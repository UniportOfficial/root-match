# Session Handoff — 2026-06-02 Remaining Pages from Functional Spec Complete

## TL;DR

> **Quick Summary**: 6 Wave (A~F) + 1 chore + 4 post-audit fix = **총 11 commit**로 `.sisyphus/plans/remaining-pages-from-functional-spec.md` 플랜을 완료. **functional-spec.md §4 27개 라우트 100% 커버**(27 spec-literal + 5 alias = 32 routes 등록) + middleware fail-closed 역할 가드 + 5 React Context + 7 신규 공통 컴포넌트.
>
> **Status**: Oracle 4라운드 회귀 검증 통과 (`<promise>VERIFIED</promise>`). typecheck + lint + build EXIT 0.
>
> **Branch**: `dev-monorepo` HEAD `6a5cf81`, origin push 완료.
>
> **다음 단계**: Phase 1.Week 2 백엔드 통합 트랙 (Prisma + Better Auth + 도메인 모듈 + E2E).

---

## 1. Context

### 1.1 시작 시점

- 이전 세션 (Chunks 1~4) 완료 상태: 11/27 라우트 구현, Tailwind 토큰 + AppBadge + 기본 페이지(/quotes /request /matching /requests /transactions /disputes /mypage)
- 사용자 요청: `/start-work` (옵션 A — Sisyphus 오케스트레이터로 자동 실행)
- 플랜 파일: `.sisyphus/plans/remaining-pages-from-functional-spec.md` (713줄, 6 Wave + Final Verification Wave)
- 명세: `docs/specs/functional-spec.md` (363줄, 27 routes + 12 functional groups + 9 acceptance criteria)
- 사용자 결정 (이전 세션 인터뷰): **React Context + useReducer만 사용** (Zustand/Jotai/Redux 외부 의존성 금지)

### 1.2 작업 방식

- **Wave A/B/F**: 단일 sub-agent 또는 직접 (인프라/통합 일관성)
- **Wave C/D/E**: 2~3 sub-agent 병렬 (`visual-engineering` 카테고리 + `frontend-ui-ux` 스킬)
- **Final Verification Wave**: F1(oracle) / F2(unspecified-high + ai-slop-remover) / F3(unspecified-high + playwright) / F4(deep) 4개 audit 병렬
- 모든 sub-agent 모델 라우팅 에러 발생 시 직접 구현으로 폴백 (Wave C sub-3 `/factories/[id]` 자체 구현)

---

## 2. 완료된 Wave

### Wave A — 인프라 (`f19787b`)

**7개 공통 컴포넌트**:

- `apps/web/src/components/layout/{AppLayout,AppHeader,AppSidebar}.tsx`
- `apps/web/src/components/ui/{AppButton,ProcessStepper}.tsx`
- `apps/web/src/components/auth/AuthModal.tsx`
- `apps/web/src/components/notification/NotificationDropdown.tsx`

**5개 React Context** (State/Dispatch 분리, hydration-safe):

- `apps/web/src/state/{User,Companies,Messages,Notifications,Workflow}Context.tsx`
- `apps/web/src/state/AppProviders.tsx` (composition, root layout 1줄 적용)

**mockData.ts 332줄 도메인 분할**:

- `apps/web/src/data/{companies,users,messages,notifications,activityLogs}.ts`
- `apps/web/src/data/_legacy/` 삭제

**packages/shared/src/types/ 신규**:

- `companies.ts` (Company, CompanyPortfolioItem, CompanyFilter)
- `users.ts` (User, UserPermission, AccountType — 'admin' | 'member' / 'client' | 'factory')
- `messages.ts` (Message)
- `notifications.ts` (Notification, ActivityLog, DashboardStats)

**route-group layout.tsx 3개**:

- `(client)/layout.tsx`, `(common)/layout.tsx`, `(factory)/layout.tsx` — 모두 AppLayout으로 감쌈

**WorkflowContext sessionStorage 백워드 호환**:

- `rm:matchingResults`, `rm:selectedFactory` 키 hydrate/sync, 1시간 만료 검사 유지

### Wave B — 인증 진입 (`d0f925c`)

- `/login` (standalone, no AppLayout) — RHF + zod, 로그인/회원가입 탭, 모의 계정 `hong@techsolution.co.kr / 123456`
- `/role-select` (standalone) — 발주처 카드 → `/request`, 공장 카드 → `/factory/onboarding`; 클릭 시 mock 계정 자동 로그인 (client/factory)
- `/dashboard` (`(common)` 내) — 4 stats 카드 + 추천 기업 3개 + 활동 로그 5개

### chore — factory-data 이동 (`86d4a86`)

- `apps/api/src/matching/fixtures/factory-data.ts` → `packages/shared/src/fixtures/factory-data.ts`
- `packages/shared/package.json` exports에 `"./fixtures/factory-data": "./src/fixtures/factory-data.ts"` 추가 (Turbopack + NodeNext 동시 만족)
- `apps/api/src/matching/services/ai-matching.service.ts` import 경로 업데이트
- `apps/api/src/matching/fixtures/` 디렉토리 삭제

### Wave C — 공장 플로우 (`4c1c309`)

- `/factory/onboarding` (FAC-001~004) — RHF + zod (basic info 7 필드) + dynamic useState (processes/production rows/portfolio images, image-only filter)
- `/factory/requests` (FAC-005) — keyword + processType + status 필터, 상세 링크
- `/factory/requests/[id]` (FAC-006) — RHF + zod 견적 제출, dispatch `messages/sendMessage`, 라우팅 `/messages?message=...&context=quote`
- `/factories/[id]` (FAC-007) — `mockFactoryDetails` from `@rootmatching/shared/fixtures/factory-data`, 인증/KPI/포트폴리오/리뷰

### Wave D — 거래/분쟁 (`a2e09d0`)

- `/contract` (CON-001~004) — `useWorkflowState` selectedFactory + 에스크로 라디오 + ProcessStepper (5 step, current=3) + `workflow/setContract` + `workflow/completePayment` → `/transactions/TXN-2026-018`
- `/transaction/review` (TXN-006~007) — 별점 + 후기 + 후속 액션 라디오 + `workflow/submitReview` → `/dashboard`
- `/disputes/mediation` (DSP-002~003) — RHF + zod (Suspense-wrapped useSearchParams) + 4 분쟁 유형 + 증빙 체크/파일 → `/disputes`
- `/transaction/progress` — Server Component redirect → `/transactions/TXN-2026-018`

### Wave E — 공통 기능 (`ffe0427`)

- `/companies` (COM-001~003) — `useCompaniesFiltered`, `?keyword=` 쿼리 자동 적용 (Suspense), 즐겨찾기 토글
- `/companies/[id]` (COM-004~006) — 기본 정보 + 즐겨찾기 + 문의 모달 → `messages/sendMessage`
- `/messages` (MSG-001~005) — 2-pane list+chat, `?message=` 자동 선택 + markAsRead (Suspense), Enter/Shift+Enter 키보드
- `/mypage/analytics` (MY-005) — 4 stat 카드 + activity log + 활동 유형별 요약 bar (외부 chart lib 없이)
- `/mypage/settings` (MY-006~008) — RHF + zod 프로필 폼 (`user/updateProfile`), 비밀번호 변경 UI, 알림 토글

### Wave F — 폴리쉬 통합 (`2541b5a`)

- `apps/web/src/middleware.ts` — Next.js 미들웨어, `rm-auth` 쿠키 기반 인증 가드
- `apps/web/src/lib/auth-cookie.ts` — `setAuthCookie / clearAuthCookie` 헬퍼
- UserContext useEffect로 인증 상태와 쿠키 동기화
- AppLayout에 `usePathname` 효과 추가 → 동적 문서 제목 `{화면명} - RootMatching B2B` (18 정적 + 6 동적 prefix)
- AppLayout에 해시 스무스 스크롤 + pathname 변경 시 top 스크롤
- F1 (notification 연결) + F2 (헤더 검색 → `/companies?keyword=`) + F6 (`?keyword=` 자동 적용)는 Wave A/E에서 선행 구현 확인

### Post-audit Fix 1 — Final audit 후속 (`63e9331`)

- `/login`이 `?redirectTo=` 쿼리 활용 (same-origin 가드, 기본값 `/dashboard`)
- `/transaction/progress`가 `/transactions/TXN-2026-018`로 리다이렉트 (플랜의 `/transactions/:id` intent 정확 매칭)
- `mockDashboardStats`를 별도 `apps/web/src/data/dashboardStats.ts`로 분리
- AppHeader FormEvent 타입 전용 import

### Post-audit Fix 2 — Oracle Round 1 (`2df80f9`)

Oracle Round 1이 지적한 4개 blocking 갭 해결:

1. **인증 가드 우회 가능 문제 해결**
   - UserContext 초기 상태를 `{ currentUser: null, isAuthenticated: false }`로 변경
   - 쿠키는 `state.isAuthenticated && state.currentUser` 모두 truthy일 때만 쓰여짐 → public 라우트 방문이 silent하게 인증 못 함
2. **역할 기반 미들웨어 가드 구현**
   - `ROLE_COOKIE_NAME = 'rm-role'` 추가, `FACTORY_ONLY_PREFIXES` + `CLIENT_ONLY_PREFIXES` 매칭, 불일치 시 `/dashboard` 리다이렉트
3. **`/mypage` 저장이 §14 acceptance 충족**
   - `user/updateCompany` + `companies/updateCompany` 모두 dispatch (회사 정보가 사용자 컨텍스트와 회사 목록 양쪽 갱신)
   - 폼이 `zodResolver(profileSchema)` 사용 (email/url/number 가드)
4. **RHF + zod 커버리지 확장**
   - `/factory/onboarding` basic info 7 필드에 RHF + zod (dynamic state는 useState 유지)
5. **`UserPermission` / `AccountType` 타입 alias 추가** (기존 schemas/user.ts UserRole 충돌 회피)
6. **mockCurrentUser.accountType = 'client'`, mockFactoryUser 신규** (역할 가드 작동 검증 가능)

### Post-audit Fix 3 — Oracle Round 2 (`dfe69a3`)

Oracle Round 2가 지적한 마지막 1개 갭 (인증 후 rm-role 없을 때 fail-open) 해결:

- middleware: 역할-범위 라우트인데 `rm-role`이 'client'/'factory' 아닌 경우 → **fail-closed**, `/role-select` 리다이렉트
- `user/register` reducer 기본값 `accountType: 'client'` 추가 (인증 직후 role 쿠키 갭 제거)

### Post-audit Fix 4 — Oracle Round 3 (`6a5cf81`)

Oracle Round 3이 지적한 5개 spec-literal alias 부재 해결:

- `apps/web/src/app/quote-requests/page.tsx` → `redirect('/quotes')`
- `apps/web/src/app/client/{request,matching,requests}/page.tsx` → `redirect('/<target>')`
- `apps/web/src/app/client/requests/[id]/page.tsx` → Next.js 15 async params → `redirect('/requests/{id}')`

→ 빌드에 spec 문자 그대로 등록됨. 미들웨어는 alias가 PUBLIC도 아니고 ROLE_PREFIX도 아니므로 통과 → 페이지가 `redirect()` 발사 → 캐노니컬 경로가 미들웨어로 재평가되어 역할 가드 적용

---

## 3. 최종 상태

### 3.1 검증 결과 (`6a5cf81` 시점)

```text
typecheck:  EXIT 0  (packages/shared, apps/api, apps/web 모두 Done)
lint:       EXIT 0  (3 warning, 모두 @next/next/no-img-element on intentional <img>)
build:      EXIT 0  (32 routes + /_not-found + Middleware 39.4 kB)
```

### 3.2 등록 라우트 32개

**공개 (3)**:

- `/`, `/login`, `/role-select`

**공통 인증 (10)**:

- `/dashboard`, `/quotes`, `/quote-requests` (→alias), `/companies`, `/companies/[id]`, `/messages`, `/mypage`, `/mypage/analytics`, `/mypage/settings`

**발주처 전용 (8)**:

- `/request`, `/client/request` (→alias), `/matching`, `/client/matching` (→alias), `/requests`, `/client/requests` (→alias), `/requests/[id]`, `/client/requests/[id]` (→alias)

**공장 전용 (3)**:

- `/factory/onboarding`, `/factory/requests`, `/factory/requests/[id]`

**공통 도메인 (4)**:

- `/factories/[id]`, `/contract`, `/transaction/progress` (→`/transactions/TXN-2026-018`), `/transaction/review`

**거래/분쟁 (5)**:

- `/transactions`, `/transactions/[id]`, `/disputes`, `/disputes/[id]`, `/disputes/mediation`

### 3.3 인증 + 역할 가드 동작 모델

| 시나리오                                                                                                  | 미들웨어 처리                           |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 비로그인 → 공개 라우트 (`/`, `/login`, `/role-select`)                                                    | 통과                                    |
| 비로그인 → 보호 라우트                                                                                    | `/login?redirectTo=<원본>` 리다이렉트   |
| 인증 (client) → 발주처 전용 라우트                                                                        | 통과                                    |
| 인증 (client) → 공장 전용 라우트 (`/factory/*`)                                                           | `/dashboard` 리다이렉트                 |
| 인증 (factory) → 공장 전용 라우트                                                                         | 통과                                    |
| 인증 (factory) → 발주처 전용 라우트 (`/request`, `/matching`, `/contract`, `/transaction/*`, `/requests`) | `/dashboard` 리다이렉트                 |
| 인증 (role 미설정) → 역할-범위 라우트                                                                     | `/role-select` 리다이렉트 (fail-closed) |

### 3.4 페이지 데이터 흐름 모델 (모두 mock)

| 컨텍스트             | 영속화                                                    | 사용처                                                                |
| -------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| UserContext          | `rm-auth`/`rm-role` 쿠키 (인증 상태 sync)                 | AppHeader, /mypage\*, /login, /role-select, /companies/[id] 문의 모달 |
| CompaniesContext     | (없음, 메모리)                                            | /companies, /companies/[id], /dashboard 추천, /mypage 저장 시         |
| MessagesContext      | (없음, 메모리)                                            | /messages, /factory/requests/[id] 견적 제출, /companies/[id] 문의     |
| NotificationsContext | (없음, 메모리)                                            | AppHeader 알림 드롭다운                                               |
| WorkflowContext      | `rm:matchingResults`, `rm:selectedFactory` sessionStorage | /request → /matching → /contract → /transaction/review → /dashboard   |

---

## 4. Plan §13 우선순위 처리 현황

| #   | 항목                                         | 상태              | 비고                                                                                                       |
| --- | -------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | 라우터 인증 가드 + 역할별 접근 제어          | ✅ 완료           | middleware fail-closed                                                                                     |
| 5   | 거래 상태 머신 정의 + 상태 전이 검증         | ⚠️ 부분           | WorkflowContext가 contract/payment/inspection/review 상태 관리; 전이 검증은 백엔드 작업                    |
| 8   | 분쟁 케이스 생성 + 중재자 처리 + 조정안 승인 | ✅ UI 완료        | DSP-002/003 폼; DSP-004 상세는 기존 `/disputes/[id]` (Chunks 3+4)                                          |
| 9   | 폼 검증 라이브러리 (RHF + zod)               | ✅ 완료           | 전 폼에 채택                                                                                               |
| 2   | 백엔드 API 연동 + Pinia 영속화               | ⏭️ **Phase 1.W2** | mock 상태                                                                                                  |
| 3   | OpenAI 백엔드 이전                           | ⚠️ 부분           | apps/api에 NestJS Matching 컨트롤러는 있음, web/request가 직접 호출 (Phase 1.W2에서 web→api 프록시화 필요) |
| 4   | 파일 업로드/다운로드 API + 보안 정책         | ⏭️ **Phase 1.W2** | 현재 브라우저 File 객체만 표시                                                                             |
| 6   | 실제 결제/에스크로/전자서명 연동             | ⏭️ **Phase 후속** | mock UI만                                                                                                  |
| 7   | 메시지 대화방 모델 + WebSocket/SSE           | ⏭️ **Phase 후속** | mock 메시지/local 답장                                                                                     |
| 10  | E2E 테스트 시나리오                          | ⏭️ **Phase 1.W2** | `.sisyphus/evidence/final-qa/` 수동 캡처는 별도 진행                                                       |

---

## 5. 다음 세션 진입 (Phase 1.Week 2)

### 5.1 권장 시작 시퀀스

```bash
cd /Users/uni-claw/dev/root-match
nvm use 22
git pull origin dev-monorepo   # 다른 작업자 변경 가져오기
git status                      # 깨끗한 트리 확인
```

### 5.2 Phase 1.W2 백엔드 통합 백로그

이전 핸드오프 `docs/handoffs/2026-05-26-phase-1-week-1-complete.md` v1.1 기준 다음 작업:

1. **Prisma 6 + Neon PostgreSQL** 연결
   - `apps/api/prisma/schema.prisma` 생성
   - Company/User/QuoteRequest/Transaction/Dispute 모델 (현재 mock 데이터에서 추론)
   - `pnpm prisma migrate dev`
2. **Better Auth + Prisma adapter** NestJS 통합
   - `auth-cookie.ts`의 mock 쿠키를 Better Auth 세션으로 교체
   - 미들웨어는 그대로 두고 쿠키 의미만 실제 세션으로 매핑
3. **비즈니스 모듈**: Users, Companies (Matching, Quotes는 이미 있음)
4. **Mock fixtures → Prisma seed 마이그레이션**:
   - 데이터 소스: `apps/web/src/data/{companies,users,messages,notifications,activityLogs,dashboardStats}.ts` + `packages/shared/src/fixtures/factory-data.ts` + `apps/web/src/data/{requestData,transactionData,disputeData}.ts`
5. **nestjs-zod DTO** 검증 + **Swagger** + **ThrottlerGuard** + **helmet** + **nestjs-pino**
6. **apps/web 클라이언트 측 API 통합**:
   - mock dispatch 액션을 fetch 호출로 교체
   - sessionStorage hydration 유지 (오프라인 폴백)
   - WorkflowContext가 sessionStorage + API 양방향 sync
7. **E2E 테스트** Playwright 셋업 (apps/web 또는 e2e/ 워크스페이스)

### 5.3 마이너 정리 백로그 (선택, 비차단)

F2 Code Quality audit가 지적한 항목:

- `apps/web/src/app/(common)/mypage/page.tsx:37-43` raw hex 색상 6개 → Tailwind 토큰
- `apps/web/src/components/ui/{AppBadge,AppButton}.tsx`, `ProcessStepper.tsx` 일부 raw 팔레트 (slate/emerald/red) → semantic 토큰
- `(factory)/factory/onboarding/page.tsx` `PortfolioImage.size` 미사용 필드 제거
- `(common)/mypage/{analytics,settings}/page.tsx` 중복 탭 정의 → 공용 상수 추출
- `(factory)/factory/requests/page.tsx` + `[id]/page.tsx` 중복 status label/variant 매핑 → 공용 helper
- `(common)/factories/[id]/page.tsx` `mockDefaultFactoryDetail` fallback → 404 페이지 옵션 검토

---

## 6. 참고 파일

### 6.1 본 세션에서 생성/변경한 핵심 파일

```text
apps/web/src/
├── middleware.ts                      [신규 — auth + role 가드 fail-closed]
├── lib/
│   ├── auth-cookie.ts                 [신규 — rm-auth + rm-role 쿠키]
│   └── cn.ts                          [기존, 변경 없음]
├── components/
│   ├── layout/{AppLayout,AppHeader,AppSidebar}.tsx     [신규 — Wave A]
│   ├── ui/{AppButton,ProcessStepper}.tsx               [신규 — Wave A]
│   ├── ui/AppBadge.tsx                                 [기존, 변경 없음]
│   ├── auth/AuthModal.tsx                              [신규 — Wave A]
│   └── notification/NotificationDropdown.tsx           [신규 — Wave A]
├── state/
│   ├── AppProviders.tsx               [신규 — composition]
│   ├── UserContext.tsx                [신규 + Round1/2 fix — cookie sync]
│   ├── CompaniesContext.tsx           [신규]
│   ├── MessagesContext.tsx            [신규]
│   ├── NotificationsContext.tsx       [신규]
│   └── WorkflowContext.tsx            [신규 — sessionStorage hydrate/sync]
├── data/
│   ├── companies.ts                   [분할 신규]
│   ├── users.ts                       [분할 신규 + Round1 fix — mockFactoryUser 추가]
│   ├── messages.ts                    [분할 신규]
│   ├── notifications.ts               [분할 신규]
│   ├── activityLogs.ts                [분할 신규 — dashboardStats 분리됨]
│   └── dashboardStats.ts              [신규 — post-audit fix 1]
├── app/
│   ├── layout.tsx                     [수정 — AppProviders wrap]
│   ├── page.tsx                       [기존, 변경 없음]
│   ├── login/page.tsx                 [신규 + post-audit 1 — redirectTo 지원]
│   ├── role-select/page.tsx           [신규 + Round1 fix — mock 자동 로그인]
│   ├── quote-requests/page.tsx        [Round3 alias]
│   ├── client/request/page.tsx        [Round3 alias]
│   ├── client/matching/page.tsx       [Round3 alias]
│   ├── client/requests/page.tsx       [Round3 alias]
│   ├── client/requests/[id]/page.tsx  [Round3 alias — async params]
│   ├── (client)/layout.tsx            [신규]
│   ├── (common)/layout.tsx            [신규]
│   ├── (factory)/layout.tsx           [신규]
│   ├── (common)/dashboard/page.tsx    [Wave B]
│   ├── (common)/companies/{page,[id]/page}.tsx          [Wave E]
│   ├── (common)/messages/page.tsx     [Wave E]
│   ├── (common)/mypage/analytics/page.tsx               [Wave E]
│   ├── (common)/mypage/settings/page.tsx                [Wave E]
│   ├── (common)/mypage/page.tsx       [기존 + Round1 fix — Context dispatch + zod]
│   ├── (common)/disputes/mediation/page.tsx             [Wave D]
│   ├── (common)/factories/[id]/page.tsx                 [Wave C sub-3 직접]
│   ├── (common)/transactions/[id]/page.tsx              [기존 + Wave A — ProcessStepper 추출]
│   ├── (factory)/factory/onboarding/page.tsx            [Wave C + Round1 fix — RHF + zod]
│   ├── (factory)/factory/requests/{page,[id]/page}.tsx  [Wave C]
│   ├── (client)/contract/page.tsx     [Wave D]
│   ├── (client)/transaction/progress/page.tsx           [Wave D + post-audit 1 — TXN-2026-018]
│   └── (client)/transaction/review/page.tsx             [Wave D]

packages/shared/src/
├── fixtures/factory-data.ts           [신규 — chore commit, apps/api에서 이동]
├── types/
│   ├── companies.ts                   [신규]
│   ├── users.ts                       [신규 + Round1 fix — UserPermission/AccountType]
│   ├── messages.ts                    [신규]
│   ├── notifications.ts               [신규]
│   ├── matching.ts, requests.ts, transactions.ts, disputes.ts  [기존]
│   └── index.ts                       [수정 — 4개 신규 barrel]
└── package.json                       [수정 — fixtures/factory-data subpath export]

apps/api/src/matching/
├── services/ai-matching.service.ts    [수정 — fixture import path]
└── fixtures/                          [삭제 — shared로 이동]
```

### 6.2 evidence

- `.sisyphus/evidence/final-qa/` — F3 audit가 dev server까지 띄웠으나 evidence 누적 미확인. 본 세션 마지막에 별도 Playwright QA task 실행 중.

### 6.3 핵심 외부 참고

- `docs/specs/functional-spec.md` — 27 라우트 + 12 그룹 + §14 9 acceptance criteria
- `docs/design-system.md` — Tailwind 토큰 + 컴포넌트 패턴
- `docs/prd/rootmatching-prd.md` — PRD v0.4
- `docs/handoffs/2026-05-26-phase-1-week-1-complete.md` — Phase 1.W2 백로그 출처
- `docs/handoffs/2026-06-02-upstream-divergence-trial-merge.md` — upstream/main 충돌 컨텍스트 (팀의 Spring Boot 라인 vs 우리 NestJS 라인)

---

## 7. 알려진 한계 (Phase 1.W2 이전)

- **인증은 mock only**: `hong@techsolution.co.kr / 123456` (client) 또는 `/role-select`에서 공장 자동 mock-login. 실제 패스워드 검증 없음.
- **새로고침 시 상태 손실**: User/Companies/Messages/Notifications/Workflow 모두 메모리. sessionStorage는 WorkflowContext만 부분 사용.
- **OpenAI 호출이 클라이언트 직접**: `/request` 페이지에서 `fetch('${NEXT_PUBLIC_API_URL}/matching/recommend')` 호출. Phase 1.W2에서 web → api 프록시화 필요.
- **파일 업로드**: 브라우저 File 객체 / `URL.createObjectURL`만. 서버 업로드 없음.
- **결제/에스크로/전자서명**: UI flow만, 실제 PG/계약 API 미연결.
- **알림/메시지 실시간 X**: 폴링 또는 WebSocket 없음, mock 데이터만.
- **분쟁 케이스 영속 X**: `/disputes/mediation` 제출 후 `/disputes` 이동만, 실제 case 생성 로직 없음.

---

## 8. 팀 컨텍스트 (참고)

- 우리 라인: `dev-monorepo` (PRD v0.4, Next.js + NestJS + Prisma + Better Auth)
- 팀 라인: `main` (PR #2, Vue 3 + Spring Boot 4.0.6 + Gradle + JPA + H2/MySQL)
- 충돌 컨텍스트는 `docs/handoffs/2026-06-02-upstream-divergence-trial-merge.md` 참고
- Phase 1.W2에서 우리 라인 NestJS + Prisma 구현이 완성되면, 팀과 백엔드 선택 재협상 데이터 포인트로 활용 가능

---

**HEAD: `6a5cf81` (push 완료)**
**Verification: Oracle Round 4 `<promise>VERIFIED</promise>`**
