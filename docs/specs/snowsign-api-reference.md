# Snowsign API Reference + Phase 3 Integration Plan

> Phase 3 (전자계약) vendor 결정 및 rootmatching 통합 design. 외부 vendor 가이드의 핵심 부분을 hoist하여 우리 시스템과의 매핑을 명시. 실제 구현은 W2-6 closure + Phase 2 (견적/매칭 persist) 후 별도 delegation으로 진행.

| 항목             | 값                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------- |
| 작성일           | 2026-06-03                                                                                |
| 출처             | 스노우싸인 Public API Guide **v1.3** (2026-05-30; 외부 vendor `jtsnowball.com`)           |
| 의존 컨텍스트    | PRD v0.4 §6.2 (전자계약) + §FR-5 / handoff §3.4 외부 dep #2 / backlog v0.6 §3.7 (예정)    |
| 작업 범위        | spec 문서만 (실제 구현 NOT in scope; Phase 3 delegation 시점)                             |
| 적용 시점        | Phase 3 진입 (W2-6 closure + Phase 2 견적/매칭 persist 후)                                |
| Estimated effort | Phase 3: 1-2 engineer-day (vendor 확인 사항 unblock 가정)                                 |
| 참고 plan        | `.sisyphus/plans/phase-1-w2.md` §A.7 (Phase 3 delegation prompt — 다음 revision에서 작성) |

---

## 0. 핵심 결론 (TL;DR)

1. **Vendor 결정**: PRD v0.4 §6.2의 "모두싸인 / 이폼사인" → **스노우싸인 (Snowsign by JT Snowball)** 채택. 외부 dep #2 vendor 결정 closure.
2. **API 적합성**: PRD FR-5 (계약) P0 5/5 모두 cover. 한국 전자문서법 §4의2 (감사추적인증서) 별도 PDF 지원. integrity_hash (SHA-256) 무결성 검증 가능.
3. **확인 필요 항목 (vendor 문의 needed)**: webhook 지원 여부 / sandbox 환경 분리 정책 / 월 사용량 단가 / 변경계약서 (FR-5.6 P1) 지원.
4. **통합 패턴**: NestJS `contracts/` 모듈 + `SnowsignClient` HTTP wrapper + Prisma `Contract` model + (webhook 또는) `ContractsPoller` Cron. Better Auth + W2-5 user/company 와 직교 통합.
5. **보안**: API key는 `apps/api/.env` (gitignored)에만 저장. CI는 GitHub Actions repo secret. chat/IDE/git에 plain text 노출 금지.

---

## 1. Vendor 정보

| 항목         | 값                                                       |
| ------------ | -------------------------------------------------------- |
| Vendor       | 스노우싸인 (Snowsign)                                    |
| 운영사       | JT Snowball (`jtsnowball.com` 도메인)                    |
| Base URL     | `https://api-snowsign.jtsnowball.com/public`             |
| 프로토콜     | HTTPS                                                    |
| 응답 형식    | JSON (UTF-8)                                             |
| 인증 방식    | `X-API-Key` 헤더 (간단; OAuth/SAML 불필요)               |
| Rate limit   | **100 req/min per API Key**                              |
| API 버전     | `/v1/...`                                                |
| 가이드 버전  | v1.3 (2026-05-30)                                        |
| 콘솔         | 스노우싸인 웹 콘솔 → 조직 설정 → API 키 (생성/회전/폐기) |
| 한국 법 준수 | 전자문서법 §4·§4의2·§5 (감사추적인증서 별도 PDF 발급)    |

### 1.1 API Key 발급 + 보관 정책

1. 스노우싸인 웹 콘솔 → 조직 설정 → API 키 → 새 API 키 (즉시 활성화)
2. 키는 **최초 생성 시에만 확인 가능** — 분실 시 회전 필요
3. **rootmatching 보관 위치**:
   - dev/CI: `apps/api/.env` (gitignored) + GitHub Actions secret `SNOWSIGN_API_KEY`
   - prod: 환경별 별도 키 + Railway/Fly.io secret (도메인 확정 시점)
4. **NEVER**: git commit / chat / IDE history / Slack 등에 plain text 노출.

### 1.2 환경 변수 (apps/api/.env.example placeholder)

```bash
# apps/api/.env.example — NEVER commit actual values
SNOWSIGN_API_KEY=                                      # rotate via Snowsign console
SNOWSIGN_BASE_URL=https://api-snowsign.jtsnowball.com/public
SNOWSIGN_POLL_INTERVAL_MS=300000                       # 5min cron interval (if no webhook)
SNOWSIGN_DEFAULT_EXPIRY_DAYS=14                        # default contract expiry (deadline_days)
```

---

## 2. API 매트릭스 (Snowsign 가이드 v1.3 § 발췌 + rootmatching 매핑)

### 2.1 계약서 API

| 메서드 | 엔드포인트                              | 설명                      | rootmatching 사용처                                         |
| ------ | --------------------------------------- | ------------------------- | ----------------------------------------------------------- |
| GET    | `/v1/contracts`                         | 계약서 목록 조회          | Admin 화면 (FR-10) / 운영자 모니터링                        |
| GET    | `/v1/contracts/{id}`                    | 계약서 상세 조회          | rootmatching DB `Contract` row hydrate 또는 detail 보강     |
| GET    | `/v1/contracts/{id}/status`             | 계약서 상태 조회          | `ContractsPoller` cron polling (webhook 미지원 시)          |
| POST   | `/v1/contracts/{id}/send`               | 계약서 발송               | rootmatching `POST /contracts/:id/send` 핸들러 internal     |
| POST   | `/v1/contracts/{id}/cancel`             | 계약서 취소               | 분쟁 직전 또는 발주처 요청                                  |
| POST   | `/v1/contracts/{id}/remind`             | 리마인더 발송             | 미서명 참여자 nudge (운영자/cron)                           |
| GET    | `/v1/contracts/{id}/download`           | 완료된 PDF 다운로드       | `Contract.downloadUrl` 1h 만료 — on-demand refresh          |
| GET    | `/v1/contracts/{id}/audit-certificate`  | 감사추적인증서 PDF        | 한국 전자문서법 §4의2 준수 — `Contract.auditCertificateUrl` |
| POST   | `/v1/contracts/bulk-download`           | 일괄 다운로드 (최대 50건) | Admin export / 운영자 회계 처리                             |
| POST   | `/v1/contracts/bulk-audit-certificates` | 감사추적 일괄 다운로드    | Admin export                                                |

### 2.2 템플릿 API

| 메서드 | 엔드포인트                           | 설명                                       | rootmatching 사용처                                  |
| ------ | ------------------------------------ | ------------------------------------------ | ---------------------------------------------------- |
| GET    | `/v1/templates`                      | 템플릿 목록                                | 초기 setup 시 1회 + 추후 신규 약관 추가 시           |
| GET    | `/v1/templates/{id}`                 | 템플릿 상세 + signature_fields + variables | `ContractsService.getTemplateMeta(templateId)` cache |
| GET    | `/v1/templates/{id}/download`        | 원본 PDF 다운로드                          | (선택) 발주처에게 약관 미리 보기                     |
| POST   | `/v1/templates/{id}/create-contract` | 템플릿 기반 계약서 생성 (DRAFT)            | rootmatching `POST /contracts` 진입점 (Step 8 entry) |

### 2.3 상태 전이

```text
draft ──send──▶ pending ──(1st 서명)──▶ in_progress ──(all 서명)──▶ completed
   │                │                          │
   │                └──── cancel ────────┐     └── reject/expire ──▶ rejected/expired
   └──── cancel ─────────────────────────┴──▶ cancelled
```

7 states (PRD FR-5.4 기준 4 states보다 풍부) — rootmatching `ContractStatus` Prisma enum도 동일하게 정의.

### 2.4 보안 method 옵션

| 값                      | 설명                                                      | rootmatching 권장                                    |
| ----------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `email`                 | 이메일 링크 클릭만 (기본)                                 | dev/test 환경                                        |
| `password`              | 서명 비밀번호 입력                                        | client/factory 양측 모두 prod default                |
| `easy_cert`             | 간편인증 (카카오/PASS 등 vendor 측에서 처리)              | factory 측 (60대 디지털 약자 UX 호환)                |
| `identity_verification` | 본인인증 (휴대폰 SMS + CI 해시; CI값은 API 응답에서 제외) | **prod default (양측)** — PRD NFR-2 보안 + 분쟁 대응 |

→ rootmatching prod default = **identity_verification** (양측), factory 측은 easy_cert 옵션 허용.

### 2.5 모바일 알림톡 (vendor 내장)

- Snowsign이 자체적으로 카카오 알림톡 발송 지원 (`mobile_alimtalk_enabled` per participant).
- **rootmatching Phase 5 카카오 알림톡 (FR-11.3)과의 관계**:
  - **계약 관련** 알림 (서명 요청 / 완료) → Snowsign vendor managed (rootmatching 구현 불필요)
  - **비계약 거래** 알림 (검수 / 결제 / 분쟁 / 매칭) → rootmatching 자체 통합 (Bizmsg/NHN Cloud)
- → Phase 5 알림톡 scope **축소 가능** (이점: 빌드 effort 감소 + vendor template 등록 1단계 통합).

### 2.6 integrity_hash + 감사추적

- `data.integrity_hash` = 완성 PDF + 감사추적인증서 SHA-256 (completed 시점만 채워짐)
- rootmatching 측 무결성 검증 패턴:
  1. `GET /v1/contracts/{id}/download` → PDF 받기
  2. `GET /v1/contracts/{id}/audit-certificate` → 인증서 PDF 받기
  3. 두 파일 binary concat → SHA-256 계산 → `integrity_hash`와 비교
  4. 일치 = 전자문서법 §4의2 ("내용의 동일성") 보장
- 분쟁 발생 시 (Phase 5 FR-8) audit certificate + integrity hash가 법적 증빙.

---

## 3. PRD FR-5 (계약) 매핑 — 5/5 P0 cover

| PRD FR    | 기능                                                                       | Snowsign 매핑                                                             | 평가                           |
| --------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------ |
| FR-5.1 P0 | 전자계약 작성                                                              | `POST /v1/templates/{id}/create-contract` (template-based)                | ✅                             |
| FR-5.2 P0 | 전자서명 (모두싸인/이폼사인 webhook → **스노우싸인 webhook 또는 polling**) | `POST /v1/contracts/{id}/send` + 참여자 서명 + status sync                | ✅ (webhook 미명시; §5.1 참조) |
| FR-5.3 P0 | 계약서 PDF 다운로드 (S3 presigned URL)                                     | `GET /v1/contracts/{id}/download` (1h expiry URL)                         | ✅                             |
| FR-5.4 P0 | 상태 머신 (`drafting → signed → in_progress → completed / disputed`)       | 7 states (draft/pending/in_progress/completed/cancelled/expired/rejected) | ✅ 더 풍부                     |
| FR-5.5 P0 | 표준 약관 템플릿 (DB 관리)                                                 | 템플릿 등록 + variables (date/checkbox/text) + signature_fields           | ✅                             |
| FR-5.6 P1 | 변경계약서                                                                 | (가이드 미명시 — cancel + 재생성 패턴 추정)                               | 🟡 vendor 확인 needed (§5.4)   |
| 부가      | 한국 전자문서법 §4의2 (감사추적인증서)                                     | `GET /v1/contracts/{id}/audit-certificate`                                | ✅                             |
| 부가      | integrity hash (SHA-256)                                                   | `data.integrity_hash` (completed 시)                                      | ✅ 무결성 검증 가능            |

→ **PRD FR-5 P0 5/5 모두 cover** + FR-5.6 P1 1개만 vendor 확인 needed.

---

## 4. rootmatching 통합 architecture (Phase 3 draft)

### 4.1 Prisma model

```prisma
model Contract {
  id                    String         @id @default(cuid())
  quoteRequestId        String         @unique
  quoteRequest          QuoteRequest   @relation(fields: [quoteRequestId], references: [id])
  acceptedQuoteId       String?
  acceptedQuote         Quote?         @relation(fields: [acceptedQuoteId], references: [id])

  snowsignContractId    String?        @unique
  snowsignTemplateId    String?

  title                 String
  status                ContractStatus @default(draft)

  sentAt                DateTime?
  completedAt           DateTime?
  cancelledAt           DateTime?
  cancelledReason       String?
  expiresAt             DateTime?

  integrityHash         String?
  downloadUrl           String?
  downloadUrlExpiresAt  DateTime?
  auditCertificateUrl   String?
  auditCertificateUrlExpiresAt DateTime?

  participants          ContractParticipant[]
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  @@index([status, createdAt])
  @@index([snowsignContractId])
}

model ContractParticipant {
  id              String   @id @default(cuid())
  contractId      String
  contract        Contract @relation(fields: [contractId], references: [id])
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])

  snowsignParticipantUuid String?
  roleName        String
  name            String
  email           String
  phone           String?
  securityMethod  String?
  mobileAlimtalkEnabled Boolean @default(false)

  status          String   @default("pending")
  signedAt        DateTime?

  @@index([contractId, status])
}

enum ContractStatus {
  draft
  pending
  in_progress
  completed
  cancelled
  expired
  rejected
}
```

### 4.2 NestJS module 구조

```text
apps/api/src/contracts/
  ├─ contracts.module.ts             // Module + Controller + Service + Poller + Client
  ├─ contracts.controller.ts         // /contracts CRUD + send/cancel/sync/pdf
  ├─ contracts.service.ts            // Prisma orchestration + Snowsign client calls
  ├─ snowsign.client.ts              // HTTP wrapper (X-API-Key, zod schema validation)
  ├─ contracts.poller.ts             // @nestjs/schedule Cron (status sync if no webhook)
  ├─ contracts.webhook.controller.ts // (if vendor 지원 시) POST /webhooks/snowsign
  └─ dto/
       ├─ create-contract.dto.ts     // createZodDto from shared/schemas/contract.ts
       ├─ send-contract.dto.ts
       └─ snowsign-contract.schema.ts // zod schema for vendor response validation

packages/shared/src/schemas/contract.ts
  // ContractCreateSchema, ContractParticipantSchema, ContractStatusSchema (.meta({id}))
```

### 4.3 Endpoint set (rootmatching internal)

| 메서드 | 경로                    | 가드                     | 설명                                                                             |
| ------ | ----------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| POST   | `/contracts`            | BetterAuthGuard          | 견적 accept → template_id + participants로 draft 생성 (Snowsign create-contract) |
| GET    | `/contracts/me`         | BetterAuthGuard          | 내가 발주처/공장인 계약 list                                                     |
| GET    | `/contracts/:id`        | BetterAuthGuard          | 상세 + participants                                                              |
| POST   | `/contracts/:id/send`   | BetterAuthGuard          | Snowsign 발송 (월 사용량 차감 — 운영자 confirmation 권장)                        |
| POST   | `/contracts/:id/cancel` | BetterAuthGuard          | 취소 (with reason)                                                               |
| POST   | `/contracts/:id/sync`   | BetterAuthGuard          | 수동 status sync (Snowsign GET /status)                                          |
| GET    | `/contracts/:id/pdf`    | BetterAuthGuard          | downloadUrl on-demand refresh + redirect (1h)                                    |
| GET    | `/contracts/:id/audit`  | BetterAuthGuard          | auditCertificateUrl on-demand refresh + redirect                                 |
| POST   | `/webhooks/snowsign`    | webhook signature verify | (if 지원) vendor webhook 수신                                                    |

### 4.4 워크플로 (PRD §5.2 Step 7-9 cover)

```text
Step 7  발주처 비교/선택 (FE)
    └─→ /matching에서 공장 선택 → 선택된 견적 ID 확정

Step 8  전자계약 체결 (FE + rootmatching backend + Snowsign)
    1. POST /contracts (rootmatching)
       └─→ ContractsService.create()
            ├─→ Prisma Contract row 생성 (status=draft)
            ├─→ snowsign.client.createContract(template_id, participants, variables)
            ├─→ snowsignContractId 저장 + status=draft 유지
            └─→ return contractId

    2. POST /contracts/:id/send (rootmatching)
       └─→ ContractsService.send()
            ├─→ Snowsign 콘솔 confirmation (운영자) — 월 사용량 차감 prevention
            ├─→ snowsign.client.sendContract(snowsignContractId)
            ├─→ status=pending, sentAt=now
            └─→ FE에 알림 (또는 vendor 알림톡)

    3. (참여자가 Snowsign hosted page에서 서명)
       └─→ Snowsign 측에서 email + 알림톡 발송 (rootmatching 미관여)

    4. [polling OR webhook]
       └─→ ContractsPoller.tick() 5min마다 active contracts (status NOT IN [completed, cancelled, expired, rejected]) status sync
            ├─→ snowsign.client.getStatus(snowsignContractId)
            ├─→ status 변경 시 Prisma update
            └─→ status=completed 시:
                 ├─→ integrity_hash, downloadUrl, auditCertificateUrl 캐시
                 └─→ event emit (escrow trigger, Phase 4)

Step 9  escrow 결제 (Phase 4 territory)
    └─→ Contract.status=completed → Transaction 생성 (ESCROW_PENDING)
```

---

## 5. Open questions (vendor 문의 needed — Phase 3 entry blocker)

### 5.1 Webhook 지원 여부 — CRITICAL

- 가이드 v1.3 전체 검색: **webhook 관련 API 미명시**.
- rootmatching 측 함의:
  - **있으면**: vendor에서 `POST /webhooks/snowsign` 호출 → 즉시 status sync (latency ~0)
  - **없으면**: `ContractsPoller` Cron 5min interval (latency 0-5min) + active contracts만 polling
- **vendor 문의 필요**: webhook signing secret + payload format + retry policy
- **임팩트**: 없으면 PRD FR-5.2의 "webhook" wording → "webhook 또는 status polling"으로 갱신 needed.

### 5.2 Sandbox 환경 — CRITICAL

- 가이드에 dev/staging/prod 환경 분리 정책 미명시.
- 가능성:
  - (a) 단일 base URL + 별도 dev API key (월 사용량 면제 또는 무료 한도)
  - (b) 별도 sandbox URL (e.g., `api-snowsign-sandbox.jtsnowball.com`)
  - (c) 모든 호출이 실제 사용량 차감 (dev 작업 비용 우려)
- **vendor 문의 필요**: sandbox URL + sandbox key 발급 정책 + dev 테스트 비용 면제 여부.

### 5.3 가격 / 사용량 정책

- `POST /v1/contracts/{id}/send` 시점 "월간 계약 사용량 차감" 명시.
- 미명시:
  - 단가 (계약 1건당 비용)
  - 월 한도 (한도 초과 시 정책)
  - 분기 결제 vs prepaid
- **vendor 문의 필요** (사업 회계 측면).

### 5.4 변경계약서 (FR-5.6 P1)

- 가이드에 변경계약서 API 미명시.
- 가능 패턴:
  - (a) cancel + 재생성 (audit trail 단절 우려)
  - (b) vendor에 별도 endpoint 있을 가능성
- **vendor 문의 필요** (Phase 3 P0 영역 아니지만 P1로 영향).

### 5.5 권한 / 조직 관리

- API key가 조직 단위로 발급됨. multi-tenant rootmatching 구조에서:
  - rootmatching 운영팀이 단일 조직 API key로 모든 계약 처리 (현재 default 가정)
  - 또는 발주처/공장별 별도 조직 (vendor 멀티 조직 지원 시) — 가이드 미명시
- **vendor 문의 필요** (보안 + 권한 격리 측면).

### 5.6 한국어 / locale

- 가이드는 한국어 + JSON UTF-8 명시.
- 알림톡 본문 시각 = KST 기준 명시.
- API 응답의 에러 메시지가 한국어인지 영어인지 미명시 (예시는 한국어).
- 큰 임팩트 없음 — i18n 시점에 재확인.

---

## 6. Phase 3 작업 순서 (W2-6 closure + Phase 2 견적/매칭 persist 후)

### 6.1 Pre-condition (Phase 3 진입 전 사용자 결정 needed)

- [x] vendor 결정 (스노우싸인 채택)
- [ ] §5.1 webhook 지원 여부 vendor 문의 → 답변 (Tier 1 MUST)
- [ ] §5.2 sandbox 환경 + dev key 발급 → 확인 (Tier 1 MUST)
- [ ] §5.3 가격 / 월 사용량 정책 → 확인 (Tier 1 MUST)
- [ ] §5.4 변경계약서 정책 → 확인 (Tier 2 SHOULD)
- [x] template 등록 (Snowsign 콘솔, 표준 약관 1-3종) — 사용자 사전 작업
- [ ] PRD v0.5 갱신 (§6.2 vendor "모두싸인 / 이폼사인" → "스노우싸인") (Tier 2 SHOULD)
- [ ] backlog v0.6 §3.7 신설 (본 문서와 함께 commit)
- [ ] plan §A.7 W2-Phase3 delegation prompt 작성 (다음 plan revision)

### 6.2 Sub-steps (단일 atomic commit 가정)

1. **(S)** `pnpm --filter @rootmatching/api add @nestjs/schedule` + `axios` (HTTP client) — 또는 `undici` (built-in fetch wrapping)
2. **(M)** `apps/api/prisma/schema.prisma` — `Contract` + `ContractParticipant` + `ContractStatus` enum 추가 + migration
3. **(M)** `packages/shared/src/schemas/contract.ts` — `ContractCreateSchema`, `ContractParticipantSchema`, `ContractStatusSchema` `.meta({id})`
4. **(M)** `apps/api/src/contracts/` 모듈 + service + controller + DTOs
5. **(M)** `apps/api/src/contracts/snowsign.client.ts` — HTTP wrapper + zod response validation
6. **(M)** `apps/api/src/contracts/contracts.poller.ts` — @nestjs/schedule Cron (5min) — webhook 미지원 시
7. **(S)** `apps/api/src/contracts/contracts.webhook.controller.ts` — webhook 지원 시 only
8. **(S)** `app.module.ts` — ContractsModule 등록 + ScheduleModule.forRoot()
9. **(M)** `apps/api/test/contracts.e2e-spec.ts` — Snowsign mock + create + send + status sync + completed event
10. **(S)** `apps/api/.env.example` — SNOWSIGN\_\* 변수 placeholder
11. **(XS)** Single atomic commit: `feat(api): contracts module + Snowsign integration (Phase 3)`

### 6.3 Forbidden territory (Phase 3 작업 시 금지)

- W2-6 closure 산출물 변경 (throttler / helmet / pino / Swagger)
- W2-5 Users + Companies 모듈 변경
- Better Auth 코드 (W2-2 frozen)
- apps/web (Phase 2 territory)
- Phase 4 territory (transactions / escrow)
- Phase 5 territory (disputes / reviews / notifications)
- ci.yml

### 6.4 Verification (Phase 3 atomic commit 시)

```bash
# 매 변경 후
pnpm -r typecheck && pnpm lint && pnpm format:check
pnpm guard:no-mock-auth

# Phase 3 검증
pnpm --filter @rootmatching/api build && pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api exec prisma migrate dev --name add_contract_models
pnpm --filter @rootmatching/api test
pnpm --filter @rootmatching/api test:e2e --runInBand

# Live verification (sandbox 환경 가정)
curl -i -X POST http://localhost:3001/contracts \
  -b /tmp/cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"templateId":"<sandbox-template>","title":"테스트 계약","participants":[...],"variables":{...}}'
# 기대: HTTP 201 + { contractId, snowsignContractId, status: "draft" }

curl -i -X POST http://localhost:3001/contracts/<id>/send -b /tmp/cookies.txt
# 기대: HTTP 200 + status: "pending"
```

---

## 7. Phase 5 알림 scope 영향 (positive)

Snowsign이 자체적으로 카카오 알림톡 지원 (`mobile_alimtalk_enabled`)하므로:

- **Phase 5 NotificationModule scope 축소**:
  - 계약 관련 알림 (서명 요청 / 완료) → Snowsign vendor managed (rootmatching 0 effort)
  - 비계약 거래 알림 (검수 / 결제 / 분쟁 / 매칭) → rootmatching 자체 통합 (Bizmsg/NHN)
- **외부 dep #6 (카카오 알림톡 비즈 계정) scope**:
  - 계약 알림 template = Snowsign이 처리 → rootmatching 별도 등록 불필요
  - 비계약 알림 template만 rootmatching 측 등록 (5-6 template)
- **사업 운영 측면**:
  - 알림 비용 = Snowsign 측 (계약 단가에 포함) + rootmatching 자체 (비계약 알림)
  - 통합 monitoring은 별도 (vendor + 자체)

→ Phase 5 알림 effort **약 30-40% 감소** 예상.

---

## 8. 보안 + 운영 권고

### 8.1 API key 관리

- **Rotation 주기**: 분기별 1회 (90일) 권장. vendor 콘솔에서 회전.
- **저장 위치**:
  - dev: `apps/api/.env` (gitignored)
  - CI: GitHub Actions repo secret `SNOWSIGN_API_KEY`
  - prod: Railway/Fly.io secret (도메인 확정 시점, Phase 6)
- **NEVER**:
  - git commit (apps/api/.env가 .gitignore에 포함됐는지 매 setup 시 확인)
  - chat / Slack / IDE history / screenshots / public docs
  - 개발자 PC 외 backup (`~/.zshrc` 등 home dotfiles)
- **노출 시 대응**: 즉시 콘솔 → 키 폐기 → 새 키 발급 → 모든 환경 secret 갱신.

### 8.2 Rate limit 대응

- 100 req/min per key + 우리는 단일 조직 키 가정.
- `ContractsPoller`가 5min interval로 active contracts polling 시:
  - active contracts 100건 가정 → 5min에 100 req = 평균 20 req/min → 한도의 20%
  - 1000건이면 200 req/min → 한도 초과
- **대응**:
  - polling을 batch (`GET /contracts?status=pending,in_progress`)로 1 req에 다수 contract status fetch
  - 또는 active contracts 100건 이상 시 webhook 사용 (vendor 지원 가정)
  - rate limit 초과 시 (429) exponential backoff

### 8.3 Webhook signing (vendor 지원 시)

- vendor가 webhook을 보낼 때 signing secret으로 payload 서명 → rootmatching 측에서 검증
- 매 webhook req에 `X-Snowsign-Signature` 또는 유사 헤더 + HMAC-SHA256 검증
- 미검증 시 spoofed webhook으로 인한 계약 상태 위조 위험

---

## 9. References

| 항목                                    | 출처                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| Snowsign Public API Guide v1.3          | 사용자 제공 (외부 vendor, 2026-05-30)                   |
| 한국 전자문서 및 전자거래 기본법        | §4 · §4의2 · §5 (전자계약 법적 효력 + 감사추적인증서)   |
| PRD v0.4 §6.2                           | MVP P0 "전자계약" (vendor 명시 갱신 필요)               |
| PRD v0.4 §FR-5                          | 계약 기능 요구사항 (5/5 P0 + 1 P1 cover 확인)           |
| handoff §3.4 #2                         | 외부 dep #2 (vendor 결정) — 본 doc으로 부분 closure     |
| `docs/specs/w2-2.5-followup-backlog.md` | backlog v0.6 §3.7 (예정) — 본 doc cross-reference       |
| `.sisyphus/plans/phase-1-w2.md` §A.7    | Phase 3 delegation prompt — 다음 plan revision에서 작성 |

---

## 10. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026-06-03 | 초기 작성. 사용자가 Snowsign API key 발급 + 가이드 v1.3 (외부 vendor `jtsnowball.com`) 제공. PRD v0.4 §6.2의 "모두싸인 / 이폼사인" vendor 명시 → **스노우싸인 채택** 확정. PRD FR-5 P0 5/5 모두 cover + P1 1건 (변경계약서)만 vendor 확인 needed. 통합 architecture (Prisma Contract + ContractParticipant + ContractStatus enum + NestJS contracts/ 모듈 + SnowsignClient + ContractsPoller) draft 작성. Phase 3 sub-steps 11 단계 명세 + Open questions 6건 (webhook / sandbox / 가격 / 변경계약서 / 권한 / locale) vendor 문의 needed. Phase 5 알림 scope 축소 가능 인사이트 — Snowsign vendor 측 모바일 알림톡 자동 지원으로 계약 관련 알림 effort 0. 보안 권고 (API key rotation + storage + webhook signing) 명시. **본 spec은 documentation only — 실제 구현은 Phase 3 진입 시 plan §A.7 delegation으로 진행.** |
