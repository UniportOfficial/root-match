# Session Handoff — 2026-06-03 (W2-1 완료, W2-2 진입 준비 완료)

다음 세션이 컨텍스트 없이 이어받을 수 있도록 정리한 entry-point 문서.

**이번 세션 산출물**: Q10 BLOCKER fix commit + Momus v0.7-delta re-review + §A.2 drift check + Neon 셋업 + .env 작성 + pgvector 설치 + W2-1 §A.1 위임 + 검증 (2 commits: `13e90c1` Q10 fix, `467b73f` W2-1).
**다음 작업**:

1. (선택) plan §A.2 patches + §16 footer 갱신 — gitignored, doc-only, doc-only commit 1개
2. Wave 2 W2-2 진입 (§A.2 prompt verbatim 위임) — critical path 5-7 engineer-day

---

## Quick Reference

```text
저장소: /Users/uni-claw/dev/root-match
활성 브랜치: dev-monorepo (모두 local-only commits, push 정책: 명시 요청 시에만)
HEAD: <handoff commit, 본 문서를 포함하는 새 docs(handoffs) commit>
      이전 HEAD chain: 467b73f → 13e90c1 → 6ef6404 → f2faf93 → 84ffa8a → aa99d30 → a2e1e64
push 상태: origin/dev-monorepo 대비 8 commits ahead (handoff commit 포함)

런타임 요구: Node ≥ 22.13 (pnpm 11.3.0이 Node 20에서 ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite)
            매 세션 첫 명령: `nvm use 22` + commit 시 `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` (husky pre-commit hook이 fresh subshell에서 Node 잡을 때 필요)

핵심 문서:
  - 본 핸드오프 (entry point, W2-1 closure + W2-2 ready)
  - docs/handoffs/2026-06-03-scenario-b-complete-w2-1-ready.md (이전 entry-point)
  - docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md (Pre-Flight + Scenario B addendum 상세)
  - .sisyphus/plans/phase-1-w2.md v0.7 (gitignored, 살아있는 문서)
    └ Q1-Q11 결정 상태; §11.1 detailed resolutions; §A.1/§A.2 delegation prompts
  - docs/plans/mvp-roadmap.md v1.1
  - docs/specs/{matching-endpoint-design-decision, backend-design-mapping, rootmatching-erd, functional-spec}.md
  - docs/prd/rootmatching-prd.md v0.4 §13

다음 작업 순서:
  1. (선택) plan §A.2 patches + §16 footer 갱신 — ~10분, doc-only
  2. Wave 2 W2-2 진입 (§A.2 prompt) — 30-60분 agent time / 5-7 engineer-day estimate
```

---

## 세션 목표 (완료)

사용자 입력: 이전 세션 entry-point 핸드오프 검증 → "Q10 fix + Momus + drift check 묶음" → Neon 셋업 → W2-1 위임.

ULTRAWORK 모드로 진행, Architectural 검토 2회 (Supabase pivot, NextAuth+Supabase pivot) 후 모두 **Neon + Better Auth 유지** 결정.

---

## 완료된 작업 요약

### Stage 1: Q10 BLOCKER fix (commit `13e90c1`)

| 항목                                                      | 결과                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml:42` `node-version: 20 → 22`     | ✅                                                                                  |
| `package.json:8` `engines.node ">=20.10.0" → ">=22.13.0"` | ✅                                                                                  |
| `pnpm -r typecheck`                                       | ✅ Done                                                                             |
| `pnpm lint`                                               | ✅ 0 errors, 3 pre-existing img warnings                                            |
| `pnpm format:check`                                       | ✅ clean                                                                            |
| 단독 commit                                               | ✅ `13e90c1 chore(ci): bump CI + repo engines to node 22 (pnpm 11.3.0 requirement)` |

🟡 **부수 발견**: husky pre-commit hook (`pnpm lint-staged`)이 fresh subshell에서 nvm 환경을 inherit 못함 → 첫 commit attempt가 Node v20.20.2로 fall-back 되어 실패. PATH에 v22 bin 직접 prepend (`export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"`) 후 재시도 성공. **앞으로 commit 명령 모두 동일 prefix 필요**.

### Stage 2: Momus v0.7-delta re-review (background)

- Task ID: `bg_326d71ea`, session: `ses_1738f515affePoepgbPew1Dsq6`, duration 1m 16s
- **Verdict: [OKAY]**
- Quote: "The plan is executable: referenced repository files and docs exist, the core implementation tasks have clear starting points, and each task includes concrete QA commands with expected results. The only notable drift is that the Node 22 CI/engine fix appears already applied, so that W2-7 prerequisite becomes a no-op rather than a blocker."
- 본 세션은 plan v0.7 §16 footer 갱신 미수행 (gitignored 영향 + W2-2 진입 우선) — 다음 plan-edit turn에 처리 권장

### Stage 3: §A.2 drift check (13 ↔ 15 mapping)

§A.2 EXPECTED OUTCOME 13 items vs §7.2.3 15 sub-steps:

| Gap | 설명                                                                                              | Severity   | 권장 처리                                                                                      |
| --- | ------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| A   | §7.2.3 sub-step 1이 `prisma.client.ts` 파일 생성을 enumerate 안 함, §A.2 #1이 prerequisite로 명시 | low        | §A.2가 strictly more explicit. No-op                                                           |
| B   | §A.2 #12 `auth.config.spec.ts` drift-guard regression test이 §7.2.3에 없음                        | low        | §A.2가 Q6 강화. No-op                                                                          |
| C   | §7.2.3 sub-step 13 (`MIGRATION.md` for mock-user migration)이 §A.2에 빠짐                         | **medium** | 결정 필요: Option 1 (§A.2 #14 추가) vs Option 2 (W2-2.5 follow-up backlog 명시 분리, **권장**) |

§A.1 ↔ §7.1.3 mapping: §A.1 intro paragraph에 5↔12 mapping 자가 명시됨. **Zero drift**.

### Stage 4: Neon 셋업 + .env + smoke

| Step                                                                             | Result                                                                                                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Neon 프로젝트 `rootmatching` (Postgres 18.4, us-east-2, branch `production`)     | 사용자 처리                                                                                                                                |
| POOLED connection string 수신                                                    | `postgresql://neondb_owner:***@ep-misty-violet-ajwbprp0-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| DIRECT_URL 도출                                                                  | POOLED에서 `-pooler` token 제거 — Neon documented convention                                                                               |
| openssl rand -base64 32 × 2 → `BETTER_AUTH_SECRET` + `COOKIE_SECRET`             | 44 bytes each                                                                                                                              |
| `apps/api/.env` 작성 (25 lines, 1185 bytes, gitignored 검증)                     | ✅                                                                                                                                         |
| `git check-ignore apps/api/.env`                                                 | `.gitignore:37:.env apps/api/.env` ✅                                                                                                      |
| `prisma db pull --print` (non-destructive smoke)                                 | connectivity ✅                                                                                                                            |
| pgvector 설치 (`CREATE EXTENSION IF NOT EXISTS vector;` via `prisma db execute`) | 0.8.1 ✅                                                                                                                                   |
| Neon 샘플 테이블 `playing_with_neon` 제거                                        | ✅                                                                                                                                         |
| Neon Auth OFF 검증 (no `neon_auth.*` schemas)                                    | ✅                                                                                                                                         |

🟡 **메모**:

- Region us-east-2 (Ohio) ≠ handoff §3 권장 ap-northeast-2 (Tokyo). 한국 latency ~180ms vs ~50ms. **dev OK, prod 이전 시 Neon 재생성 또는 region 이동 고려**
- Branch `production` (Neon 2024+ default) ≠ handoff §3 step 4 "main 유지" 언급. **무해, 다음 handoff revision에서 step 4 문구 갱신 권장**

### Stage 5: W2-1 §A.1 위임 (commit `467b73f`)

- Task ID: `bg_21c54992`, session: `ses_173791e17ffenzxIyytHSqHuNd`, agent: Sisyphus-Junior (`deep`), duration 11m 3s
- **모든 12 sub-steps ✓ + 7 verification gates ✓**
- Commit: `467b73f feat(api): prisma 6 + pgvector + initial migration + /health/db`
- §7.1.4 verification gate: `curl -s http://localhost:3001/health/db | jq '.db, .vectorExtension'` → `"up"` + `"enabled"` (latencyMs 839, timestamp 2026-06-03T08:18:00.742Z)

#### 산출물 인벤토리 (11 files: +623 / -24)

| Path                                                                      | +/-                                                             |
| ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                           | +213 / -22 (PreFlightPlaceholder 제거, 9 models + 4 enums 추가) |
| `apps/api/prisma/migrations/20260603000000_init_phase_1_w2/migration.sql` | +207 (CREATE EXTENSION vector + 4 enums + 9 tables)             |
| `apps/api/src/health/health.controller.ts`                                | +43 (GET /health/db)                                            |
| `apps/api/src/health/health.module.ts`                                    | +7                                                              |
| `apps/api/src/health/health.controller.spec.ts`                           | +64 (unit: up/down branches via mock)                           |
| `apps/api/src/prisma/prisma.service.ts`                                   | +28 / -10 (softHealthCheck + enableShutdownHooks)               |
| `apps/api/src/app.module.ts`                                              | +3 / -1 (HealthModule 등록)                                     |
| `apps/api/test/health-db.e2e-spec.ts`                                     | +35                                                             |
| `apps/api/test/schema.snapshot.spec.ts`                                   | +28 (schema drift guard)                                        |
| `apps/api/package.json`                                                   | +7 / -2 (jest rootDir/roots: snapshot spec 픽업)                |
| `README.md`                                                               | +1 (API endpoints table)                                        |

#### DB state 직접 검증 (Prisma `$queryRaw`)

```text
_prisma_migrations:  [{migration_name:"20260603000000_init_phase_1_w2", applied:true, started=finished, rolled_back_at:null}]
public tables (10):  _prisma_migrations + account + company + factory_embeddings + match_recommendations + profile + quote_requests + session + user + verification
enums (4):           AccountType + MatchingSource + QuoteRequestStatus + UserRole
pgvector:            0.8.1 (extname='vector')
embedding column:    factory_embeddings.embedding = USER-DEFINED vector (1536 nullable)
soft health mimic:   {db:"up", vectorExtension:"enabled", latencyMs:389}
```

#### 🟡 W2-1 deviation (plan v0.8 changelog 후보)

§A.1 [MUST DO] line 1467 `Use prisma migrate dev` vs 실제 사용한 `prisma migrate diff --from-empty --to-schema-datamodel + prisma db execute + prisma migrate resolve --applied`.

**원인**: 우리가 직전 Neon 셋업 단계에서 `CREATE EXTENSION IF NOT EXISTS vector;`를 `prisma db execute`로 미리 실행함. migration history 없는 상태에서 `migrate dev`가 이 extension을 drift로 인식 → reset 요구. §A.1 [MUST NOT DO] line 1479의 `prisma migrate reset` 금지와 충돌.

**해결**: documented Prisma "baseline existing DB" 패턴. `migrate diff`로 schema → SQL 추출 → `db execute`로 DB에 적용 → `migrate resolve --applied`로 history 마킹.

**안전성 검증**: `_prisma_migrations` row가 정상 등록됨 (applied:true, finished_at set). 다음 `prisma migrate dev` (W2-2의 `better_auth_additional_fields` migration)는 drift 없이 정상 작동 예상.

**plan v0.8 권장 changelog row**: §11.1에 "baseline-existing-DB fallback" pattern 명시 + §A.1 [MUST DO] 조건부 swap rule 추가 ("if `CREATE EXTENSION` was pre-applied to DB before migration history exists, use diff+execute+resolve").

---

## 다음 세션 시작 방법

### 0. 환경 확인 (매 세션 첫 명령)

```bash
cd /Users/uni-claw/dev/root-match

# Node 22 필수
nvm use 22
node --version                          # → v22.22.3

# pnpm 활성
corepack enable
pnpm --version                          # → 11.3.0

# 현재 상태
git status                              # → working tree clean
git log --oneline -8
# <handoff>  docs(handoffs): w2-1 complete, w2-2 ready (...)
# 467b73f    feat(api): prisma 6 + pgvector + initial migration + /health/db
# 13e90c1    chore(ci): bump CI + repo engines to node 22 (...)
# 6ef6404    docs(handoffs): scenario B complete, W2-1 ready (...)
# f2faf93    docs(handoffs): scenario B closure addendum (...)
# 84ffa8a    docs(handoffs): phase 1.W2 pre-flight complete (...)
# aa99d30    chore(api): phase 1.W2 pre-flight (...)
# a2e1e64    chore: phase 1.W2 housekeeping (...)

# plan 재확인
head -30 .sisyphus/plans/phase-1-w2.md
```

### 1. W2-1 sanity 재검증 (변경 없으면 그대로 green)

```bash
# 7 gates
pnpm -r typecheck
pnpm lint                                              # 0 errors / 3 pre-existing img warnings
pnpm format:check
pnpm --filter @rootmatching/api build
pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api test                   # 29 tests (5 suites)
pnpm --filter @rootmatching/api test:e2e               # 3 tests (2 suites)

# §7.1.4 live smoke (dev server 띄우고)
pnpm --filter @rootmatching/api start &
sleep 5 && curl -s http://localhost:3001/health/db | jq '.db, .vectorExtension'
# 기대: "up" + "enabled"

# Direct DB state
cd apps/api && node --env-file=.env -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRaw\`SELECT count(*) FROM information_schema.tables WHERE table_schema='public'\`
  .then(r => console.log('public tables:', r))
  .finally(() => p.\$disconnect());"
# 기대: 10 (9 schema models + _prisma_migrations)
```

### 2. (선택, 권장) plan §A.2 patches + §16 Momus footer 갱신

`.sisyphus/plans/phase-1-w2.md`는 gitignored이라 commit 안 됨. 다만 살아있는 reference doc이므로 갱신 가치 있음:

| Change                                                               | Where                            | Reason                                                                                     |
| -------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| §A.2 intro에 13↔15 mapping clarifying note 추가                      | §A.2 시작 직후 (line 1497 부근)  | §A.1과 동일 패턴, drift findings 명시화                                                    |
| Gap C 결정 — Option 2 명시 (MIGRATION.md를 W2-2.5 follow-up backlog) | §11.1 또는 §A.2 [MUST NOT DO] 끝 | medium gap 해소                                                                            |
| §16 footer Momus v0.7-delta verdict 라운드 인용                      | §16 끝 (line 1593-1595)          | "Momus v0.7-delta re-review pending" 문구를 `ses_1738f515affePoepgbPew1Dsq6 [OKAY]`로 교체 |
| §11.1 "baseline-existing-DB fallback" pattern 추가                   | §11.1 Q3 또는 새 row             | W2-1 deviation을 plan에 normalize                                                          |
| §A.1 [MUST DO] conditional swap rule 추가                            | §A.1 prompt 안 (line ~1467)      | "if CREATE EXTENSION pre-applied → use diff+execute+resolve"                               |

처리 후 단독 commit (또는 W2-2 commit 안에 fold, 분리 권장):

```bash
git add docs/handoffs/  # 만약 본 handoff doc도 함께 갱신했다면
git commit -m "docs(plans): v0.8 — Momus v0.7-delta [OKAY], §A.2 Gap C resolved, baseline-DB fallback"
# 단, plan은 gitignored라 actual content는 docs/handoffs/에 변경 반영 필요
```

### 3. W2-2 §A.2 prompt 위임

`.sisyphus/plans/phase-1-w2.md` §A.2 (line 1496-1591)의 `prompt="""..."""` 본문을 verbatim copy.

권장 ORCHESTRATOR ADDENDUM 추가 (W2-1 위임 시 사용한 패턴과 동일):

```text
[ORCHESTRATOR ADDENDUM — current state at delegation time (not in plan §A.2, factual update)]
- HEAD at delegation: 467b73f (W2-1) + <handoff commit hash> (W2-1 handoff). W2-1의 모든 7 gates pass, /health/db {"up","enabled"}, _prisma_migrations history 1개 (init_phase_1_w2 applied).
- Branch chain: <handoff> → 467b73f → 13e90c1 → 6ef6404 → f2faf93 → 84ffa8a → aa99d30 → a2e1e64. Working tree clean. 8 commits ahead of origin/dev-monorepo.
- Schema state (Prisma 6.19.3, 9 models + 4 enums):
  * Better Auth (4): User, Session, Account, Verification — hand-authored from §7.1.3 librarian snippet
  * Domain (4): Company, Profile, QuoteRequest, MatchRecommendation
  * pgvector (1): FactoryEmbedding (embedding vector(1536) nullable)
  * Enums: UserRole {admin,member,operator}, AccountType {client,factory}, QuoteRequestStatus, MatchingSource
- apps/api/.env exists and valid (verified by W2-1 prisma migrate + soft health):
  * DATABASE_URL = Neon POOLED (us-east-2)
  * DIRECT_URL = Neon DIRECT (POOLED minus -pooler)
  * BETTER_AUTH_SECRET / COOKIE_SECRET = 44-byte base64 each
  * BETTER_AUTH_URL = http://localhost:3001
- Neon DB state at delegation:
  * Postgres 18.4 / us-east-2 / branch production
  * pgvector 0.8.1 installed
  * 10 public tables (9 schema models + _prisma_migrations)
  * 4 enums registered
  * Neon Auth OFF (no neon_auth.* schemas)
- Q9 dry-run gate is the FIRST action (§A.2 EXPECTED OUTCOME #3). Pre-Flight aa99d30 installed @better-auth/cli@1.4.21 + better-auth@1.6.13. Version mismatch is the dry-run's subject.
- Husky pre-commit hook requires Node 22 in PATH for the subshell. Use: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` BEFORE every `git commit`.
- W2-1 deviation pattern for migrations (baseline-existing-DB): `prisma migrate diff + db execute + migrate resolve --applied` — NOT needed for W2-2 because migration history is now established. Normal `prisma migrate dev --name better_auth_additional_fields` should work.
- Plan §A.2 Gap C (MIGRATION.md): Option 2 권장 — follow-up backlog로 분리, W2-2 atomic commit scope에서 제외. 단, §7.2.3 sub-step 13 자체는 §A.2의 [TASK] line 1506 "per §7.2 (15 sub-steps)" 명시로 인해 agent가 따를 수 있음 — 만약 agent가 MIGRATION.md를 만들기 시작하면 stop + 별도 W2-2.5 backlog로 분리 가이드.
- Plan §A.2 Gaps A, B: §A.2가 strictly more explicit/strict than §7.2.3, no action needed.
- Region us-east-2 + Neon branch `production`: documented in handoff, no immediate action.

[CONCISE REPORT FORMAT — same 8-item structure as W2-1]
1. Final commit hash + subject
2. §7.2.3 15 sub-steps matrix (✓/✗ per step)
3. §7.2.4 verification gate (curl /api/auth/sign-up/email Set-Cookie header verbatim)
4. 7 verification gates pass/fail
5. Files modified (path + lines added/removed)
6. Q9 dry-run outcome (CLI 1.4.21 emitted schema match/no-match with 1.6.13 hand-authored snippet)
7. Deviations + justification
8. Open questions / follow-ups
```

위 `[ORCHESTRATOR ADDENDUM]`을 §A.2 prompt body 끝에 append 후:

```python
task(
  category="ultrabrain",
  load_skills=["git-master", "playwright"],
  run_in_background=True,   # 30-60min 예상, timeout 회피
  description="W2-2 Better Auth 1.6 integration + cookie sync + remove mock auth",
  prompt=<§A.2 prompt body + ORCHESTRATOR ADDENDUM>
)
```

### 4. W2-2 결과 검증

W2-2 완료 system-reminder 도착 시:

```bash
# Q9 dry-run 결과 확인 (commit body cited)
git show HEAD --stat
git log --format='%B' -1

# 9 verification gates (W2-2 = W2-1's 7 + auth.e2e-spec + Playwright smoke)
pnpm -r typecheck && pnpm lint && pnpm format:check && pnpm --filter @rootmatching/api build && pnpm --filter @rootmatching/api exec prisma generate && pnpm --filter @rootmatching/api test && pnpm --filter @rootmatching/api test:e2e && pnpm --filter @rootmatching/web exec playwright test

# §7.2.4 live verification
pnpm dev &
sleep 8
curl -i -X POST http://localhost:3001/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@rootmatching.dev","password":"TempPass!2026","name":"Tester","accountType":"client","companyName":"Test","phone":"010-0000-0000","agreeTerms":true}'
# 기대: HTTP 200 + Set-Cookie: better-auth.session_token=...; Path=/; HttpOnly; SameSite=Lax (NO Secure attribute in dev — Q5)

# Drift guard regression (Q6)
pnpm --filter @rootmatching/api test -- auth.config.spec.ts
```

### 5. Wave 3+ 진입 (W2-3 onwards)

W2-2 commit + 검증 후, plan v0.7 §11.1 wave 시퀀싱 따라:

```text
Wave 3a (병렬): W2-3 (nestjs-zod DTO) ∥ W2-4 (Prisma seed)
Wave 3b:        W2-5 (Users + Companies modules behind BetterAuthGuard)
Wave 4a:        Option C β (matching endpoint Prisma 모델 도입)
Wave 4b:        W2-6 (Throttler + helmet + pino + Swagger)
Wave 5:         W2-7 (Neon CI branching + E2E gate)
```

각 wave마다 plan §A에 delegation prompt 추가 권장 (§A.1, §A.2 패턴 동일).

---

## 모든 결정사항 / 알려진 이슈

### ✅ Q1-Q10 RESOLVED + 적용됨

| Q                          | 결정                                                                                                 | 본 세션 적용                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Q1 UserRole vs AccountType | Dual-enum: `UserRole {admin,member,operator}` + `AccountType {client,factory}` (lowercase)           | ✅ W2-1 migration에 반영              |
| Q2 PK strategy             | `cuid()`                                                                                             | ✅ W2-1 migration에 반영              |
| Q3 Neon CI branching       | 하이브리드 — ephemeral Neon branch + Docker pgvector services block                                  | W2-7에서 적용                         |
| Q4 Throttler storage       | In-memory MVP + explicit Redis migration trigger before horizontal scale                             | W2-6에서 적용                         |
| Q5 Better Auth cookies     | `BETTER_AUTH_URL.startsWith('https://')` 기반 + prod `crossSubDomainCookies`                         | W2-2에서 적용                         |
| Q6 additionalFields enum   | Prisma SoT + exported `assertSameSet()` boot-time guard + accountType `validator.input: z.enum(...)` | W2-2에서 적용                         |
| Q7 Mock-user 비밀번호      | dev/CI 고정 `TempPass!2026`                                                                          | W2-4 + W2-2 Playwright smoke에서 적용 |
| Q8 Where Option C lives    | Direct in `MatchingModule`                                                                           | Wave 4a에서 적용                      |
| Q9 Better Auth CLI version | `@better-auth/cli@latest` (1.4.21) + W2-2 sub-step 2 dry-run smoke gate                              | W2-2 first action                     |
| Q10 CI Node 22 mismatch    | ci.yml node-version: 22 + package.json engines.node >=22.13.0                                        | ✅ commit `13e90c1`                   |

### 🟡 Deferred (non-blocking)

| 항목                                             | 처리 시점                                             |
| ------------------------------------------------ | ----------------------------------------------------- |
| Q11 `prisma.config.ts` migration                 | Prisma 7 upgrade 시 함께                              |
| §A.2 Gap C MIGRATION.md                          | W2-2.5 follow-up backlog (✅ v0.8 [MUST NOT DO] 명시) |
| Plan §11.1 baseline-existing-DB fallback pattern | ✅ v0.8 applied (handoff v1.1)                        |
| Plan §16 footer Momus v0.7-delta verdict 인용    | ✅ v0.8 applied (handoff v1.1)                        |

### 🔴 외부 의존성 (사용자가 해결)

1. **`(client)/quotes` 라우트-디자인 모순** (Phase 2 진입 전 권장) — mvp-roadmap §6.1.3
2. **모두싸인/이폼사인 contract + 토스페이먼츠 KYC** (Phase 3+4 진입 전)
3. **프로덕션 도메인 확정** — `crossSubDomainCookies.domain: 'rootmatching.com'`은 placeholder. W2-2 production deploy 전 실제 도메인으로 교체.
4. **Neon region 결정** — 현재 us-east-2. prod 이전 시 ap-northeast-2 (Tokyo)로 재생성/마이그레이션 권장.

### 📋 Documented gaps (handoff 명시 → 처리 상태)

1. Pre-edit TDD acceptance-criteria list 권장 (Oracle round 1 9 drift fixes 예방용) — W2-2 onwards (여전히 권장; W2-2 위임 prompt에 ADDENDUM으로 반영)
2. ✅ Momus v0.7-delta re-review verdict [OKAY] — plan §16 footer 갱신 완료 (v0.8, handoff v1.1)
3. ✅ §A.2 Gap C MIGRATION.md — Option 2 적용 (W2-2.5 follow-up backlog로 §A.2 [MUST NOT DO]에 명시)
4. ✅ §A.1 baseline-existing-DB pattern — plan §11.1 새 sub-section + §A.1 CONDITIONAL SWAP RULE로 정상화

### 무해한 warning (현 시점 무시 가능)

1. **pnpm `ERR_PNPM_IGNORED_BUILDS`** — Prisma engines lazy-download, 동작 영향 없음
2. **lint warning 3개** (`<img>` LCP) — Phase 0 잔재, Phase 2 UI 작업 시 처리 권장
3. **2 Prisma client 버전 공존** (5.22.0 transitive via @better-auth/cli@1.4.21 + 6.19.3 direct) — 실 runtime은 6.19.3, W2-2의 Q9 dry-run에서 영향 확인
4. **Next.js plugin warning** (`Pages directory cannot be found`) — App Router라 무해
5. **Prisma `package.json#prisma` deprecation** — Q11 RESOLVED-DEFERRED

---

## 핵심 파일 인벤토리

### 코드 (committed; W2-1 `467b73f` 추가)

- `apps/api/prisma/schema.prisma` (9 models + 4 enums, Prisma 6 + postgresqlExtensions + pgvector)
- `apps/api/prisma/migrations/20260603000000_init_phase_1_w2/migration.sql` (initial migration)
- `apps/api/prisma/migrations/migration_lock.toml` (Prisma lock)
- `apps/api/src/health/health.controller.ts` (GET /health/db)
- `apps/api/src/health/health.module.ts`
- `apps/api/src/health/health.controller.spec.ts` (unit, mocked PrismaService)
- `apps/api/src/prisma/prisma.service.ts` (softHealthCheck + enableShutdownHooks)
- `apps/api/test/health-db.e2e-spec.ts` (e2e against real DB)
- `apps/api/test/schema.snapshot.spec.ts` (schema drift guard)
- `apps/api/package.json` (jest rootDir/roots adjusted)

### 코드 (committed; Pre-Flight `aa99d30`에서 추가, W2-1에서 그대로 활용)

- `apps/api/prisma/seed.ts` (skeleton) — W2-4에서 9 mock fixtures 시드
- `apps/api/src/prisma/prisma.module.ts` (`@Global()` exporting `PrismaService`)

### 코드 (committed; Q10 fix `13e90c1`)

- `.github/workflows/ci.yml` (line 42: `node-version: 22`)
- `package.json` (line 8: `engines.node: ">=22.13.0"`)

### 문서 (committed; living)

- **`docs/handoffs/2026-06-03-w2-1-complete-w2-2-ready.md` — 본 핸드오프 (entry point)**
- `docs/handoffs/2026-06-03-scenario-b-complete-w2-1-ready.md` — 이전 entry-point (W2-1 진입 전)
- `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md` — Pre-Flight + Scenario B addendum (audit trail 상세)
- `docs/handoffs/2026-05-26-phase-1-week-1-complete.md` — Phase 1.W1 완료 핸드오프
- `docs/plans/mvp-roadmap.md` v1.1 — MVP backlog single source of truth
- `docs/specs/matching-endpoint-design-decision.md` — Option C 잠정 Prisma model
- `docs/specs/backend-design-mapping.md` — dev-monorepo 정책 라벨
- `docs/specs/rootmatching-erd.md` — ERD 출처
- `docs/specs/functional-spec.md` — 27 routes + §14 9 acceptance criteria
- `docs/prd/rootmatching-prd.md` v0.4 §13 — Phase 1.W2 정의

### 로컬 전용 (gitignored)

- `.sisyphus/plans/phase-1-w2.md` v0.7 (1595 lines) — 살아있는 planning doc
- `apps/api/.env` (25 lines, Neon credentials + Better Auth secrets)

---

## 환경 정보

```text
OS: macOS (darwin)
Node: v22.22.3 (nvm 관리) — 필수 ≥ 22.13
pnpm: 11.3.0 (corepack)
저장소: /Users/uni-claw/dev/root-match
remote: origin (push 정책: 명시 요청 시에만)
```

### Commit 명령어 보일러플레이트 (husky 호환)

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
git commit -m "..." -m "..."
```

### 검증 명령 빠른 참조

```bash
# 매 변경 후
pnpm -r typecheck && pnpm lint && pnpm format:check

# 풀 빌드 + 테스트
pnpm -r run build && pnpm -r test && pnpm --filter @rootmatching/api test:e2e

# Prisma
pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api exec prisma migrate dev --name <name>
pnpm --filter @rootmatching/api exec prisma migrate status
pnpm --filter @rootmatching/api exec prisma studio          # GUI

# 개발 서버
pnpm dev   # web :3000 + api :3001 병렬

# Health smoke
curl -s http://localhost:3001/health/db | jq
```

---

## 다음 세션 첫 메시지 후보

W2-2로 바로 진입:

> "W2-1 검증 끝났고, 환경도 그대로. plan §A.2 W2-2 prompt 그대로 + ORCHESTRATOR ADDENDUM 추가해서 위임해줘."

또는 plan §A.2 patches 먼저:

> "W2-2 진입 전에 plan §A.2 patches 처리하자: Gap C Option 2 (MIGRATION.md follow-up backlog) + §A.2 intro mapping note + §16 Momus footer + §11.1 baseline-existing-DB pattern. 끝나면 W2-2 위임."

또는 push 정책 변경 시:

> "8 commits 모두 push 하자. Q10 fix 들어있으니 CI는 통과해야 함. 그 다음 W2-2."

---

## 참고 문서

| 파일                                                                   | 역할                                                                                                                                                                        |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/handoffs/2026-06-03-scenario-b-complete-w2-1-ready.md`           | 이전 entry-point (Q10 fix 전 시점)                                                                                                                                          |
| `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md`            | Pre-Flight + Scenario B closure (audit trail)                                                                                                                               |
| `docs/handoffs/2026-05-26-phase-1-week-1-complete.md`                  | Phase 1.W1 완료                                                                                                                                                             |
| `docs/handoffs/2026-06-02-backend-api-branch-evaluation.md`            | feature/backend-api 브랜치 평가                                                                                                                                             |
| `docs/handoffs/2026-06-02-remaining-pages-functional-spec-complete.md` | functional-spec 잔여 페이지                                                                                                                                                 |
| `docs/handoffs/2026-06-02-upstream-divergence-trial-merge.md`          | upstream divergence 분석                                                                                                                                                    |
| `.sisyphus/plans/phase-1-w2.md` v0.8 §7.2 + §11.1 + §A.2               | W2-2 sub-steps + Q5/Q6/Q9 detail + delegation prompt (v0.8 patches: §A.2 mapping note + Gap C MUST NOT DO + §11.1 baseline-DB pattern + §A.1 swap rule + §16 Momus verdict) |

---

## 변경 이력 (이 핸드오프 문서)

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.1 | 2026-06-03 | **Stage B 완료: plan v0.8 patches 5건 적용 (doc-only, gitignored plan + handoff 동기화).** (a) §A.2 [EXPECTED OUTCOME] intro에 13↔15 mapping note (Gap A low / Gap B low / Gap C medium RESOLVED) 추가. (b) §A.2 [MUST NOT DO]에 `[Gap C — RESOLVED]` MIGRATION.md 금지 추가 (W2-2.5 follow-up backlog 분리). (c) §16 footer "Momus v0.7-delta re-review still pending" → ACCEPT [OKAY] `ses_1738f515affePoepgbPew1Dsq6` 인용 + "End of plan v0.7" → "End of plan v0.8". (d) §11.1 새 sub-section "W2-1 Implementation Note: baseline-existing-DB fallback pattern" 추가 (Combined template Implementation notes 뒤 line 1146) — W2-1 commit `467b73f`의 4-step baseline-DB triplet 정상화. (e) §A.1 [MUST DO]에 "CONDITIONAL SWAP RULE" pointer 추가 — pre-applied CREATE EXTENSION 케이스를 §11.1 baseline-DB triplet으로 swap. (f) §16 changelog table에 v0.8 row 추가. Plan: 1595 → 1620 lines (+25). 본 핸드오프: Deferred + Documented gaps 섹션 상태 flip. **No code/schema changes; push 정책 변경 없음** (8 commits ahead 유지, W2-2 commit 후 한 번에 push 예정). |
| v1.0 | 2026-06-03 | W2-1 완료 시점 entry-point doc 신규 생성. Q10 fix commit + W2-1 commit + DB state 직접 검증 + Architectural 검토 2회 (Supabase, NextAuth+Supabase 모두 reject) 기록. W2-2 진입을 위한 ORCHESTRATOR ADDENDUM template + 5-step 절차 명시. plan §A.2 Gap C / §A.1 baseline-existing-DB 패턴 documented gaps로 명시.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
