# UCanSign API Reference + Phase 3 Integration Plan

> Phase 3 (전자계약) vendor 결정 변경 (Snowsign → UCanSign) 및 rootmatching 통합 design. 외부 vendor 공식 문서의 핵심 부분을 hoist하여 우리 시스템과의 매핑을 명시. 실제 구현은 W2-6 closure + Phase 2 (견적/매칭 persist) 후 별도 delegation으로 진행.

| 항목             | 값                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 작성일           | 2026-06-04                                                                                                                      |
| vendor 결정 변경 | **Snowsign → UCanSign** (handoff §3.7.1 v1.1 시점 Snowsign 채택 ✅ CLOSED → v1.2 시점 reopen + UCanSign 재채택)                 |
| 출처             | UCanSign Postman 공식 문서 (`documenter.getpostman.com/view/20616084/2s7YfHhcGY`, publishDate 2022-09-15) + 개발자센터 + 마케팅 |
| 의존 컨텍스트    | PRD v0.4 §6.2 (전자계약) + §FR-5 / handoff §3.4 외부 dep #2 / backlog v0.7 §3.7 (재결정)                                        |
| 작업 범위        | spec 문서만 (실제 구현 NOT in scope; Phase 3 delegation 시점)                                                                   |
| 적용 시점        | Phase 3 진입 (W2-6 closure + Phase 2 견적/매칭 persist 후)                                                                      |
| Estimated effort | Phase 3: 1-2 engineer-day (vendor 확인 사항 unblock 가정)                                                                       |
| 참고 plan        | `.sisyphus/plans/phase-1-w2.md` §A.7 (Phase 3 delegation prompt — 다음 revision에서 작성)                                       |
| 이전 vendor doc  | `docs/specs/snowsign-api-reference.md` v0.1 (deprecated, alternative reference로 보존)                                          |

---

## 0. 핵심 결론 (TL;DR)

1. **Vendor 변경**: Snowsign (v0.6 backlog 시점 채택) → **UCanSign 채택**. 이유: webhook 명시 지원 (Snowsign 미명시) + 가격 투명 (1건당 100원 + 신규 10건 무료 vs Snowsign 비공개) + embedding page (iframe 통합) 명시 지원.
2. **API 적합성**: PRD FR-5 (계약) P0 4/5 cover + audit-trail PDF 지원. 단 한국 전자문서법 §4의2 감사추적인증서 명시는 audit-trail로 추정 (vendor 확인 needed). integrity_hash는 vendor 미명시 (Snowsign 우위 항목).
3. **확인 필요 항목 (vendor 문의 needed)**: 외국인 본인인증 지원 여부 (mobile_identification 휴대폰 인증이 외국인등록번호 대응?) / sandbox 환경 분리 정책 / multi-tenant 권한 / 변경계약서 정책.
4. **통합 패턴**: NestJS `contracts/` 모듈 + `UCanSignClient` HTTP wrapper (token cache + auto-refresh) + Prisma `Contract` model + **webhook controller** (4 events) + (보조) status polling. customValue/customValue1-5 필드로 rootmatching internal ID 매핑.
5. **보안**: API KEY는 `apps/api/.env` (gitignored)에만 저장. accessToken (30분 만료)은 메모리/Redis 캐시. CI는 GitHub Actions repo secret. chat/IDE/git에 plain text 노출 금지.
6. **Phase 5 알림 영향**: UCanSign은 카카오 알림톡 별도 지원 (Snowsign처럼 vendor 자체 모바일 알림톡 자동 발송 X) → Phase 5 NotificationModule scope 축소 효과 **없음** (외부 dep #6 카카오 알림톡 비즈 그대로 필요).

---

## 1. Vendor 정보

| 항목         | 값                                                                  |
| ------------ | ------------------------------------------------------------------- |
| Vendor       | UCanSign (유캔싸인)                                                 |
| 도메인       | `ucansign.com` (마케팅) / `app.ucansign.com` (개발자센터 + API)     |
| Base URL     | `https://app.ucansign.com/openapi`                                  |
| 프로토콜     | HTTPS                                                               |
| 응답 형식    | JSON (UTF-8), 공통 포맷 `{ msg, result, code }`                     |
| 인증 방식    | **Bearer token** (API KEY → accessToken 발급 후 Authorization 헤더) |
| accessToken  | **유효기간 30분** — 짧으므로 캐시 + auto-refresh 패턴 필수          |
| Rate limit   | 가이드 미명시 (vendor 확인 needed)                                  |
| API 그룹     | 8 (회원/문서/폴더/결제/포인트/탬플릿/임베딩페이지/웹훅)             |
| 가이드 출처  | UCanSign Postman 공식 문서 (publishedId `2s7YfHhcGY`, 2022-09-15)   |
| 한국 법 준수 | 전자문서법 §4의2 audit-trail 별도 PDF 지원 (감사추적인증서 추정)    |

### 1.1 API KEY 발급 + accessToken 흐름

```
[1] API KEY 발급 (app.ucansign.com 개발자센터에서 수동 발급)
        ↓
[2] POST /openapi/user/token  body: { "apiKey": "<발급키>" }
        ↓  result.accessToken (유효기간 30분)
[3] 이후 모든 요청 헤더: Authorization: Bearer <accessToken>
        ↓  (30분 만료 → 재발급 필요)
[Logout] DELETE /openapi/user/token  (accessToken 비활성화)
[OAuth]  POST /openapi/user/oauth/auth (grantType=code / refresh; refreshToken 유효기간 7일)
```

**rootmatching NestJS 통합 권고** (내 해석 — 가이드에 없는 구현 제안):

- `UCanSignAuthService` 클래스에 accessToken을 in-memory cache 또는 Redis (Phase 6 horizontal scale 시) 저장.
- token 만료 5분 전 (`expiresAt - 5min`) 자동 재발급. 매 API 호출마다 `/user/token` 호출 = 불필요한 latency + rate limit 부담.
- `@nestjs/axios` HttpService + interceptor 패턴: 401/`accessToken 만료` 응답 시 자동 token refresh + 1회 retry.
- API KEY는 `ConfigService.get('UCANSIGN_API_KEY')` 형태로만 주입. 절대 코드/repo/chat 노출 금지.
- multi-instance horizontal scale 시 Redis 공유 캐시 (handoff §3.4 외부 dep / W2-6 throttler 패턴과 일관).

### 1.2 환경 변수 (apps/api/.env.example placeholder)

```bash
# apps/api/.env.example — NEVER commit actual values
UCANSIGN_API_KEY=                                          # rotate via UCanSign 개발자센터
UCANSIGN_BASE_URL=https://app.ucansign.com/openapi
UCANSIGN_TOKEN_CACHE_TTL_SECONDS=1500                      # 25min (5min safety margin before 30min expiry)
UCANSIGN_WEBHOOK_SIGNATURE_HEADER=                         # vendor 확인 needed (signing secret 발급 여부)
UCANSIGN_DEFAULT_EXPIRY_MINUTES=20160                      # 14일 (vendor default와 동일)
```

---

## 2. API 매트릭스 (UCanSign Postman 발췌 + rootmatching 매핑)

### 2.1 회원 User (4 endpoints)

| 메서드 | 엔드포인트                 | 설명                                   | rootmatching 사용처                                       |
| ------ | -------------------------- | -------------------------------------- | --------------------------------------------------------- |
| POST   | `/openapi/user/token`      | API KEY → accessToken 발급 (30분 만료) | `UCanSignAuthService.refreshToken()` (cache 만료 시 자동) |
| POST   | `/openapi/user/oauth/auth` | OAuth (code / refresh)                 | rootmatching 미사용 (API KEY 단순 경로 채택)              |
| DELETE | `/openapi/user/token`      | accessToken 비활성화 (logout)          | 운영 graceful shutdown 시 / 비상 revoke                   |
| GET    | `/openapi/user`            | 회원정보 조회                          | 운영자 sanity check (deployment smoke)                    |

### 2.2 문서 Documents (18 endpoints — 주요)

| 메서드 | 엔드포인트                                                | 설명                                   | rootmatching 사용처                                              |
| ------ | --------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| GET    | `/openapi/documents`                                      | 문서 리스트                            | Admin 화면 (FR-10) / 운영자 모니터링                             |
| GET    | `/openapi/documents/:documentId`                          | 문서 세부정보                          | rootmatching DB `Contract` row hydrate                           |
| GET    | `/openapi/documents/:documentId/histories`                | 문서 이력 (서명 요청 → 완료 활동 추적) | 분쟁 발생 시 timeline 증빙                                       |
| GET    | `/openapi/documents/:documentId/file`                     | 문서 PDF URL (유효기간 3분)            | `Contract.downloadUrl` on-demand refresh                         |
| GET    | `/openapi/documents/:documentId/audit-trail`              | 감사추적인증서 PDF (유효기간 3분)      | 한국 전자문서법 §4의2 (감사추적인증서 추정 — vendor 확인 needed) |
| GET    | `/openapi/documents/:documentId/full-file`                | 종합 파일 (PDF + audit 결합 추정)      | 회계 / 법적 증빙 일괄 다운로드                                   |
| POST   | `/openapi/documents/:documentId/request/reminder`         | 서명 요청 메시지 재전송                | 미서명 참여자 nudge (운영자/cron)                                |
| POST   | `/openapi/documents/:documentId/request/cancellation`     | 서명요청 취소                          | 분쟁 직전 또는 발주처 요청                                       |
| PUT    | `/openapi/documents/:documentId/expiry`                   | 서명 만료기간 재설정                   | (선택) 14일 default 외 연장 요청                                 |
| GET    | `/openapi/documents/:documentId/participants/:pid/fields` | 참여자 입력필드 조회                   | 디버깅 / 운영자 사후 분석                                        |
| PUT    | `/openapi/documents/archive`                              | 휴지통 이동 (배치)                     | 만료 / 취소 문서 자동 정리 cron                                  |
| DELETE | `/openapi/documents/:documentId/archive`                  | 완전 삭제                              | 데이터 보존 정책 만료 후 (~ 1년)                                 |

### 2.3 폴더 Folder (5 endpoints)

| 메서드 | 엔드포인트                             | rootmatching 사용처                                     |
| ------ | -------------------------------------- | ------------------------------------------------------- |
| GET    | `/openapi/folders`                     | 운영자 분류 (예: "client / factory 계약" 별도 폴더)     |
| POST   | `/openapi/folders`                     | 초기 setup (rootmatching 운영 조직 1회)                 |
| PUT    | `/openapi/folders/:folderId/documents` | 계약 생성 시 적절한 폴더로 자동 분류 (customValue 매핑) |

### 2.4 결제 Payment (2 endpoints)

UCanSign 결제는 payapp 통합. **rootmatching은 토스 escrow 채택 예정** → 이 API 미사용 (외부 dep #3 토스 KYC territory).

### 2.5 포인트 Point (3 endpoints)

| 메서드 | 엔드포인트                      | rootmatching 사용처                                       |
| ------ | ------------------------------- | --------------------------------------------------------- |
| GET    | `/openapi/point/balance`        | 잔여 포인트 모니터링 (cron 5min, 임계값 100 미만 시 알림) |
| GET    | `/openapi/point/charge/history` | 회계 (포인트 충전 내역 reconciliation)                    |
| GET    | `/openapi/point/usage/history`  | 문서별 포인트 소모 추적                                   |

**가격 (vendor 공식)**:

- 계약 1건당 **100원** (포인트 차감)
- 신규 가입 시 **10건 무료 포인트** 제공 (= 1,000원 상당)
- API 이용료 0원
- vendor 응답 needed: 월 사용량 면제 정책 / 한도 / sandbox 환경 분리

### 2.6 탬플릿 Template (4 endpoints)

| 메서드 | 엔드포인트                       | 설명                                           | rootmatching 사용처                                  |
| ------ | -------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| GET    | `/openapi/templates`             | 탬플릿 목록                                    | 초기 setup 시 1회 + 신규 약관 추가 시                |
| GET    | `/openapi/templates/:documentId` | 탬플릿 상세 + 참여자 + 필드 (signature_fields) | `ContractsService.getTemplateMeta(templateId)` cache |
| POST   | `/openapi/templates/:documentId` | **탬플릿 기반 서명문서 생성** (DRAFT)          | rootmatching `POST /contracts` 진입점                |
| DELETE | `/openapi/templates/:documentId` | 탬플릿 삭제                                    | 운영자 manual (자주 발생 X)                          |

**탬플릿 → 서명문서 생성 핵심 필드** (`POST /openapi/templates/:documentId`):

- `documentName`, `folderId`, `configExpireMinute`, `processType` (`PROCEDURE` 비대면 default), `isSequential` (순차 vs 동시), `isSendMessage` (false 시 임베딩 페이지로만 진행)
- `participants[].authentications[]`: 2차인증 (`password` / `mobile_identification` 휴대폰 실명인증 / `mobile_otp`)
- `participants[].signingMethodType`: `email` / `kakao` (알림톡) / `none` (isSendMessage=false 시)
- `payment`: 마지막 참여자에게 요청할 결제정보 (rootmatching 미사용)
- **`customValue` / `customValue1-5`**: rootmatching internal IDs (e.g., `quoteRequestId`, `acceptedQuoteId`, `tenantId`) — webhook payload에도 함께 전달됨 → multi-tenant 매핑 키로 활용

### 2.7 임베딩 페이지 Embedding Page (4 endpoints)

UCanSign UI를 iframe/redirect로 rootmatching 페이지에 임베딩. 링크 유효기간 30분.

| 메서드 | 엔드포인트                                     | 설명                              | rootmatching 사용처                                     |
| ------ | ---------------------------------------------- | --------------------------------- | ------------------------------------------------------- |
| POST   | `/openapi/embedding/sign-creating`             | 서명 생성 페이지 요청             | 발주처가 rootmatching 화면 안에서 계약서 생성           |
| POST   | `/openapi/embedding/view/:documentId`          | 문서 접근 페이지 (서명 진행 화면) | 참여자가 rootmatching에서 직접 서명 (이메일 외부이탈 X) |
| POST   | `/openapi/embedding/template-creating`         | 탬플릿 생성 페이지                | 운영자 admin 화면                                       |
| POST   | `/openapi/embedding/template-modifying/:docId` | 탬플릿 수정 페이지                | 운영자 admin 화면                                       |

**redirectUrl + action 쿼리 패턴**:

- 임베딩 페이지 완료 시 `redirectUrl?documentId=...&action=...`로 이동.
- `action` 값:
  - `document_creating` (서명 생성 완료)
  - `template_creating` / `template_modifying`
  - `signing_completed` / `signing_completed_all`
  - `document_view`
- 이탈 시 (뒤로가기/나가기): `*_fail` action으로 redirect.
- **rootmatching 활용**: `/contracts/:id/embed/redirect` route로 받아 Prisma sync + 사용자에게 적절한 다음 페이지 표시.

### 2.8 Webhook (4 이벤트, vendor 명시)

UCanSign이 등록된 URL로 POST 호출. **rootmatching `POST /webhooks/ucansign` 핸들러 + signing secret 검증 (vendor 확인 needed)**.

| eventType               | 발생 시점                                         | payload 핵심 필드                                                                              |
| ----------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `sign_creating`         | 서명 요청 생성 / 탬플릿 기반 서명문서 생성 시     | `documentId`, `documentName`, `folderId`, `customValue` × 6                                    |
| `signing_canceled`      | 서명 진행 중 문서 취소 시                         | `documentId`, `customValue` × 6                                                                |
| `signing_completed`     | 중간 참여자가 서명 완료 시 (마지막 참여자 제외)   | `documentId`, `participantId`, `participantName`, `participantSigningOrder`, `customValue` × 6 |
| `signing_completed_all` | **마지막 참여자가 서명 완료 시** (계약 완성 신호) | 동일 + 계약 완성 → escrow trigger (Phase 4)                                                    |

**rootmatching 통합 핸들러 패턴**:

```typescript
// apps/api/src/contracts/contracts.webhook.controller.ts (Phase 3 territory)
@Post('/webhooks/ucansign')
async handleWebhook(@Body() payload: UCanSignWebhookPayload, @Headers() headers: Record<string, string>) {
  // 1. signing secret 검증 (vendor 확인 needed — Q5)
  if (!this.verifySignature(headers, payload)) throw new UnauthorizedException()

  // 2. customValue로 rootmatching contract row 매핑
  const contract = await this.prisma.contract.findFirst({
    where: { ucansignDocumentId: payload.documentId },
  })
  if (!contract) throw new NotFoundException()

  // 3. eventType별 처리
  switch (payload.eventType) {
    case 'sign_creating': /* status: draft → pending */ break
    case 'signing_canceled': /* status: cancelled */ break
    case 'signing_completed': /* status: in_progress, 참여자 signedAt 기록 */ break
    case 'signing_completed_all': /* status: completed, escrow trigger emit */ break
  }
}
```

### 2.9 상태 전이

```text
need_signing ──(요청 발송)──▶ wait_for_signing ──(서명)──▶ completed
     │                                  │
     └──── request_cancelled ◀──────────┘
```

4 states (Snowsign 7 states 대비 단순). rootmatching `ContractStatus` Prisma enum:

```prisma
enum ContractStatus {
  draft               // rootmatching 측 임시 상태 (UCanSign 호출 전)
  pending             // UCanSign 'need_signing' / 'wait_for_signing' aggregate
  in_progress         // signing_completed event 받은 후 (1+ 참여자 서명, 미완료)
  completed           // signing_completed_all event 후
  cancelled           // request_cancelled
}
```

### 2.10 2차인증 (security method)

| 값                      | 설명                              | rootmatching 권장 prod                             |
| ----------------------- | --------------------------------- | -------------------------------------------------- |
| `password`              | 2차 비밀번호                      | dev/test                                           |
| `mobile_identification` | 휴대전화 실명인증 (이름 + 휴대폰) | **양측 prod default** (PRD NFR-2 보안 + 분쟁 대응) |
| `mobile_otp`            | OTP 인증                          | (선택) factory 측 옵션                             |

**Open question**: `mobile_identification`이 **외국인등록번호** 기반 본인인증을 지원하는지 미명시. 발주처/공장 중 외국인 사업자가 있을 가능성 → vendor 문의 §5.

### 2.11 customValue 6개 활용 (rootmatching internal mapping)

`customValue` + `customValue1-5` 6개 필드를 통해 webhook payload에 internal IDs 매핑. 예시:

| 필드         | rootmatching 매핑                                              |
| ------------ | -------------------------------------------------------------- |
| customValue  | `quoteRequestId` (PRD §FR-3 견적 요청 ID)                      |
| customValue1 | `acceptedQuoteId` (PRD §FR-4 수락된 견적 ID)                   |
| customValue2 | `clientCompanyId` (발주처 회사 ID)                             |
| customValue3 | `factoryCompanyId` (공장 회사 ID)                              |
| customValue4 | `tenantId` (multi-tenant 분리 시; 또는 `rootmatching-prod-v1`) |
| customValue5 | `rootmatchingContractId` (Prisma `Contract.id` cuid)           |

→ Snowsign 대비 큰 장점. webhook 받으면 즉시 매핑 가능 (별도 외부 lookup 불필요).

---

## 3. PRD FR-5 (계약) 매핑 — 4/5 P0 cover + audit-trail

| PRD FR    | 기능                                   | UCanSign 매핑                                                                | 평가                                  |
| --------- | -------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| FR-5.1 P0 | 전자계약 작성                          | `POST /openapi/templates/:templateId` (template-based)                       | ✅                                    |
| FR-5.2 P0 | 전자서명 (vendor webhook)              | 4 webhook events 명시 (sign_creating / canceled / completed / completed_all) | ✅ **명시 지원 (Snowsign 우위 항목)** |
| FR-5.3 P0 | 계약서 PDF 다운로드                    | `GET /openapi/documents/:docId/file` (3분 expiry URL)                        | ✅                                    |
| FR-5.4 P0 | 상태 머신                              | 4 states (need_signing / wait_for_signing / completed / request_cancelled)   | ✅                                    |
| FR-5.5 P0 | 표준 약관 템플릿 (DB 관리)             | 템플릿 등록 + variables (fieldName 기반 매핑)                                | ✅                                    |
| FR-5.6 P1 | 변경계약서                             | 가이드 미명시 — cancel + 재생성 추정 (Q4 확인)                               | 🟡 vendor 확인 needed                 |
| 부가      | 한국 전자문서법 §4의2 (감사추적인증서) | `GET /openapi/documents/:docId/audit-trail` (audit-trail PDF)                | 🟡 명칭만 추정 — vendor 확인          |
| 부가      | integrity hash (SHA-256)               | 가이드 미명시 (Snowsign 우위 항목)                                           | 🔴 vendor 미지원 (자체 검증 필요)     |
| 부가      | embedding page (iframe 통합)           | 4 endpoints 명시 + redirectUrl + action 패턴                                 | ✅ **명시 지원 (Snowsign 미명시)**    |

→ **PRD FR-5 P0 5/5 모두 cover** + FR-5.6 P1 1개 + audit-trail 1개만 vendor 확인 needed. integrity_hash는 rootmatching 자체 검증 패턴 필요 (downloaded PDF SHA-256 → DB 저장).

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

  ucansignDocumentId    String?        @unique
  ucansignTemplateId    String?
  ucansignFolderId      String?

  title                 String
  status                ContractStatus @default(draft)

  sentAt                DateTime?
  completedAt           DateTime?
  cancelledAt           DateTime?
  cancelledReason       String?
  expiresAt             DateTime?

  downloadUrl           String?
  downloadUrlExpiresAt  DateTime?     // 3분 expiry — 매 요청 시 refresh
  auditTrailUrl         String?
  auditTrailUrlExpiresAt DateTime?

  // rootmatching 자체 무결성 검증 (UCanSign integrity_hash 미지원)
  pdfSha256Hash         String?        // signing_completed_all 시점에 PDF 다운로드 후 자체 계산

  participants          ContractParticipant[]
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  @@index([status, createdAt])
  @@index([ucansignDocumentId])
}

model ContractParticipant {
  id                      String   @id @default(cuid())
  contractId              String
  contract                Contract @relation(fields: [contractId], references: [id])
  userId                  String?
  user                    User?    @relation(fields: [userId], references: [id])

  ucansignParticipantId   String?
  roleName                String
  name                    String
  email                   String
  phone                   String?
  signingMethodType       String?  // email / kakao / none
  authType                String?  // password / mobile_identification / mobile_otp

  status                  String   @default("need_signing")  // UCanSign value 그대로
  signingOrder            Int
  signedAt                DateTime?

  @@index([contractId, status])
}

enum ContractStatus {
  draft
  pending           // UCanSign 'need_signing' / 'wait_for_signing' aggregate
  in_progress       // 1+ 참여자 서명 완료 (마지막 제외)
  completed         // signing_completed_all event 후
  cancelled         // request_cancelled
}
```

### 4.2 NestJS module 구조

```text
apps/api/src/contracts/
  ├─ contracts.module.ts             // Module + Controller + Service + Auth + Webhook
  ├─ contracts.controller.ts         // /contracts CRUD + send/cancel/sync/pdf
  ├─ contracts.service.ts            // Prisma orchestration + UCanSign client calls
  ├─ ucansign.client.ts              // HTTP wrapper (Bearer token + zod validation)
  ├─ ucansign-auth.service.ts        // accessToken cache + auto-refresh (30분 만료 대응)
  ├─ contracts.webhook.controller.ts // POST /webhooks/ucansign (4 events)
  └─ dto/
       ├─ create-contract.dto.ts     // createZodDto from shared/schemas/contract.ts
       ├─ ucansign-webhook.schema.ts // zod schema (4 eventType discriminated union)
       └─ ucansign-document.schema.ts // zod schema for vendor response validation

packages/shared/src/schemas/contract.ts
  // ContractCreateSchema, ContractParticipantSchema, ContractStatusSchema (.meta({id}))
```

### 4.3 Endpoint set (rootmatching internal)

| 메서드 | 경로                         | 가드                     | 설명                                                                                |
| ------ | ---------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| POST   | `/contracts`                 | BetterAuthGuard          | 견적 accept → templateId + participants → UCanSign `POST /templates/:id` draft 생성 |
| GET    | `/contracts/me`              | BetterAuthGuard          | 내가 발주처/공장인 계약 list                                                        |
| GET    | `/contracts/:id`             | BetterAuthGuard          | 상세 + participants                                                                 |
| POST   | `/contracts/:id/send`        | BetterAuthGuard          | (isSendMessage=true 분기) 운영자 confirmation + 포인트 차감 prevention              |
| POST   | `/contracts/:id/cancel`      | BetterAuthGuard          | UCanSign `POST /documents/:id/request/cancellation`                                 |
| GET    | `/contracts/:id/embed/sign`  | BetterAuthGuard          | UCanSign `POST /embedding/sign-creating` → redirectUrl set + 임시 페이지 URL 반환   |
| GET    | `/contracts/:id/embed/view`  | BetterAuthGuard          | UCanSign `POST /embedding/view/:docId` → 참여자 직접 서명 페이지                    |
| GET    | `/contracts/:id/pdf`         | BetterAuthGuard          | UCanSign `GET /documents/:id/file` (3분 expiry refresh)                             |
| GET    | `/contracts/:id/audit-trail` | BetterAuthGuard          | UCanSign `GET /documents/:id/audit-trail` (3분 expiry refresh)                      |
| POST   | `/webhooks/ucansign`         | webhook signature verify | UCanSign 4 events 수신 + customValue 매핑 + status 업데이트                         |

### 4.4 워크플로 (PRD §5.2 Step 7-9 cover)

```text
Step 7  발주처 비교/선택 (FE)
    └─→ /matching에서 공장 선택 → 선택된 견적 ID 확정

Step 8  전자계약 체결 (FE + rootmatching backend + UCanSign)
    1. POST /contracts (rootmatching)
       └─→ ContractsService.create()
            ├─→ Prisma Contract row 생성 (status=draft)
            ├─→ ucansign.client.createFromTemplate(templateId, participants, customValues)
            │     - customValue = quoteRequestId
            │     - customValue1 = acceptedQuoteId
            │     - customValue2 = clientCompanyId
            │     - customValue3 = factoryCompanyId
            │     - customValue5 = rootmatchingContractId
            ├─→ ucansignDocumentId 저장 + status=draft 유지
            └─→ return contractId

    2. (옵션 A) 자동 발송 — isSendMessage=true
       └─→ UCanSign이 직접 email/카카오 알림톡 발송 (signingContactInfo 기준)

       (옵션 B) 임베딩 페이지로 사내 서명
       └─→ GET /contracts/:id/embed/sign → 임시 URL
            └─→ 발주처/공장이 rootmatching 화면 안에서 서명 (외부 이탈 X)

    3. (참여자가 UCanSign hosted 또는 embedding page에서 서명)
       └─→ 각 참여자 서명 시 webhook 'signing_completed' 발생

    4. POST /webhooks/ucansign (UCanSign → rootmatching)
       └─→ customValue로 contract row 매핑
            ├─→ signing_completed: ContractParticipant.status=completed, signedAt 기록
            └─→ signing_completed_all:
                 ├─→ Contract.status=completed, completedAt=now
                 ├─→ ucansign.client.getDocumentFile() + getAuditTrail()
                 ├─→ 양 PDF binary concat → SHA-256 → pdfSha256Hash 저장
                 ├─→ downloadUrl + auditTrailUrl 캐시 (3분 expiry)
                 └─→ EventEmitter (escrow trigger, Phase 4)

Step 9  escrow 결제 (Phase 4 territory)
    └─→ Contract.status=completed → Transaction 생성 (ESCROW_PENDING)
```

---

## 5. Open questions (vendor 문의 needed — Phase 3 entry blocker)

### 5.1 외국인 본인인증 지원 여부 — CRITICAL

가이드 §2 휴대전화 실명인증(`mobile_identification`)은 "이름 + 휴대폰 번호" 기반. **외국인등록번호** 기반 본인인증을 지원하는지 미명시.

- 발주처/공장 중 외국인 사업자가 있을 경우 영향.
- **vendor 문의 필요**: mobile_identification이 외국인 휴대폰 + 외국인등록번호 검증 가능 여부.

### 5.2 Sandbox / Dev 환경 정책 — CRITICAL

가이드에 dev/staging/prod 환경 분리 정책 미명시. 가입 시 10건 무료 포인트는 있으나 sandbox 별도 URL/key 발급 정책 미상.

- **vendor 문의 필요**:
  - 가능성 (a) 단일 base URL + 별도 dev key (월 사용량 면제)
  - 가능성 (b) sandbox URL (`app-sandbox.ucansign.com/openapi` 등)
  - 가능성 (c) prod key로 dev/test (포인트 차감 risk)

### 5.3 가격 / 사용량 정책

가이드 명시:

- 계약 1건당 100원 (포인트 차감)
- 신규 가입 시 10건 무료 포인트
- API 이용료 0원

미명시:

- 월 한도 / 한도 초과 시 정책
- 포인트 충전 단위 (1만원당 100건 추정 — 확인 needed)
- 분기 결제 vs prepaid
- (참고) rootmatching 2026년 7-12월 베타 운영 기준 월 50-200건 사용량 예상 → 월 5,000-20,000원 비용 추정

### 5.4 변경계약서 (FR-5.6 P1)

가이드에 변경계약서 별도 endpoint 미명시.

- 가능 패턴:
  - (a) cancel + 재생성 (audit-trail 단절 우려)
  - (b) vendor에 별도 endpoint 있을 가능성
- **vendor 문의 필요** (Phase 3 P0 영역 아니지만 P1로 영향).

### 5.5 Webhook signing / payload format / retry policy

가이드에 webhook 4 events payload는 명시되어 있으나 **signing secret 발급 + 검증 방식 + retry policy 미명시**.

- **vendor 문의 필요**:
  - signing secret 발급 방법 (HMAC-SHA256? 어느 헤더?)
  - retry 횟수 + 간격 (실패 시 backoff)
  - 수신 endpoint whitelist 등록 절차 (vendor 콘솔에서?)

### 5.6 Multi-tenant 권한 / 조직 관리

가이드상 API KEY는 회원 (조직) 단위 발급. rootmatching은 운영팀 단일 조직으로 모든 발주처×공장 계약 처리 가정.

- **vendor 문의 필요**: 단일 운영 조직 키 정책 OK 여부 + 또는 발주처/공장별 별도 조직 키 분리 가능 여부.

### 5.7 audit-trail = 한국 전자문서법 §4의2 감사추적인증서?

가이드 `GET /openapi/documents/:docId/audit-trail`은 명시되어 있으나 "한국 전자문서법 §4의2 감사추적인증서" 라는 법적 명칭은 미명시.

- **vendor 문의 필요**: audit-trail PDF가 §4의2 요건 (법적 효력) 충족하는지 명시적 확인.

### 5.8 integrity_hash (SHA-256) 자체 제공 여부

가이드에 integrity_hash 응답 필드 미명시. Snowsign은 `data.integrity_hash` 제공.

- **vendor 문의 필요**: vendor 자체 제공 X 시 rootmatching 측 PDF binary concat → SHA-256 자체 계산 패턴 (§4.4 워크플로 참조).

---

## 6. Phase 3 작업 순서 (W2-6 closure + Phase 2 견적/매칭 persist 후)

### 6.1 Pre-condition (Phase 3 진입 전 사용자 결정 needed)

- [x] vendor 결정 (UCanSign 채택, 본 doc v0.1 closure)
- [ ] §5.1 외국인 본인인증 지원 여부 vendor 문의 → 답변 (Tier 1 MUST)
- [ ] §5.2 sandbox 환경 + dev key 발급 → 확인 (Tier 1 MUST)
- [ ] §5.5 webhook signing secret + retry → 확인 (Tier 1 MUST)
- [ ] §5.3 가격 / 월 사용량 정책 → 확인 (Tier 2 SHOULD)
- [ ] §5.4 변경계약서 정책 → 확인 (Tier 2 SHOULD)
- [ ] §5.6 multi-tenant 권한 → 확인 (Tier 2 SHOULD)
- [ ] §5.7 audit-trail 법적 효력 → 확인 (Tier 2 SHOULD)
- [x] template 등록 (UCanSign 개발자센터, 표준 약관 1-3종) — 사용자 사전 작업
- [ ] PRD v0.5 갱신 (§6.2 vendor "모두싸인 / 이폼사인" → "UCanSign") (Tier 2 SHOULD)
- [ ] backlog v0.7 §3.7 fold-in (본 문서와 함께 commit)
- [ ] plan §A.7 W2-Phase3 delegation prompt 작성 (다음 plan revision)

### 6.2 Sub-steps (단일 atomic commit 가정)

1. **(S)** `pnpm --filter @rootmatching/api add @nestjs/schedule` + `axios` (또는 `undici`) + `@nestjs/cache-manager` (token cache 용)
2. **(M)** `apps/api/prisma/schema.prisma` — `Contract` + `ContractParticipant` + `ContractStatus` enum 추가 + migration
3. **(M)** `packages/shared/src/schemas/contract.ts` — `ContractCreateSchema`, `ContractParticipantSchema`, `ContractStatusSchema` `.meta({id})`
4. **(M)** `apps/api/src/contracts/` 모듈 + service + controller + DTOs
5. **(M)** `apps/api/src/contracts/ucansign.client.ts` — HTTP wrapper (Bearer + zod response)
6. **(M)** `apps/api/src/contracts/ucansign-auth.service.ts` — accessToken cache + auto-refresh
7. **(M)** `apps/api/src/contracts/contracts.webhook.controller.ts` — 4 events handler + signing secret 검증
8. **(S)** `app.module.ts` — ContractsModule 등록
9. **(M)** `apps/api/test/contracts.e2e-spec.ts` — UCanSign mock + create + send + webhook + audit-trail + integrity hash
10. **(S)** `apps/api/.env.example` — UCANSIGN\_\* 변수 placeholder
11. **(XS)** Single atomic commit: `feat(api): contracts module + UCanSign integration (Phase 3)`

### 6.3 Forbidden territory (Phase 3 작업 시 금지)

- W2-6 closure 산출물 변경 (throttler / helmet / pino / Swagger)
- W2-5 Users + Companies 모듈 변경
- Better Auth 코드 (W2-2 frozen)
- apps/web (Phase 2 territory)
- Phase 4 territory (transactions / escrow / 토스)
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
  -d '{"templateId":"<sandbox-template>","title":"테스트 계약","participants":[...],"customValues":{...}}'
# 기대: HTTP 201 + { contractId, ucansignDocumentId, status: "draft" }

# Webhook 시뮬레이션 (signing_completed_all)
curl -i -X POST http://localhost:3001/webhooks/ucansign \
  -H 'X-UCanSign-Signature: ...' \
  -d '{"eventType":"signing_completed_all","documentId":"<docId>","customValue":"<quoteReqId>",...}'
# 기대: HTTP 200 + contract.status=completed + pdfSha256Hash 채워짐
```

---

## 7. Phase 5 알림 scope 영향 (negative vs Snowsign)

Snowsign은 모바일 알림톡 vendor 자체 지원 (`mobile_alimtalk_enabled`)으로 계약 알림 vendor managed였으나, **UCanSign은 다름**:

- UCanSign 카카오 알림톡 = signingMethodType=`kakao` 선택 시 vendor 발송 (제한적)
- 그러나 vendor가 자체 알림톡 template 관리 ≠ Snowsign 수준의 자동 발송

**Phase 5 NotificationModule scope 영향** (vs Snowsign 채택 시):

- 계약 서명 요청 알림 = UCanSign `signingMethodType=kakao` 활용 가능 (제한적 cover)
- 계약 완료 알림 = rootmatching 자체 통합 needed (UCanSign이 완료 알림은 발송 X 추정)
- **외부 dep #6 (카카오 알림톡 비즈 계정) scope 축소 효과 없음** (Snowsign 채택 시 30-40% 감소 가능했던 부분 사라짐)
- rootmatching이 비계약 거래 알림 + 일부 계약 알림 모두 자체 통합

→ vendor 변경 trade-off: UCanSign (webhook + 가격 + embedding 우위) ↔ Snowsign (알림톡 + integrity_hash 우위). rootmatching은 webhook 명시 지원 + 가격 투명성 우선 → **UCanSign 채택 결정 유지**.

---

## 8. 보안 + 운영 권고

### 8.1 API KEY + accessToken 관리

- **API KEY**: 분기별 1회 (90일) rotate 권장. UCanSign 개발자센터에서 회전.
- **accessToken**: 30분 만료 — 메모리/Redis 캐시 + 자동 재발급 패턴 (manualy refresh 매 25min — 5min safety margin).
- **저장 위치**:
  - dev: `apps/api/.env` (gitignored)
  - CI: GitHub Actions repo secret `UCANSIGN_API_KEY`
  - prod: Railway/Fly.io secret (도메인 확정 시점, Phase 6)
- **NEVER**:
  - git commit
  - chat / Slack / IDE history / screenshots / public docs
  - 개발자 PC 외 backup (`~/.zshrc` 등 home dotfiles)
- **노출 시 대응**: 즉시 개발자센터 → 키 폐기 → 새 키 발급 → 모든 환경 secret 갱신.

### 8.2 Rate limit 대응

- 가이드 미명시 (vendor 확인 needed)
- 보수적 가정: 60 req/min per key (token refresh + document API 합산)
- `UCanSignAuthService` token cache로 매 요청마다 `/user/token` 호출 방지 (이 자체로 ~50% rate limit 절감)
- 429 응답 시 exponential backoff (1s → 2s → 4s)

### 8.3 Webhook signing (vendor 응답 후 확정)

- vendor가 signing secret 제공 시:
  - `X-UCanSign-Signature` 또는 유사 헤더 + HMAC-SHA256 검증
  - 미검증 시 spoofed webhook으로 인한 계약 상태 위조 위험
- vendor 미제공 시:
  - source IP whitelist (UCanSign 측 IP 범위 확인 + nginx/Cloudflare 차단)
  - 또는 customValue5 (rootmatching contractId) 매칭 검증 + Prisma row 상태 무결성 (불일치 시 무시)

### 8.4 30분 token 만료 대응

핵심: accessToken 만료 5분 전 미리 재발급. handoff §3.4 외부 dep horizontal scale 시 Redis 공유 캐시:

```typescript
// apps/api/src/contracts/ucansign-auth.service.ts (Phase 3 territory)
@Injectable()
export class UCanSignAuthService {
  private cachedToken: { value: string; expiresAt: Date } | null = null

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt.getTime() - Date.now() > 5 * 60_000) {
      return this.cachedToken.value
    }
    const { accessToken } = await this.refreshToken()
    return accessToken
  }

  private async refreshToken() {
    const apiKey = this.config.get<string>('UCANSIGN_API_KEY')!
    const response = await firstValueFrom(this.http.post(`${baseUrl}/user/token`, { apiKey }))
    const accessToken = response.data.result.accessToken
    this.cachedToken = { value: accessToken, expiresAt: new Date(Date.now() + 30 * 60_000) }
    return { accessToken }
  }
}
```

---

## 9. References

| 항목                                    | 출처                                                              |
| --------------------------------------- | ----------------------------------------------------------------- |
| UCanSign Postman 공식 문서              | `documenter.getpostman.com/view/20616084/2s7YfHhcGY` (2022-09-15) |
| UCanSign 마케팅 페이지                  | `ucansign.com/api`                                                |
| UCanSign 개발자센터                     | `app.ucansign.com/developer`                                      |
| 한국 전자문서 및 전자거래 기본법        | §4 · §4의2 · §5 (전자계약 법적 효력 + 감사추적인증서)             |
| PRD v0.4 §6.2                           | MVP P0 "전자계약" (vendor 명시 갱신 필요)                         |
| PRD v0.4 §FR-5                          | 계약 기능 요구사항 (4/5 P0 + audit-trail cover 확인)              |
| handoff §3.4 #2                         | 외부 dep #2 (vendor 결정) — 본 doc으로 closure                    |
| `docs/specs/snowsign-api-reference.md`  | v0.1 (deprecated, alternative reference로 보존)                   |
| `docs/specs/w2-2.5-followup-backlog.md` | v0.7 §3.7 (vendor 재결정 fold-in 후 갱신)                         |
| `.sisyphus/plans/phase-1-w2.md` §A.7    | Phase 3 delegation prompt — 다음 plan revision에서 작성           |

---

## 10. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026-06-04 | 초기 작성. handoff v1.1 §3.7.1 (Snowsign 채택 ✅ CLOSED)에서 **vendor 재결정 → UCanSign 채택** 결정 fold-in. UCanSign Postman 공식 문서 (publishedId `2s7YfHhcGY`)에서 8 endpoint group (회원/문서/폴더/결제/포인트/탬플릿/임베딩페이지/웹훅) 매트릭스 hoist + rootmatching 통합 architecture (Prisma Contract + ContractParticipant + 4 ContractStatus enum + NestJS contracts/ 모듈 + UCanSignClient + UCanSignAuthService + 4 webhook events handler) draft 작성. customValue/customValue1-5 6 필드를 활용한 internal IDs 매핑 (quoteRequestId/acceptedQuoteId/clientCompanyId/factoryCompanyId/tenantId/rootmatchingContractId). Phase 3 sub-steps 11 단계 명세 + Open questions 8건 (외국인 인증 / sandbox / 가격 / 변경계약서 / webhook signing / multi-tenant / audit-trail 법적 효력 / integrity_hash) vendor 문의 needed. Phase 5 알림 scope 영향: Snowsign 대비 negative (모바일 알림톡 vendor 자체 발송 효과 없음 — 카카오 알림톡 비즈 dep 그대로 필요). 보안 권고 (30분 token 만료 대응 + Redis 공유 캐시 + signing secret 검증) 명시. **본 spec은 documentation only — 실제 구현은 Phase 3 진입 시 plan §A.7 delegation으로 진행.** 이전 vendor doc `snowsign-api-reference.md` v0.1은 deprecated 상태로 alternative reference로 보존. |
