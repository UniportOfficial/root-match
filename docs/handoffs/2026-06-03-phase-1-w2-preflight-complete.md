# Session Handoff — 2026-06-03 (Phase 1.W2 Plan + Pre-Flight 완료, Neon 게이트 대기)

다음 세션이 컨텍스트 없이 이어받을 수 있도록 정리한 문서.
**이번 세션 산출물**: housekeeping 1 commit + Phase 1.W2 상세 계획서(.sisyphus, local) + Pre-Flight scaffold 1 commit. **다음 작업**: 사용자가 Neon 프로젝트를 생성해 `apps/api/.env`를 채우면 Wave 1 (W2-1) 시작 가능.

---

## Quick Reference

```
저장소: /Users/uni-claw/dev/root-match
활성 브랜치: dev-monorepo (origin 대비 ahead 2)
기준 HEAD: aa99d30 chore(api): phase 1.W2 pre-flight (Prisma + Better Auth deps + scaffold)
직전 HEAD: a2e1e64 chore: phase 1.W2 housekeeping (redirect stubs + /health + design-mapping labels)
push 상태: 모두 로컬만, 미푸시 (사용자 정책)

런타임 요구: Node ≥ 22.13 (pnpm 11.3.0이 Node 20에서 ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite 발생)
              매 세션 첫 명령: nvm use 22

핵심 문서:
  - 본 핸드오프
  - .sisyphus/plans/phase-1-w2.md  v0.6  (1165 lines, gitignored, 살아있는 문서)
  - docs/plans/mvp-roadmap.md      v1.1  (§6.1 검토 결과 추가)
  - docs/specs/matching-endpoint-design-decision.md (옵션 C 잠정 Prisma model)
  - docs/specs/rootmatching-erd.md  (ERD 출처 + 채택 메모)
  - docs/specs/backend-design-mapping.md (정책 정렬 + dev-monorepo 라벨 보강 완료)
  - docs/specs/functional-spec.md   (§14 9 acceptance criteria)
  - docs/prd/rootmatching-prd.md    v0.4 §13 (Phase 1.W2 정의)

다음 작업: User Neon 셋업 (외부) → Wave 1 W2-1 (Prisma + pgvector + initial migration + /health/db)
```

---

## 세션 목표 (완료)

사용자 입력 흐름: `housekeeping` → `D (plan) → Neon 안내 → A (Pre-Flight 진입)`.

ULTRAWORK 모드로 진행하며 Oracle 8회 + Momus 2회 검증을 거쳐 모든 단계가 ACCEPT/VERIFIED로 closed.

---

## 완료된 작업 상세

### Stage 1: Housekeeping — commit `a2e1e64`

`docs/plans/mvp-roadmap.md` §6의 5개 housekeeping 항목 처리. 실측 결과 일부는 코드 변경 불필요로 종결.

| #   | 항목                                            | 결과                                                                             |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| ①   | `apps/web/src/app/client/*` redirect stubs 제거 | ✅ 4 파일 + 5 디렉토리 제거 (roadmap 표기 "5개"는 오기, 실제 4)                  |
| ②   | 미사용 shared types 정리                        | ⏸ no-op — explore 검증: 30 export 중 미사용 0개 (10개는 nested, 모두 유지)       |
| ③   | middleware `CLIENT_ONLY_PREFIXES` 확장          | ⏸ no-op — 4개 후보 모두 부적합 (`(common)` 그룹 or `/quotes` 라우트-디자인 모순) |
| ④   | `apps/api` Hello World → `/health`              | ✅ `GET /health` readiness payload (`{status, service, uptime, timestamp}`)      |
| ⑤   | `backend-design-mapping.md` 26 TODO 정리        | ✅ §2.2, §4, §3.10, §3.12.3 4개 위치에 "dev-monorepo 채택 보류" 라벨             |

추가 산출물:

- `mvp-roadmap.md` v1.1 — §6.1 "2026-06-03 housekeeping 검토 결과" 서브섹션 추가, §7 권장 순서 C 완료 표시, §9 changelog v1.1 row

검증: typecheck 3WS ✅ / lint 0err ✅ / format ✅ / API unit 25/25 ✅ / API e2e 2/2 ✅

### Stage 2: Phase 1.W2 상세 계획서 (option D) — `.sisyphus/plans/phase-1-w2.md` v0.6

`gitignored` (.sisyphus/ 전체) — local-only 살아있는 문서. **저장소에 커밋되지 않음**.

빌드 흐름:

1. librarian × 3 background 병렬 (Prisma+Neon+pgvector / Better Auth NestJS+Next15 / nestjs-zod+security stack)
2. plan agent foreground 1회 — 884 lines skeleton 생성
3. librarian 결과 fold-in → 1165 lines
4. **Momus 2 라운드**: v0.2 REJECT → v0.3 ACCEPT [OKAY] (session `ses_176c92eb8ffeWv5w56vCvrVjHV`)
5. **Oracle 8 라운드**: 반복 NOT VERIFIED → VERIFIED (최종 round 8, sessions `ses_176b95717ffe5br4AZ6M7PGKUI`, `ses_176ae909affe7y5V0MrmBSRljL`, `ses_176a89096ffeYpYTk7baOtLFrh`, `ses_176a353dbffeiyZ8TjtA5zepCS`)

구조 (16 sections + TODO + Execution Instructions):

- §1 TL;DR + §2 Critical Path Graph (mermaid) + §3 Task Dependency Graph + §4 Parallel Execution Graph
- §5 Step 0 Pre-Neon Pre-Flight checklist (11 sub-steps)
- §6 Neon Setup Checklist (10 사용자 액션 step)
- §7 W2-1 ~ W2-7 atomic decomposition (각: Goal · Inputs · Sub-steps · Verification gate · Risk · Pointers)
- §8 Option C 영속화 (Phase α anonymous after W2-1 + Phase β auth-gated after W2-5)
- §9 Acceptance criteria 매핑 (functional-spec §14 9개)
- §10 Test plan (22 신규 spec 예상)
- §11 Open Questions (Q1 ✅ RESOLVED dual-enum, Q9 ✅ 신규 BetterAuth CLI mismatch dry-run gate)
- §12 Effort estimate · §13 Commit strategy · §14 Glossary · §15 References · §16 Changelog (v0.1→v0.6)
- TODO + Execution Instructions (Wave 0 → 5)

**핵심 결정 사항 (v0.3 Momus 반영)**:

1. **Dual-enum design** — PRD §13의 단일 `User.role={CLIENT|FACTORY|OPERATOR}`은 두 axes를 혼합한 conflation. 분리:
   - `enum UserRole { admin, member, operator }` — 회사 내 역할 / 플랫폼 직원
   - `enum AccountType { client, factory }` — 비즈니스 측면
   - 소문자 (Better Auth `additionalFields.type` 배열 + shared zod 일관)
   - 레거시 `@rootmatching/shared` `UserRoleSchema=['client','factory','operator']`은 boundary mapper로 BC 유지

2. **Wave 시퀀싱** — W2-5는 W2-4 seed users 필요, W2-6은 Option C β 후 Swagger 반영 필요:
   - Wave 3a (W2-3 ∥ W2-4) → Wave 3b (W2-5) → Wave 4a (Option C β) → Wave 4b (W2-6) → Wave 5 (W2-7)

3. **Q9 BetterAuth CLI 호환성 dry-run gate** — `@better-auth/cli@1.6.13` 존재하지 않음 (CLI는 main과 별도 versioning, 최신 1.4.21). W2-2 sub-step 2 첫 행동: 임시 `auth.config.ts`로 dry-run, 호환 실패 시 hand-author 폴백.

**Critical path (§2)**: `Pre-Flight → Neon → W2-1 → W2-2 → W2-4 → W2-5 → Option C β → W2-6 → W2-7`

- mid: 0.5+0.25+2.5+6+2.5+2+0.5+2.5+2.5 = **19.25 engineer-days**
- low: 0.5+0.25+2+5+2+2+0.5+2+2 = **16.25 engineer-days**
- wall-clock (§12 friction-discounted): **≈ 13–17 days**

### Stage 3: Pre-Flight (A 진입) — commit `aa99d30`

11 files changed, +2630/-48. Plan §5 11-step 그대로 + 실제 환경 차이로 발생한 보정.

**Deps**:

- runtime (11): `@prisma/client@6.19.3` · `better-auth@1.6.13` · `nestjs-zod@5.4.0` · `zod@^3.23` · `@nestjs/throttler@6.5.0` · `helmet@8.2.0` · `nestjs-pino@4.6.1` · `pino-http@^10` · `cookie-parser@^1.4` · `@nestjs/swagger@^11` · `@nestjs/config@^4`
- dev (5): `prisma@6.19.3` (CLI) · `@types/cookie-parser` · `@better-auth/cli@latest` (실제 1.4.21 — Q9) · `tsx@^4` · `pino-pretty@^11`
- web bump: `@hookform/resolvers` 3.10 → ^5.4.0 (zod 3-vs-4 type collision 해결 — nestjs-zod 5.4의 `dependencies.zod=^4.1.12`이 zod@4를 호이스트해 @hookform 3.10이 zod@4 타입 읽음)

**Scaffold**:

- `apps/api/prisma/schema.prisma` — datasource (DATABASE_URL/DIRECT_URL env), pgvector extension, `previewFeatures=["postgresqlExtensions"]`, `PreFlightPlaceholder` model (W2-1에서 제거)
- `apps/api/prisma/seed.ts` — skeleton with TODO marker
- `apps/api/src/prisma/prisma.module.ts` — `@Global()` exporting `PrismaService`
- `apps/api/src/prisma/prisma.service.ts` — `extends PrismaClient`. **Offline 정책**: `DATABASE_URL` 없으면 prod에서 throw, dev/test에서 `Logger.warn` + return (e2e 테스트 호환)

**Wiring**:

- `apps/api/src/app.module.ts` — `imports: [PrismaModule, MatchingModule]`
- `apps/api/package.json` — `prisma:{generate,migrate:dev,migrate:reset,studio,seed}` scripts + `"prisma": { "seed": "tsx prisma/seed.ts" }`
- `apps/api/tsconfig.json` — `include` += `"prisma/**/*.ts"`
- `apps/api/.env.example` — Phase 1.W2 env vars 문서화 (DATABASE_URL pooled with `?sslmode=require&pgbouncer=true&connect_timeout=15` / DIRECT_URL direct / BETTER_AUTH_SECRET / BETTER_AUTH_URL=http://localhost:3001 / COOKIE_SECRET / LOG_LEVEL)
- `pnpm-workspace.yaml` — `onlyBuiltDependencies` += `@prisma/client`, `@prisma/engines`, `prisma`, `better-sqlite3` (`allowBuilds:` 플레이스홀더 블록 제거)

**검증 (Node 22.22.3 + pnpm 11.3.0)**:

- `pnpm -r typecheck` ✅ (3 workspaces)
- `pnpm lint` 0 errors (3 pre-existing `<img>` warnings, 무관)
- `pnpm format:check` ✅
- `pnpm --filter @rootmatching/api build` ✅
- `pnpm --filter @rootmatching/api exec prisma generate` ✅ (engines downloaded)
- `pnpm --filter @rootmatching/api test` ✅ 25/25
- `pnpm --filter @rootmatching/api test:e2e` ✅ 2/2 (`/health` 200 + `GET /` 404)
- pre-commit lint-staged hook 통과

---

## 다음 세션 시작 방법

### 0. 환경 확인 (매 세션 첫 명령)

```bash
cd /Users/uni-claw/dev/root-match

# Node 22 필수 (pnpm 11.3.0이 Node 20에서 깨짐)
nvm use 22                              # → Now using node v22.22.3
node --version                          # → v22.22.3

# pnpm 활성 확인
corepack enable
pnpm --version                          # → 11.3.0

# 현재 상태 확인
git status                              # → working tree clean (ahead 2)
git log --oneline -5
# aa99d30 chore(api): phase 1.W2 pre-flight (...)
# a2e1e64 chore: phase 1.W2 housekeeping (...)
# 51102f3 docs(plans): add MVP roadmap and backlog living document
# 5f98508 docs: document mock fallback policy and matching endpoint design decision
# a57c6c9 test(api): cover matching mock fallback and production safety (Oracle scenarios)

# 핵심 plan 재확인
cat .sisyphus/plans/phase-1-w2.md | head -100
ls -la .sisyphus/plans/                # → phase-1-w2.md (v0.6)
```

### 1. Pre-Flight gates 즉시 재실행 (변경 없으면 그대로 green)

```bash
pnpm -r typecheck
pnpm lint
pnpm format:check
pnpm --filter @rootmatching/api build
pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api test           # 25/25
pnpm --filter @rootmatching/api test:e2e       # 2/2
```

### 2. 사용자 게이트: Neon 셋업 (필수, 외부 작업)

`.sisyphus/plans/phase-1-w2.md` §6 10-step Checklist 그대로:

```text
1. https://console.neon.tech 로그인
2. 프로젝트 'rootmatching' 생성
   - Postgres 16
   - Region: ap-northeast-2 (Seoul) 권장, fallback ap-northeast-1 (Tokyo)
3. Settings → Auth → Neon Auth 비활성화 (Better Auth 자체 호스팅 사용)
4. 기본 브랜치 main 유지 (Neon이 shadow를 자동 처리)
5. POOLED connection string 복사 → apps/api/.env: DATABASE_URL=...
   형식: postgresql://USER:PASS@ep-XXX-pooler.REGION.aws.neon.tech/DB?sslmode=require&pgbouncer=true&connect_timeout=15
6. DIRECT connection string 복사 → DIRECT_URL=... (pgbouncer 제거)
   형식: postgresql://USER:PASS@ep-XXX.REGION.aws.neon.tech/DB?sslmode=require
7. SQL Editor(main) → CREATE EXTENSION IF NOT EXISTS vector;
   확인: SELECT extversion FROM pg_extension WHERE extname='vector';   (>= 0.7 expected)
8. 로컬에서:
     openssl rand -base64 32        # → BETTER_AUTH_SECRET=...
     BETTER_AUTH_URL=http://localhost:3001
     openssl rand -base64 32        # → COOKIE_SECRET=...
9. .env가 gitignored 확인: git check-ignore apps/api/.env
10. 최종 gate: pnpm --filter @rootmatching/api exec prisma db pull
    기대 출력: "Introspected 0 models"  (스키마는 아직 비어있음)
```

### 3. Wave 1 진입 — W2-1 (Prisma + pgvector + 첫 migration + /health/db)

§6.10 게이트 통과 후 plan §7.1의 12 sub-step 따름. 권장 위임:

```typescript
task(
  (category = 'deep'),
  (load_skills = ['git-master']),
  (run_in_background = false),
  (description = 'W2-1 Prisma + pgvector + initial migration + /health/db'),
  (prompt =
    'Execute Phase 1.W2-1 per .sisyphus/plans/phase-1-w2.md §7.1 (12 sub-steps).\n\n' +
    'TASK: ...\nEXPECTED OUTCOME: ...\nREQUIRED TOOLS: ...\n' +
    'MUST DO: 12 sub-steps in order; verification gate `curl -s http://localhost:3001/health/db | jq \'.db, .vectorExtension\'` returns "up" + "enabled"; atomic commit `feat(api): prisma 6 + pgvector + initial migration + /health/db`.\n' +
    'MUST NOT DO: skip schema-snapshot spec (sub-step 2-3 + 6); commit before verification; modify the Pre-Flight commit aa99d30.'),
)
```

### 4. Wave 2 (W2-2 Better Auth — Critical path 5–7d)

W2-1 commit 후 plan §7.2 따름. **첫 행동**: Q9 dry-run gate (§7.2.3 sub-step 2) — 임시 `auth.config.ts`로 `@better-auth/cli@1.4.21`가 `better-auth@1.6.13` 호환되는지 확인. 호환 실패 시 §7.1.3의 hand-authored 4 Prisma 모델 (User/Session/Account/Verification) 사용.

---

## 알려진 이슈 / 결정 필요 사항

### ✅ 결정됨 (이번 세션)

| 항목                       | 결정                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 UserRole vs AccountType | **Dual-enum**: `UserRole {admin,member,operator}` + `AccountType {client,factory}`. 레거시 shared zod는 boundary mapper(`apps/api/src/users/role.mapper.ts`)로 변환 |
| Q2 PK strategy             | `cuid()` (matching-endpoint-design-decision.md §4.1 잠정안 따름)                                                                                                    |
| Q9 BetterAuth CLI version  | `@better-auth/cli@latest` (1.4.21). W2-2 sub-step 2 첫 동작이 dry-run smoke gate                                                                                    |
| Wave 시퀀싱                | 3a (W2-3 ∥ W2-4) → 3b (W2-5) → 4a (Option C β) → 4b (W2-6) → 5 (W2-7)                                                                                               |
| Option C 위치              | Direct in `MatchingModule` (Q8). 새 `PersistenceModule` 분리는 W2-6 결합 압박 시점에 재고려                                                                         |
| Mock-user 비밀번호         | dev/CI 고정 `TempPass!2026` (Q7). seed.ts header에 명시                                                                                                             |

### 🟡 결정 필요 (Phase 1.W2 진행 중)

| Q   | 항목                                                                | deadline         |
| --- | ------------------------------------------------------------------- | ---------------- |
| Q3  | Neon CI branching 전략 (persistent vs ephemeral vs docker postgres) | W2-7 전          |
| Q4  | Throttler storage backend (in-memory vs Redis)                      | W2-6 sub-track a |
| Q5  | Better Auth `cookies.secure` (env-driven)                           | W2-2 sub-step 1  |
| Q6  | `additionalFields.role` enum 동기화 방법 (수동 mirror + assert)     | W2-2 sub-step 1  |

### 🔴 외부 의존성 (사용자가 해결)

1. **Neon 프로젝트 생성** + DATABASE_URL/DIRECT_URL/BETTER_AUTH_SECRET/COOKIE_SECRET 채우기 — §6 Checklist
2. **`/quotes` 라우트-디자인 모순** — `(client)` 그룹 안에 있으나 페이지 의도는 factory 측 (Link `/factory/requests/...`). 별도 design-fix PR로 그룹 이동 또는 명세 정정. Phase 2 진입 전 처리 권장 (mvp-roadmap §6.1.3)
3. **모두싸인/이폼사인 contract** + **토스페이먼츠 KYC** (Phase 3+4 진입 전)

### 무해한 warning (현 시점 무시 가능)

1. **pnpm `ERR_PNPM_IGNORED_BUILDS`** — `@nestjs/core`, `@prisma/client`, `@prisma/engines`, `prisma`, `sharp` 등의 postinstall 스크립트가 ignored로 표시되지만, Prisma engines는 첫 `prisma generate` 실행 시 lazy-download 되어 실제 동작에 영향 없음. `pnpm-workspace.yaml` `onlyBuiltDependencies` 등록은 이미 했으나 pnpm 11.3.0이 일부 케이스 여전히 warn.
2. **lint warning 3개** (`<img>` LCP) — Phase 0 잔재, Phase 2 UI 작업 시 처리 권장.
3. **2 Prisma client 버전 공존** (5.22.0 transitive via @better-auth/cli@1.4.21 + 6.19.3 direct dep) — 실 runtime은 6.19.3만 사용. Q9 dry-run에서 영향 확인.
4. **Next.js plugin warning** (`Pages directory cannot be found`) — App Router라 무해. handoff 2026-05-26 동일.

---

## 핵심 파일 인벤토리

### 코드 (commit aa99d30로 추가됨)

- `apps/api/prisma/schema.prisma` (placeholder + pgvector)
- `apps/api/prisma/seed.ts` (skeleton)
- `apps/api/src/prisma/prisma.module.ts` (Global)
- `apps/api/src/prisma/prisma.service.ts` (offline-tolerant)

### 문서 (커밋된 living docs)

- `docs/plans/mvp-roadmap.md` v1.1 — Single source of truth for MVP backlog
- `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md` — 본 문서
- `docs/handoffs/2026-05-26-phase-1-week-1-complete.md` — Phase 1.W1 완료 핸드오프 (이전 세션 reference)
- `docs/specs/matching-endpoint-design-decision.md` — 옵션 C 잠정 Prisma model
- `docs/specs/backend-design-mapping.md` — dev-monorepo 정책 라벨 적용됨
- `docs/specs/rootmatching-erd.md` — Spring/MySQL 출처 + Postgres/Prisma 채택 메모
- `docs/specs/functional-spec.md` — 27 routes + §14 9 acceptance criteria
- `docs/prd/rootmatching-prd.md` v0.4 — §13 Phase 1.W2 정의

### 로컬 전용 (gitignored .sisyphus/)

- `.sisyphus/plans/phase-1-w2.md` v0.6 — Phase 1.W2 상세 계획서 (Momus ACCEPT + Oracle VERIFIED)
- `.sisyphus/plans/remaining-pages-from-functional-spec.md` — 이전 세션 산출물

---

## 환경 정보

```
OS: macOS (darwin)
Node: v22.22.3 (nvm 관리, .nvm/versions/node/v22.22.3) — 필수 ≥ 22.13
pnpm: 11.3.0 (corepack)
Git user: 기존 setup 그대로
저장소: /Users/uni-claw/dev/root-match
remote: origin = git@github.com:... (push 정책: 명시 요청 시에만)
```

### 빌드 시스템 메모

- pnpm workspaces, `verifyDepsBeforeRun: never`
- shared 패키지는 CJS dist (`packages/shared/dist`) — jest 호환 (commit `702e38d`)
- ESLint 9 flat config (root), Prettier 3, Husky 9 + lint-staged 15
- TypeScript 5.7+, target ES2023
- web: Next.js 15 (App Router), React 19, Tailwind 3.4
- api: NestJS 11, Jest 30

### Commit 메시지 컨벤션

```
feat(scope): summary
fix(scope): summary
chore(scope): summary
docs(scope): summary
test(scope): summary
```

Body는 bullet list 가능. 한국어/영어 혼용 OK. 직전 세 commit 예시 그대로 참고.

### 검증 명령 빠른 참조

```bash
# 매 변경 후
pnpm -r typecheck && pnpm lint && pnpm format:check

# 풀 빌드 + 테스트
pnpm -r run build && pnpm -r test && pnpm --filter @rootmatching/api test:e2e

# Prisma (W2-1 이후)
pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api exec prisma migrate dev --name <name>
pnpm --filter @rootmatching/api exec prisma db pull         # Neon 연결 확인
pnpm --filter @rootmatching/api exec prisma studio          # GUI

# 개발 서버
pnpm dev   # web :3000 + api :3001 병렬
```

---

## 검증 흐름 메모 (이번 세션 lessons learned)

### Oracle 검증의 정확성

Plan 작성 후 Oracle 8 round를 거치며 다음 부류의 issue들이 매번 새로 발견됨:

1. **stale text** — Momus가 결정한 새 정책이 본문에 반영됐어도 다른 섹션에 오래된 문구가 남아 모순 생성
2. **arithmetic** — `~18` 같은 어림수 주장이 실제 합산 (`19.25`)과 다름
3. **claim vs reality** — "moved" 라고 적었는데 실제로는 "duplicated" 한 경우 (line 155 dup-dep)
4. **regex/grep self-reference** — 변경 history를 changelog에 적으면서 prohibited 패턴 자체를 인용해 regex가 hit

**교훈**: 다음 세션에서 plan 수정 시 (a) 전체 본문에서 변경된 정책 지칭 단어로 grep, (b) 산술/수치 주장은 명시적 derive, (c) "moved" 등의 동사가 실제 cleanup을 의미하는지 재확인, (d) changelog에서 prohibited 패턴 인용 시 paraphrase.

### Momus + Oracle 분리 역할

- **Momus** = plan의 _clarity/verifiability/completeness_ — 새 plan은 Momus로 일찍 검증
- **Oracle** = artifact의 _truth/consistency_ — claim과 실제가 일치하는지 ruthless 검증

Phase 1.W2 진행 중 새로운 atomic task 분해를 plan에 추가할 때마다 Momus → Oracle 순서로 검증 권장.

---

## 다음 세션 첫 메시지 후보

사용자가 Neon 셋업 완료 후 다음과 같이 시작 가능:

> "Neon 프로젝트 만들고 .env 채웠다. prisma db pull도 Introspected 0 models 떴어. 이제 W2-1 시작해줘."

또는 더 명시적으로:

> "Neon 게이트 통과. .sisyphus/plans/phase-1-w2.md §7.1 W2-1 12 sub-step 실행해줘. 옵션 C Phase α는 W2-1 끝나면 동시에 분기."

---

## 참고 문서

| 파일                                                                   | 역할                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `docs/handoffs/2026-05-26-phase-1-week-1-complete.md`                  | Phase 1.W1 완료 핸드오프. 도구 인프라/모노레포 셋업 reference           |
| `docs/handoffs/2026-06-02-backend-api-branch-evaluation.md`            | feature/backend-api 브랜치 평가 (ERD/contract/design-mapping 채택 근거) |
| `docs/handoffs/2026-06-02-remaining-pages-functional-spec-complete.md` | functional-spec 잔여 페이지 작업 완료                                   |
| `docs/handoffs/2026-06-02-upstream-divergence-trial-merge.md`          | upstream divergence 분석                                                |

---

## 변경 이력 (이 핸드오프 문서)

| 버전 | 날짜       | 변경                                                                                                                  |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-06-03 | Phase 1.W2 plan + Pre-Flight 완료, Neon 게이트 대기 세션 정리 (housekeeping a2e1e64 + plan v0.6 + pre-flight aa99d30) |
