# Session Entry-Point — Wave 3a (W2-3 ∥ W2-4 병렬 fire)

> **Session scope**: Phase 1.W2 Wave 3a — `nestjs-zod` DTO (W2-3) + Prisma seed (W2-4) 병렬 실행. **2 background agents 동시 fire**. 이 세션에서는 **design system 작업하지 않음** (별도 Session C).

| 항목            | 값                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 세션 ID (예상)  | Next session #1 of 2 (after W2-2.5 Tier 1+2 closure)                                                                                                                                              |
| 시작 시점 HEAD  | `7641e8a` 이상 (W2-2.5 Tier 2 backlog v0.3) — Session C 먼저 끝났으면 그 hash                                                                                                                     |
| 작업 범위       | `apps/api/src/matching/dto/`, `apps/api/src/auth/dto/`, `apps/api/src/app.module.ts`, `packages/shared/src/schemas/`, `apps/api/prisma/seed/`, `apps/api/prisma/seed.ts`, `apps/api/package.json` |
| 작업 금지       | `apps/web/**` 전체 (Session C 영역), `.github/workflows/ci.yml`, Better Auth code (`apps/api/src/auth/auth.config.ts`), §11/§11.1 결정사항                                                        |
| Agent 수        | 2 (W2-3 + W2-4 병렬 background)                                                                                                                                                                   |
| 예상 wall-clock | 30-90min agent time (가장 긴 agent가 결정)                                                                                                                                                        |
| 결과물          | 2 atomic commits — `feat(api): nestjs-zod ...` + `feat(api): prisma seed ...`                                                                                                                     |
| Next session 후 | Wave 3b 진입 (W2-5 Users + Companies modules, sequential after W2-4)                                                                                                                              |

---

## 1. 이번 세션 목표

W2-3 + W2-4를 **병렬 background agents 2개**로 fire하고, 양쪽 완료 알림 대기 후 검증 + commit 확인.

### 1.1 Why 병렬?

`.sisyphus/plans/phase-1-w2.md` v0.10 §4 (Parallel Execution Graph):

```text
Wave 3a (parallel x 2):
  ├── W2-3: nestjs-zod DTO + global ZodValidationPipe
  └── W2-4: Prisma seed (User → Company → QuoteRequest via Better Auth signUpEmail)
```

**Zero conflict** between W2-3 and W2-4:

- W2-3 touches: `apps/api/src/matching/dto/`, `apps/api/src/auth/dto/`, `apps/api/src/app.module.ts`, `packages/shared/src/schemas/`
- W2-4 touches: `apps/api/prisma/seed/`, `apps/api/prisma/seed.ts`, `apps/api/package.json` (seed:reset script), 가능시 schema migration (`apps/api/prisma/migrations/<TS>_add_quote_request_natural_key`)

→ 다른 디렉토리 → 동시 fire 안전. Wave 3a critical path 단축 (sequential 시 ~3-4d → parallel 시 ~2-3d).

### 1.2 What NOT in this session

- ❌ Design system upgrade (별도 Session C; `docs/handoffs/2026-06-03-session-design-system.md`)
- ❌ W2-5 (Wave 3b, W2-4 seed users 의존 — 본 session 완료 후)
- ❌ W2-2.5 Tier 3 (optional, deferred)
- ❌ Push (정책: 명시 요청 시에만)

---

## 2. Quick Reference

```text
저장소:    /Users/uni-claw/dev/root-match
브랜치:    dev-monorepo (local-only commits)
HEAD:      세션 시작 시점에 `git log --oneline -1` 확인 (최소 7641e8a; Session C 먼저 끝났으면 그 hash)
Node:      22.22.3 (nvm use 22)
pnpm:      11.3.0 (corepack)

핵심 문서 (이번 session에서 참조):
  - 본 핸드오프 (Session B entry-point)
  - docs/handoffs/2026-06-03-w2-2-complete-wave-3a-ready.md v1.2 (master reference; W2-2/W2-2.5 closure 전체 컨텍스트)
  - .sisyphus/plans/phase-1-w2.md v0.10 §A.3 + §A.4 (canonical delegation prompts; gitignored)
  - .sisyphus/plans/phase-1-w2.md v0.10 §7.3 + §7.4 (sub-step 상세)
  - apps/api/MIGRATION.md v0.1 (W2-4 canonical playbook)
  - docs/specs/w2-2.5-followup-backlog.md v0.3 (Tier 1+2 ✅, Wave 3a 진입 가능)
```

### 검증 명령 boilerplate

```bash
# 매 변경 후
pnpm -r typecheck && pnpm lint && pnpm format:check
pnpm guard:no-mock-auth   # W2-2.5 Tier 2 regression guard

# Wave 3a 검증 (양쪽 완료 후)
pnpm --filter @rootmatching/api build && pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api test          # unit + auth.config.spec
pnpm --filter @rootmatching/api test:e2e      # auth + validation + seed + others
pnpm --filter @rootmatching/web exec playwright test

# W2-3 live gate (§7.3.4)
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3001/matching/recommend \
  -H 'Content-Type: application/json' -d '{}'
# 기대: 400

# W2-4 live gate (§7.4.4)
pnpm --filter @rootmatching/api exec prisma migrate reset --force --skip-seed && \
pnpm --filter @rootmatching/api exec prisma db seed && \
pnpm --filter @rootmatching/api exec prisma db seed && \
pnpm --filter @rootmatching/api exec node --env-file=.env -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([p.user.count(), p.company.count(), p.quoteRequest.count()])
  .then(([u,c,q]) => console.log(\`users=\${u} companies=\${c} requests=\${q}\`))
  .finally(() => p.\$disconnect());"
# 기대: users=2 companies=2 requests=N (idempotent on 2nd run)
```

### Commit boilerplate (husky 호환)

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
git commit -m "..."
```

---

## 3. 이전 작업 요약 (one-liner)

- **W2-1** ✅ `467b73f` — Prisma 6 + Neon + pgvector + initial migration + /health/db
- **W2-2** ✅ `f484ad5` — Better Auth 1.6 integration + cookie sync + mock auth removal (9/9 gates)
- **W2-2.5 Tier 1** ✅ `b059cad` MIGRATION.md + `23d917a` PrismaService Pattern (a) backfill + `5c0b536` Q9 RESOLVED + status updates
- **W2-2.5 Tier 2** ✅ `bec8a14` mock auth regression guard CI + `02f8178` handoff v1.2 + `7641e8a` backlog v0.3
- **Design system spec** ✅ `ae4fe12` Toss + senior-friendly WCAG AAA (Session C에서 execute)

**전체 컨텍스트**: `docs/handoffs/2026-06-03-w2-2-complete-wave-3a-ready.md` v1.2 참조 (master doc; 이 session 컨텍스트 전부 포함).

---

## 4. 이번 세션 작업 — 2 agents 병렬 fire

### 4.1 W2-3 (nestjs-zod DTO — S=1d, category=quick)

#### 4.1.1 Delegation call

```python
task(
  category="quick",
  load_skills=["git-master"],
  run_in_background=True,
  description="W2-3 nestjs-zod global ZodValidationPipe + matching/auth DTOs",
  prompt=<§4.1.2 prompt body + §4.1.3 ORCHESTRATOR ADDENDUM>
)
```

#### 4.1.2 Prompt body (from plan §A.3)

```text
[TASK]
Execute Phase 1.W2-3 per .sisyphus/plans/phase-1-w2.md §7.3 (8 sub-steps). Closes phase-1-W2-3. S=1d cookbook task.

GOAL: Wire `nestjs-zod` globally so every Nest controller body/query/param is validated against a zod schema imported from `@rootmatching/shared`; invalid payload returns HTTP 400 with structured `{ statusCode: 400, message: ['...'], error: 'Bad Request' }` envelope.

[EXPECTED OUTCOME] — 8 atomic deliverables matching §7.3.3 sub-steps 1:1.

1. `apps/api/src/main.ts`: `import 'reflect-metadata'` is FIRST import (verify; W2-2 may have already placed it).
2. `ZodValidationPipe` wired via `APP_PIPE` provider in `apps/api/src/app.module.ts` (per §7.3.6 librarian finding: APP_PIPE participates in DI/lifecycle, easier test overrides — preferred over `app.useGlobalPipes`).
3. `packages/shared/src/schemas/matching.ts` exports `QuoteRequestDraftSchema` derived from existing `QuoteRequestDraft` type (if missing — check first). Mark with `.meta({id: 'QuoteRequestDraft'})` for stable OpenAPI component names.
4. `apps/api/src/matching/dto/quote-request-draft.dto.ts` uses `createZodDto(QuoteRequestDraftSchema)`.
5. `MatchingController.recommend(@Body() body: QuoteRequestDraftDto)` uses the new DTO class.
6. Failing supertest spec `apps/api/test/validation.e2e-spec.ts`: POST `/matching/recommend` with `{}` → expect HTTP 400 + body has `message` array with zod issues.
7. `apps/api/src/auth/dto/`: `login.dto.ts` + `register.dto.ts` using `createZodDto(LoginSchema)` / `createZodDto(RegisterSchema)` from `@rootmatching/shared`. These feed W2-5 + Swagger.
8. Single atomic commit: `feat(api): nestjs-zod global validation + matching/auth DTOs`.

[REQUIRED TOOLS]
- mcp_Read, mcp_Write, mcp_Edit
- mcp_Bash (Node 22 prefix; pnpm; git; supertest)
- mcp_Lsp_diagnostics (verify after each TS edit)
- mcp_Grep / mcp_Glob (find existing zod usage in shared / matching)

[MUST DO]
- Node 22 in every bash: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && ...`
- Husky pre-commit hook: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` BEFORE every `git commit`.
- Use `APP_PIPE` provider (DI-managed), NOT `app.useGlobalPipes` (per §7.3.6 librarian).
- Use `createZodDto()` from `nestjs-zod`; do NOT manually write Nest-style DTO classes.
- Mark shared zod schemas with `.meta({id: 'Name'})` for stable OpenAPI component naming (W2-6 Swagger depends on this).
- Verify shared package consumed via CJS: zod must be a `peerDependency` in `packages/shared/package.json` (NOT bundled) to maintain object identity across packages (R1).
- Verification gates before commit: typecheck + lint + format:check + build + prisma generate + unit tests + new validation.e2e-spec PASS.
- §7.3.4 live gate: `curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3001/matching/recommend -H 'Content-Type: application/json' -d '{}'` returns `400`.
- Single atomic commit at end. Body cites: Q6 RESOLVED (role/accountType already in shared types from W2-2), R1 mitigation (shared zod peerDep), R2 caveat (no `.transform()` in shared schemas).

[MUST NOT DO]
- Use `app.useGlobalPipes(new ZodValidationPipe())` directly — `APP_PIPE` provider only.
- Enable `strictSchemaDeclaration: true` — would throw on existing `@Param('id') id: string` route handlers (per §7.3.6 librarian). Defer to Phase 2 after class-validator DTO migration.
- Add `.transform()` to shared schemas — causes OpenAPI input/output drift (R2). Keep transforms in service layer.
- Bundle zod in shared package — `peerDependency` only; pnpm dedupe ensures single object identity (R1).
- Touch Better Auth code (W2-2 territory; auth DTOs are zod schema → nestjs-zod, not Better Auth modification).
- Touch Prisma schema (W2-4 may seed via shared schemas; this task only defines DTOs).
- Touch throttler / helmet / Swagger config — W2-6 territory.
- Touch `.github/workflows/ci.yml`.
- Modify §11 / §11.1 decisions (already RESOLVED).
- Add @nestjs/config ConfigModule wiring.
- Touch `apps/web/**` (Session C territory; design system).

[CONTEXT]
- W2-2 merged (commit `f484ad5`). `User.role` enum mapping finalized. `auth.config.ts` exports `assertSameSet`, `USER_ROLE_VALUES`, `ACCOUNT_TYPE_VALUES`.
- Shared package: `@rootmatching/shared` at `packages/shared/`. Has zod schemas + TS types. Verify presence of `LoginSchema`, `RegisterSchema`, `QuoteRequestDraftSchema` (or `QuoteRequestDraft` type — derive schema if only type exists).
- nestjs-zod version: latest stable (`pnpm --filter @rootmatching/api add nestjs-zod` if not yet installed).
- Existing matching endpoint: `apps/api/src/matching/matching.controller.ts` `POST /matching/recommend` currently accepts raw body. This task migrates that to DTO.
- §7.3.6 librarian session `bg_e89d7c64` covered this — folded into §7.3 pointers. No re-research.
- W2-3 runs in parallel with W2-4 (Prisma seed) — different directories (`apps/api/src/matching/dto`, `apps/api/src/auth/dto`, `packages/shared/src/schemas/` vs `apps/api/prisma/seed/`); zero conflict.
- Wave 3b (W2-5 Users/Companies modules) waits for both W2-3 + W2-4 to complete.
```

#### 4.1.3 ORCHESTRATOR ADDENDUM template

```text
[ORCHESTRATOR ADDENDUM — current state at delegation time (not in plan §A.3, factual update from Sisyphus 2026-06-03)]

**HEAD at delegation**: <검증: git log --oneline -1, 최소 7641e8a; Session C 먼저 완료시 그 commit>
Working tree clean expected. Push policy: deferred until Wave 3a + (optionally) Session C 모두 complete.

**W2-2 closure state** (commit `f484ad5`, all 9 gates PASS):
- `auth.config.ts` exports: `betterAuth` instance + exported `assertSameSet` + `USER_ROLE_VALUES` + `ACCOUNT_TYPE_VALUES` + `AuthSession` + `AuthUser` types
- `apps/api/src/auth/` has: auth.config.ts, auth.config.spec.ts (5 cases PASS), auth.controller.ts (/auth/me), auth.module.ts, better-auth.guard.ts, current-user.decorator.ts
- `apps/api/src/prisma/prisma.client.ts`: module-time singleton (Pattern (a); used by auth.config + future seed; NOT NestJS DI)
- `apps/api/src/prisma/prisma.service.ts`: NestJS DI; W2-2.5 commit `23d917a` added 20-line header documenting Pattern (a) + `HORIZONTAL_SCALE_TRIGGER` grep tag for eventual refactor
- `apps/api/test/auth.e2e-spec.ts` PASS: 3 cases (signup 200 + /auth/me 401 + /auth/me 200)
- `apps/api/test/jest-e2e.json`: `transformIgnorePatterns` includes better-auth + transitive ESM deps (do NOT weaken this list; W2-3 should not need changes here)
- `apps/api/package.json` has Better Auth deps (`better-auth@1.6.13` + `@better-auth/cli@1.4.21`); `nestjs-zod` may need install: `pnpm --filter @rootmatching/api add nestjs-zod` as first action

**Shared package state** (`packages/shared/`):
- Read `packages/shared/src/types/` for current types — likely has `LoginSchema`, `RegisterSchema`, `QuoteRequestDraft` (type, NOT schema)
- If `QuoteRequestDraftSchema` is missing as zod schema, derive from `QuoteRequestDraft` type as `z.object({...})` matching 1:1
- Mark each new/existing schema with `.meta({id: 'Name'})` for Swagger component naming (W2-6 will depend on this)
- Verify `packages/shared/package.json`: `zod` should be in `peerDependencies` (NOT `dependencies` — bundling breaks object identity per R1)

**Wave 3a parallel fire context**: W2-4 (Prisma seed) is firing in parallel as another agent. W2-4 touches `apps/api/prisma/` ONLY. You touch `apps/api/src/matching/dto/`, `apps/api/src/auth/dto/`, `apps/api/src/app.module.ts`, `packages/shared/src/schemas/`. **Zero overlap**. If you notice the other agent's commit landing first, that's fine — your branch will rebase naturally.

**Husky pre-commit Node 22 PATH**: MANDATORY. `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` before EVERY `git commit`. Without this, lint-staged falls back to system Node v20 and fails with `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.

**Push policy at delegation time**: do NOT push. Orchestrator will push all commits after Wave 3a (W2-3 + W2-4) atomic commits complete.

[CONCISE REPORT FORMAT — 8 items matching W2-2 style]
1. Final commit hash + subject (`feat(api): nestjs-zod global validation + matching/auth DTOs`)
2. §7.3.3 8 sub-steps matrix (✓/✗ per step with one-line outcome)
3. §7.3.4 verification curl result (HTTP 400 + zod issues body excerpt)
4. 7 verification gates pass/fail (typecheck / lint / format:check / build / prisma generate / unit tests / validation.e2e-spec)
5. Files modified (path + lines added/removed table)
6. Shared schema additions/changes (was `QuoteRequestDraftSchema` already present? Did you add `.meta({id})` to existing ones?)
7. Deviations + justification (e.g., if you had to derive schema from type vs found existing)
8. Open questions / follow-ups
```

### 4.2 W2-4 (Prisma seed — M=2-3d, category=unspecified-high)

#### 4.2.1 Delegation call

```python
task(
  category="unspecified-high",
  load_skills=["git-master"],
  run_in_background=True,
  description="W2-4 Prisma seed (mock users + companies + quote requests via Better Auth signUpEmail)",
  prompt=<§4.2.2 prompt body + §4.2.3 ORCHESTRATOR ADDENDUM>
)
```

#### 4.2.2 Prompt body (from plan §A.4)

```text
[TASK]
Execute Phase 1.W2-4 per .sisyphus/plans/phase-1-w2.md §7.4 (9 sub-steps). Closes phase-1-W2-4. M=2-3d.

GOAL: After `pnpm --filter @rootmatching/api exec prisma migrate reset --force --skip-seed` + `prisma db seed`, the DB contains 2 mock users + 2 companies + N quote requests with full relations. Running seed twice produces ZERO duplicates. Follow `apps/api/MIGRATION.md` (W2-2.5 commit `b059cad`) for the canonical playbook.

[EXPECTED OUTCOME] — 9 atomic deliverables matching §7.4.3 sub-steps 1:1.

1. Catalog `apps/web/src/data/*.ts` and decide which to seed NOW vs defer to Phase 2. Phase 1.W2 seeds 3 files only: `users.ts → User`, `companies.ts → Company`, `requestData.ts → QuoteRequest`. Phase 2 will seed: `transactionData.ts`, `disputeData.ts`, `messages.ts`, `notifications.ts`, `activityLogs.ts`. Document this triage in `apps/api/prisma/seed.ts` header comment with explicit reference to `apps/api/MIGRATION.md` §5 (관계 데이터 처리 순서).
2. `apps/api/prisma/seed/00-users.ts`: for each mock user (hong@techsolution.co.kr client + factory@example.kr factory), call `auth.api.signUpEmail({ body: {...} })` with `password: 'TempPass!2026'` per `MIGRATION.md` §3 + Q7 RESOLVED. Idempotency via `findUnique({email})` short-circuit (see `MIGRATION.md` §2.2). Promote `role: 'admin'` + `emailVerified: true` via raw `prisma.user.update` AFTER signup (Q6 server-managed; signup API does not accept `role`).
3. `apps/api/prisma/seed/10-companies.ts`: `prisma.company.upsert({ where: {userId}, ... })` — one Company per User (1:1). For client: `테크솔루션`; for factory: `박공장 가공소` (matching `mockCompanies[0]` semantics from `apps/web/src/data/companies.ts`).
4. `apps/api/prisma/seed/20-quote-requests.ts`: read `apps/web/src/data/requestData.ts`, `prisma.quoteRequest.upsert({ where: {<natural key>}, ... })`. Natural key suggestion: `(clientUserId, projectName)` `@@unique` — if not in current schema, propose schema migration in this commit (NEW migration: `add_quote_request_natural_key`).
5. `apps/api/prisma/seed.ts` orchestrator: imports the 3 sub-modules in order (User → Company → QuoteRequest) and runs sequentially. **Wrap Company + QuoteRequest in `prisma.$transaction`** (relational integrity); **keep Better Auth signup OUTSIDE the transaction** (R1: signup is not transactional + emits Session side-effect).
6. Failing spec `apps/api/test/seed.e2e-spec.ts`: drop DB, run seed, expect `prisma.user.count()` === 2, `prisma.company.count()` === 2, `prisma.quoteRequest.count()` === N (N = fixture count); run seed AGAIN, expect counts unchanged.
7. Run spec → green.
8. Add npm script in `apps/api/package.json`: `"seed:reset": "prisma migrate reset --force --skip-seed && prisma db seed"`.
9. Single atomic commit: `feat(api): prisma seed for mock fixtures (users + companies + quote requests via better auth signup)`.

[REQUIRED TOOLS]
- mcp_Read, mcp_Write, mcp_Edit
- mcp_Bash (Node 22 prefix; pnpm; prisma; git)
- mcp_Lsp_diagnostics (verify after each TS edit)
- mcp_Grep / mcp_Glob (find requestData shape in apps/web)

[MUST DO]
- Node 22 in every bash: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && ...`
- Husky pre-commit hook: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` BEFORE every `git commit`.
- Follow `apps/api/MIGRATION.md` (commit `b059cad`) as the canonical playbook — §1 inventory, §2 procedure, §3 password policy, §5 relation order.
- Use `auth.api.signUpEmail` for User creation (NOT raw `prisma.user.create` — would skip Better Auth password hash → signin fails).
- Fixed password `TempPass!2026` for ALL seed users (Q7 RESOLVED; dev/CI only).
- After signup, raw `prisma.user.update` to set `role: 'admin'` + `emailVerified: true` (Q6 server-managed: `role.input: false` means it cannot be sent in signup body).
- Mitigate R1 (Session side-effect): either `signUpEmail({ asResponse: false })` OR explicit `prisma.session.deleteMany({ where: { userId } })` after seed loop. Pick one, justify in seed.ts header.
- Enforce 3-pass relation order: User pass first (with `console.assert(user, 'user not created')` between passes per R2), then Company, then QuoteRequest.
- Verification gates before commit: typecheck + lint + format:check + build + prisma generate + unit tests + new `seed.e2e-spec` PASS.
- §7.4.4 live gate (run AFTER commit): full pipe `migrate reset --skip-seed → db seed → db seed (2nd) → node -e count` returns `2 2 N` (N = QuoteRequest count, identical on both seed runs).
- Single atomic commit at end. Body cites: Q7 RESOLVED (TempPass!2026), Q6 RESOLVED (role promotion path), `apps/api/MIGRATION.md` §5 (relation order), R1 mitigation choice + reasoning.

[MUST NOT DO]
- Use raw `prisma.user.create` for User creation — Better Auth hash + Account row are skipped → signin fails.
- Hardcode passwords other than `TempPass!2026` in dev/CI — Q7 RESOLVED.
- Include `transactionData.ts`, `disputeData.ts`, `messages.ts`, `notifications.ts`, `activityLogs.ts` in seed — those are Phase 2 (matching `mvp-roadmap.md` §2.2-§2.5).
- Wrap Better Auth signup inside `prisma.$transaction` (R1: signup is not transactional; would cause hangs or partial state).
- Modify `apps/web/src/data/*.ts` mock files — they remain shape references.
- Touch Better Auth code (W2-2 territory).
- Touch `.github/workflows/ci.yml` UNLESS this commit pushed before W2-7 (Q10 same caveat as §A.1/§A.2).
- Touch throttler / helmet / Swagger (W2-6 territory).
- Modify §11 / §11.1 decisions.
- Touch `apps/web/**` (Session C territory).

[CONTEXT]
- W2-2 merged (commit `f484ad5`). Better Auth `auth.api.signUpEmail` is the only sanctioned password-hashing path. `apps/api/src/auth/auth.config.ts` exports `auth` instance.
- `apps/api/MIGRATION.md` (W2-2.5 commit `b059cad`) is the canonical mock→real playbook. Read first.
- Mock data inventory: `apps/web/src/data/users.ts` (2 entries: `mockCurrentUser` client + `mockFactoryUser` factory), `apps/web/src/data/companies.ts` (mockCompanies array), `apps/web/src/data/requestData.ts` (QuoteRequest fixtures).
- Prisma schema state (W2-1 commit `467b73f`): `User`, `Company`, `Profile`, `QuoteRequest`, `MatchRecommendation`, `FactoryEmbedding` + Better Auth `Session`/`Account`/`Verification`. `QuoteRequest.clientUserId` FK exists; natural key `@@unique` may need adding.
- `seed.ts` currently a stub (`apps/api/prisma/seed.ts` from Pre-Flight aa99d30). This task replaces it.
- `prisma db seed` invocation reads `package.json#prisma.seed` script (currently `"tsx prisma/seed.ts"`).
- W2-4 runs in parallel with W2-3 (nestjs-zod DTO) — different directories; zero conflict.
- Wave 3b (W2-5 Users/Companies modules) e2e tests assert against THE SEED USERS produced by this task — W2-5 cannot proceed until W2-4 green.
```

#### 4.2.3 ORCHESTRATOR ADDENDUM template

```text
[ORCHESTRATOR ADDENDUM — current state at delegation time (not in plan §A.4, factual update from Sisyphus 2026-06-03)]

**HEAD at delegation**: <same as W2-3; check via git log --oneline -1>
Working tree clean expected. Push policy: deferred until Wave 3a complete.

**Canonical playbook**: read `apps/api/MIGRATION.md` (W2-2.5 commit `b059cad`) FIRST. §1 mock 인벤토리 has 2 user shapes; §2 signUpEmail procedure with idempotency; §3 password policy TempPass!2026; §5 relation order User → Profile → Company → FactoryEmbedding → QuoteRequest → MatchRecommendation.

**Prisma state** (W2-1 commit `467b73f`):
- Schema models: User, Session, Account, Verification (Better Auth) + Company, Profile, QuoteRequest, MatchRecommendation, FactoryEmbedding
- Enums: UserRole {admin, member, operator}, AccountType {client, factory}, QuoteRequestStatus, MatchingSource
- All PKs cuid()
- `QuoteRequest.clientUserId` FK exists; natural key `@@unique` MAY NEED ADDING (check schema; if absent, propose schema migration in this commit OR use deterministic Prisma id from fixture hash)
- `_prisma_migrations` has 1 row (init_phase_1_w2 applied); subsequent `migrate dev` works normally (W2-1 baseline-existing-DB pattern was one-time)
- pgvector 0.8.1 installed; FactoryEmbedding.embedding nullable (NULL initially; W2-4 doesn't populate embeddings; deferred to dedicated embedding-generation pass)

**Better Auth state** (W2-2 commit `f484ad5`):
- `auth.api.signUpEmail({ body: {...} })` works; creates User + Account (hashed password) + Session (side-effect — clean up per R1)
- Server-side import: `import { auth } from '../../src/auth/auth.config'` (relative path from prisma/seed/)
- Password hash: scrypt (NOT bcrypt — do NOT manually bcrypt then store)
- `accountType.input: true`: pass in signup body
- `role.input: false`: do NOT pass in signup body; promote via raw `prisma.user.update` AFTER

**Mock data inventory** (apps/web/src/data/):
- `users.ts`: `mockCurrentUser` (hong@techsolution.co.kr, client, admin, 홍길동, position 사업개발팀장, phone 010-1234-5678) + `mockFactoryUser` (factory@example.kr, factory, admin, 박공장, position 대표, phone 010-2222-3333). Both reference `mockCompanies[0]` as defaultCompany.
- `companies.ts`: mockCompanies array — read to get exact field shape
- `requestData.ts`: N QuoteRequest fixtures — read to get count + fields

**Seed orchestrator state**:
- `apps/api/prisma/seed.ts` is currently a 14-line stub (Pre-Flight `aa99d30`). Replace with multi-file orchestrator: `seed/00-users.ts` + `seed/10-companies.ts` + `seed/20-quote-requests.ts` imported by `seed.ts`.
- `apps/api/package.json` already has `"prisma": { "seed": "tsx prisma/seed.ts" }` — verify tsx is in devDeps.

**Wave 3a parallel fire context**: W2-3 is firing in parallel. W2-3 touches `apps/api/src/matching/dto/`, `apps/api/src/auth/dto/`, `apps/api/src/app.module.ts`, `packages/shared/src/schemas/`. You touch `apps/api/prisma/` only. **Zero overlap**.

**Husky pre-commit Node 22 PATH**: MANDATORY. `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` before EVERY `git commit`.

**Push policy at delegation time**: do NOT push. Orchestrator will push all commits after Wave 3a complete.

[CONCISE REPORT FORMAT — 8 items matching W2-2 style]
1. Final commit hash + subject (`feat(api): prisma seed for mock fixtures (users + companies + quote requests via better auth signup)`)
2. §7.4.3 9 sub-steps matrix (✓/✗ per step)
3. §7.4.4 verification pipe result (`prisma migrate reset --skip-seed → db seed → db seed → node -e count` final line: `2 2 N`)
4. 8 verification gates pass/fail (typecheck / lint / format:check / build / prisma generate / unit tests / new seed.e2e-spec / api e2e others)
5. Files modified + new files (path + lines table)
6. Schema migration (if QuoteRequest natural key added): migration filename + DDL
7. Deviations + justification (R1 Session mitigation choice; any Phase 2 fixtures triaged out)
8. Open questions / follow-ups
```

---

## 5. Validation (양쪽 완료 알림 도착 후)

W2-3 + W2-4 모두 system reminder로 완료 알림 도착 시:

```bash
# 1. Background results 수집
background_output(task_id="<W2-3 task_id>")
background_output(task_id="<W2-4 task_id>")

# 2. 각각 8-item concise report 검증

# 3. 전체 9 verification gates (Wave 3a 통합)
pnpm -r typecheck && pnpm lint && pnpm format:check
pnpm guard:no-mock-auth   # W2-2.5 Tier 2 regression guard
pnpm --filter @rootmatching/api build && pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api test
pnpm --filter @rootmatching/api test:e2e
pnpm --filter @rootmatching/web exec playwright test

# 4. W2-3 live gate
pnpm dev &
sleep 8
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3001/matching/recommend \
  -H 'Content-Type: application/json' -d '{}'
# Expected: 400

# 5. W2-4 live gate
pnpm --filter @rootmatching/api exec prisma migrate reset --force --skip-seed && \
pnpm --filter @rootmatching/api exec prisma db seed && \
pnpm --filter @rootmatching/api exec prisma db seed && \
pnpm --filter @rootmatching/api exec node --env-file=.env -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([p.user.count(), p.company.count(), p.quoteRequest.count()])
  .then(([u,c,q]) => console.log(\`users=\${u} companies=\${c} requests=\${q}\`))
  .finally(() => p.\$disconnect());"
# Expected: users=2 companies=2 requests=N (idempotent)

# 6. W2-2 sanity (signup still works after seed reset)
pnpm dev &
sleep 8
curl -i -X POST http://localhost:3001/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"hong@techsolution.co.kr","password":"TempPass!2026"}'
# Expected: 200 + session cookie (seed user signin works)
```

---

## 6. Post-session next steps

### 6.1 Wave 3a 완료 후 즉시 다음

- **Wave 3b — W2-5 (Users + Companies modules)** — single agent, sequential. e2e specs reference the seed users from W2-4.
  - Plan §7.5 + §A.5 (다음 plan revision에 추가 권장)
  - HEAD at fire: after W2-3 + W2-4 commits land
  - Estimated: M=2d

### 6.2 본 session과 독립적으로 진행 가능

- **Session C — Design system upgrade** — `docs/handoffs/2026-06-03-session-design-system.md`
  - `docs/specs/design-system-upgrade.md` v0.1 spec 적용
  - `visual-engineering` category + `frontend-ui-ux` skill
  - 본 session B와 zero conflict (apps/web vs apps/api 분리)
  - Estimated: 1-1.5 days agent

### 6.3 Push 정책

본 session 완료 시점에 Push 여부 결정:

- Option A: Wave 3a + Session C 모두 완료 후 한 번에 push (모든 commits)
- Option B: Wave 3a만 끝나면 push (Q10 CI validation 우선)

사용자 명시 요청 시에만 push 실행.

---

## 7. 첫 메시지 후보

### 후보 1 — 즉시 병렬 fire (가장 권장)

> "W2-3 + W2-4 Wave 3a 병렬 fire. handoff §4.1 + §4.2 prompt body + ORCHESTRATOR ADDENDUM 추가해서 2 agents background 동시 실행. 양쪽 system reminder 대기."

### 후보 2 — 순차 fire (보수적)

> "먼저 W2-3 (S=1d, cookbook) fire 해서 검증한 후 W2-4 (M=2-3d) fire. 충돌 risk 없지만 보수적으로 sequential."

---

## 8. 작업 금지 reminder

이번 session에서는 다음 작업 **절대 금지**:

1. ❌ `apps/web/**` 파일 수정 (Session C 영역)
2. ❌ `apps/web/tailwind.config.ts` 수정 (Session C 영역)
3. ❌ `apps/web/src/app/globals.css` 수정 (Session C 영역)
4. ❌ `apps/web/src/components/ui/**` 수정 (Session C 영역)
5. ❌ `docs/design-system.md` 수정 (Session C 영역)
6. ❌ `.github/workflows/ci.yml` 수정 (Q10 fix already in `13e90c1`; W2-7 territory)
7. ❌ W2-5 진입 (Wave 3b; W2-4 완료 후)
8. ❌ Better Auth code 수정 (W2-2 territory)
9. ❌ §11 / §11.1 plan decisions 수정 (already RESOLVED)
10. ❌ Push (정책 명시 요청 시에만)

---

## 9. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                 |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-06-03 | 초기 작성. Session B (Wave 3a W2-3 + W2-4 병렬 fire) 전용 entry-point. master doc (`2026-06-03-w2-2-complete-wave-3a-ready.md` v1.2) 분리 — Session C와 독립적 실행. |
