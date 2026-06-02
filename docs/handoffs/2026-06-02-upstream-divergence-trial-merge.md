# Session Handoff — 2026-06-02 Upstream Divergence & Trial Merge

## TL;DR

머신 이전을 위해 핸드오프 정리를 시작한 시점, `upstream/main`에서 **30분 차이로 두 개의 PR이 머지**되어 우리 작업과 정면 충돌하는 상황이 발견됐습니다. 그 상황을 가시화하기 위해 `trial/merge-main-into-monorepo` 브랜치에서 trial merge를 수행했습니다.

이 문서는 다음을 기록합니다:

1. Upstream에 무엇이 일어났는가
2. 우리는 무엇을 어떻게 머지했는가
3. 팀과 무엇을 정렬해야 하는가
4. Phase 2 포팅 로드맵

---

## 1. Remote 재구성 결과

| 시점 | 상태 |
|---|---|
| 변경 전 | `origin = B-oxygen/root-match`, `upstream = L-dragon-woo/...` |
| 변경 후 | `origin = L-dragon-woo/DGU-Technology-start-up-capstone` (SSH) |

`B-oxygen/root-match` GitHub 리포지토리 자체는 콜드 백업으로 남겨두며, 로컬에서는 더 이상 sync 하지 않습니다.

### L-dragon-woo upstream에 push된 우리 브랜치

| 브랜치 | 출처 | 용도 |
|---|---|---|
| `dev-monorepo` | `aa8eac8` (구 `backup/dev-20260602`) | **활성 작업 브랜치** — Phase 1.Week 2 이후 작업 |
| `backup/dev-monorepo-20260602` | 동일 commit | 2026-06-02 시점 스냅샷 |
| `archive/vue3-phase0` | `a500cbf` (구 `dev-vue3-prototype`) | Phase 0 Vue 3 프로토타입 아카이브 |
| `trial/merge-main-into-monorepo` | 본 trial merge commit | upstream/main과의 충돌 가시화용, 빌드 안 됨 |

---

## 2. Upstream에서 일어난 일 (시간순)

```
2026-05-26  aa8eac8  (우리)  PRD v0.4 + Phase 1.Week 1 (Next.js + NestJS 모노레포)
2026-05-29  1eb2544  팀(jangjunseo05)  feat: AI 매칭 (벡터 검색 + GPT-4o 추천)
2026-05-29  bb03f94  팀          Merge PR #1 (feature/ai-matching → main)
2026-06-02  c1d5191  팀(DonggunSe0)   chore: separate frontend and setup spring backend
            ├ src/ → frontend/ 폴더로 이동
            └ backend/ 폴더 신규 생성 (Spring Boot 4.0.6, Java 17, Gradle, JPA, H2/MySQL)
2026-06-02  dc8926e  팀          chore: add backend log.md (WORK_LOG.md, 159줄)
2026-06-02  603a0b0  팀          Merge PR #2 (feature/backend-frontend-structure → main)
2026-06-02  (현재)   (우리)       trial 머지 + 본 문서 작성
```

### 우리 PRD v0.4 vs 팀 PR #2 — 충돌하는 결정

| 영역 | 우리 (PRD v0.4) | 팀 (PR #2, 30분 전) |
|---|---|---|
| Backend 언어 | TypeScript (NestJS 11) | **Java 17 (Spring Boot 4.0.6)** |
| Build | pnpm + Nest CLI | **Gradle** |
| ORM | Prisma 6 | **Spring Data JPA + Lombok** |
| DB (dev) | Neon PostgreSQL | **H2 in-memory** |
| DB (prod) | Neon PostgreSQL | **MySQL** |
| 인증 | Better Auth 자체 호스팅 | (미정) |
| API 문서 | `@nestjs/swagger` | `springdoc-openapi-starter-webmvc-ui` |
| Frontend | Next.js 15 + React 19 | **Vue 3 + Vite (유지)** |
| 레이아웃 | `apps/{web,api}` + `packages/shared` | `frontend/` + `backend/` |
| 포트 | api:3001, web:3000 (예정) | backend:8080, frontend:5173 |

**거의 모든 기술 선택이 다릅니다.**

---

## 3. Trial Merge 결과 분석

### 머지 실행

```bash
git switch -c trial/merge-main-into-monorepo dev-monorepo
git merge --no-ff origin/main
```

### 충돌 통계 (해결 전)

| 충돌 코드 | 개수 | 의미 |
|---|---|---|
| `DU` | 54 | 우리 삭제 / upstream이 `frontend/`로 옮기며 수정 — Phase 0 Vue 파일들 |
| `AU` | 4 | 우리만 `apps/web/public/`에 추가한 아이콘 |
| `UA` | 4 | upstream만 `frontend/public/`에 추가한 같은 아이콘 |
| `UU` | 2 | 양측 다 수정 — `.gitignore`, `README.md` |
| `DD` | 4 | 양측 다 삭제 — 루트 `public/*.png` (rename된 잔재) |

추가로 **35개 파일이 자동 staged** (충돌 없음, upstream 신규 자산 + Spring backend 전체).

### 적용한 해결 정책

```
DU (54)  → 우리 deletion 유지  (Phase 0 Vue 코드는 폐기)
AU (4)   → ours add  (apps/web/public/ 아이콘 유지)
UA (4)   → 거부      (frontend/public/ 중복 아이콘 제거)
DD (4)   → confirm   (양측 합의된 삭제)
UU (2)   → manual    (.gitignore: 양측 머지 / README: trial 안내문 신규 작성)
auto add → 받아들임   (backend/ + frontend/ 신규 비즈니스 자산)
```

### 머지 후 디렉토리 트리

```
trial/merge-main-into-monorepo/
├── apps/                              # 정식 작업 영역 (변경 없음)
│   ├── web/                            #   Next.js 15
│   └── api/                            #   NestJS 11
├── packages/shared/                    # 변경 없음
│
├── backend/                           # 🆚 upstream Spring Boot — 협상 자료
│   ├── build.gradle
│   ├── settings.gradle
│   ├── README.md
│   ├── WORK_LOG.md                    # 팀의 백엔드 작업 기록 159줄
│   ├── .env.example                   # MySQL 환경변수
│   └── src/main/java/com/dgu/backend/
│       ├── BackendApplication.java
│       ├── global/config/WebConfig.java     # CORS for localhost:5173
│       ├── global/response/ApiResponse.java
│       └── health/HealthController.java     # /api/health
│
├── frontend/                          # 🆚 upstream Vue 자산 — Phase 2 포팅 reference
│   ├── package.json                   # rootmatching-b2b
│   ├── pnpm-lock.yaml
│   ├── package-lock.json
│   ├── (Vue config 파일들은 우리 측에서 삭제됨)
│   ├── docs/design-system.md          # 우리 docs/와 중복, frontend/ 안에도 있음
│   └── src/
│       ├── data/disputeData.ts        # 신규 — 분쟁 mock data
│       ├── data/transactionData.ts    # 신규 — 거래 mock data
│       ├── services/aiMatching.ts     # 🔥 신규 — OpenAI GPT-4o + 매칭 추천 (209줄)
│       ├── services/vectorSearch.ts   # 🔥 신규 — 벡터 검색 (87줄)
│       └── views/
│           ├── QuoteRequestBoardView.vue          # 신규 — 견적요청 게시판
│           ├── client/ClientRequestDetailView.vue # 신규
│           ├── client/ClientRequestListView.vue   # 신규
│           ├── client/ClientRequestView.vue       # AI 매칭 통합 (+529줄)
│           ├── client/MatchingResultView.vue      # AI 결과 화면 (+671줄)
│           ├── dispute/DisputeDetailView.vue      # 신규
│           ├── dispute/DisputeListView.vue        # 신규
│           ├── mypage/ProfileView.vue             # 프로필 꾸미기
│           ├── transaction/TransactionListView.vue # 신규
│           └── transaction/TransactionProgressView.vue # 신규
│
└── docs/
    ├── prd/rootmatching-prd.md        # PRD v0.4
    └── handoffs/
        ├── 2026-05-26-phase-1-week-1-complete.md
        └── 2026-06-02-upstream-divergence-trial-merge.md  # 본 문서
```

### 빌드 가능성

- `apps/`, `packages/` 만으로는 빌드 가능 (Phase 1.Week 1 검증된 상태)
- `frontend/` 단독 빌드는 불가능 — 의존성 누락, config 파일들 삭제됨
- `backend/` 단독 빌드는 가능 (Gradle 자체 완결)
- **trial 브랜치 전체로는 빌드/실행 의도 없음**

---

## 4. 정식 작업 (`dev-monorepo`) 진행 — 변경 없음

Trial merge는 **별도 브랜치**에 격리되어 있으므로, `dev-monorepo` 본 작업은 핸드오프 v1.1의 Phase 1.Week 2 가이드 그대로 진행합니다:

1. Prisma 6 + Neon PostgreSQL 연결
2. Better Auth 통합 (PRD v0.4 핵심)
3. DTO 검증 (`nestjs-zod`)
4. Users / Companies 비즈니스 모듈
5. Swagger
6. 보안 + 운영성 (throttler, helmet, pino)
7. E2E 테스트

---

## 5. Phase 2 포팅 로드맵 (upstream 자산 → 우리 모노레포)

trial 브랜치의 `frontend/`와 `backend/`에 있는 자산을 PRD Phase 2~3에서 우리 모노레포로 재구성합니다.

### Frontend 자산 → `apps/web/`

| upstream 자산 | 우리 새 위치 | Phase | 비고 |
|---|---|---|---|
| `frontend/src/services/aiMatching.ts` | `apps/api/src/matching/ai-matching.service.ts` | Phase 2.Week 6 | NestJS service로 이식, OpenAI client 동일 |
| `frontend/src/services/vectorSearch.ts` | `apps/api/src/matching/vector-search.service.ts` | Phase 2.Week 6 | Postgres `pgvector` extension 사용 (Neon 지원) |
| `frontend/src/data/{factory,mockData,request}*.ts` | `apps/api/prisma/seed.ts` | Phase 1.Week 2 | Prisma seed로 재구성 |
| `frontend/src/data/{dispute,transaction}Data.ts` | `apps/api/prisma/seed.ts` | Phase 2 | 동일 |
| `frontend/src/views/QuoteRequestBoardView.vue` | `apps/web/app/(client)/quotes/page.tsx` | Phase 2.Week 5 | React + Server Component |
| `frontend/src/views/client/ClientRequest*.vue` | `apps/web/app/(client)/requests/...` | Phase 2.Week 5 | React Hook Form + zod |
| `frontend/src/views/client/MatchingResultView.vue` | `apps/web/app/(client)/matching/page.tsx` | Phase 2.Week 6 | AI 결과 화면, 서버 액션 |
| `frontend/src/views/dispute/*.vue` | `apps/web/app/(client)/disputes/...` | Phase 3 | 분쟁 중재 시스템 |
| `frontend/src/views/transaction/*.vue` | `apps/web/app/(client)/transactions/...` | Phase 2.Week 7 | 거래 진행 |
| `frontend/src/views/mypage/ProfileView.vue` | `apps/web/app/(common)/mypage/page.tsx` | Phase 2.Week 4 | 프로필 꾸미기 |

### Backend 결정 — 팀 협상 필요

| 옵션 | Pros | Cons |
|---|---|---|
| A. **우리 NestJS 유지** (PRD v0.4 강행) | PRD 합의 기반, TypeScript 일관성, Better Auth 활용 | 팀 PR #2 (Spring) 폐기 설득 필요 |
| B. **팀 Spring 합류** | 팀과 정렬, 충돌 해소 | PRD v0.4 폐기, Phase 1.Week 1 일부 폐기, Java 학습 비용 |
| C. **하이브리드** (NestJS BFF + Spring core) | 양측 자산 활용 | 복잡도 ↑, 운영 오버헤드 ↑ |

**현재 결정 (사용자, 2026-06-02)**: **옵션 A** — 우리 라인 고수, 팀 설득 진행.

---

## 6. 팀과 합의해야 할 의제 (Next Conversation)

1. **PRD v0.4 재확인**: Better Auth + Prisma + Neon이 팀 합의였는지 (사용자 응답: ✅ 합의되었으나 팀이 재확인 안 하고 따로 감)
2. **PR #2 Spring Boot 셋업**: 폐기 / 별도 microservice / 메인 백엔드 중 어느 위치인지
3. **Vue → React pivot 시점**: 팀에 PRD v0.4 통보 후 frontend 재구성 일정
4. **AI 매칭 (PR #1) 재구성**: `frontend/src/services/aiMatching.ts` 209줄을 NestJS로 어떻게 이식할지
5. **`dev-monorepo` 브랜치 인정**: 팀 main 흐름과 별개의 long-lived working branch로 인정받기

---

## 7. 명령어 reference

### 현재 브랜치 상태 확인

```bash
git fetch origin --prune
git branch -vv
# 로컬:
#   dev-monorepo                       → origin/dev-monorepo (= L-dragon-woo)
#   trial/merge-main-into-monorepo     → 본 trial branch
#   dev-vue3-prototype                 → (tracking lost, archived as archive/vue3-phase0)
#   main                               → origin/main (= upstream 팀 main)
```

### dev-monorepo로 돌아가기

```bash
git switch dev-monorepo
# Phase 1.Week 2 작업 계속
```

### upstream 변경 추적 (pull은 신중히)

```bash
git fetch origin --prune
git log --oneline dev-monorepo..origin/main  # 팀이 main에 새로 머지한 것
```

### trial 브랜치 폐기 (협상 후)

```bash
git switch dev-monorepo
git branch -D trial/merge-main-into-monorepo  # 로컬 삭제
git push origin --delete trial/merge-main-into-monorepo  # 원격 삭제
```

---

## 8. 변경 이력

| 버전 | 날짜 | 변경 |
|---|---|---|
| v1.0 | 2026-06-02 | upstream PR #1, PR #2 분석 + trial merge + remote 재구성 + Phase 2 로드맵 |
