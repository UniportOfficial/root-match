# Matching Endpoint Design Decision — 1-step vs 2-step

> **결정 노트** · 2026-06-02 · `dev-monorepo`
>
> `feature/backend-api` 브랜치에서 채택한 `docs/specs/backend-api-contract.md`는 **2-step 모델**을 정의합니다. 우리 현재 구현은 **1-step 모델**입니다. 본 문서는 두 모델의 차이, 평가 기준, 결정과 향후 마이그레이션 비용을 기록합니다.

---

## 1. 두 모델 정의

### 1.1 옵션 A — 1-step (현재 `dev-monorepo` 구현)

```
POST /matching/recommend
  body: QuoteRequestDraft
  ─→ 응답: FactoryRecommendation[]
```

- 한 번의 요청으로 요청 정보 + AI 매칭 동시 처리
- 결과는 프런트 `sessionStorage`에 저장 (1시간 staleness)
- 견적 요청은 **영속화되지 않음**

### 1.2 옵션 B — 2-step (`backend-api-contract.md`에서 채택한 모델)

```
POST /quote-requests
  body: { projectName, processType, productItem, estimatedQuantity, desiredDeadline,
          budgetRange, detailRequirements, attachments? }
  ─→ 응답: { id, status: "new", ... }   # 영속화된 견적 요청

POST /quote-requests/:id/match
  body: 없음 또는 옵션
  ─→ 응답: { quoteRequestId, items: FactoryRecommendation[], mockOnly, adapter }

GET /quote-requests/:id/recommendations
  ─→ 응답: { quoteRequestId, items: FactoryRecommendation[], count }
```

- 견적 요청을 먼저 **DB 영속화** (`status: new → matched → quoted → contracted`)
- 매칭은 별도 endpoint로 분리 (재매칭, 비동기 처리 가능)
- 추천 결과도 별도 조회 가능 (`/recommendations`)

### 1.3 옵션 C — 하이브리드

`POST /matching/recommend`는 유지하되, 응답 후 백엔드에서 비동기로 `quote_requests` + `match_recommendations` 테이블에 기록.

---

## 2. 평가 기준

### 2.1 PRD v0.4 정합성

| 기준                                                    | 옵션 A                               | 옵션 B                          | 옵션 C                   |
| ------------------------------------------------------- | ------------------------------------ | ------------------------------- | ------------------------ |
| Phase 1.W2 Prisma + DB 영속화                           | ❌ session만 사용                    | ✅ DB 영속화가 endpoint 본질    | 🟡 응답 후 백엔드 영속화 |
| `/requests` 내 요청 목록 (functional-spec §6.3 REQ-007) | ❌ session만 보이고 새로고침 시 손실 | ✅ `GET /quote-requests`로 조회 | ✅ 동일                  |
| `/requests/[id]` 견적 요청 상세 (REQ-008)               | ❌ 마찬가지                          | ✅ `GET /quote-requests/:id`    | ✅ 동일                  |

→ Phase 1.W2 이후 functional-spec 충족을 위해 **DB 영속화가 필수**. 옵션 A 단독으로는 부족.

### 2.2 UX (현재 발주 요청 폼)

| 기준                           | 옵션 A                                          | 옵션 B                                             | 옵션 C  |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------- | ------- |
| 폼 제출 후 즉시 매칭 결과 화면 | ✅ 한 요청에 완성                               | 🟡 2 요청 필요 (네트워크 round-trip ↑)             | ✅ 동일 |
| 매칭 실패 시 재시도            | 🟡 폼 다시 입력 (또는 sessionStorage에서 retry) | ✅ `POST /:id/match` 재호출                        | ✅ 동일 |
| 매칭 결과 공유/북마크          | ❌ session 휘발성                               | ✅ url로 `/requests/:id`/`/matching/:id` 공유 가능 | ✅ 동일 |

→ 사용자 시점에서 옵션 A는 빠르지만, **재진입/공유 UX가 약함**.

### 2.3 백엔드 복잡도 / Race / Retry

| 기준                 | 옵션 A                               | 옵션 B                                 | 옵션 C                       |
| -------------------- | ------------------------------------ | -------------------------------------- | ---------------------------- |
| GPT-4o 호출 실패 시  | ❌ 전체 요청 실패 (요청 정보도 잃음) | ✅ 요청은 영속화됨, match만 재시도     | ✅ 동일                      |
| 동시 매칭 요청 race  | 🟡 별도 보호 필요                    | ✅ `quote_request_id` 기반 idempotency | 🟡 동기 응답에서 race는 동일 |
| 백엔드 인증 컨텍스트 | ❌ stateless, 요청자 추적 어려움     | ✅ `client_user_id` FK 저장            | ✅ 동일                      |

### 2.4 마이그레이션 비용

| 기준             | 옵션 A          | 옵션 B                                                                 | 옵션 C                                 |
| ---------------- | --------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| 현재 코드 변경량 | 0 (그대로 유지) | 🔴 web `/request/page.tsx` + api 라우트 + Prisma model 추가 (~300 LoC) | 🟡 api에 영속화 로직만 추가 (~100 LoC) |
| 프런트 수정      | 0               | 🔴 fetch 흐름 2단계로 분리, sessionStorage→DB id 전환                  | 0 (응답 shape 유지)                    |
| 테스트 영향      | 0               | 🔴 시나리오 #2 path 변경                                               | 🟢 검증 가능                           |

---

## 3. 결정 (2026-06-02)

### 3.1 단기 (Phase 1.W2 진입 시점까지) — **옵션 A 유지**

이유:

- 현재 코드가 작동하며, mock fallback fix로 #2 시나리오 PASS 가능
- Phase 1.W2의 Prisma + Better Auth 통합 작업이 우선
- 프런트 `request page` + sessionStorage 흐름은 안정적

### 3.2 중기 (Phase 1.W2 중) — **옵션 C로 점진 전환**

이유:

- `POST /matching/recommend`의 외부 shape는 유지 (프런트 수정 0)
- 백엔드에서 응답 직전에 `quote_requests` + `match_recommendations` 테이블에 기록
- 이로써 `/requests`, `/requests/[id]`, `/matching` 후 재진입이 functional-spec REQ-007/REQ-008/AIM-003을 충족
- `backend-api-contract.md`의 2-step shape는 **나중에 도입할 reference**로 보존

### 3.3 장기 (Phase 2+) — **옵션 B로 분리 검토**

이유:

- `/factory/quote-requests` 게시판이 활성화되면 발주 요청 영속화 시점과 매칭 시점 분리 필요
- 재매칭, 비동기 매칭, admin이 매칭 결과 검토하는 운영 시나리오에 대응
- 그쪽 백엔드와 협상 후 결정

---

## 4. 옵션 C 구체 설계 (Phase 1.W2 작업 단위)

### 4.1 Prisma model (잠정)

```prisma
model QuoteRequest {
  id                    String   @id @default(cuid())
  clientUserId          String   @map("client_user_id")
  clientCompanyId       String?  @map("client_company_id")
  projectName           String   @map("project_name")
  processType           String   @map("process_type")
  productItem           String   @map("product_item") @db.Text
  estimatedQuantity     String   @map("estimated_quantity")
  desiredDeadline       String   @map("desired_deadline")
  budgetRange           String   @map("budget_range")
  detailRequirements    String   @map("detail_requirements") @db.Text
  status                QuoteRequestStatus @default(NEW)
  createdAt             DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  recommendations       MatchRecommendation[]

  @@index([clientUserId])
  @@index([status])
  @@map("quote_requests")
}

enum QuoteRequestStatus {
  NEW
  REVIEWING
  MATCHED
  QUOTED
  CONTRACTED
  CANCELLED
}

model MatchRecommendation {
  id                  String   @id @default(cuid())
  quoteRequestId      String   @map("quote_request_id")
  factoryId           String   @map("factory_id")
  score               Int
  qualityScore        Int      @map("quality_score")
  deliveryScore       Int      @map("delivery_score")
  priceScore          Int      @map("price_score")
  trustScore          Int      @map("trust_score")
  reason              String   @db.Text
  estimateMin         Int      @map("estimate_min")
  estimateMax         Int      @map("estimate_max")
  source              MatchingSource @default(DETERMINISTIC_MOCK)
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  quoteRequest        QuoteRequest @relation(fields: [quoteRequestId], references: [id], onDelete: Cascade)

  @@unique([quoteRequestId, factoryId, source])
  @@index([quoteRequestId])
  @@map("match_recommendations")
}

enum MatchingSource {
  DETERMINISTIC_MOCK
  OPENAI_ADAPTER
  MANUAL_ADMIN
}
```

### 4.2 API 변경 (옵션 C — shape 유지)

```typescript
// MatchingController (변경 후)
@Post('recommend')
async recommend(
  @Body() request: QuoteRequestDraft,
  @CurrentUser() user: User,           // Better Auth context
): Promise<FactoryRecommendation[]> {
  // 1) 영속화
  const persisted = await this.quoteRequestService.create({
    ...request,
    clientUserId: user.id,
    clientCompanyId: user.companyId,
  });

  // 2) AI 매칭 (기존 로직 + mock fallback)
  const recommendations = await this.aiMatching.matchFactories(request);

  // 3) 매칭 결과 영속화 (비동기 fire-and-forget도 OK)
  await this.matchRecommendationService.saveAll(persisted.id, recommendations);

  // 4) 응답 shape는 그대로 유지 (프런트 수정 0)
  return recommendations;
}
```

### 4.3 향후 분리 시 옵션 B로 확장

```typescript
// 추가 — Phase 2
@Post('/quote-requests/:id/match')
async rematch(@Param('id') id: string): Promise<FactoryRecommendation[]> { ... }

@Get('/quote-requests/:id/recommendations')
async getRecommendations(@Param('id') id: string) { ... }
```

---

## 5. 협상 의제 (팀과)

- 옵션 C가 그쪽 `POST /quote-requests` + `POST /:id/match` shape와 다름 → 우리가 단일 `/matching/recommend`에서 동등 효과 달성
- 양측이 동일한 `QuoteRequest`/`MatchRecommendation` 도메인 모델을 사용 → DB-level 호환 유지 가능
- 그쪽이 Spring 백엔드를 계속 운영한다면, BFF (Next.js) ↔ Spring 통신 시 1-step 또는 2-step 어느 쪽이든 adapter로 처리

---

## 6. 결론

| 시점          | 채택          | 비용                    | 효과                                         |
| ------------- | ------------- | ----------------------- | -------------------------------------------- |
| 지금          | 옵션 A (현재) | 0                       | #2 시나리오 PASS, Phase 1.W2 진입 가능       |
| Phase 1.W2 중 | **옵션 C**    | api ~100 LoC, web 0 LoC | REQ-007/REQ-008/AIM-003 충족, DB 영속화 시작 |
| Phase 2+      | 옵션 B 확장   | api ~150 LoC, web 일부  | 재매칭/비동기/admin 시나리오 대응            |

**프런트 코드 변경 없이 백엔드 영속화만 추가**하는 옵션 C가 가장 비용 대비 효과적입니다.

---

## 7. 관련 문서

- `docs/specs/functional-spec.md` §14 인수 기준
- `docs/specs/backend-api-contract.md` 2-step shape 정의 (옵션 B reference)
- `docs/specs/rootmatching-erd.md` `quote_requests` + `match_recommendations` ERD
- `docs/specs/backend-design-mapping.md` `QuoteRequestStatus` + `MatchingSource` enum 정의
- `docs/handoffs/2026-06-02-backend-api-branch-evaluation.md` 채택 결정
- `apps/api/src/matching/services/ai-matching.service.ts` 현재 1-step 구현
