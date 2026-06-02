# RootMatching Backend API Contract

> **출처 채택 메모 — dev-monorepo 2026-06-02**
>
> 이 문서는 `origin/feature/backend-api` (commit `4976813`)에서 가져와 dev-monorepo에 채택한 협업 자료입니다.
>
> **원작성**: 백엔드 팀 (Spring Boot mock API 가정, Vue 3 프런트엔드 클라이언트 가정)
> **dev-monorepo 적용 컨텍스트**: NestJS 11 + Next.js 15 (Server Components + Server Actions) + PRD v0.4
>
> ### 정책 정렬 차이
>
> | 원본 가정                                       | dev-monorepo 정책                                        |
> | ----------------------------------------------- | -------------------------------------------------------- |
> | `http://localhost:8080`                         | `http://localhost:3001` (NestJS)                         |
> | `localhost:5173` (Vite)                         | `localhost:3000` (Next.js)                               |
> | `Authorization: Bearer mock-session-token`      | **Better Auth session cookie** (httpOnly, signed)        |
> | Spring `@RestController` + `Map<String,Object>` | NestJS `@Controller` + zod-validated DTOs (`nestjs-zod`) |
> | `springdoc-openapi`                             | `@nestjs/swagger`                                        |
>
> ### Endpoint 차이 (현재 구현 vs contract)
>
> dev-monorepo 현재 활성 endpoint:
>
> - `POST /matching/recommend` — 1-step (요청 + AI 매칭 즉시 응답)
>
> 본 contract endpoint (Phase 1.W2+ 도입 후보):
>
> - `POST /quote-requests` — 요청 영속화
> - `POST /quote-requests/:id/match` — AI 매칭 분리
> - `GET /quote-requests/:id/recommendations` — 결과 조회
>
> **결정 보류**: 1-step vs 2-step 모델 중 어떤 것이 PRD v0.4에 맞는지 Phase 1.W2 설계 단계에서 재논의.
>
> ### 응답 envelope 정책
>
> 원본: 모든 응답이 `{ success, message, data }` envelope
> dev-monorepo 정책: NestJS는 zod DTO 기반 직접 응답이 기본. envelope이 필요한 경우 ResponseInterceptor로 일괄 적용 (도입 여부 Phase 1.W2 결정).
>
> ### 사용 범위
>
> - **참고용**: NestJS API 모듈 설계 시 endpoint/method/payload shape 참조
> - **점진 도입**: 도메인별로 필요 endpoint 선별 채택 (전체 32개를 모두 구현할 필요 없음)
> - **validation**: 그쪽이 정의한 필드 require/optional 정책을 우리 zod 스키마에 반영
>
> ### 우선순위
>
> 충돌 시: 본 문서 < `docs/specs/functional-spec.md` (UX) < `docs/prd/rootmatching-prd.md` (제품 정책)

---

작성일: 2026-06-02  
기준: `backend/docs/functional-spec.md` 및 `frontend/src` 목 데이터/Pinia store를 읽기 전용으로 해석  
구현 위치: `backend/src/main/java/com/dgu/backend/rootmatching`  
응답 형식: 성공 `{ "success": true, "message": "OK|CREATED", "data": ... }`, 오류 `{ "success": false, "code": "VALIDATION_ERROR", "message": "요청 값 검증에 실패했습니다.", "errors": [{ "field": "email", "message": "올바른 이메일 형식이어야 합니다." }] }`

> 현재 구현은 프론트 연결을 위한 in-memory mock API입니다. 실제 결제, 실제 전자서명, 실제 파일 저장, 실제 OpenAI 호출은 하지 않습니다.

## 공통 규칙

- Base URL(local): `http://localhost:8080`
- 인증: contract상 로그인 후 `Authorization: Bearer mock-session-token`을 붙이는 구조를 권장합니다. 현재 mock 서버는 프론트 전환 편의를 위해 인증 미들웨어를 강제하지 않습니다.
- 날짜/시간: KST 기준 ISO-8601 문자열 우선. 기존 프론트 목 데이터 표시값은 그대로 허용합니다.
- 첨부파일: 실제 업로드 저장 금지. `attachments`/`portfolio`/`evidence`는 `{ name, size, type }` metadata만 받고 응답에서 `url: null`, `mockOnly: true`를 반환합니다.
- AI 매칭: `/quote-requests/:id/match`는 API key가 없어도 deterministic mock recommendation을 반환합니다. OpenAI는 추후 `MatchingAdapter` 경계로만 연결해야 합니다.

## Validation error 예시

```http
POST /auth/login
Content-Type: application/json

{ "email": "bad", "password": "123456" }
```

```json
{
  "success": false,
  "message": "요청 값 검증에 실패했습니다.",
  "code": "VALIDATION_ERROR",
  "errors": [{ "field": "email", "message": "올바른 이메일 형식이어야 합니다." }],
  "timestamp": "2026-06-02T19:25:00+09:00"
}
```

## Endpoint 목록

| 영역           | Method | Endpoint                                      | Auth | Request body 요약                                                                                                               | Response `data` 요약                           | 프론트 연결 메모                                                       |
| -------------- | -----: | --------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Auth           |   POST | `/auth/login`                                 | No   | `{ email, password }`                                                                                                           | `{ token, user }`                              | `userStore.login`; 목 계정 `hong@techsolution.co.kr / 123456`          |
| Auth           |   POST | `/auth/register`                              | No   | `{ name, email, password, companyName, position?, phone?, termsAccepted? }`                                                     | `{ token, user }`                              | `userStore.register`                                                   |
| Auth           |   POST | `/auth/logout`                                | Yes  | 없음                                                                                                                            | `{ loggedOut: true }`                          | `userStore.logout`                                                     |
| Auth           |    GET | `/auth/me`                                    | Yes  | 없음                                                                                                                            | `{ user }`                                     | 새로고침 세션 복원 후보                                                |
| Users          |    GET | `/users/me`                                   | Yes  | 없음                                                                                                                            | `User`                                         | 마이페이지/헤더 사용자 정보                                            |
| Users          |  PATCH | `/users/me`                                   | Yes  | `Partial<User>`; `id/email` 무시                                                                                                | 갱신된 `User`                                  | `updateProfile`; 회사 수정은 `/companies/:id` 권장                     |
| Companies      |    GET | `/companies?keyword&industry&region&size`     | Yes  | query                                                                                                                           | `{ items, count, filters }`                    | `companyStore.filteredCompanies` 대체                                  |
| Companies      |    GET | `/companies/:id`                              | Yes  | 없음                                                                                                                            | `Company + isFavorite`                         | `/companies/:id` 상세                                                  |
| Companies      |  PATCH | `/companies/:id`                              | Yes  | `Partial<Company>`; `id` 무시                                                                                                   | 갱신된 `Company`                               | `companyStore.updateCompany`/마이페이지 회사 정보                      |
| Companies      |   POST | `/companies/:id/favorite`                     | Yes  | 없음                                                                                                                            | `{ companyId, isFavorite: true }`              | `toggleFavorite` add                                                   |
| Companies      | DELETE | `/companies/:id/favorite`                     | Yes  | 없음                                                                                                                            | `{ companyId, isFavorite: false }`             | `toggleFavorite` remove                                                |
| Quote requests |   POST | `/quote-requests`                             | Yes  | `{ projectName, processType, productItem, estimatedQuantity, desiredDeadline, budgetRange, detailRequirements, attachments? }`  | 생성된 요청                                    | `workflowStore.submitRequest`                                          |
| Quote requests |    GET | `/quote-requests?keyword&status&processType`  | Yes  | query                                                                                                                           | `{ items, count }`                             | 게시판/내 요청 목록                                                    |
| Quote requests |    GET | `/quote-requests/:id`                         | Yes  | 없음                                                                                                                            | 요청 상세                                      | `/client/requests/:id`, 공장 요청 상세                                 |
| Quote requests |  PATCH | `/quote-requests/:id`                         | Yes  | `Partial<QuoteRequest>`                                                                                                         | 갱신된 요청                                    | 임시저장/상태 변경 후보                                                |
| AI matching    |   POST | `/quote-requests/:id/match`                   | Yes  | 없음 또는 옵션                                                                                                                  | `{ quoteRequestId, items, mockOnly, adapter }` | `workflowStore.runAIMatching`; 프론트 OpenAI 직접 호출 대체            |
| AI matching    |    GET | `/quote-requests/:id/recommendations`         | Yes  | 없음                                                                                                                            | `{ quoteRequestId, items, count }`             | `/client/matching` 추천 결과 조회                                      |
| Factory        |   POST | `/factories/profile`                          | Yes  | `{ name, managerName, location, phone, email?, processes?, equipment?, products?, certifications?, portfolio?, introduction? }` | 생성된 프로필                                  | `/factory/onboarding`                                                  |
| Factory        |    GET | `/factories/profile/me`                       | Yes  | 없음                                                                                                                            | 프로필 또는 `{ profile: null }`                | 온보딩 수정 모드                                                       |
| Factory        |  PATCH | `/factories/profile/me`                       | Yes  | `Partial<FactoryProfile>`                                                                                                       | 갱신된 프로필                                  | 공장 프로필 수정                                                       |
| Factory        |    GET | `/factory/quote-requests?keyword&status`      | Yes  | query                                                                                                                           | `{ items, count }`                             | `/factory/requests`                                                    |
| Factory        |    GET | `/factory/quote-requests/:id`                 | Yes  | 없음                                                                                                                            | 요청 상세                                      | `/factory/requests/:id`                                                |
| Factory        |   POST | `/factory/quote-requests/:id/quotes`          | Yes  | `{ amount, productionDays, availableDeadline, paymentTerms, proposalMessage, factoryId?, factoryName? }`                        | `{ quote, message }`                           | 견적 제출 후 `[견적 협의]` 메시지 생성                                 |
| Messages       |    GET | `/messages`                                   | Yes  | 없음                                                                                                                            | `{ items, unreadCount }`                       | `messageStore.sortedMessages`                                          |
| Messages       |    GET | `/messages/:id`                               | Yes  | 없음                                                                                                                            | 메시지 상세                                    | 메시지 상세/스레드                                                     |
| Messages       |   POST | `/messages`                                   | Yes  | `{ senderId, senderName, senderCompany, receiverId, receiverName, receiverCompany, subject, content, attachments? }`            | 생성 메시지                                    | 기업 문의하기                                                          |
| Messages       |   POST | `/messages/:id/replies`                       | Yes  | `{ content, senderId? }`                                                                                                        | `{ message, reply }`                           | 채팅형 답장                                                            |
| Messages       |  PATCH | `/messages/:id/read`                          | Yes  | 없음                                                                                                                            | 갱신 메시지                                    | 읽음 처리                                                              |
| Messages       |  PATCH | `/messages/read-all`                          | Yes  | 없음                                                                                                                            | `{ updated }`                                  | 전체 읽음                                                              |
| Notifications  |    GET | `/notifications`                              | Yes  | 없음                                                                                                                            | `{ items, unreadCount }`                       | `notificationStore.sortedNotifications`                                |
| Notifications  |  PATCH | `/notifications/:id/read`                     | Yes  | 없음                                                                                                                            | 갱신 알림                                      | 읽음 처리                                                              |
| Notifications  |  PATCH | `/notifications/read-all`                     | Yes  | 없음                                                                                                                            | `{ updated }`                                  | 전체 읽음                                                              |
| Contracts      |   POST | `/contracts`                                  | Yes  | `{ quoteRequestId, factoryId, amount, dueDate, paymentMethod? }`                                                                | 생성 계약                                      | `/contract` 계약 생성; 전자서명 mock                                   |
| Contracts      |    GET | `/contracts/:id`                              | Yes  | 없음                                                                                                                            | 계약 상세                                      | 계약/결제 화면                                                         |
| Contracts      |   POST | `/contracts/:id/escrow-payment/mock-complete` | Yes  | 없음                                                                                                                            | `{ contract, transaction }`                    | 실제 PG 금지, mock 상태 전이                                           |
| Transactions   |    GET | `/transactions?role&status`                   | Yes  | query                                                                                                                           | `{ items, count }`                             | `/transactions`                                                        |
| Transactions   |    GET | `/transactions/:id`                           | Yes  | 없음                                                                                                                            | 거래 상세                                      | `/transactions/:id`                                                    |
| Transactions   |  PATCH | `/transactions/:id/progress`                  | Yes  | `{ progressRate, status?, statusKey? }`                                                                                         | 갱신 거래                                      | 공장 작업 진행률 업데이트                                              |
| Transactions   |   POST | `/transactions/:id/updates`                   | Yes  | `{ title, description, date? }`                                                                                                 | `{ transaction, update }`                      | 공장 작업 업데이트                                                     |
| Transactions   |   POST | `/transactions/:id/approve-inspection`        | Yes  | 없음                                                                                                                            | 완료 상태 거래                                 | 발주처 검수 승인                                                       |
| Transactions   |   POST | `/transactions/:id/review`                    | Yes  | `{ rating, content, nextAction? }`                                                                                              | 생성 리뷰                                      | `/transaction/review`                                                  |
| Disputes       |    GET | `/disputes?status`                            | Yes  | query                                                                                                                           | `{ items, count }`                             | `/disputes`                                                            |
| Disputes       |   POST | `/disputes`                                   | Yes  | `{ transactionId, type, summary, requestedResolution, evidence? }`                                                              | 생성 분쟁                                      | `type`: `quality/deadline/payment/contract` 또는 `품질/납기/결제/계약` |
| Disputes       |    GET | `/disputes/:id`                               | Yes  | 없음                                                                                                                            | 분쟁 상세                                      | `/disputes/:id`                                                        |
| Disputes       |  PATCH | `/disputes/:id/status`                        | Yes  | `{ status, statusLabel?, progress? }`                                                                                           | 갱신 분쟁                                      | 운영자/중재 mock 상태 변경                                             |

## 주요 request/response schema

### QuoteRequest

```json
{
  "id": "req-001",
  "projectName": "알루미늄 하우징 시제품 제작",
  "processType": "금형 / CNC 정밀가공",
  "productItem": "전장 모듈용 알루미늄 케이스",
  "estimatedQuantity": "1차 500개, 양산 월 3,000개",
  "desiredDeadline": "2026-05-20",
  "budgetRange": "3,000만원 ~ 4,500만원",
  "detailRequirements": "6061 알루미늄 소재 기준...",
  "attachments": [
    {
      "id": "att-001",
      "name": "drawing.pdf",
      "size": 2400000,
      "type": "application/pdf",
      "url": null,
      "mockOnly": true
    }
  ],
  "status": "new"
}
```

### FactoryRecommendation

```json
{
  "factoryId": "1",
  "factoryName": "문래정밀가공",
  "score": 94,
  "qualityScore": 95,
  "deadlineScore": 97,
  "priceScore": 82,
  "reliabilityScore": 94,
  "reason": "공정 역량과 납기/품질 mock KPI가 요청 조건에 부합합니다.",
  "estimatedQuoteRange": { "min": 320, "max": 420, "currency": "KRW", "unit": "만원" },
  "source": "deterministic-mock"
}
```

### Mock attachment

```json
{
  "id": "att-101",
  "name": "housing_2d_drawing.pdf",
  "size": 2400000,
  "type": "application/pdf",
  "url": null,
  "mockOnly": true
}
```
