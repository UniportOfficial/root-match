# RootMatching Backend Design Mapping

> **출처 채택 메모 — dev-monorepo 2026-06-02**
>
> 이 문서는 `origin/feature/backend-api` (commit `4976813`)에서 가져와 dev-monorepo에 채택한 협업 자료입니다.
>
> **원작성**: 백엔드 팀 (Spring Boot + JPA 가정으로 enum/index/mock→DB 전환 가이드 작성)
> **dev-monorepo 적용 컨텍스트**: NestJS 11 + Prisma 6 + Neon PostgreSQL + Better Auth + PRD v0.4
>
> ### 정책 정렬 차이
>
> | 원본 권장                                       | dev-monorepo 정책                                                       |
> | ----------------------------------------------- | ----------------------------------------------------------------------- |
> | JPA `@Enumerated(EnumType.STRING)`              | **Prisma `enum`** + TS union from `@rootmatching/shared`                |
> | MySQL DDL `ALTER TABLE ... ADD INDEX`           | **Prisma `@@index` / `@@unique`**                                       |
> | `FULLTEXT INDEX`                                | **Postgres `tsvector` 컬럼 + GIN index** + `to_tsvector('simple', ...)` |
> | Java package 구조 (`controller/service/entity`) | **NestJS module + Prisma model + zod DTO**                              |
> | `MatchingAdapter` interface (Java)              | **NestJS DI service** (이미 `apps/api/src/matching/` 존재)              |
> | Spring Security context/JWT                     | **Better Auth session middleware**                                      |
>
> ### 채택 권장 사항 (즉시 활용 가능)
>
> - **enum 정의** (§1.2~§1.13): UserRole, QuoteRequestStatus, FactoryQuoteStatus, MatchingSource, ContractStatus, TransactionStatus, DisputeType, DisputeStatus, NotificationType — 그대로 Prisma enum으로 옮길 수 있음
> - **상태 전이 다이어그램** (§1.4, §1.5, §1.8, §1.9, §1.11): NestJS service의 state machine 검증 로직 reference
> - **mock→DB 전환 13단계** (§4.4): Phase 1.W2 → Phase 3까지의 마일스톤 reference
> - **중복/애매한 상태값 개선안** (§1.14): 우리도 동일 함정 피해야 함 (영문 key + 한글 label 중복 저장 금지, mock suffix 노출 금지)
> - **운영 필요 필드 vs mock 누락 필드** (§3.10, §3.11): Prisma migration 설계 시 빠진 필드 점검
>
> ### 채택 보류 (재해석 필요)
>
> - **MySQL DDL 예시 (§2.2)**: Postgres + Prisma 문법으로 다시 작성 필요
> - **JPA package tree (§4.2)**: 우리는 NestJS module 구조이므로 직접 대응 안 됨
>
> ### 사용 범위
>
> - **Phase 1.W2 우선**: User/Company/Factory/Quote 도메인 enum + entity 결정 시
> - **Phase 2+**: Contract/Transaction/Dispute 도메인 확장 시 참고
>
> ### 우선순위
>
> 충돌 시: 본 문서 < `docs/specs/functional-spec.md` (UX) < `docs/specs/rootmatching-erd.md` (DB 모델) < `docs/prd/rootmatching-prd.md` (제품 정책)

---

작성일: 2026-06-02  
범위: 백엔드 설계 문서화/정리  
기준 자료:

- `backend/docs/functional-spec.md`
- `backend/src/main/java/com/dgu/backend/rootmatching/RootMatchingStore.java`
- `backend/src/main/java/com/dgu/backend/rootmatching/**` mock API service/controller
- `docs/rootmatching-erd.md`

> 이 문서는 운영 DB/JPA 전환을 위한 설계 기준입니다. 실제 DB migration 파일은 만들지 않았습니다. 애매한 항목은 `TODO` 또는 `제안`으로 남깁니다.

---

## 1. 상태 enum 정리

### 1.1 전체 상태값 수집 요약

| 도메인         | 현재 필드                 | 현재 사용/명세 값                                                         | 운영 JPA enum 제안                                         |
| -------------- | ------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 사용자         | `users.role`              | `admin`, `member`                                                         | `UserRole`                                                 |
| 거래 역할      | `transactions.myRole`     | `client`, `factory`                                                       | `TransactionPartyRole`                                     |
| 견적 요청      | `quoteRequests.status`    | `new`, `reviewing`, `quoted`                                              | `QuoteRequestStatus`                                       |
| 공장 견적      | `quotes.status`           | `submitted`                                                               | `FactoryQuoteStatus`                                       |
| AI 추천        | `recommendations.source`  | `deterministic-mock`                                                      | `MatchingSource`                                           |
| 계약           | `contracts.paymentMethod` | `escrow`                                                                  | `PaymentMethod`                                            |
| 계약           | `contracts.status`        | `created_mock`, `escrow_paid_mock`                                        | `ContractStatus`                                           |
| 거래           | `transactions.statusKey`  | `production`, `inspection`, `completed`; 명세/ERD상 `delayed`             | `TransactionStatus`                                        |
| 거래           | `transactions.status`     | `작업 진행 중`, `납품 검수 대기`, `거래 완료`; 명세상 `일정 지연 주의`    | `TransactionDisplayStatus`는 별도 enum보다 i18n label 권장 |
| 분쟁 유형      | `disputes.type`           | `quality`, `deadline`, `payment`, `contract`; 한글 입력도 validation 허용 | `DisputeType`                                              |
| 분쟁 상태      | `disputes.status`         | `reviewing`, `proposal`, `waiting`, `resolved`                            | `DisputeStatus`                                            |
| 알림           | `notifications.type`      | `message`; 명세상 `match`, `system`, `inquiry`                            | `NotificationType`                                         |
| 메시지 읽음    | `messages.isRead`         | `true`, `false`                                                           | boolean 유지                                               |
| 알림 읽음      | `notifications.isRead`    | `true`, `false`                                                           | boolean 유지                                               |
| 첨부           | `attachments.mockOnly`    | `true`, `false`                                                           | boolean 유지 또는 `AttachmentStorageStatus` 제안           |
| 리뷰 후속 액션 | `review.nextAction`       | 명세상 `reorder`, `crm`                                                   | `ReviewNextAction`                                         |

---

### 1.2 UserRole

| 한글 상태명 | 영문 enum constant | 현재 값  | 설명                              |
| ----------- | ------------------ | -------- | --------------------------------- |
| 관리자      | `ADMIN`            | `admin`  | 회사/계정 관리 권한을 가진 사용자 |
| 일반 멤버   | `MEMBER`           | `member` | 일반 사용자                       |

**제안**

```java
public enum UserRole {
    ADMIN,
    MEMBER
}
```

운영 DB에는 `ADMIN`, `MEMBER`로 저장하는 것을 권장합니다. 현재 mock 값은 소문자이므로 API boundary에서 변환이 필요합니다.

---

### 1.3 TransactionPartyRole

| 한글 상태명 | 영문 enum constant | 현재 값   | 설명                                         |
| ----------- | ------------------ | --------- | -------------------------------------------- |
| 발주처      | `CLIENT`           | `client`  | 거래에서 의뢰/검수/리뷰를 수행하는 주체      |
| 공장        | `FACTORY`          | `factory` | 견적 제출/작업 진행 업데이트를 수행하는 주체 |

**제안**

거래 자체에는 `client_user_id`, `factory_profile_id`가 있으므로 운영 DB에서 `myRole`을 저장하기보다 조회 API 요청자의 관계로 계산하는 것이 더 안전합니다.

---

### 1.4 QuoteRequestStatus

| 한글 상태명 | 영문 enum constant | 현재 값       | 설명                                       |
| ----------- | ------------------ | ------------- | ------------------------------------------ |
| 신규        | `NEW`              | `new`         | 발주처가 요청을 등록했고 공장 검토 전 상태 |
| 검토 중     | `REVIEWING`        | `reviewing`   | 공장 또는 플랫폼이 요청을 검토 중          |
| 매칭 완료   | `MATCHED`          | 명세/ERD 제안 | AI 추천 결과가 생성됨                      |
| 견적 제출됨 | `QUOTED`           | `quoted`      | 하나 이상의 공장 견적이 제출됨             |
| 계약 생성됨 | `CONTRACTED`       | ERD 제안      | 선택 견적 기반 계약이 생성됨               |
| 취소됨      | `CANCELLED`        | ERD 제안      | 발주처 또는 운영자가 요청을 취소함         |

**상태 전이 제안**

```text
NEW
 ├─ match 실행 ─> MATCHED
 ├─ 공장 검토 ─> REVIEWING
 └─ 취소 ─> CANCELLED

REVIEWING
 ├─ 견적 제출 ─> QUOTED
 └─ 취소 ─> CANCELLED

MATCHED
 ├─ 견적 제출 ─> QUOTED
 └─ 취소 ─> CANCELLED

QUOTED
 ├─ 계약 생성 ─> CONTRACTED
 └─ 취소 ─> CANCELLED
```

**개선안**

- 현재 mock은 견적 제출 시 바로 `quoted`로 변경합니다.
- AI 매칭 실행 후 `matched` 상태를 저장하지 않습니다.
- 운영에서는 `MATCHED`와 `QUOTED`를 분리하는 것이 추천 결과 조회/견적 제출 여부를 구분하기 좋습니다.

---

### 1.5 FactoryQuoteStatus

| 한글 상태명 | 영문 enum constant | 현재 값     | 설명                            |
| ----------- | ------------------ | ----------- | ------------------------------- |
| 제출됨      | `SUBMITTED`        | `submitted` | 공장이 견적을 제출함            |
| 선택됨      | `ACCEPTED`         | ERD 제안    | 발주처가 계약 대상으로 선택함   |
| 미선택/거절 | `REJECTED`         | ERD 제안    | 다른 견적 선택 또는 발주처 거절 |
| 철회됨      | `WITHDRAWN`        | ERD 제안    | 공장이 견적을 철회함            |

**상태 전이 제안**

```text
SUBMITTED
 ├─ 발주처 선택 ─> ACCEPTED
 ├─ 발주처 거절 ─> REJECTED
 └─ 공장 철회 ─> WITHDRAWN
```

---

### 1.6 MatchingSource

| 한글 상태명      | 영문 enum constant   | 현재 값              | 설명                                             |
| ---------------- | -------------------- | -------------------- | ------------------------------------------------ |
| 결정적 목 추천   | `DETERMINISTIC_MOCK` | `deterministic-mock` | API key 없이 동일 입력에 대해 mock 추천 생성     |
| OpenAI 어댑터    | `OPENAI_ADAPTER`     | TODO                 | 실제 OpenAI 호출을 service adapter로 분리한 경우 |
| 운영자 수동 추천 | `MANUAL_ADMIN`       | ERD 제안             | 운영자가 추천 결과를 수동 보정한 경우            |

**개선안**

- 현재 문자열 `deterministic-mock`은 Java enum constant로 바로 쓰기 어렵습니다.
- DB 저장값은 `DETERMINISTIC_MOCK`, API 응답은 기존 호환을 위해 `deterministic-mock`으로 내려주는 방식을 제안합니다.

---

### 1.7 PaymentMethod

| 한글 상태명 | 영문 enum constant | 현재 값  | 설명                                           |
| ----------- | ------------------ | -------- | ---------------------------------------------- |
| 에스크로    | `ESCROW`           | `escrow` | 플랫폼 보호 결제 방식. 현재는 mock 완료만 지원 |

**TODO**

- 무통장/카드/세금계산서 등 결제 방식 확장 여부는 사업 정책 확인 필요.

---

### 1.8 ContractStatus

| 한글 상태명           | 영문 enum constant | 현재 값            | 설명                              |
| --------------------- | ------------------ | ------------------ | --------------------------------- |
| 목 계약 생성          | `CREATED_MOCK`     | `created_mock`     | 실제 전자서명 전 mock 계약 생성   |
| 목 전자서명 완료      | `SIGNED_MOCK`      | ERD 제안           | 실제 전자서명 대신 mock 서명 완료 |
| 목 에스크로 결제 완료 | `ESCROW_PAID_MOCK` | `escrow_paid_mock` | 실제 PG 없이 결제 완료 상태 전이  |
| 취소됨                | `CANCELLED`        | ERD 제안           | 계약 취소                         |

**상태 전이 제안**

```text
CREATED_MOCK
 ├─ mock 서명 완료 ─> SIGNED_MOCK
 ├─ mock 결제 완료 ─> ESCROW_PAID_MOCK
 └─ 취소 ─> CANCELLED

SIGNED_MOCK
 ├─ mock 결제 완료 ─> ESCROW_PAID_MOCK
 └─ 취소 ─> CANCELLED
```

**개선안**

- 현재 API는 `CREATED_MOCK -> ESCROW_PAID_MOCK`으로 바로 전이합니다.
- 명세에는 전자서명 단계가 있으므로 운영 전환 시 `SIGNED_MOCK` 또는 실제 `SIGNED` 상태를 분리하는 것이 좋습니다.

---

### 1.9 TransactionStatus

| 한글 상태명    | 영문 enum constant | 현재 값              | 설명                                  |
| -------------- | ------------------ | -------------------- | ------------------------------------- |
| 작업 진행 중   | `PRODUCTION`       | `production`         | 계약/결제 이후 제작 진행 중           |
| 납품 검수 대기 | `INSPECTION`       | `inspection`         | 납품 자료가 등록되어 발주처 검수 대기 |
| 일정 지연 주의 | `DELAYED`          | 명세/ERD상 `delayed` | 납기 지연 위험 또는 지연 상태         |
| 거래 완료      | `COMPLETED`        | `completed`          | 검수 승인 및 리뷰 가능/완료 상태      |

**현재 한글 display status**

| 한글 상태명    | 연결 statusKey | 설명                                           |
| -------------- | -------------- | ---------------------------------------------- |
| 작업 진행 중   | `PRODUCTION`   | `ContractService.completeEscrow()`에서 생성    |
| 납품 검수 대기 | `INSPECTION`   | seed 거래 상태                                 |
| 거래 완료      | `COMPLETED`    | 검수 승인 또는 리뷰 제출 후 상태               |
| 일정 지연 주의 | `DELAYED`      | 기능 명세/ERD에 있으나 현재 mock seed에는 없음 |

**상태 전이 제안**

```text
PRODUCTION
 ├─ 납품 등록 ─> INSPECTION
 ├─ 지연 감지 ─> DELAYED
 └─ 취소/분쟁 정책은 TODO

DELAYED
 ├─ 일정 정상화 ─> PRODUCTION
 └─ 납품 등록 ─> INSPECTION

INSPECTION
 ├─ 검수 승인 ─> COMPLETED
 └─ 문제 신고 ─> DISPUTE 생성, 거래 상태는 INSPECTION 또는 DISPUTED 별도 추가 검토

COMPLETED
 └─ 리뷰 작성/수정
```

**개선안**

- `transactions.status` 한글 문자열과 `transactions.statusKey` 영문 값이 중복됩니다.
- 운영 DB에는 `status_key` enum만 저장하고, 한글 label은 API DTO/i18n layer에서 생성하는 것을 권장합니다.
- 분쟁 진행 중 거래 상태를 나타낼 `DISPUTED` 추가 여부는 정책 확인이 필요합니다.

---

### 1.10 DisputeType

| 한글 상태명 | 영문 enum constant | 현재 값                                | 설명                            |
| ----------- | ------------------ | -------------------------------------- | ------------------------------- |
| 품질        | `QUALITY`          | `quality`, validation상 `품질`도 허용  | 불량, 치수 오차, 검사 불합격    |
| 납기        | `DEADLINE`         | `deadline`, validation상 `납기`도 허용 | 지연, 일정 불이행               |
| 결제        | `PAYMENT`          | `payment`, validation상 `결제`도 허용  | 대금/정산/에스크로 관련 이슈    |
| 계약        | `CONTRACT`         | `contract`, validation상 `계약`도 허용 | 계약 조건 불이행/범위 해석 이견 |

**개선안**

- API 입력에서는 한글 alias를 허용하더라도 DB에는 `QUALITY`, `DEADLINE`, `PAYMENT`, `CONTRACT`만 저장하는 것을 권장합니다.

---

### 1.11 DisputeStatus

| 한글 상태명      | 영문 enum constant | 현재 값     | 설명                              |
| ---------------- | ------------------ | ----------- | --------------------------------- |
| 자료 검토 중     | `REVIEWING`        | `reviewing` | 플랫폼/중재자가 자료 검토 중      |
| 조정안 제시      | `PROPOSAL`         | `proposal`  | 중재 조정안을 제시한 상태         |
| 상대방 답변 대기 | `WAITING`          | `waiting`   | 한쪽 당사자의 답변/자료 제출 대기 |
| 해결 완료        | `RESOLVED`         | `resolved`  | 합의 또는 조정 종료               |

**상태 전이 제안**

```text
REVIEWING
 ├─ 추가 자료 필요 ─> WAITING
 └─ 조정안 작성 ─> PROPOSAL

WAITING
 ├─ 답변 수신 ─> REVIEWING
 └─ 조정안 제시 ─> PROPOSAL

PROPOSAL
 ├─ 수락/합의 ─> RESOLVED
 └─ 이견 발생 ─> WAITING 또는 REVIEWING
```

---

### 1.12 NotificationType

| 한글 상태명 | 영문 enum constant | 현재 값          | 설명                                  |
| ----------- | ------------------ | ---------------- | ------------------------------------- |
| 메시지      | `MESSAGE`          | `message`        | 메시지/답장/견적 협의 알림            |
| 매칭        | `MATCH`            | 명세상 `match`   | AI 추천 결과 생성 또는 신규 매칭 알림 |
| 시스템      | `SYSTEM`           | 명세상 `system`  | 프로필 업데이트, 운영 공지 등         |
| 문의        | `INQUIRY`          | 명세상 `inquiry` | 회사 문의/기업 프로필 조회 등         |

---

### 1.13 ReviewNextAction

| 한글 상태명 | 영문 enum constant | 현재 값          | 설명                       |
| ----------- | ------------------ | ---------------- | -------------------------- |
| 재의뢰      | `REORDER`          | 명세상 `reorder` | 같은 공장과 후속 거래 희망 |
| 거래처 관리 | `CRM`              | 명세상 `crm`     | 거래처로 관리              |

---

### 1.14 중복/애매한 상태값 개선안

| 문제                           | 현재 모습                                                  | 개선안                                                                                                           |
| ------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 한글 display와 영문 key 중복   | `transactions.status = 거래 완료`, `statusKey = completed` | DB에는 enum만 저장, DTO에서 label 생성                                                                           |
| mock suffix 노출               | `created_mock`, `escrow_paid_mock`                         | 운영 enum은 `CREATED`, `SIGNED`, `ESCROW_PAID`; mock 여부는 `mock_only` 또는 adapter type으로 분리하는 방안 검토 |
| 한글/영문 dispute type 혼용    | `quality`와 `품질` 모두 validation 허용                    | API 입력 alias만 허용, DB 저장은 enum constant로 통일                                                            |
| quote request `matched` 미저장 | match API 실행 후 추천만 저장                              | 매칭 완료 시 `QuoteRequestStatus.MATCHED`로 전이할지 정책 결정                                                   |
| transaction dispute 상태 없음  | 문제 신고 시 dispute 생성만 가능                           | `DISPUTED` 상태 추가 여부 검토                                                                                   |
| 알림 reference 부족            | `link` 문자열 중심                                         | `reference_type`, `reference_id` 컬럼 병행 저장 권장                                                             |

---

## 2. 인덱스 / unique 제약 조건 권장안

### 2.1 테이블별 권장 인덱스

| 대상 테이블                    | 컬럼                                                  | 제약/인덱스 종류    | 필요한 이유                                       | 예상 조회/API                                      |
| ------------------------------ | ----------------------------------------------------- | ------------------- | ------------------------------------------------- | -------------------------------------------------- |
| `users`                        | `email`                                               | UNIQUE              | 로그인 식별자 중복 방지                           | `POST /auth/login`, 회원가입 중복 확인             |
| `users`                        | `company_id`                                          | INDEX               | 회사 소속 사용자 조회                             | 마이페이지/회사 관리 TODO                          |
| `companies`                    | `industry`                                            | INDEX               | 업종 필터                                         | `GET /companies?industry=`                         |
| `companies`                    | `region`                                              | INDEX               | 지역 필터                                         | `GET /companies?region=`                           |
| `companies`                    | `size`                                                | INDEX               | 규모 필터                                         | `GET /companies?size=`                             |
| `companies`                    | `name`                                                | INDEX 또는 FULLTEXT | 회사명 검색                                       | `GET /companies?keyword=`                          |
| `companies`                    | `description`, `name`                                 | FULLTEXT            | keyword 검색 정확도/성능                          | `GET /companies?keyword=`                          |
| `company_favorites`            | `user_id`, `company_id`                               | UNIQUE              | 동일 사용자의 중복 즐겨찾기 방지                  | favorite add/delete                                |
| `company_favorites`            | `user_id`                                             | INDEX               | 내 즐겨찾기 목록                                  | favorite companies TODO                            |
| `factory_profiles`             | `owner_user_id`                                       | UNIQUE 또는 INDEX   | 사용자별 공장 프로필 조회. 1인 1프로필이면 UNIQUE | `GET /factories/profile/me`                        |
| `factory_profiles`             | `company_id`                                          | INDEX               | 회사와 공장 프로필 연결                           | 공장 상세/회사 상세 통합 TODO                      |
| `factory_profiles`             | `location`                                            | INDEX               | 지역 기반 공장 검색/추천                          | AI matching/filter TODO                            |
| `factory_process_capabilities` | `factory_profile_id`, `process_name`                  | UNIQUE              | 동일 공장 공정 중복 방지                          | 공장 프로필 조회/매칭                              |
| `factory_equipment`            | `factory_profile_id`                                  | INDEX               | 공장 설비 목록 조회                               | 공장 상세                                          |
| `factory_products`             | `factory_profile_id`                                  | INDEX               | 생산 가능 품목 조회                               | 공장 상세/매칭                                     |
| `factory_certifications`       | `factory_profile_id`                                  | INDEX               | 인증 목록 조회                                    | 공장 상세                                          |
| `quote_requests`               | `client_user_id`                                      | INDEX               | 내 요청 목록                                      | `GET /quote-requests` with auth user               |
| `quote_requests`               | `client_company_id`                                   | INDEX               | 회사 단위 요청 조회                               | 회사/발주처 관리 TODO                              |
| `quote_requests`               | `status`                                              | INDEX               | 상태 필터                                         | `GET /quote-requests?status=`                      |
| `quote_requests`               | `process_type`                                        | INDEX               | 공정 필터                                         | `GET /quote-requests?processType=`                 |
| `quote_requests`               | `requested_at`                                        | INDEX               | 최신순 정렬                                       | `GET /quote-requests`                              |
| `quote_requests`               | `project_name`, `product_item`, `detail_requirements` | FULLTEXT            | keyword 검색                                      | `GET /quote-requests?keyword=`                     |
| `match_recommendations`        | `quote_request_id`, `factory_profile_id`, `source`    | UNIQUE              | 같은 요청/공장/source 추천 중복 방지              | match 재실행 upsert                                |
| `match_recommendations`        | `quote_request_id`, `score`                           | INDEX               | 요청별 추천 점수순 조회                           | `GET /quote-requests/:id/recommendations`          |
| `factory_quotes`               | `quote_request_id`                                    | INDEX               | 요청별 제출 견적 조회                             | request detail/contract 생성                       |
| `factory_quotes`               | `factory_profile_id`                                  | INDEX               | 공장 제출 견적 이력                               | factory dashboard TODO                             |
| `factory_quotes`               | `status`                                              | INDEX               | 선택/제출 상태 필터                               | contract 대상 조회                                 |
| `contracts`                    | `quote_request_id`                                    | INDEX               | 요청 기반 계약 조회                               | `GET /contracts/:id`, request detail TODO          |
| `contracts`                    | `factory_quote_id`                                    | UNIQUE              | 하나의 선택 견적은 하나의 계약만 생성             | `POST /contracts` 중복 방지                        |
| `contracts`                    | `status`                                              | INDEX               | 계약 상태 조회                                    | 계약/결제 관리 TODO                                |
| `mock_escrow_payments`         | `contract_id`                                         | UNIQUE              | 계약당 mock 결제 이력 1건 기준                    | `POST /contracts/:id/escrow-payment/mock-complete` |
| `transactions`                 | `contract_id`                                         | UNIQUE              | 계약당 거래 1건                                   | 결제 완료 시 거래 중복 생성 방지                   |
| `transactions`                 | `status_key`                                          | INDEX               | 거래 상태 필터                                    | `GET /transactions?status=`                        |
| `transactions`                 | `updated_at`                                          | INDEX               | 최근 거래 정렬                                    | `GET /transactions`                                |
| `transaction_updates`          | `transaction_id`, `created_at`                        | INDEX               | 거래별 업데이트 시간순 조회                       | `GET /transactions/:id`                            |
| `reviews`                      | `transaction_id`                                      | UNIQUE              | 거래당 리뷰 1건 기준                              | `POST /transactions/:id/review`                    |
| `reviews`                      | `factory_profile_id`                                  | INDEX               | 공장 리뷰 목록                                    | 공장 상세 TODO                                     |
| `disputes`                     | `transaction_id`                                      | INDEX               | 거래별 분쟁 조회                                  | `GET /disputes`, transaction detail TODO           |
| `disputes`                     | `type`                                                | INDEX               | 분쟁 유형 필터/통계                               | admin dashboard TODO                               |
| `disputes`                     | `status`                                              | INDEX               | 진행/완료 필터                                    | `GET /disputes?status=`                            |
| `disputes`                     | `updated_at`                                          | INDEX               | 최근 처리순 정렬                                  | dispute list                                       |
| `dispute_timelines`            | `dispute_id`, `event_at`                              | INDEX               | 분쟁 이력 시간순 조회                             | `GET /disputes/:id`                                |
| `messages`                     | `sender_user_id`                                      | INDEX               | 보낸 메시지 조회                                  | `GET /messages` TODO                               |
| `messages`                     | `receiver_user_id`, `is_read`                         | INDEX               | 받은 메시지/안읽음 수                             | `GET /messages`                                    |
| `messages`                     | `created_at`                                          | INDEX               | 최신순 정렬                                       | `GET /messages`                                    |
| `message_replies`              | `message_id`, `created_at`                            | INDEX               | thread 답장 시간순 조회                           | `GET /messages/:id`                                |
| `notifications`                | `receiver_user_id`, `is_read`                         | INDEX               | 사용자별 알림/안읽음 수                           | `GET /notifications`                               |
| `notifications`                | `created_at`                                          | INDEX               | 최신순 정렬                                       | `GET /notifications`                               |
| `attachments`                  | `owner_type`, `owner_id`                              | INDEX               | 각 도메인 첨부 metadata 조회                      | quote/message/dispute/transaction detail           |

---

### 2.2 MySQL DDL 예시

> 실제 migration 파일이 아니라 설계 예시입니다. 컬럼 타입/길이는 실제 요구사항 확정 후 조정합니다.

```sql
-- users
ALTER TABLE users
  ADD CONSTRAINT uk_users_email UNIQUE (email),
  ADD INDEX idx_users_company_id (company_id);

-- companies
ALTER TABLE companies
  ADD INDEX idx_companies_industry (industry),
  ADD INDEX idx_companies_region (region),
  ADD INDEX idx_companies_size (size),
  ADD INDEX idx_companies_name (name),
  ADD FULLTEXT INDEX ftx_companies_keyword (name, description);

-- company_favorites
ALTER TABLE company_favorites
  ADD CONSTRAINT uk_company_favorites_user_company UNIQUE (user_id, company_id),
  ADD INDEX idx_company_favorites_user_id (user_id);

-- factory profiles
ALTER TABLE factory_profiles
  ADD CONSTRAINT uk_factory_profiles_owner_user UNIQUE (owner_user_id),
  ADD INDEX idx_factory_profiles_company_id (company_id),
  ADD INDEX idx_factory_profiles_location (location);

ALTER TABLE factory_process_capabilities
  ADD CONSTRAINT uk_factory_process UNIQUE (factory_profile_id, process_name),
  ADD INDEX idx_factory_process_factory_id (factory_profile_id);

ALTER TABLE factory_equipment
  ADD INDEX idx_factory_equipment_factory_id (factory_profile_id);

ALTER TABLE factory_products
  ADD INDEX idx_factory_products_factory_id (factory_profile_id);

ALTER TABLE factory_certifications
  ADD INDEX idx_factory_certifications_factory_id (factory_profile_id);

-- quote requests
ALTER TABLE quote_requests
  ADD INDEX idx_quote_requests_client_user_id (client_user_id),
  ADD INDEX idx_quote_requests_client_company_id (client_company_id),
  ADD INDEX idx_quote_requests_status (status),
  ADD INDEX idx_quote_requests_process_type (process_type),
  ADD INDEX idx_quote_requests_requested_at (requested_at),
  ADD FULLTEXT INDEX ftx_quote_requests_keyword (project_name, product_item, detail_requirements);

-- matching
ALTER TABLE match_recommendations
  ADD CONSTRAINT uk_match_request_factory_source UNIQUE (quote_request_id, factory_profile_id, source),
  ADD INDEX idx_match_request_score (quote_request_id, score DESC);

-- quotes/contracts/payments
ALTER TABLE factory_quotes
  ADD INDEX idx_factory_quotes_request_id (quote_request_id),
  ADD INDEX idx_factory_quotes_factory_id (factory_profile_id),
  ADD INDEX idx_factory_quotes_status (status);

ALTER TABLE contracts
  ADD INDEX idx_contracts_quote_request_id (quote_request_id),
  ADD CONSTRAINT uk_contracts_factory_quote_id UNIQUE (factory_quote_id),
  ADD INDEX idx_contracts_status (status);

ALTER TABLE mock_escrow_payments
  ADD CONSTRAINT uk_mock_escrow_contract_id UNIQUE (contract_id);

-- transactions/reviews/disputes
ALTER TABLE transactions
  ADD CONSTRAINT uk_transactions_contract_id UNIQUE (contract_id),
  ADD INDEX idx_transactions_status_key (status_key),
  ADD INDEX idx_transactions_updated_at (updated_at);

ALTER TABLE transaction_updates
  ADD INDEX idx_transaction_updates_txn_created (transaction_id, created_at);

ALTER TABLE reviews
  ADD CONSTRAINT uk_reviews_transaction_id UNIQUE (transaction_id),
  ADD INDEX idx_reviews_factory_profile_id (factory_profile_id);

ALTER TABLE disputes
  ADD INDEX idx_disputes_transaction_id (transaction_id),
  ADD INDEX idx_disputes_type (type),
  ADD INDEX idx_disputes_status (status),
  ADD INDEX idx_disputes_updated_at (updated_at);

ALTER TABLE dispute_timelines
  ADD INDEX idx_dispute_timelines_dispute_event (dispute_id, event_at);

-- messages/notifications/attachments
ALTER TABLE messages
  ADD INDEX idx_messages_sender_user_id (sender_user_id),
  ADD INDEX idx_messages_receiver_read (receiver_user_id, is_read),
  ADD INDEX idx_messages_created_at (created_at);

ALTER TABLE message_replies
  ADD INDEX idx_message_replies_message_created (message_id, created_at);

ALTER TABLE notifications
  ADD INDEX idx_notifications_receiver_read (receiver_user_id, is_read),
  ADD INDEX idx_notifications_created_at (created_at);

ALTER TABLE attachments
  ADD INDEX idx_attachments_owner (owner_type, owner_id);
```

---

## 3. 현재 mock API store와 운영 DB 테이블 매핑

### 3.1 Store collection 단위 매핑

| Mock store 구조      | Java 타입                               | 운영 DB 테이블                                                               | 설명                                                               |
| -------------------- | --------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `users`              | `Map<String, Map<String,Object>>`       | `users`                                                                      | 사용자 계정                                                        |
| `currentUser`        | `Map<String,Object>`                    | 저장 대상 아님                                                               | mock session 상태. 운영에서는 SecurityContext/JWT/session으로 대체 |
| `companies`          | `Map<String, Map<String,Object>>`       | `companies`                                                                  | 회사/기업 디렉토리                                                 |
| `favoriteCompanyIds` | `Set<String>`                           | `company_favorites`                                                          | 현재 사용자 기준 즐겨찾기 Set. 운영에서는 user-company join table  |
| `quoteRequests`      | `Map<String, Map<String,Object>>`       | `quote_requests`, `attachments`                                              | 견적 요청과 첨부 metadata                                          |
| `recommendations`    | `Map<String, List<Map<String,Object>>>` | `match_recommendations`                                                      | 요청별 AI/mock 추천 결과                                           |
| `factoryProfiles`    | `Map<String, Map<String,Object>>`       | `factory_profiles` 및 하위 capability/equipment/product/certification tables | 공장 프로필                                                        |
| `quotes`             | `Map<String, Map<String,Object>>`       | `factory_quotes`                                                             | 공장 견적 제출                                                     |
| `messages`           | `Map<String, Map<String,Object>>`       | `messages`, `message_replies`, `attachments`                                 | 메시지와 답장                                                      |
| `notifications`      | `Map<String, Map<String,Object>>`       | `notifications`                                                              | 알림                                                               |
| `contracts`          | `Map<String, Map<String,Object>>`       | `contracts`, `mock_escrow_payments`                                          | 계약과 mock 결제 상태                                              |
| `transactions`       | `Map<String, Map<String,Object>>`       | `transactions`, `transaction_updates`, `reviews`, `attachments`              | 거래 진행과 리뷰/파일                                              |
| `disputes`           | `Map<String, Map<String,Object>>`       | `disputes`, `dispute_timelines`, `attachments`                               | 분쟁과 증빙                                                        |

---

### 3.2 users/currentUser 필드 매핑

| Mock 필드명   | Mock 타입 | 운영 DB 테이블       | 운영 DB 컬럼               | 비고                                                   |
| ------------- | --------- | -------------------- | -------------------------- | ------------------------------------------------------ |
| `id`          | String    | `users`              | `id`                       | 운영에서는 bigint/UUID 권장. mock id `user1` 변환 필요 |
| `email`       | String    | `users`              | `email`                    | unique                                                 |
| `name`        | String    | `users`              | `name`                     |                                                        |
| `role`        | String    | `users`              | `role`                     | `admin/member` → `ADMIN/MEMBER` 변환 권장              |
| `position`    | String    | `users`              | `position`                 |                                                        |
| `phone`       | String    | `users`              | `phone`                    |                                                        |
| `company`     | Object    | `users`, `companies` | `company_id` FK            | mock은 company object nested. 운영에서는 FK            |
| 없음          | -         | `users`              | `password_hash`            | 운영 필수. mock에는 비밀번호 저장 없음                 |
| 없음          | -         | `users`              | `created_at`, `updated_at` | 운영 감사 컬럼 필요                                    |
| `currentUser` | Object    | 없음                 | 없음                       | session/security context로 대체                        |

---

### 3.3 companies/favorites 필드 매핑

| Mock 필드명               | Mock 타입    | 운영 DB 테이블                           | 운영 DB 컬럼                | 비고                             |
| ------------------------- | ------------ | ---------------------------------------- | --------------------------- | -------------------------------- |
| `id`                      | String       | `companies`                              | `id`                        | mock string id 변환 필요         |
| `name`                    | String       | `companies`                              | `name`                      | keyword 검색 대상                |
| `industry`                | String       | `companies`                              | `industry`                  | filter index                     |
| `region`                  | String       | `companies`                              | `region`                    | filter index                     |
| `size`                    | String       | `companies`                              | `size`                      | filter index                     |
| `description`             | String       | `companies`                              | `description`               | fulltext 검색 대상               |
| `tags`                    | List<String> | TODO: `company_tags` 또는 JSON           | `tag_name` 또는 `tags_json` | 검색 품질을 위해 별도 table 권장 |
| `contactEmail`            | String       | `companies`                              | `contact_email`             |                                  |
| `contactPhone`            | String       | `companies`                              | `contact_phone`             |                                  |
| `website`                 | String       | `companies`                              | `website`                   |                                  |
| `establishedYear`         | Number       | `companies`                              | `established_year`          |                                  |
| `employeeCount`           | Number       | `companies`                              | `employee_count`            |                                  |
| `revenue`                 | String       | `companies`                              | `revenue`                   | 금액 정규화는 TODO               |
| `certifications`          | List<String> | TODO: `company_certifications` 또는 JSON | `certification_name`        | 공장 인증과 통합 여부 TODO       |
| `createdAt`               | String       | `companies`                              | `created_at`                | date/datetime 변환 필요          |
| `isFavorite`              | Boolean      | 없음 또는 DTO                            | 없음                        | 조회 DTO 계산 필드               |
| `favoriteCompanyIds` item | String       | `company_favorites`                      | `company_id`                | `user_id`와 함께 저장            |

---

### 3.4 factoryProfiles 필드 매핑

| Mock 필드명        | Mock 타입    | 운영 DB 테이블                             | 운영 DB 컬럼              | 비고                         |
| ------------------ | ------------ | ------------------------------------------ | ------------------------- | ---------------------------- |
| `id`               | String       | `factory_profiles`                         | `id`                      |                              |
| `ownerUserId`      | String       | `factory_profiles`                         | `owner_user_id`           | FK to users                  |
| 없음               | -            | `factory_profiles`                         | `company_id`              | 회사와 공장 프로필 연결 필요 |
| `name`             | String       | `factory_profiles`                         | `name`                    |                              |
| `managerName`      | String       | `factory_profiles`                         | `manager_name`            |                              |
| `location`         | String       | `factory_profiles`                         | `location`                | 지역/주소 검색 기준          |
| `phone`            | String       | `factory_profiles`                         | `phone`                   |                              |
| `email`            | String       | `factory_profiles`                         | `email`                   |                              |
| `processes`        | List<String> | `factory_process_capabilities`             | `process_name`            | 별도 row로 분리 권장         |
| `equipment`        | List<String> | `factory_equipment`                        | `name`                    | 별도 row                     |
| `products`         | List<String> | `factory_products`                         | `product_name`            | 생산량/비고 확장 가능        |
| `certifications`   | List<String> | `factory_certifications`                   | `certification_name`      | issuer/date는 mock에 없음    |
| `monthlyCapacity`  | String       | `factory_profiles` 또는 `factory_products` | `monthly_capacity`        | 전체/품목별 구분 필요        |
| `portfolio`        | List<Object> | `attachments`                              | owner=`FACTORY_PORTFOLIO` | metadata만 저장              |
| `introduction`     | String       | `factory_profiles`                         | `introduction`            |                              |
| `reliabilityScore` | Number       | `factory_profiles`                         | `reliability_score`       | 계산/수동 관리 정책 TODO     |
| `createdAt`        | String       | `factory_profiles`                         | `created_at`              |                              |
| `updatedAt`        | String       | `factory_profiles`                         | `updated_at`              |                              |

---

### 3.5 quoteRequests 필드 매핑

| Mock 필드명          | Mock 타입    | 운영 DB 테이블            | 운영 DB 컬럼          | 비고                                                      |
| -------------------- | ------------ | ------------------------- | --------------------- | --------------------------------------------------------- |
| `id`                 | String       | `quote_requests`          | `id`                  |                                                           |
| 없음                 | -            | `quote_requests`          | `client_user_id`      | 현재 mock은 `clientName`만 있음. auth user 기반 저장 필요 |
| 없음                 | -            | `quote_requests`          | `client_company_id`   | 회사 단위 조회를 위해 필요                                |
| `clientName`         | String       | DTO 또는 `companies.name` | 없음                  | 정규화 후 join으로 표시 권장                              |
| `projectName`        | String       | `quote_requests`          | `project_name`        |                                                           |
| `processType`        | String       | `quote_requests`          | `process_type`        | enum/코드 테이블화 TODO                                   |
| `productItem`        | String       | `quote_requests`          | `product_item`        |                                                           |
| `estimatedQuantity`  | String       | `quote_requests`          | `estimated_quantity`  |                                                           |
| `quantity`           | String       | 없음 또는 DTO alias       | 없음                  | `estimatedQuantity` alias. 중복 제거 권장                 |
| `desiredDeadline`    | String       | `quote_requests`          | `desired_deadline`    | date 변환 필요                                            |
| `budgetRange`        | String       | `quote_requests`          | `budget_range`        | 최소/최대 금액 정규화 TODO                                |
| `detailRequirements` | String       | `quote_requests`          | `detail_requirements` |                                                           |
| `description`        | String       | 없음 또는 DTO alias       | 없음                  | `detailRequirements` alias. 중복 제거 권장                |
| `requestedAt`        | String       | `quote_requests`          | `requested_at`        |                                                           |
| `status`             | String       | `quote_requests`          | `status`              | `QuoteRequestStatus` enum                                 |
| `attachments`        | List<Object> | `attachments`             | owner=`QUOTE_REQUEST` | 실제 파일 저장 없음                                       |
| `updatedAt`          | String       | `quote_requests`          | `updated_at`          | update 시 추가됨                                          |

---

### 3.6 recommendations 필드 매핑

| Mock 필드명                    | Mock 타입 | 운영 DB 테이블          | 운영 DB 컬럼           | 비고                                 |
| ------------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------------ |
| outer key `quoteRequestId`     | String    | `match_recommendations` | `quote_request_id`     | 요청별 추천 목록                     |
| `factoryId`                    | String    | `match_recommendations` | `factory_profile_id`   | FK                                   |
| `factoryName`                  | String    | DTO join                | 없음                   | `factory_profiles.name`에서 조회     |
| `location`                     | String    | DTO join                | 없음                   | `factory_profiles.location`에서 조회 |
| `score`                        | Number    | `match_recommendations` | `score`                | 0~100                                |
| `qualityScore`                 | Number    | `match_recommendations` | `quality_score`        |                                      |
| `deadlineScore`                | Number    | `match_recommendations` | `deadline_score`       |                                      |
| `priceScore`                   | Number    | `match_recommendations` | `price_score`          |                                      |
| `reliabilityScore`             | Number    | `match_recommendations` | `reliability_score`    | factory profile score snapshot       |
| `reason`                       | String    | `match_recommendations` | `reason`               | AI/mock 추천 이유                    |
| `estimatedQuoteRange.min`      | Number    | `match_recommendations` | `estimated_min_amount` | 금액 단위 확인 필요                  |
| `estimatedQuoteRange.max`      | Number    | `match_recommendations` | `estimated_max_amount` | 금액 단위 확인 필요                  |
| `estimatedQuoteRange.currency` | String    | `match_recommendations` | `currency`             | 현재 `KRW`                           |
| `estimatedQuoteRange.unit`     | String    | `match_recommendations` | `unit`                 | 현재 `만원`                          |
| `source`                       | String    | `match_recommendations` | `source`               | `MatchingSource` enum                |
| 없음                           | -         | `match_recommendations` | `created_at`           | 추천 생성 시점                       |

---

### 3.7 quotes/factory_quotes 필드 매핑

| Mock 필드명            | Mock 타입 | 운영 DB 테이블   | 운영 DB 컬럼         | 비고                                                          |
| ---------------------- | --------- | ---------------- | -------------------- | ------------------------------------------------------------- |
| `id`                   | String    | `factory_quotes` | `id`                 |                                                               |
| `quoteRequestId`       | String    | `factory_quotes` | `quote_request_id`   | FK                                                            |
| `factoryId`            | String    | `factory_quotes` | `factory_profile_id` | FK                                                            |
| 없음 또는 request body | -         | `factory_quotes` | `sender_user_id`     | 실제 제출자 추적 필요                                         |
| `amount`               | String    | `factory_quotes` | `amount`             | 운영에서는 numeric amount/currency 분리 검토                  |
| `productionDays`       | Number    | `factory_quotes` | `production_days`    |                                                               |
| `availableDeadline`    | String    | `factory_quotes` | `available_deadline` | date                                                          |
| `paymentTerms`         | String    | `factory_quotes` | `payment_terms`      |                                                               |
| `proposalMessage`      | String    | `factory_quotes` | `proposal_message`   |                                                               |
| `status`               | String    | `factory_quotes` | `status`             | `FactoryQuoteStatus` enum                                     |
| `createdAt`            | String    | `factory_quotes` | `submitted_at`       | mock field명은 `createdAt`, 운영은 의미상 `submitted_at` 권장 |
| `factoryName`          | String    | DTO only         | 없음                 | request body에서 메시지 생성을 위해 임시 사용. join으로 대체  |

---

### 3.8 messages/notifications 필드 매핑

| Mock 필드명           | Mock 타입    | 운영 DB 테이블    | 운영 DB 컬럼                     | 비고                                 |
| --------------------- | ------------ | ----------------- | -------------------------------- | ------------------------------------ |
| `messages.id`         | String       | `messages`        | `id`                             |                                      |
| `senderId`            | String       | `messages`        | `sender_user_id`                 | FK                                   |
| `senderName`          | String       | DTO join          | 없음                             | users/companies join으로 대체        |
| `senderCompany`       | String       | DTO join          | 없음                             |                                      |
| `receiverId`          | String       | `messages`        | `receiver_user_id`               | FK                                   |
| `receiverName`        | String       | DTO join          | 없음                             |                                      |
| `receiverCompany`     | String       | DTO join          | 없음                             |                                      |
| `subject`             | String       | `messages`        | `subject`                        |                                      |
| `content`             | String       | `messages`        | `content`                        |                                      |
| `isRead`              | Boolean      | `messages`        | `is_read`                        |                                      |
| `createdAt`           | String       | `messages`        | `created_at`                     |                                      |
| `attachments`         | List<Object> | `attachments`     | owner=`MESSAGE`                  |                                      |
| `replies[].id`        | String       | `message_replies` | `id`                             |                                      |
| `replies[].senderId`  | String       | `message_replies` | `sender_user_id`                 |                                      |
| `replies[].content`   | String       | `message_replies` | `content`                        |                                      |
| `replies[].createdAt` | String       | `message_replies` | `created_at`                     |                                      |
| `notifications.id`    | String       | `notifications`   | `id`                             |                                      |
| `type`                | String       | `notifications`   | `type`                           | `NotificationType` enum              |
| `title`               | String       | `notifications`   | `title`                          |                                      |
| `content`             | String       | `notifications`   | `content`                        |                                      |
| `isRead`              | Boolean      | `notifications`   | `is_read`                        |                                      |
| `link`                | String       | `notifications`   | `link`                           | URL 문자열. reference 컬럼 병행 권장 |
| 없음                  | -            | `notifications`   | `receiver_user_id`               | 운영 필수                            |
| 없음                  | -            | `notifications`   | `reference_type`, `reference_id` | 운영 추적성 향상                     |

---

### 3.9 contracts/transactions/reviews/disputes 필드 매핑

| Mock 필드명           | Mock 타입    | 운영 DB 테이블         | 운영 DB 컬럼                   | 비고                                         |
| --------------------- | ------------ | ---------------------- | ------------------------------ | -------------------------------------------- |
| `contracts.id`        | String       | `contracts`            | `id`                           |                                              |
| `quoteRequestId`      | String       | `contracts`            | `quote_request_id`             | FK                                           |
| 없음                  | -            | `contracts`            | `factory_quote_id`             | 선택 견적 추적 필요                          |
| `clientName`          | String       | DTO join               | 없음                           | `client_user_id`/company join으로 대체       |
| `factoryId`           | String       | `contracts`            | `factory_profile_id`           | FK                                           |
| `factoryName`         | String       | DTO join               | 없음                           |                                              |
| `projectName`         | String       | `contracts`            | `project_name`                 | snapshot 허용                                |
| `amount`              | String       | `contracts`            | `amount`                       | numeric 분리 TODO                            |
| `dueDate`             | String       | `contracts`            | `due_date`                     | date                                         |
| `paymentMethod`       | String       | `contracts`            | `payment_method`               | `PaymentMethod`                              |
| `status`              | String       | `contracts`            | `status`                       | `ContractStatus`                             |
| `mockOnly`            | Boolean      | `contracts`            | `mock_only`                    | 운영에서는 adapter log로 분리 가능           |
| `paidAt`              | String       | `mock_escrow_payments` | `paid_at`                      | 현재 contract map에 patch됨. 별도 table 권장 |
| `transactions.id`     | String       | `transactions`         | `id`                           |                                              |
| `contractId`          | String       | `transactions`         | `contract_id`                  | unique FK                                    |
| `myRole`              | String       | DTO 계산               | 없음                           | 요청자 기준 계산 권장                        |
| `client`              | String       | DTO join               | 없음                           |                                              |
| `factory`             | String       | DTO join               | 없음                           |                                              |
| `status`              | String       | DTO label              | 없음 또는 `status_label`       | DB 저장 비권장                               |
| `statusKey`           | String       | `transactions`         | `status_key`                   | `TransactionStatus`                          |
| `progressRate`        | Number       | `transactions`         | `progress_rate`                | 0~100 validation                             |
| `currentStep`         | Number       | `transactions`         | `current_step`                 |                                              |
| `nextAction`          | String       | `transactions`         | `next_action`                  |                                              |
| `deliveryFile`        | Object       | `attachments`          | owner=`TRANSACTION_DELIVERY`   |                                              |
| `inspectionFile`      | Object       | `attachments`          | owner=`TRANSACTION_INSPECTION` |                                              |
| `updates[]`           | List<Object> | `transaction_updates`  | row                            | nested 구조 분리                             |
| `review`              | Object       | `reviews`              | row                            | nested 구조 분리                             |
| `disputes.id`         | String       | `disputes`             | `id`                           |                                              |
| `transactionId`       | String       | `disputes`             | `transaction_id`               | FK                                           |
| `projectName`         | String       | DTO join/snapshot      | 없음 또는 snapshot             | 중복 최소화 권장                             |
| `counterparty`        | String       | DTO join               | 없음                           |                                              |
| `type`                | String       | `disputes`             | `type`                         | `DisputeType`                                |
| `typeLabel`           | String       | DTO label              | 없음                           | enum label 생성 권장                         |
| `status`              | String       | `disputes`             | `status`                       | `DisputeStatus`                              |
| `statusLabel`         | String       | DTO label              | 없음 또는 snapshot             | label 생성 권장                              |
| `summary`             | String       | `disputes`             | `summary`                      |                                              |
| `requestedResolution` | String       | `disputes`             | `requested_resolution`         |                                              |
| `evidence`            | List<Object> | `attachments`          | owner=`DISPUTE_EVIDENCE`       |                                              |

---

### 3.10 mock에는 있지만 운영 DB에는 없애거나 계산할 필드

| Mock 필드                                                                                     | 이유                        | 운영 대안                                |
| --------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------- |
| `currentUser`                                                                                 | 서버 메모리 session 상태    | Spring Security context/JWT/session      |
| `clientName`, `factoryName`, `senderName`, `receiverName`, `senderCompany`, `receiverCompany` | 정규화 데이터 중복          | FK join 후 DTO에서 생성                  |
| `quantity`                                                                                    | `estimatedQuantity`와 중복  | `estimated_quantity` 하나로 통일         |
| `description`                                                                                 | `detailRequirements`와 중복 | `detail_requirements` 하나로 통일        |
| `isFavorite`                                                                                  | 조회자별 계산값             | `company_favorites` 존재 여부로 DTO 계산 |
| `transactions.myRole`                                                                         | 요청자에 따라 달라지는 값   | auth user와 transaction 관계로 계산      |
| `transactions.status` 한글 문자열                                                             | enum label 중복 저장        | `status_key` 저장 후 label 변환          |
| `disputes.typeLabel`, `disputes.statusLabel`                                                  | enum label 중복 저장        | DTO/i18n layer에서 생성                  |
| nested `company` object in user                                                               | 중복 snapshot               | `company_id` FK                          |
| nested `attachments`, `updates`, `review`, `replies`                                          | document-style 구조         | 별도 table 관계                          |

---

### 3.11 운영 DB에는 필요하지만 mock에는 부족한 필드

| 운영 필요 필드                           | 대상 테이블            | 필요한 이유                    |
| ---------------------------------------- | ---------------------- | ------------------------------ |
| `password_hash`                          | `users`                | 실제 인증                      |
| `created_at`, `updated_at`, `deleted_at` | 대부분 테이블          | 감사/정렬/soft delete          |
| `client_user_id`, `client_company_id`    | `quote_requests`       | 내 요청/회사 요청 조회         |
| `company_id`                             | `factory_profiles`     | 회사와 공장 프로필 연결        |
| `sender_user_id`                         | `factory_quotes`       | 견적 제출 담당자 추적          |
| `factory_quote_id`                       | `contracts`            | 어떤 견적으로 계약했는지 추적  |
| `reviewer_user_id`                       | `reviews`              | 리뷰 작성자 추적               |
| `requester_user_id`                      | `disputes`             | 분쟁 신청자 추적               |
| `receiver_user_id`                       | `notifications`        | 사용자별 알림 조회             |
| `reference_type`, `reference_id`         | `notifications`        | 알림 발생 도메인 추적          |
| `owner_type`, `owner_id`                 | `attachments`          | 여러 도메인 파일 metadata 연결 |
| `storage_url` 또는 `storage_key`         | `attachments`          | 실제 파일 저장소 연결 시 필요  |
| `raw_mock_payload`                       | `mock_escrow_payments` | mock/adapter 응답 감사 로그    |

---

### 3.12 실제 API 전환 시 주의할 점

1. **ID 타입 전환**
   - mock은 `req-001`, `TXN-2026-018` 같은 문자열 ID를 사용합니다.
   - 운영 DB는 bigint PK + public id/code 컬럼을 병행하는 방안을 권장합니다.
2. **응답 호환성**
   - 프론트 연동 전까지 기존 mock field alias를 DTO에서 유지할지 결정해야 합니다.
   - 내부 entity는 정규화하고, API DTO에서 `estimatedQuantity`, `detailRequirements` 등 기존 명세 필드를 유지하는 방식이 안전합니다.
3. **enum 저장 방식**
   - JPA `@Enumerated(EnumType.STRING)` 사용 권장.
   - DB 저장값은 대문자 enum constant로 통일하고, API serialization alias는 필요 시 DTO/JsonCreator에서 처리합니다.
4. **파일 처리**
   - 현재는 metadata만 저장합니다.
   - 실제 저장소 도입 시에도 `Attachment` entity와 `FileStorageAdapter`를 분리해야 합니다.
5. **AI 매칭**
   - OpenAI 호출은 controller/service에 직접 넣지 말고 `MatchingAdapter` interface로 분리합니다.
   - API key가 없을 때 deterministic mock fallback을 유지합니다.
6. **결제/전자서명**
   - 실제 PG/e-sign provider 응답은 adapter log table에 저장하고 core contract/transaction 상태와 분리합니다.
7. **메시지/알림 이벤트화**
   - 견적 제출, 매칭 완료, 결제 완료, 분쟁 상태 변경 시 domain event로 메시지/알림을 생성하는 방식 권장.

---

## 4. 추후 JPA package 구조 제안

### 4.1 패키지 방식 판단

| 방식                                                     | 장점                                | 단점                                          | RootMatching 적합성 |
| -------------------------------------------------------- | ----------------------------------- | --------------------------------------------- | ------------------- |
| 계층형 패키지 (`controller/`, `service/`, `repository/`) | 초기에 단순                         | 도메인 간 파일이 흩어져 변경 영향 추적 어려움 | 낮음                |
| 도메인별 패키지 (`quote/`, `factory/`, `transaction/`)   | 기능 단위 응집도 높음, 팀 분업 쉬움 | 공통 규칙 정리가 필요                         | 높음                |

**최종 추천: 도메인별 패키지 구조**

현재 mock API도 이미 도메인별 controller/service로 분리되어 있으므로, JPA 전환 시 도메인별 package 안에 `entity`, `repository`, `dto`, `mapper`, `service`, `controller`를 두는 방식이 가장 자연스럽습니다.

---

### 4.2 최종 추천 package tree

```text
backend/src/main/java/com/dgu/backend/
├── global/
│   ├── config/
│   ├── error/
│   ├── response/
│   ├── security/                 # TODO: JWT/session 인증 도입 시
│   └── util/
├── rootmatching/
│   ├── common/
│   │   ├── entity/
│   │   │   └── BaseTimeEntity.java
│   │   ├── dto/
│   │   └── mapper/
│   ├── auth/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── service/
│   │   └── exception/
│   ├── user/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   ├── mapper/
│   │   └── exception/
│   ├── company/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   └── mapper/
│   ├── factory/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   └── mapper/
│   ├── quote/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   └── mapper/
│   ├── matching/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   ├── adapter/
│   │   │   ├── MatchingAdapter.java
│   │   │   ├── DeterministicMockMatchingAdapter.java
│   │   │   └── OpenAiMatchingAdapter.java       # TODO, key 없으면 비활성
│   │   └── mapper/
│   ├── contract/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   ├── adapter/
│   │   │   ├── EscrowPaymentAdapter.java
│   │   │   └── MockEscrowPaymentAdapter.java
│   │   └── mapper/
│   ├── transaction/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   └── mapper/
│   ├── review/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   └── service/
│   ├── dispute/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   └── mapper/
│   ├── message/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   └── mapper/
│   ├── notification/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── service/
│   │   └── mapper/
│   └── attachment/
│       ├── dto/
│       ├── entity/
│       ├── repository/
│       ├── service/
│       └── adapter/
│           ├── FileStorageAdapter.java
│           └── MockFileStorageAdapter.java
```

---

### 4.3 각 패키지 역할

| 패키지       | 역할                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------- |
| `controller` | HTTP endpoint, request validation 진입점, response envelope 반환                            |
| `dto`        | Request/Response DTO. 프론트 contract와 내부 entity 분리                                    |
| `entity`     | JPA entity, enum, entity relationship 정의                                                  |
| `repository` | Spring Data JPA repository, query method/custom query                                       |
| `service`    | 도메인 use case, transaction boundary, 상태 전이 검증                                       |
| `mapper`     | entity ↔ DTO 변환. MapStruct 도입 여부 TODO                                                 |
| `exception`  | 도메인별 예외. global handler에서 공통 응답 변환                                            |
| `adapter`    | 외부 시스템 boundary. OpenAI/PG/e-sign/file storage 등을 직접 service에 넣지 않기 위한 계층 |

---

### 4.4 mock API → 운영 DB 기반 API 전환 순서

| 단계 | 작업                                  | 설명                                                                          |
| ---: | ------------------------------------- | ----------------------------------------------------------------------------- |
|    1 | Enum 확정                             | 이 문서의 enum 제안을 기준으로 DB 저장값/API alias 정책 결정                  |
|    2 | Entity 설계                           | `users`, `companies`, `quote_requests` 등 core entity부터 작성                |
|    3 | Repository 추가                       | 각 entity별 Spring Data JPA repository 생성                                   |
|    4 | DTO 분리                              | 현재 `Map<String,Object>` 응답을 Request/Response DTO로 교체                  |
|    5 | User/Company 전환                     | 인증/회사/즐겨찾기부터 DB 기반으로 전환                                       |
|    6 | Factory/Quote 전환                    | 공장 프로필, 견적 요청, 첨부 metadata DB 저장 적용                            |
|    7 | Matching 전환                         | deterministic mock adapter 결과를 `match_recommendations`에 저장              |
|    8 | Quote/Message/Notification event 연결 | 견적 제출 시 factory quote 저장 후 message/notification 생성 transaction 처리 |
|    9 | Contract/Transaction 전환             | 계약 생성, mock escrow, 거래 상태 전이 DB화                                   |
|   10 | Review/Dispute 전환                   | 리뷰/분쟁/증빙/timeline DB화                                                  |
|   11 | 인증/권한 적용                        | JWT/session, role/ownership authorization 추가                                |
|   12 | 통합 테스트 보강                      | API contract test + repository/service integration test 작성                  |
|   13 | mock store 제거                       | `RootMatchingStore` 제거 또는 test fixture 전용으로 이동                      |

---

## 5. 추가 확인 필요 사항

| 항목                 | 확인 필요 내용                                             | 권장 액션                                                 |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| ID 전략              | bigint auto increment, UUID, public code 병행 여부         | API URL 호환성을 위해 internal id + public code 검토      |
| 사용자 role          | `admin/member` 외 공장/발주처 role을 user role로 둘지 여부 | `UserRole`과 `TransactionPartyRole` 분리 권장             |
| 회사와 공장 관계     | 한 회사가 여러 공장 프로필을 가질 수 있는지                | 1:N 가능성을 열어 `factory_profiles.company_id` 구성 권장 |
| quote request status | AI 매칭 완료 `MATCHED`를 상태로 저장할지 여부              | 추천 결과 생성 이력과 request 상태 정책 결정              |
| 거래 분쟁 상태       | 분쟁 발생 시 transaction에 `DISPUTED`를 추가할지 여부      | 운영/CS 요구사항 확인 필요                                |
| 금액 정규화          | `4,200,000원`, `3,000만원 ~ 4,500만원` 문자열 유지 여부    | `amount_min`, `amount_max`, `currency`, `unit` 분리 검토  |
| 파일 저장            | S3/GCS/local 중 어떤 adapter를 쓸지                        | 현재는 metadata만 유지. 실제 저장소는 별도 결정           |
| OpenAI 사용          | 모델/비용/실패 fallback 정책                               | backend adapter + key 없는 경우 deterministic mock 유지   |
| 전자서명             | 자체 mock 단계 유지 또는 외부 e-sign 도입 여부             | provider 선택 전까지 `SIGNED_MOCK` 유지                   |
| 결제/에스크로        | 실제 PG provider와 정산 정책                               | mock payment table과 실제 payment adapter 분리            |
| 검색                 | MySQL FULLTEXT로 충분한지, OpenSearch 필요 여부            | 초기 MySQL FULLTEXT, 데이터 증가 시 검색엔진 검토         |
| audit/soft delete    | 모든 테이블에 `deleted_at`이 필요한지                      | 운영/관리자 기능 요구 확인                                |
