# Lighthouse Coverage Gap — Session C 미검증 라우트 Inventory

> **Session C deferred follow-up (b)** — handoff `2026-06-03-wave-3a-q10-session-c-complete.md` §1.2 + backlog `w2-2.5-followup-backlog.md` §3.4.5.
> Session C는 5개 라우트 Lighthouse 100/100 달성. 나머지 라우트의 visual regression 및 a11y 검증 계획 문서.

| 항목           | 값                                                         |
| -------------- | ---------------------------------------------------------- |
| 작성일         | 2026-06-03                                                 |
| 트리거         | Session C closure (`3679a34`); backlog §3.4.5 Tier 3 NICE  |
| 라우트 기준    | `apps/web/src/app/**/page.tsx` glob 실측 (2026-06-03 기준) |
| 검증 도구      | Lighthouse CLI, Playwright, axe-core                       |
| 다음 검증 목표 | Phase 2 진입 시 high 우선순위 추가 검증                    |

---

## 1. Session C 검증 결과

### 1.1 검증된 5개 라우트

| URL          | Lighthouse a11y | WCAG AAA contrast | 비고                                            |
| ------------ | --------------- | ----------------- | ----------------------------------------------- |
| `/`          | 100             | body 11:1         | 랜딩 페이지 — DS 컴포넌트 없음 (순수 Tailwind)  |
| `/signin`    | 100             | heading 16.56:1   | Better Auth UI (page.tsx 없음, API 라우트 기반) |
| `/signup`    | 100             | brand 8.17:1      | Better Auth UI (page.tsx 없음, API 라우트 기반) |
| `/dashboard` | 100             | danger 7.59:1     | `(common)/dashboard` — AppBadge 사용            |
| `/quotes`    | 100             | (same as above)   | `(client)/quotes` — AppBadge 사용               |

WCAG AAA contrast 공통 기준 (Session C 달성):

- Body text (`#333d4b`): 11:1 on `#ffffff`
- Heading (`#191f28`): 16.56:1 on `#ffffff`
- Brand (`#3182f6`): 8.17:1 on `#ffffff`
- Danger (`#f04452`): 7.59:1 on `#ffffff`

### 1.2 glob vs 핸드오프 카운트 차이

| 출처                                  | 라우트 수 | 비고                                                           |
| ------------------------------------- | --------- | -------------------------------------------------------------- |
| `design-system-upgrade.md` §8 Phase D | 27개      | Session C 이전 기준; spec 작성 시점의 추정치                   |
| `w2-2.5-followup-backlog.md` §3.4.5   | 22개      | 27 - 5 verified = 22 미검증 (spec 기반 계산)                   |
| **glob 실측 (2026-06-03)**            | **28개**  | `apps/web/src/app/**/page.tsx` 실제 파일 수; spec보다 1개 많음 |
| glob 미검증 (page.tsx 기준)           | **25개**  | 28 - 3 confirmed (/, /dashboard, /quotes) = 25                 |

> **차이 원인 분석**: `design-system-upgrade.md`의 27개 집계 이후 1개 route가 추가되었거나 초기 집계에서 1개 누락된 것으로 추정. `/signin`과 `/signup`은 Better Auth 제공 페이지로 page.tsx 파일 없음 — Session C는 URL 기준으로 검증했으므로 page.tsx 카운트와 별개. `/login/page.tsx`가 `/signin` 역할을 할 가능성 있으나 Session C 검증 목록과의 명확한 매핑은 미확인.
>
> **본 spec에서 미검증 카운트: page.tsx 기준 25개** (/, /dashboard, /quotes 3개만 confirmed verified로 처리).

---

## 2. 미검증 라우트 Inventory (25개, page.tsx 기준)

### 2.1 라우트 그룹 분포

| 그룹        | 라우트 수 | 페르소나                       | 비고                                                 |
| ----------- | --------- | ------------------------------ | ---------------------------------------------------- |
| `(client)`  | 7개       | client (발주처) — /quotes 제외 | /quotes는 Session C 검증 완료; 나머지 7개 미검증     |
| `(common)`  | 12개      | 공통 (양 페르소나)             | /dashboard 제외 12개 미검증                          |
| `(factory)` | 3개       | factory (공장)                 | 전체 미검증                                          |
| public      | 3개       | 사전 인증 (pre-auth)           | / 제외; /login, /role-select, /quote-requests 미검증 |

### 2.2 전체 미검증 라우트 상세

#### (client) 그룹 — 7개 미검증

| URL                     | page.tsx 경로                            | DS 컴포넌트                         | 우선순위 | 예상 이슈                                                 |
| ----------------------- | ---------------------------------------- | ----------------------------------- | -------- | --------------------------------------------------------- |
| `/request`              | `(client)/request/page.tsx`              | AppBadge                            | high     | RHF form input; focus-visible 검증 필요; 48px tap target  |
| `/matching`             | `(client)/matching/page.tsx`             | AppBadge                            | high     | 매칭 결과 카드; AppBadge semantic color 확인              |
| `/requests`             | `(client)/requests/page.tsx`             | AppBadge                            | high     | 목록 페이지; AppBadge yellow/red variant 렌더링 확인      |
| `/requests/[id]`        | `(client)/requests/[id]/page.tsx`        | AppBadge                            | medium   | 상세 페이지; dynamic route (mock data 필요)               |
| `/contract`             | `(client)/contract/page.tsx`             | AppBadge, AppButton, ProcessStepper | high     | 계약 critical path; ProcessStepper + 버튼 48px 검증       |
| `/transaction/progress` | `(client)/transaction/progress/page.tsx` | 없음 (DS 미사용)                    | medium   | DS 컴포넌트 미사용; 기본 Tailwind 색상만 → 낮은 a11y 위험 |
| `/transaction/review`   | `(client)/transaction/review/page.tsx`   | AppBadge, AppButton                 | medium   | 리뷰 제출; AppButton 크기 검증                            |

#### (common) 그룹 — 12개 미검증

| URL                   | page.tsx 경로                          | DS 컴포넌트              | 우선순위 | 예상 이슈                                                 |
| --------------------- | -------------------------------------- | ------------------------ | -------- | --------------------------------------------------------- |
| `/mypage`             | `(common)/mypage/page.tsx`             | 없음 (DS 미사용)         | medium   | 프로필 편집 form; focus-visible + input 크기 검증         |
| `/mypage/analytics`   | `(common)/mypage/analytics/page.tsx`   | AppBadge                 | low      | 분석 대시보드; AppBadge semantic color 확인               |
| `/mypage/settings`    | `(common)/mypage/settings/page.tsx`    | AppBadge, AppButton      | medium   | 설정; AppButton ghost variant + AppBadge 확인             |
| `/messages`           | `(common)/messages/page.tsx`           | AppBadge, AppButton      | medium   | 메시지; AppButton 상태 확인                               |
| `/companies`          | `(common)/companies/page.tsx`          | AppBadge, AppButton      | medium   | 회사 목록; AppBadge color + AppButton 크기                |
| `/companies/[id]`     | `(common)/companies/[id]/page.tsx`     | AppBadge, AppButton      | medium   | 회사 상세; dynamic route                                  |
| `/disputes`           | `(common)/disputes/page.tsx`           | AppBadge                 | high     | 분쟁 목록; AppBadge red/danger variant 확인 필요          |
| `/disputes/mediation` | `(common)/disputes/mediation/page.tsx` | AppBadge, AppButton      | high     | 분쟁 조정; critical path — AppButton 48px + focus         |
| `/disputes/[id]`      | `(common)/disputes/[id]/page.tsx`      | 없음 (DS 미사용)         | high     | 분쟁 상세; DS 미사용이지만 critical path                  |
| `/factories/[id]`     | `(common)/factories/[id]/page.tsx`     | AppBadge                 | low      | 공장 프로필; AppBadge color 확인                          |
| `/transactions`       | `(common)/transactions/page.tsx`       | 없음 (DS 미사용)         | medium   | 거래 목록; DS 미사용 — Tailwind 직접 사용 패턴 확인       |
| `/transactions/[id]`  | `(common)/transactions/[id]/page.tsx`  | AppBadge, ProcessStepper | high     | 거래 진행 스텝퍼; ProcessStepper active state + 대비 검증 |

#### (factory) 그룹 — 3개 미검증

| URL                      | page.tsx 경로                              | DS 컴포넌트         | 우선순위 | 예상 이슈                                              |
| ------------------------ | ------------------------------------------ | ------------------- | -------- | ------------------------------------------------------ |
| `/factory/onboarding`    | `(factory)/factory/onboarding/page.tsx`    | AppBadge, AppButton | high     | 공장 온보딩 첫 페이지; AppButton primary CTA 48px 검증 |
| `/factory/requests`      | `(factory)/factory/requests/page.tsx`      | AppBadge            | high     | 공장 수주 목록; factory primary workflow               |
| `/factory/requests/[id]` | `(factory)/factory/requests/[id]/page.tsx` | AppBadge, AppButton | high     | 공장 수주 상세; 입찰/응답 버튼 크기 + focus 검증 필요  |

#### public 그룹 — 3개 미검증

| URL               | page.tsx 경로             | DS 컴포넌트      | 우선순위 | 예상 이슈                                                        |
| ----------------- | ------------------------- | ---------------- | -------- | ---------------------------------------------------------------- |
| `/login`          | `login/page.tsx`          | AppButton        | high     | 로그인 form; `/signin` URL과의 매핑 불명확; focus-visible + 48px |
| `/role-select`    | `role-select/page.tsx`    | AppButton        | high     | 역할 선택; AppButton large CTA — 48px tap target 중요            |
| `/quote-requests` | `quote-requests/page.tsx` | 없음 (DS 미사용) | low      | DS 미사용; 낮은 a11y 위험 예상                                   |

---

## 3. 우선순위 분류

### High 우선순위 (Phase 2 진입 시 추가 검증 권장) — 10개

인증/계약/분쟁/공장 critical path 라우트. DS 컴포넌트(특히 ProcessStepper, AppButton primary)를 사용하거나 되돌릴 수 없는 액션을 포함하는 라우트.

| #   | URL                   | 이유                                            |
| --- | --------------------- | ----------------------------------------------- |
| 1   | `/request`            | 견적 요청 제출 — 발주처 핵심 workflow, RHF form |
| 2   | `/matching`           | AI 매칭 결과 — 발주처 핵심 CTA 포함             |
| 3   | `/requests`           | 발주처 견적 목록 — AppBadge 다수 렌더링         |
| 4   | `/contract`           | 계약 체결 — ProcessStepper + 불가역 액션        |
| 5   | `/disputes`           | 분쟁 목록 — red/danger AppBadge 정확성 검증     |
| 6   | `/disputes/mediation` | 분쟁 조정 — critical 불가역 액션                |
| 7   | `/disputes/[id]`      | 분쟁 상세 — DS 미사용이지만 critical path       |
| 8   | `/transactions/[id]`  | 거래 진행 스텝퍼 — ProcessStepper 유일 사용처   |
| 9   | `/factory/onboarding` | 공장 온보딩 — 첫 공장 경험, primary CTA 중요    |
| 10  | `/login` (= /signin?) | 로그인 form — DS AppButton + focus 검증         |

### Medium 우선순위 — 9개

일반 navigation 및 목록 페이지. 주요 DS 컴포넌트 사용하지만 즉각적인 critical path 아님.

`/requests/[id]`, `/transaction/progress`, `/transaction/review`, `/mypage`, `/mypage/settings`, `/messages`, `/companies`, `/companies/[id]`, `/transactions`

### Low 우선순위 — 6개

DS 컴포넌트 미사용 또는 부수적인 분석/프로필 라우트.

`/mypage/analytics`, `/factories/[id]`, `/quote-requests`, `/role-select`, `/factory/requests`, `/factory/requests/[id]`

> 참고: `/role-select`는 AppButton을 사용하지만 pre-auth 라우트로 낮은 트래픽 예상. `/factory/requests` 및 `/factory/requests/[id]`는 factory primary workflow이나 AppBadge만 사용해 위험도 상대적으로 낮음.

---

## 4. 검증 계획

### 4.1 Phase 2 진입 시 (high priority 10개 우선)

```bash
# 개발 서버 시작
pnpm dev &
sleep 8

# Lighthouse CLI (per route, a11y category)
lighthouse http://localhost:3000/request --only-categories=accessibility --output=json --output-path=/tmp/lh-request.json
lighthouse http://localhost:3000/matching --only-categories=accessibility --output=json --output-path=/tmp/lh-matching.json
lighthouse http://localhost:3000/requests --only-categories=accessibility --output=json --output-path=/tmp/lh-requests.json
lighthouse http://localhost:3000/contract --only-categories=accessibility --output=json --output-path=/tmp/lh-contract.json
lighthouse http://localhost:3000/disputes --only-categories=accessibility --output=json --output-path=/tmp/lh-disputes.json
lighthouse http://localhost:3000/transactions/1 --only-categories=accessibility --output=json --output-path=/tmp/lh-tx-id.json
lighthouse http://localhost:3000/factory/onboarding --only-categories=accessibility --output=json --output-path=/tmp/lh-factory-onboarding.json
lighthouse http://localhost:3000/login --only-categories=accessibility --output=json --output-path=/tmp/lh-login.json

# 목표: 각 라우트 a11y ≥ 100 (Session C 수준 유지)
```

### 4.2 Phase 2 closure 시 (전체 25개 + CI matrix 포함)

backlog §3.4.2와 통합하여 CI matrix에 Lighthouse 자동화 포함:

```yaml
# .github/workflows/ci.yml 추가 예시 (Phase 2 closure 시점)
lighthouse:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node 22
      uses: actions/setup-node@v4
      with:
        node-version: '22'
    - name: Install + Build
      run: pnpm install && pnpm build
    - name: Start server
      run: pnpm start &
    - name: Lighthouse CI (all routes)
      uses: treosh/lighthouse-ci-action@v11
      with:
        urls: |
          http://localhost:3000/
          http://localhost:3000/login
          http://localhost:3000/role-select
          http://localhost:3000/request
          http://localhost:3000/matching
          http://localhost:3000/requests
          http://localhost:3000/contract
          http://localhost:3000/disputes
          http://localhost:3000/disputes/mediation
          http://localhost:3000/transactions
          http://localhost:3000/factory/onboarding
          http://localhost:3000/factory/requests
        budgetPath: ./.lighthouserc.json
        # budgetPath에서 accessibility >= 100 enforce
```

### 4.3 WCAG AAA contrast snapshot 자동화 검토

현재 Session C는 DevTools axe 수동 확인. Phase 2 closure 시 `@axe-core/playwright` 도입 검토:

```typescript
// e2e/accessibility.spec.ts (Phase 2 backlog)
import { checkA11y } from 'axe-playwright';

const routes = ['/', '/request', '/contract', '/disputes/mediation', ...];

for (const route of routes) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);
    await checkA11y(page, null, {
      runOnly: { type: 'tag', values: ['wcag2aaa', 'wcag21aaa'] },
    });
  });
}
```

---

## 5. References

| 파일                                                              | 관련 내용                                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| `docs/handoffs/2026-06-03-wave-3a-q10-session-c-complete.md` §1.2 | Session C Lighthouse 5/5 100/100 결과                            |
| `docs/specs/design-system-upgrade.md` v0.1 §8 Phase D             | "27개 라우트 전수 screenshot check" 원문 (glob 실측 28개와 차이) |
| `docs/specs/w2-2.5-followup-backlog.md` §3.4.5                    | Tier 3 NICE — 본 spec이 §3.4.5의 구체 plan                       |
| `docs/specs/w2-2.5-followup-backlog.md` §3.4.2                    | CI matrix test:e2e 추가 (Phase 2 closure 시 통합 타겟)           |
| `apps/web/src/app/**/page.tsx` (glob 28개)                        | 라우트 inventory source of truth                                 |
| `docs/specs/phase-2-quotes-route-design-conflict.md`              | `/quotes` 라우트 그룹 모순 상세 분석                             |

---

## 6. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                        |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026-06-03 | 신규 작성. Session C deferred follow-up (b). glob 실측 28개 (spec 추정 27개 + 1 차이 noted). 미검증 25개 inventory + 우선순위 분류 (high 10 / medium 9 / low 6). Phase 2/closure 검증 계획. |
