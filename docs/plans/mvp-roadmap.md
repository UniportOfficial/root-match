# Rootmatching MVP Roadmap & Backlog

> **MVP 완성까지 남은 작업의 단일 진실원 (Single Source of Truth)**

| 항목                 | 값                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 작성일               | 2026-06-02                                                                                                                                 |
| 활성 브랜치          | `dev-monorepo`                                                                                                                             |
| 기준 HEAD            | `5f98508` (docs: matching endpoint design decision)                                                                                        |
| PRD 기준             | `docs/prd/rootmatching-prd.md` v0.4                                                                                                        |
| Functional Spec 기준 | `docs/specs/functional-spec.md` (27 라우트 + §14 9 acceptance criteria)                                                                    |
| 참고 자료            | `docs/handoffs/2026-05-26-phase-1-week-1-complete.md`, `docs/specs/rootmatching-erd.md`, `docs/specs/matching-endpoint-design-decision.md` |

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

### 1.3 ❌ 미구현 (대부분)

- **인증**: Better Auth 0%, 비밀번호 hash 0%, DB session 0%
- **API endpoint**: 27 라우트 중 1개만 실 백엔드. 나머지 26개는 mock/Context
- **Prisma**: 의존성도 없음, schema 없음, migration 없음
- **DB**: Neon 연결 0%
- **파일 업로드/다운로드**: UI만, 실제 storage 0%
- **외부 통합**: 토스페이먼츠, 모두싸인, 카카오 알림톡 0%
- **거래 state machine**: 0% (`transactionData.ts` fixture)
- **분쟁 case 영속**: 0% (제출 시 단순 redirect)

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

| #    | 작업                                                                                                                              |    Effort    | 핵심 함정                                                                                              | 검증                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | :----------: | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| W2-1 | **Prisma 6 + Neon + pgvector** schema 작성, migration, PrismaService                                                              |   M (2-3d)   | DIRECT_URL vs DATABASE_URL, pgvector는 raw SQL (`Unsupported("vector")`)                               | `prisma migrate dev` + `GET /health/db`          |
| W2-2 | **Better Auth 통합** (NestJS mount + Next.js 15 sync + Prisma adapter)                                                            | **L (5-7d)** | body-parser 순서, `trustedOrigins`, cookie sync, mock 계정 → real user 마이그레이션                    | `signIn.email` + protected route 401             |
| W2-3 | **nestjs-zod DTO** + global `ZodValidationPipe` (shared schema 활용)                                                              |    S (1d)    | shared import 경계, transform 과사용 시 Swagger drift                                                  | invalid body → 400 + zod error                   |
| W2-4 | **Mock fixtures → Prisma seed** (`apps/web/src/data/*.ts` 9개 → `apps/api/prisma/seed.ts`)                                        |   M (2-3d)   | 관계 seed 순서 (user→company→factory→request), idempotency (upsert), password는 Better Auth signup으로 | `migrate reset` 후 seed 통과, 2회 실행 후 중복 0 |
| W2-5 | **Users + Companies 모듈** (`BetterAuthGuard` 적용)                                                                               |    M (2d)    | `User.role` enum 확장 (additionalFields)                                                               | `GET /users/me` + `PATCH /companies/:id`         |
| W2-6 | **운영 보안** (`@nestjs/throttler` + `helmet` + `nestjs-pino` + cookie-parser) + **Swagger** (zod-to-openapi `cleanupOpenApiDoc`) |  S-M (2-3d)  | matching endpoint는 expensive → 별도 rate limit, CSP는 Swagger UI와 충돌 가능                          | `/docs` 접속, 5회 호출 후 429                    |
| W2-7 | **E2E 테스트** (Nest supertest + 시나리오 #1, #2 Playwright)                                                                      |   M (2-3d)   | test DB 격리, OpenAI는 mock fallback 고정                                                              | CI에서 동일 재현                                 |

**Phase 1.W2 합산**: **13-20 working days** (3-4주 풀타임 또는 5-7주 파트타임)

### 2.2 Phase 2 (발주 + 매칭 MVP) — 약 2-3주

기능 ID와 작업 매핑 (functional-spec §6 + ERD 기반):

| 도메인                | 작업                                                                                                  | functional-spec ID   | 우선순위 |
| --------------------- | ----------------------------------------------------------------------------------------------------- | -------------------- | :------: |
| **Request**           | `POST/GET/PATCH /quote-requests`, Prisma model, 6대 공정 enum                                         | REQ-001~006          |    P0    |
| **Request 영속화**    | `POST /matching/recommend`에 `quote_requests` + `match_recommendations` write (옵션 C, 프런트 변경 0) | REQ-007/008, AIM-003 |    P0    |
| **File upload**       | Vercel Blob (사진/검사결과서) + S3 presigned (도면, 최대 50MB)                                        | REQ-005, FR-2.2      |    P0    |
| **Factory directory** | `GET /companies`, `GET /companies/:id`, 즐겨찾기 + 검색/필터                                          | COM-001~006          |    P0    |
| **Factory profile**   | `POST/PATCH /factories/profile/me` + 포트폴리오 metadata                                              | FAC-001~004          |    P0    |

### 2.3 Phase 3 (견적 + 계약) — 약 2-3주

| 도메인             | 작업                                                                            | functional-spec ID      | 우선순위 |
| ------------------ | ------------------------------------------------------------------------------- | ----------------------- | :------: |
| **Quote**          | `POST /factory/quote-requests/:id/quotes` + 견적 제출 시 메시지/알림 자동 생성  | FAC-005/006, FR-4.1~4.7 |    P0    |
| **운영자 정제 큐** | `apps/web/src/app/(admin)/quotes/` 보호 segment + Admin 모듈                    | FR-4.4, FR-10.2         |    P0    |
| **Contract**       | `POST /contracts` + Prisma model + 상태 머신 (`CREATED → SIGNED → ESCROW_PAID`) | CON-001~004, FR-5.1~5.6 |    P0    |
| **전자서명**       | **모두싸인** 또는 **이폼사인** webhook 연동 + 계약서 PDF S3 저장                | FR-5.2/5.3              |    P0    |

### 2.4 Phase 4 (결제 + 거래) — 약 2-3주

| 도메인                        | 작업                                                                                            | 우선순위 |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | :------: |
| **에스크로 결제**             | 토스페이먼츠 escrow API 연동 + 결제 webhook + **idempotency key** (DB unique constraint)        |    P0    |
| **Transaction state machine** | XState 또는 NestJS Guards. `PRODUCTION → INSPECTION → COMPLETED` + `DELAYED`/`DISPUTED` 분기    |    P0    |
| **납품/검수**                 | `POST /transactions/:id/updates`, `POST /transactions/:id/approve-inspection`. 파일 업로드 통합 |    P0    |
| **평판 batch**                | NestJS Cron으로 매일 trustScore/deliveryRate/reorderRate 계산                                   |    P0    |
| **리뷰**                      | `POST /transactions/:id/review` + 평점 집계                                                     |    P0    |

### 2.5 Phase 5 (분쟁 중재 + 운영 도구) — 약 2-3주

| 도메인              | 작업                                                                               |     우선순위     |
| ------------------- | ---------------------------------------------------------------------------------- | :--------------: |
| **Dispute 4단계**   | 접수 → 운영자 1차 → 양측 의견 → 결론. `PATCH /disputes/:id/status` + timeline 영속 |        P0        |
| **Admin Dashboard** | 거래 모니터링, 분쟁 큐, 견적 정제 큐, CS 도구                                      |        P0        |
| **알림 시스템**     | 카카오 알림톡 (Bizmsg/NHN Toast) + 이메일 (Resend/Sendgrid) — 단계별 트리거        | P0 (알림톡은 P1) |
| **실시간 알림**     | NestJS WebSocket/SSE + 알림 unread count sync                                      |        P1        |

### 2.6 Phase 6 (베타) — 1개 집적지 시범 운영

- 인천 남동 or 안산 시화 50공장 + 5발주처 온보딩 (운영자 콜드콜 + Human-in-the-Loop)
- 11단계 워크플로 end-to-end 5건 이상 검증
- 분쟁/정산 실측 데이터 수집
- 성능 부하 (1,000 동시 사용자, PRD NFR-1.3)
- 보안 침투 (OWASP Top 10, PRD NFR-2.6)

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

| 작업                                                                                              | 가치        |
| ------------------------------------------------------------------------------------------------- | ----------- |
| `apps/web/src/app/client/*` 5개 redirect stub 제거 (이미 `(client)` 그룹으로 통합됨)              | 라우트 정리 |
| 사용 안 된 shared types 10개 정리 (단, nested 용도면 유지)                                        | 코드 청결   |
| middleware `CLIENT_ONLY_PREFIXES`에 `/quotes`, `/companies`, `/messages`, `/mypage` 추가 검토     | 가드 완성   |
| `apps/api/src/app.controller.ts` Hello World 제거 → `/health` 엔드포인트로 교체                   | 운영 준비   |
| `docs/specs/backend-design-mapping.md` 26개 TODO 중 우리에게 해당 안 되는 것 정리 (Java/JPA 관련) | 문서 청결   |

---

## 7. 다음 작업 진입 가이드

진행 방향 후보:

| 옵션                          | 설명                                                           | 외부 의존성                                     | 비용          |
| ----------------------------- | -------------------------------------------------------------- | ----------------------------------------------- | ------------- |
| **A. 즉시 Phase 1.W2 시작**   | Day 1-2 Prisma + Neon 셋업부터                                 | **Neon 프로젝트 생성 + connection string 필요** | 13-20d (전체) |
| **B. 옵션 C 부분 구현**       | Prisma + 매칭 영속화만 먼저 (Better Auth 나중)                 | Neon 필요                                       | ~1주          |
| **C. Housekeeping**           | redirect stub 제거 + middleware 보강 + Hello World → `/health` | 없음                                            | 1-2시간       |
| **D. Phase 1.W2 상세 계획서** | `.sisyphus/plans/phase-1-w2.md` 작성 + Momus plan review       | 없음                                            | 1-2시간       |

**권장 순서**: C (housekeeping) → D (상세 계획) → 사용자 Neon 셋업 → A (W2-1부터 본격 시작)

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

## 9. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                              |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-06-02 | 초기 작성. dev-monorepo HEAD `5f98508` 기준 MVP 백로그 + Critical Path + 1주 실행 가이드. explore + librarian 에이전트 검증 완료. |
