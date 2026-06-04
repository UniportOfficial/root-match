# Rootmatching MVP Roadmap & Backlog

> **MVP 완성까지 남은 작업의 단일 진실원 (Single Source of Truth)**

| 항목                 | 값                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 작성일               | 2026-06-02                                                                                                                                         |
| 활성 브랜치          | `dev-monorepo`                                                                                                                                     |
| 기준 HEAD            | `5f98508` (docs: matching endpoint design decision)                                                                                                |
| PRD 기준             | `docs/prd/rootmatching-prd.md` v0.4                                                                                                                |
| Functional Spec 기준 | `docs/specs/functional-spec.md` (27 라우트 + §14 9 acceptance criteria)                                                                            |
| 참고 자료            | `docs/handoffs/archive/2026-05-26-phase-1-week-1-complete.md`, `docs/specs/rootmatching-erd.md`, `docs/specs/matching-endpoint-design-decision.md` |

---

## TL;DR

**현재 상태**: UI 99% 완료 (27 라우트), Backend 1% (endpoint 2개), 데이터 0% (모두 mock/Context). 이용자가 보기엔 "동작하는 듯" 하지만 **새로고침하면 모두 사라지는** 시연용 껍데기.

**MVP 정의** (PRD §6.1): 1개 집적지(인천 남동 or 안산 시화) **50공장 + 5발주처**로 **11단계 워크플로 end-to-end 검증** = Phase 6 베타.

**MVP까지 최소 6 Phase**, Phase 1.W2 (백엔드 기반)이 모든 후속의 critical path. 실작업 **약 13-20 working days**부터 시작.

---

## 1. 현재 상태 진단 (코드 기반)

### 1.1 ✅ 작동하는 것 (실 endpoint 2개)

| Endpoint                   | 상태                                                           |
| -------------------------- | -------------------------------------------------------------- |
| `POST /matching/recommend` | AI 매칭 (OpenAI + mock fallback). DB 저장 0. sessionStorage만. |
| `GET /`                    | Hello World                                                    |

### 1.2 🟡 부분 작동 (가드만)

| 영역                         | 한계                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| `apps/web/src/middleware.ts` | `rm-auth`/`rm-role` **JS-set cookie** 존재만 확인. 서버 검증/세션 없음. |
| Login form                   | mock 계정 2개만 (`hong@techsolution.co.kr`, factory)                    |
| `/request → /matching` flow  | 1-step 동작하나 sessionStorage 의존 (새로고침 시 손실)                  |

### 1.3 미구현 (Phase 1.W2 진행 중 업데이트 — 2026-06-03)

**✅ Phase 1.W2 진행 중 해결**:

- **인증**: Better Auth ✅ (W2-2 commit `f484ad5`) — signup/signin/session/middleware/role/accountType 작동; 비밀번호 hash (Better Auth scrypt) ✅; DB session ✅
- **Prisma**: ✅ (W2-1 commit `467b73f`) — 9 models + 4 enums + pgvector 0.8.1 + 1 migration history
- **DB**: Neon ✅ (us-east-2, Postgres 18.4, pooled connection)
- **API endpoint**: 27 라우트 중 2개 실 백엔드 (`/matching/recommend` + `/auth/*`) + `/auth/me` + `/health/db`; 나머지는 Wave 3+ 진행 예정 (W2-5 Users/Companies, Phase 2 Quote/Request)

**❌ 여전히 미구현**:

- **파일 업로드/다운로드**: UI만, 실제 storage 0% (Phase 2)
- **외부 통합**: 토스페이먼츠 0%, 모두싸인/이폼사인 0%, 카카오 알림톡 0% (Phase 3-5; 사용자 외부 의존)
- **거래 state machine**: 0% (`transactionData.ts` fixture; Phase 4)
- **분쟁 case 영속**: 0% (제출 시 단순 redirect; Phase 5)

### 1.4 📦 보유 자산 (재활용 가능)

- **`apps/web/src/data/*.ts`** 9개 mock 파일 → Prisma seed 후보
- **`packages/shared/src/types/*.ts`** + zod schemas → DTO 공유 reference
- **`packages/shared/src/fixtures/factory-data.ts`** → factory profile seed
- **`docs/specs/rootmatching-erd.md`** → Prisma schema의 60-70%
- **`docs/specs/backend-design-mapping.md`** → enum/index 정책

---

## 2. MVP까지 단계별 백로그

### 2.1 Phase 1.W2 (백엔드 기반) — 🚨 Critical Path, 13-20 working days

> **모든 후속 Phase가 여기에 막힘**. Better Auth + Prisma 없으면 어떤 도메인도 API화 불가.

| #      | 작업                                                                                                                              |    Effort    |                           상태                           | 검증                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | :----------: | :------------------------------------------------------: | --------------------------------------------------------------------------------- |
| W2-1   | **Prisma 6 + Neon + pgvector** schema 작성, migration, PrismaService                                                              |   M (2-3d)   |                   ✅ commit `467b73f`                    | `/health/db` → `{db:"up", vectorExtension:"enabled"}`                             |
| W2-2   | **Better Auth 통합** (NestJS mount + Next.js 15 sync + Prisma adapter)                                                            | **L (5-7d)** |                   ✅ commit `f484ad5`                    | 9/9 gates PASS; signup curl 200 + Set-Cookie verified; Playwright smoke PASS      |
| W2-2.5 | **Follow-up backlog** (MIGRATION.md + PrismaService Pattern (a) backfill + Q9 status)                                             |   S (0.5d)   | 🟡 Tier 1 진행 중 (commits `b059cad`, `23d917a`, [this]) | `docs/specs/w2-2.5-followup-backlog.md`                                           |
| W2-3   | **nestjs-zod DTO** + global `ZodValidationPipe` (shared schema 활용)                                                              |    S (1d)    |                      ⏸ Wave 3a 예정                      | invalid body → 400 + zod error                                                    |
| W2-4   | **Mock fixtures → Prisma seed** (`apps/web/src/data/*.ts` 9개 → `apps/api/prisma/seed.ts`)                                        |   M (2-3d)   |                      ⏸ Wave 3a 예정                      | `migrate reset` 후 seed 통과, 2회 실행 후 중복 0; password from `MIGRATION.md` §3 |
| W2-5   | **Users + Companies 모듈** (`BetterAuthGuard` 적용)                                                                               |    M (2d)    |                      ⏸ Wave 3b 예정                      | `GET /users/me` + `PATCH /companies/:id`                                          |
| W2-6   | **운영 보안** (`@nestjs/throttler` + `helmet` + `nestjs-pino` + cookie-parser) + **Swagger** (zod-to-openapi `cleanupOpenApiDoc`) |  S-M (2-3d)  |                      ⏸ Wave 4b 예정                      | `/docs` 접속, 5회 호출 후 429                                                     |
| W2-7   | **E2E 테스트** (Nest supertest + 시나리오 #1, #2 Playwright)                                                                      |   M (2-3d)   |                      ⏸ Wave 5 예정                       | CI에서 동일 재현                                                                  |

**Phase 1.W2 합산**: **13-20 working days** (3-4주 풀타임 또는 5-7주 파트타임). **현재 진행도**: W2-1 + W2-2 + W2-2.5 Tier 1 ≈ 8-10 engineer-day 완료. 잔여 W2-3 ~ W2-7 ≈ 8-13 engineer-day.

### 2.2 Phase 2 — 견적 요청 + 매칭 (Phase 1 후속, ~2주)

#### §2.1 `(client)/quotes` 라우트 충돌 해소 (외부 dep #1)

`(client)/quotes`가 factory 대상 콘텐츠를 담고 있어 라우트 그룹과 의미 불일치. **Phase 2 진입 전** decision package 확정 필요 (handoff §3.4 #1).

- 옵션 A: `(client)/quotes` → `(factory)/quotes`로 이동 (URL 변경 없음, 그룹만 이동)
- 옵션 B: `/quotes` 공개 게시판 유지 + factory-specific 라우트 분리
- 결정 후 `middleware.ts` `CLIENT_ONLY_PREFIXES` 정합 검토

#### §2.2 견적 요청 폼 → 실제 Prisma persist + AI 매칭 호출

W2-5 (Users + Companies) + W2-4 seed 산출물 기반. `/request` 폼 제출 시 `quote_requests` + `match_recommendations` DB 저장 (옵션 C, 프런트 변경 0).

- `POST /quote-requests` — Prisma `QuoteRequest` model, 6대 공정 enum, `BetterAuthGuard`
- `POST /matching/recommend` 응답 직전 `match_recommendations` persist
- Vercel Blob (사진/검사결과서) + S3 presigned URL (도면, 최대 50MB)
- functional-spec REQ-001~008, AIM-003

#### §2.3 매칭 결과 → `/matching` 페이지 server-side rendering

현재 sessionStorage 의존 → Prisma 기반 서버 조회. mock fallback 정책 유지 (OpenAI key 미설정 시 dev/test mock 자동 반환).

- `GET /matching/recommendations` — `matchRecommendations` DB 조회
- `/matching` 페이지 server component + Prisma fetch
- functional-spec AIM-001~005

#### §2.4 견적 history (`/requests/[id]`) — Prisma 기반 view

- `GET /quote-requests` + `GET /quote-requests/:id` — Prisma 조회
- `/requests` + `/requests/[id]` server component 전환 (mock data 제거)
- functional-spec REQ-007/008

#### §2.5 Lighthouse a11y 22 routes 검증

backlog §3.4.5 (22개 미검증 라우트 visual regression) + §3.4.2 (CI matrix test:e2e 추가) 통합.

- Phase 2 완료 시점 전체 27 라우트 Lighthouse a11y 100/100 목표
- Session C 적용 완료 5 routes (100×5) 기준 확장
- CI matrix에 lighthouse 검증 추가 검토

#### §2.6 E2E regression (matching + quote-request 시나리오)

- Playwright 시나리오 #1 (로그인 → 견적 요청 → 매칭 결과 → DB 확인)
- Playwright 시나리오 #2 (새로고침 후 `/requests`에서 요청 목록 표시)
- `apps/api/test:e2e --runInBand` (backlog §3.4.1 fix 포함)

### 2.3 Phase 3 — 전자 계약 (외부 dep #2, 1-2주)

#### §3.1 모두싸인 / 이폼사인 vendor 선정 (기준 비교 표)

**Phase 3 진입 전** 업체 선정 완료 필요 (handoff §3.4 #2). 선정 기준:

| 기준            | 모두싸인      | 이폼사인  |
| --------------- | ------------- | --------- |
| API 방식        | REST          | REST      |
| Sandbox 제공    | ✅            | ✅        |
| 한국 전자서명법 | ✅            | ✅        |
| 가격 (월정액)   | 확인 필요     | 확인 필요 |
| NestJS 레퍼런스 | 커뮤니티 있음 | 공식 SDK  |

#### §3.2 API integration + sandbox 테스트

- NestJS `ContractModule` 내 webhook 수신 엔드포인트
- sandbox 환경에서 서명 요청 → 완료 webhook 수신 → DB 상태 전환 확인
- `POST /contracts/:id/sign-request` — 서명 요청 발송

#### §3.3 계약 서명 flow → `transactions` 모듈

- `POST /contracts` — `Contract` Prisma model 생성 (`CREATED` 상태)
- 서명 완료 webhook → `SIGNED` 전환
- 계약서 PDF → S3 저장 + `contract.documentUrl` 업데이트
- functional-spec CON-001~004, FR-5.1~5.6

#### §3.4 서명 완료 → 다음 단계 (escrow) 전환 trigger

- `Contract.status = SIGNED` → `Transaction` 생성 (`ESCROW_PENDING`)
- 발주처에게 결제 안내 알림 (Phase 5 알림 모듈 의존)
- 상태 머신: `CREATED → SIGNED → ESCROW_PAID`

### 2.4 Phase 4 — 토스페이먼츠 escrow (외부 dep #3, 2-3주)

#### §4.1 사업자 KYC 완료 대기 + 페이먼츠 가맹 등록

**Phase 4 진입 전** 완료 필요 (handoff §3.4 #3).

- 토스페이먼츠 escrow 사용을 위한 사업자 KYC 통과
- 가맹점 등록 + sandbox 키 발급
- 정산 주기 + 수수료 정책 확인 (PRD §4.5 참조)

#### §4.2 escrow API 통합 (결제 → escrow hold → 정산)

- `POST /payments/escrow` — 토스페이먼츠 escrow 결제 요청
- `idempotency key` — DB unique constraint (`Transaction.tossOrderId`)
- 결제 완료 webhook → `Transaction.status = ESCROW_PAID`
- 납품 확인 → `POST /payments/escrow/:id/release` — 정산 처리

#### §4.3 분쟁 시 escrow refund flow

- `DISPUTED` 상태 진입 시 escrow hold 유지
- 운영자 결론 → `REFUNDED` (발주처 환불) 또는 `SETTLED` (공장 정산)
- `POST /payments/escrow/:id/cancel` — 환불 API 호출

#### §4.4 회계 / 세금 처리 (적격증빙 발급)

- 세금계산서 발행 트리거 (정산 완료 시)
- 거래 내역 CSV 내보내기 (Admin dashboard)
- PRD NFR-3.x 규정 준수

### 2.5 Phase 5 — 알림 (외부 dep #6, 1주)

#### §5.1 카카오 알림톡 비즈니스 계정 + 템플릿 등록

**Phase 5 진입 전** 완료 필요 (handoff §3.4 #6).

- 카카오 비즈니스 채널 개설 + 알림톡 서비스 신청
- Bizmsg / NHN Cloud 연동 채널 선택
- 템플릿 등록 (견적 요청 접수 / 매칭 완료 / 계약 서명 요청 / 결제 완료 / 납품 확인 요청 / 검수 완료)

#### §5.2 NHN / Bizmsg 통합 (template-based)

- NestJS `NotificationModule` — 알림톡 + 이메일(Resend/Sendgrid) 통합
- template ID map → `apps/api/src/notifications/templates.ts`
- 수신자 국제전화 포맷 처리 (+82)

#### §5.3 transaction state 변경 → 알림 발송 hook

주요 트리거:

| 이벤트             | 수신자 | 채널   |
| ------------------ | ------ | ------ |
| 견적 요청 접수     | 운영자 | 이메일 |
| 매칭 완료          | 발주처 | 알림톡 |
| 계약 서명 요청     | 공장   | 알림톡 |
| 결제 완료          | 공장   | 알림톡 |
| 납품 확인 요청     | 발주처 | 알림톡 |
| 검수 완료/분쟁발생 | 양측   | 알림톡 |

#### §5.4 알림 history + retry

- `Notification` Prisma model (`id`, `userId`, `type`, `channel`, `status`, `sentAt`, `retryCount`)
- 발송 실패 시 최대 3회 retry (`@nestjs/schedule` cron)
- Admin dashboard 알림 발송 로그 조회

### 2.6 Phase 6 — Prod deploy + monitoring (외부 dep #4, #5)

#### §6.1 도메인 확정 (rootmatching.com 또는 대체)

**Prod deploy 전** 완료 필요 (handoff §3.4 #4).

- `rootmatching.com` 가용 여부 + 등록
- DNS 설정 (Vercel custom domain + Railway/Fly.io API subdomain)
- TLS 자동 갱신 확인

#### §6.2 Neon ap-northeast-2 region 재생성 (us-east-2 이전)

**Prod 이전 시** 필요 (handoff §3.4 #5).

- 현재 us-east-2 (Postgres 18.4 / pgvector 0.8.1) → ap-northeast-2 재생성
- 데이터 마이그레이션 + connection string 갱신 (`apps/api/.env`)
- latency 개선 목표: 한국 사용자 기준 < 50ms

#### §6.3 Vercel + Railway/Fly 배포 자동화 (CI/CD)

- `dev-monorepo` → `main` PR merge 시 Vercel preview 자동 배포
- `main` push 시 Railway/Fly.io API 자동 배포 (GitHub Actions)
- `prisma migrate deploy` — production migration 자동화
- 환경변수 관리: Vercel env + Railway secrets

#### §6.4 Datadog / Sentry monitoring + alerting

- Sentry 에러 트래킹 (Next.js + NestJS 양쪽)
- Datadog APM (또는 Fly.io metrics)
- PRD NFR-1.3 부하 목표: 1,000 동시 사용자
- PRD NFR-2.6 보안: OWASP Top 10 침투 테스트
- Alerting: 서버 에러율 > 1% → Slack 알림

---

## 3. Critical Path & 의존성 그래프

```
Phase 1.W2 (백엔드 기반)
   │
   ├── W2-1 Prisma + Neon  ──┐
   │                          ├──► W2-4 seed ──► W2-5 Users/Companies ──► Phase 2 도메인 모듈
   ├── W2-2 Better Auth ──────┤
   │                          ├──► W2-3 nestjs-zod ──► Phase 2~5 모든 API
   ├── W2-6 보안+Swagger──────┘
   │
   └── W2-7 E2E (Phase 2 진입 전 안전망)

Phase 2 (발주+매칭) ──► Phase 3 (견적+계약) ──► Phase 4 (결제+거래) ──► Phase 5 (분쟁+운영) ──► Phase 6 (베타)
```

**병목**: Better Auth (W2-2, L=5-7d)가 가장 김. 모든 protected endpoint가 여기 의존.

**병렬 가능**: W2-6 (보안/Swagger)는 W2-2와 별개로 진행 가능.

---

## 4. 즉시 실행 권장 — 1주 작업 단위

옵션 C ([`docs/specs/matching-endpoint-design-decision.md`](../specs/matching-endpoint-design-decision.md))에 따라 **프런트 변경 0**으로 백엔드만 점진 추가:

| 일자    | 작업                                                                                                                                               | 산출물                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Day 1-2 | **W2-1**: Neon 프로젝트 생성, `apps/api/prisma/schema.prisma` 작성 (User/Company/QuoteRequest/MatchRecommendation 최소 4 model), 1st migration     | DB 연결 + `migrate dev` 통과                    |
| Day 3-4 | **W2-3**: `nestjs-zod` 도입 + `RecommendDto` 변환 + global `ZodValidationPipe`                                                                     | 기존 `POST /matching/recommend`가 zod 검증 통과 |
| Day 5-6 | **W2-4 부분**: `apps/api/prisma/seed.ts` 작성 (mock data 9개 import)                                                                               | `prisma db seed` 통과, factory_data가 DB에 적재 |
| Day 7   | **옵션 C 부분**: `POST /matching/recommend`이 응답 직전 `quote_requests` + `match_recommendations` 영속화 (Better Auth 없이 anonymous client 허용) | 한 시나리오 동작: 폼 제출 → DB 기록 → 응답      |

**1주 후**: 시나리오 #2가 PASS이며 **새로고침 후에도 `/requests`에서 자신의 요청이 보임** (REQ-007).

그다음 주: **W2-2 Better Auth** 시작 → `User`/`Session` 테이블 + login flow 마이그레이션.

---

## 5. MVP 정의 — 명확한 컷오프 기준

PRD §6.1을 코드 기준으로 풀어쓰면:

**MVP는 다음 시나리오를 한 명의 발주처가 한 번에 완수할 수 있을 때 완성**:

1. 회원가입 (Better Auth signup)
2. 로그인
3. `/request`에서 발주 요청 작성 (파일 첨부 포함)
4. `/matching`에서 추천 공장 4-N개 선택
5. 1개 공장 선택 → `/contract`에서 계약 생성
6. **모두싸인** 전자서명 완료
7. **토스페이먼츠** 에스크로 결제 완료
8. 공장 측 진행률 업데이트 (다른 계정)
9. 검수 승인 → 에스크로 해제
10. 리뷰 작성

**거기에 더해 운영자가 분쟁 1건을 4단계로 해결 가능**할 때 MVP 완료.

**현 시점 진행도**: 1, 3, 4 부분 동작 (mock). 나머지 7개는 미구현.

**MVP까지 (보수적)**: Phase 1.W2 + Phase 2~4 + Phase 5 dispute 핵심 = **약 10-14주 풀타임** 또는 4명 팀 병렬로 **5-7주**.

---

## 6. 빠르게 정리 가능한 housekeeping (각 1-2시간)

| 작업                                                                                              | 가치        | 2026-06-03 상태   |
| ------------------------------------------------------------------------------------------------- | ----------- | ----------------- |
| `apps/web/src/app/client/*` redirect stub 제거 (이미 `(client)` 그룹으로 통합됨)                  | 라우트 정리 | ✅ 완료 (§6.1.1)  |
| 사용 안 된 shared types 정리 (단, nested 용도면 유지)                                             | 코드 청결   | ⏸ 미적용 (§6.1.2) |
| middleware `CLIENT_ONLY_PREFIXES`에 `/quotes`, `/companies`, `/messages`, `/mypage` 추가 검토     | 가드 완성   | ⏸ 미적용 (§6.1.3) |
| `apps/api/src/app.controller.ts` Hello World 제거 → `/health` 엔드포인트로 교체                   | 운영 준비   | ✅ 완료 (§6.1.4)  |
| `docs/specs/backend-design-mapping.md` 26개 TODO 중 우리에게 해당 안 되는 것 정리 (Java/JPA 관련) | 문서 청결   | ✅ 완료 (§6.1.5)  |

### 6.1 2026-06-03 housekeeping 검토 결과

본 5개 항목에 대해 실측 후 처리한 결과는 다음과 같습니다.

#### 6.1.1 redirect stub 제거 — ✅ 완료

- **실제 stub 수**: 4개 (`apps/web/src/app/client/{request,matching,requests,requests/[id]}/page.tsx`). 본 §6 표의 "5개"는 오기.
- **functional-spec §4 alias** (`apps/web/src/app/quote-requests/page.tsx`, commit `6a5cf81`)는 의도된 alias로 **유지**.
- **참조 grep**: `/client/(request|matching|requests)` 패턴으로 검색 — 모노레포 전체에서 link 0건 확인.
- **조치**: stub 4개 파일 + 빈 디렉토리 5개 (`request/`, `matching/`, `requests/[id]/`, `requests/`, `client/`) 제거.

#### 6.1.2 미사용 shared types 정리 — ⏸ 미적용 (변경 없음)

- **검증 결과**: `packages/shared/src/types/*.ts`의 **30개 export 중 미사용 0개**. 본 §6 표의 "10개"는 nested(파일 내 다른 type의 일부로만 참조)를 미사용으로 오해한 수치.
- **nested 유지 항목**: `FactoryPortfolioItem`, `FactoryReview`, `FactoryKpi`, `FactoryDetail` (matching.ts) / `DisputeStep`, `DisputeTimelineItem` (disputes.ts) / `Attachment` (requests.ts) / `TransactionFile` (transactions.ts) / `UserPermission` (users.ts) / `ActivityLogType` (notifications.ts) — 총 10개. 모두 자기 파일 내 다른 type의 nested 필드 또는 packages/shared 내부 다른 모듈에서 참조됨.
- **조치**: 코드 변경 없음. 본 항목은 본 housekeeping에서 종결(추가 검토 불필요).

#### 6.1.3 middleware `CLIENT_ONLY_PREFIXES` 확장 — ⏸ 미적용 (변경 없음)

- 후보 4개에 대한 실측:
  - **`/quotes`**: `(client)` 그룹 안에 있으나 페이지 내용은 factory 대상 (`Link href={`/factory/requests/${id}`}`). 라우트 그룹 vs 페이지 의도 **모순**. CLIENT_ONLY로 넣으면 factory가 차단됨. **별도 design-fix PR로 그룹 이동**이 선행되어야 함.
  - **`/companies`**: `(common)` 그룹. client/factory 모두 회사 디렉토리 조회 필요 → CLIENT_ONLY 부적합.
  - **`/messages`**: `(common)` 그룹. 양측 메시지함 → CLIENT_ONLY 부적합.
  - **`/mypage`**: `(common)` 그룹. 양측 프로필 → CLIENT_ONLY 부적합.
- **조치**: middleware 코드 변경 없음. 본 항목 종결. `/quotes` 라우트-디자인 모순은 별도 issue로 추적 권장.

#### 6.1.4 Hello World → `/health` — ✅ 완료

- 변경 파일: `apps/api/src/app.controller.ts`, `apps/api/src/app.service.ts`, `apps/api/src/app.controller.spec.ts`, `apps/api/test/app.e2e-spec.ts`.
- **`GET /`** Hello World 제거 → **`GET /health`** readiness payload (`{ status, service, uptime, timestamp }`).
- **추후 확장**: Phase 1.W2-1 (Prisma + Neon)에서 DB ping (`db: 'ok' | 'down'`), Phase 1.W2-6에서 `@nestjs/terminus` 도입 (구조화된 `HealthCheckResult`).

#### 6.1.5 backend-design-mapping.md TODO 정리 — ✅ 완료

상단 "정책 정렬 차이" 표와 정합하도록 본문 4개 위치에 인라인 라벨/매핑 추가:

- **§2.2 MySQL DDL 예시** — "**[dev-monorepo: 채택 보류]** Postgres + Prisma로 Phase 1.W2-1에서 재작성" 라벨.
- **§4 JPA package 구조 제안** — "**[dev-monorepo: 채택 보류]** NestJS module 구조 사용, §4.4 13단계 흐름만 stack-무관 reference로 채택" 라벨.
- **§3.10 currentUser 운영 대안** — "Spring Security context/JWT/session ⇒ **dev-monorepo: Better Auth session middleware**" 인라인 매핑.
- **§3.12.3 enum 저장 방식** — "JPA `@Enumerated(EnumType.STRING)` ⇒ **dev-monorepo: Prisma `enum` + TS union**" 인라인 매핑.

26개 TODO 자체는 stack-무관 흐름(§3.x mock→DB 매핑, §5 확인 사항 등)이 다수이므로 일괄 삭제하지 않고, **dev-monorepo 정책과 충돌하는 핵심 4지점만 라벨링**하는 방식으로 처리.

---

## 7. 다음 작업 진입 가이드

진행 방향 후보:

| 옵션                          | 설명                                                           | 외부 의존성                                     | 비용          |
| ----------------------------- | -------------------------------------------------------------- | ----------------------------------------------- | ------------- |
| **A. 즉시 Phase 1.W2 시작**   | Day 1-2 Prisma + Neon 셋업부터                                 | **Neon 프로젝트 생성 + connection string 필요** | 13-20d (전체) |
| **B. 옵션 C 부분 구현**       | Prisma + 매칭 영속화만 먼저 (Better Auth 나중)                 | Neon 필요                                       | ~1주          |
| **C. Housekeeping**           | redirect stub 제거 + middleware 보강 + Hello World → `/health` | 없음                                            | 1-2시간       |
| **D. Phase 1.W2 상세 계획서** | `.sisyphus/plans/phase-1-w2.md` 작성 + Momus plan review       | 없음                                            | 1-2시간       |

**권장 순서**: ~~C (housekeeping)~~ ✅ → **D (상세 계획) → 사용자 Neon 셋업 → A (W2-1부터 본격 시작)**

2026-06-03 update: C는 §6.1에서 적용 결과 정리 완료. 다음은 D부터.

---

## 8. 데이터 근거 (코드 grep)

본 로드맵은 다음 도구로 검증되었습니다:

- **explore 에이전트 (`bg_1d7ef1e3`)** — TODO/FIXME 마커, mock data 파일, fetch ↔ controller 매핑, §13 진행 상태, Phase 1.W2 백로그 상태, stub 페이지 grep
- **librarian 에이전트 (`bg_bc5e20d0`)** — Prisma 6.19.3, Better Auth 1.6.13, nestjs-zod 5.4.0, throttler 6.5.0, helmet 8.2.0, nestjs-pino 4.6.1 등 2025-2026 기준 권장 버전 및 통합 패턴 (공식 docs/GitHub source 출처 포함)

### 주요 코드 위치 reference

| 영역             | 파일                                                 | 비고                       |
| ---------------- | ---------------------------------------------------- | -------------------------- |
| 유일 활성 API    | `apps/api/src/matching/matching.controller.ts:8,12`  | `POST /matching/recommend` |
| Hello World      | `apps/api/src/app.controller.ts:4,8`                 | 제거 대상                  |
| 인증 가드        | `apps/web/src/middleware.ts:4,31-53`                 | mock cookie 기반           |
| Mock cookie 처리 | `apps/web/src/lib/auth-cookie.ts:3-11`               | JS-set, httpOnly 아님      |
| Mock 계정        | `apps/web/src/data/users.ts:10-29`                   | client + factory           |
| 1개 실 fetch     | `apps/web/src/app/(client)/request/page.tsx:318-338` | sessionStorage 저장        |

---

## 10. 외부 의존성 현황 (handoff §3.4 cross-reference)

Phase 진입 전 사용자가 직접 해결해야 하는 외부 의존성 6건. 각 Phase의 blocking 조건.

| #   | 항목                                   | Blocking        | 현재 상태           | Action                                                                       |
| --- | -------------------------------------- | --------------- | ------------------- | ---------------------------------------------------------------------------- |
| 1   | `(client)/quotes` 라우트-디자인 결정   | Phase 2 진입 전 | ⏳ decision 작성 중 | 디자인 결정 + 라우트 그룹 이동 PR (Session C closure에서 Phase 2로 deferred) |
| 2   | 모두싸인 / 이폼사인 업체 선정 + API 키 | Phase 3 진입 전 | ⏸ 미착수            | 업체 contract + sandbox API 키 발급                                          |
| 3   | 토스페이먼츠 escrow KYC                | Phase 4 진입 전 | ⏸ 미착수            | 사업자 KYC 완료 + 가맹점 등록                                                |
| 4   | Prod 도메인 확정                       | Prod deploy 전  | ⏸ 미착수            | `rootmatching.com` 확정 또는 대체 도메인 선택                                |
| 5   | Neon region 결정                       | Prod 이전 시    | ⏸ 미착수            | us-east-2 → ap-northeast-2 재생성 (한국 latency 최적화)                      |
| 6   | 카카오 알림톡 비즈니스 계정            | Phase 5 알림 시 | ⏸ 미착수            | Bizmsg / NHN Cloud 계정 + 알림톡 템플릿 등록                                 |

> **주의**: vendor 선정 / 도메인 등 결정 자체는 사용자 영역. 기술 통합은 결정 완료 후 Phase에서 진행.

---

## 11. Phase 1.W2 closure 상태 (Phase 1 완료 임박)

Wave 3a + Q10 + Session C closure 기준 (2026-06-03). W2-5 현재 fire 중.

| 항목      | 상태                                                 | commit / 비고                       |
| --------- | ---------------------------------------------------- | ----------------------------------- |
| W2-1      | ✅ Prisma + pgvector                                 | `467b73f`                           |
| W2-2      | ✅ Better Auth 1.6                                   | `f484ad5`                           |
| W2-2.5    | ✅ Tier 1+2 closure                                  | `b059cad`, `23d917a`, `6695887` 등  |
| W2-3      | ✅ nestjs-zod                                        | `b5558a3`                           |
| W2-4      | ✅ Prisma seed                                       | `1b37cbe`                           |
| Session C | ✅ Design system (Toss tokens + WCAG AAA)            | `3679a34`                           |
| Q10       | ✅ CI matrix 5/5 green (run 26884509375)             | `6cb22d9` + `0fe48aa` + `7360d4f`   |
| W2-5      | ⏳ Users + Companies (현재 fire 중)                  | Wave 3b — 완료 시 §11 갱신          |
| W2-6      | ⏸ 보안 + Swagger (사전 spec 작성 중, backlog §3.4.4) | Wave 4b 예정; W2-5 green 후 진입    |
| W2-7      | ⏸ E2E + Neon CI branching                            | Wave 5 예정; Q3 hybrid CI 결정 시점 |

**Phase 1.W2 완료 기준**: W2-5 + W2-6 + W2-7 green → Phase 2 진입 가능.

---

## 9. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                           |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v1.2 | 2026-06-03 | Phase 2/3/4/5/6 sub-task 구체화 (Phase 2: §2.1~§2.6 / Phase 3: §3.1~§3.4 / Phase 4: §4.1~§4.4 / Phase 5: §5.1~§5.4 / Phase 6: §6.1~§6.4). 외부 dep 6건 cross-reference (§10 신규). Phase 1.W2 closure 상태 매트릭스 (§11 신규). W2-5 ⏳ fire 중 상태 반영.                     |
| v1.1 | 2026-06-03 | §6 housekeeping 5개 항목 중 3개 적용(① redirect stubs 제거 / ④ Hello World → `/health` / ⑤ backend-design-mapping.md 라벨 보강), 2개는 검토 결과 변경 불필요로 종결(② shared types 미사용 0개, ③ middleware 확장 후보 모두 부적합). 자세한 결과는 §6.1. §7 권장 순서 D로 진입. |
| v1.0 | 2026-06-02 | 초기 작성. dev-monorepo HEAD `5f98508` 기준 MVP 백로그 + Critical Path + 1주 실행 가이드. explore + librarian 에이전트 검증 완료.                                                                                                                                              |
