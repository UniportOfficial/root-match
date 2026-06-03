# Session Handoff — 2026-06-03 (W2-2 완료, W2-2.5 Tier 1+2 완료, Wave 3a 진입 준비)

다음 세션이 컨텍스트 없이 이어받을 수 있도록 정리한 entry-point 문서. **이전 entry-point** (`2026-06-03-w2-1-complete-w2-2-ready.md` v1.1)는 historical reference로 보존.

**이번 세션 산출물** (W2-2 → W2-2.5 → Wave 3a prep, 단일 세션):

- W2-2 atomic commit `f484ad5` (26 files, +741/-308; 9/9 gates PASS; Better Auth 1.6.13 통합 완료)
- design system upgrade spec `ae4fe12` (Toss tokens + 시니어 친화 WCAG AAA, 609 lines spec)
- W2-2.5 Tier 1 (MUST) — `b059cad` (MIGRATION.md 352 lines), `23d917a` (PrismaService Pattern (a) backfill, 269 lines), `5c0b536` (Q9 status + handoff + mvp-roadmap + backlog v0.2)
- W2-2.5 Tier 2 (SHOULD) — `bec8a14` (mock auth regression guard CI script + matrix + pnpm script, 99 lines), [this commit] (handoff v1.2)

**다음 작업**:

1. (선택) Push all commits (16+ ahead of origin) — Q10 CI validation gate
2. Wave 3a 진입 — W2-3 ∥ W2-4 병렬 fire (2 agents, plan §A.3 + §A.4)
3. Wave 3b 순차 — W2-5 Users/Companies (W2-4 seed users 의존)
4. Wave 4 — Option C β + W2-6 보안+Swagger
5. Wave 5 — W2-7 E2E + Neon CI branching

---

## Quick Reference

```text
저장소:        /Users/uni-claw/dev/root-match
활성 브랜치:    dev-monorepo (local-only, push 정책: 명시 요청 시에만)
HEAD:          <this handoff commit; W2-2.5 Tier 2 handoff doc>
                이전 HEAD chain:
                  bec8a14 ci: guard against mock-auth regression (W2-2.5 Tier 2 §3.2.1)
                  5c0b536 docs: w2-2.5 tier 1 closure (Q9 + handoff + mvp-roadmap + backlog v0.2)
                  23d917a docs(api): w2-2.5 prisma-service pattern (a) backfill
                  b059cad docs(api): w2-2.5 MIGRATION.md
                  ae4fe12 docs(specs): design system upgrade plan (toss + senior WCAG AAA)
                  f484ad5 feat(api,web): better auth 1.6 integration + cookie sync + remove mock auth
                  6f6443a docs: w2-2.5 followup backlog spec + handoff v1.2 (commit-count fix)
                  c80fa0c docs(handoffs): w2-1 v1.1 — plan v0.8 patches applied (Stage B)
                  29bdb7c docs(handoffs): w2-1 complete, w2-2 ready (이전 entry-point)
                  467b73f feat(api): prisma 6 + pgvector + initial migration + /health/db
                  13e90c1 chore(ci): bump CI + repo engines to node 22
                  6ef6404 docs(handoffs): scenario B complete, W2-1 ready
                  f2faf93 docs(handoffs): scenario B closure addendum
                  84ffa8a docs(handoffs): phase 1.W2 pre-flight complete
                  aa99d30 chore(api): phase 1.W2 pre-flight (Prisma + Better Auth deps + scaffold)
                  a2e1e64 chore: phase 1.W2 housekeeping
push 상태:      origin/dev-monorepo 대비 17+ commits ahead (이 핸드오프 commit 포함)

런타임 요구:    Node ≥ 22.13 (pnpm 11.3.0이 Node 20에서 ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite)
                매 세션 첫 명령: `nvm use 22`
                commit 시 PATH prefix:
                  `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"`
                (husky pre-commit hook이 fresh subshell에서 Node 잡을 때 필요)

핵심 문서:
  - 본 핸드오프 (entry point, W2-2 closure + Wave 3a ready)
  - docs/handoffs/2026-06-03-w2-1-complete-w2-2-ready.md (이전 entry-point, frozen at W2-1 closure)
  - .sisyphus/plans/phase-1-w2.md v0.10 (gitignored, 살아있는 plan)
    └ Q1-Q11 결정 상태 + §11.1 detailed + §A.1 W2-1 / §A.2 W2-2 / §A.3 W2-3 / §A.4 W2-4 delegation prompts
  - docs/plans/mvp-roadmap.md v1.1+ (Phase 1.W2 진행도 §1.3/§2.1 갱신)
  - docs/specs/w2-2.5-followup-backlog.md v0.2 (Tier 1+2 완료, Tier 3 잔여)
  - docs/specs/design-system-upgrade.md v0.1 (Toss + senior WCAG AAA spec, 별도 wave)
  - docs/specs/prisma-service-pattern.md v0.1 (Pattern (a) 채택 + (b) refactor 절차)
  - apps/api/MIGRATION.md v0.1 (mock→real user playbook)

다음 작업 순서:
  1. (선택) git push origin dev-monorepo + gh run watch (CI 통과 확인, Q10 validation)
  2. Wave 3a fire: W2-3 (§A.3) ∥ W2-4 (§A.4) 병렬 task() — 2 agents
  3. W2-5 (Wave 3b 순차) → Option C β (Wave 4a) → W2-6 (Wave 4b) → W2-7 (Wave 5)
```

---

## 1. W2-2 + W2-2.5 closure 요약

### 1.1 W2-2 (Better Auth 1.6 integration) — commit `f484ad5`

| 항목               | 결과                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent              | Sisyphus-Junior (ultrabrain category), 33m 26s                                                                                                                            |
| Files changed      | 26 (+741 / -308)                                                                                                                                                          |
| Verification gates | **9/9 PASS** (typecheck / lint / format:check / build / prisma generate / unit 34 tests / api e2e auth 3 + others 3 / web Playwright 1)                                   |
| §7.2.4 signup curl | HTTP 200 + `better-auth.session_token=...; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax` (NO `Secure` on HTTP localhost)                                                |
| Q5 verified        | ✅ `BETTER_AUTH_URL.startsWith('https://')` 기반; HTTP dev → Secure false                                                                                                 |
| Q6 verified        | ✅ `role.input:false` + `accountType.input:true` + `assertSameSet` drift guard; 5 regression cases PASS                                                                   |
| Q9 dry-run         | ❌ INCOMPATIBLE (`kAPIErrorHeaderSymbol` skew CLI 1.4.21 vs runtime 1.6.13) → fallback (c) hand-authored snippet (W2-1에서 이미 schema.prisma에 있음); no schema mutation |
| Q10 fix            | already applied (commit `13e90c1`)                                                                                                                                        |
| Mock auth 제거     | ✅ `apps/web/src/lib/auth-cookie.ts` deleted; `rm-auth`/`rm-role` 0 hits in source; UserContext → `authClient.useSession()`                                               |
| 새 파일            | `apps/api/src/auth/` (5 files) + `prisma/prisma.client.ts` + `test/auth.e2e-spec.ts` + `apps/web/playwright.config.ts` + `tests/auth.spec.ts` + `lib/auth-client.ts`      |
| 패턴 결정          | Pattern (a) accept dual-pool (PrismaService extends + prisma.client.ts singleton 공존; Pattern (b) deferred — `docs/specs/prisma-service-pattern.md`)                     |

### 1.2 W2-2.5 Tier 1 (MUST, 3 commits)

| §     | Commit    | 산출물                                                                                                                                                                     |
| ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1.1 | `b059cad` | `apps/api/MIGRATION.md` (NEW, 352 lines, 7 sections — mock 인벤토리 + dev/CI 절차 + 비밀번호 정책 + prod placeholder + 관계 데이터 순서 + 검증 매트릭스)                   |
| 3.1.2 | `23d917a` | `apps/api/src/prisma/prisma.service.ts` (20-line header + `HORIZONTAL_SCALE_TRIGGER` grep tag) + `docs/specs/prisma-service-pattern.md` (NEW, 246 lines, 6 sections)       |
| 3.1.3 | `5c0b536` | handoff doc Q9 row + Deferred 갱신 / `mvp-roadmap.md` §1.3 재작성 + §2.1 status column / `w2-2.5-followup-backlog.md` v0.2 changelog / plan §11 Q9 + §16 v0.9 (gitignored) |

### 1.3 W2-2.5 Tier 2 (SHOULD, 2 commits)

| §     | Commit        | 산출물                                                                                                                                                                          |
| ----- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.2.1 | `bec8a14`     | `apps/api/scripts/check-no-mock-auth.sh` (NEW, 96 lines, executable) + `package.json` `guard:no-mock-auth` script + `.github/workflows/ci.yml` matrix task `guard:no-mock-auth` |
| 3.2.2 | [this commit] | 본 핸드오프 doc + plan v0.10 updates (gitignored: §11 Q5/Q6 APPLIED + §7.2.4 actual result + §A.3 W2-3 prompt + §A.4 W2-4 prompt + §16 v0.10)                                   |

### 1.4 mock auth regression guard CI 작동 검증

```text
$ pnpm guard:no-mock-auth
[guard:no-mock-auth] Scanning apps/ packages/ for forbidden mock-auth patterns...
  Checking: 'rm-auth'                          → OK — clean
  Checking: 'rm-role'                          → OK — clean
  Checking: 'apps/web/src/lib/auth-cookie'     → OK — clean
[guard:no-mock-auth] PASSED — no mock-auth regression detected.
```

의도적 regression 테스트 (`apps/api/src/__regression_test.ts`에 `const X = "rm-auth"` 삽입):

```text
  Checking: 'rm-auth'                          → FAIL with file:line evidence
[guard:no-mock-auth] FAILED — 1 forbidden pattern(s) detected.
  (exit code 1)
```

→ 파일 revert; CI matrix 통합 작동 확인.

---

## 2. Wave 3a 진입 가이드

### 2.1 병렬 fire (2 agents)

Wave 3a는 plan §4 (Parallel Execution Graph)에 따라 **W2-3 ∥ W2-4 병렬** 실행. 다른 디렉토리만 건드림 (W2-3: `apps/api/src/matching/dto/`, `apps/api/src/auth/dto/`, `packages/shared/src/schemas/` / W2-4: `apps/api/prisma/seed/`, `apps/api/prisma/seed.ts`) — zero conflict.

### 2.2 W2-3 (nestjs-zod DTO + global ZodValidationPipe — S=1d)

#### 2.2.1 Plan reference

`.sisyphus/plans/phase-1-w2.md` v0.10 §A.3 (line ~1620+) has the canonical delegation prompt. Below is the same prompt reproduced inline for next-session ergonomics (plan is gitignored).

#### 2.2.2 Delegation call

```python
task(
  category="quick",
  load_skills=["git-master"],
  run_in_background=True,
  description="W2-3 nestjs-zod global ZodValidationPipe + matching/auth DTOs",
  prompt=<§2.2.3 prompt body + §2.2.4 ORCHESTRATOR ADDENDUM>
)
```

#### 2.2.3 Prompt body (verbatim from plan §A.3)

> See `.sisyphus/plans/phase-1-w2.md` v0.10 §A.3 — full 6-section prompt (TASK / EXPECTED OUTCOME 8 items / REQUIRED TOOLS / MUST DO / MUST NOT DO / CONTEXT). Key highlights:
>
> **EXPECTED OUTCOME**: 8 deliverables 1:1 with §7.3.3 sub-steps — `reflect-metadata` first import / `APP_PIPE` provider in app.module.ts / `QuoteRequestDraftSchema.meta({id})` in shared / DTO classes via `createZodDto()` / matching controller migration / validation.e2e-spec.ts (POST `/matching/recommend` empty body → 400) / auth DTOs (`login.dto.ts`, `register.dto.ts`) / atomic commit.
>
> **MUST DO**: APP_PIPE NOT useGlobalPipes; `createZodDto` only; `.meta({id})` on shared schemas; zod as `peerDependency` (R1); verification gates all green; `curl POST /matching/recommend -d '{}'` returns 400 (§7.3.4).
>
> **MUST NOT DO**: `app.useGlobalPipes` directly; `strictSchemaDeclaration:true` (defer); `.transform()` in shared schemas (R2); zod bundled in shared (R1); touch Better Auth / Prisma schema / throttler / Swagger / ci.yml / @nestjs/config.

#### 2.2.4 ORCHESTRATOR ADDENDUM template

```text
[ORCHESTRATOR ADDENDUM — current state at delegation time (not in plan §A.3, factual update from Sisyphus 2026-06-03)]

**HEAD at delegation**: `<handoff commit hash>` (docs(handoffs): w2-2 complete, wave 3a ready).
Working tree clean. 17+ commits ahead of origin/dev-monorepo (push deferred until W2-2.5 + Wave 3a complete).

**W2-2 closure state** (commit `f484ad5`, all 9 gates PASS):
- `auth.config.ts` exports: `betterAuth` instance + `assertSameSet` + `USER_ROLE_VALUES` + `ACCOUNT_TYPE_VALUES` + `AuthSession` + `AuthUser` types
- `apps/api/src/auth/` has: auth.config.ts, auth.config.spec.ts (5 cases), auth.controller.ts (/auth/me), auth.module.ts, better-auth.guard.ts, current-user.decorator.ts
- `apps/api/src/prisma/prisma.client.ts`: module-time singleton (Pattern (a); used by auth.config + future seed; NOT NestJS DI)
- `apps/api/src/prisma/prisma.service.ts`: NestJS DI; W2-2.5 commit `23d917a` added 20-line header + `HORIZONTAL_SCALE_TRIGGER` grep tag
- `apps/api/test/auth.e2e-spec.ts`: 3 cases (signup 200 + /auth/me 401 no-cookie + /auth/me 200 with cookie)
- `apps/api/test/jest-e2e.json`: `transformIgnorePatterns` includes better-auth + transitive ESM deps (do not weaken)
- `apps/api/package.json` has Better Auth deps (`better-auth@1.6.13` + `@better-auth/cli@1.4.21`); `nestjs-zod` may need install: `pnpm --filter @rootmatching/api add nestjs-zod`
- Husky pre-commit Node 22 PATH prefix MANDATORY per `apps/api/MIGRATION.md` warning (W2-2.5 commit `b059cad`)

**Shared package state** (`packages/shared/`):
- Read `packages/shared/src/types/` for current types
- Check if `LoginSchema`, `RegisterSchema`, `QuoteRequestDraftSchema` already exist as zod schemas (vs only as TS types)
- If schemas missing, derive from types as `z.object({...})` matching the type 1:1
- Mark each with `.meta({id: 'Name'})` for Swagger component naming (W2-6 dependency)

**Wave 3a parallel fire context**: W2-4 (Prisma seed) is firing in parallel as another agent. W2-4 touches `apps/api/prisma/` only; you touch `apps/api/src/matching/dto/`, `apps/api/src/auth/dto/`, `apps/api/src/app.module.ts`, `packages/shared/src/schemas/`. Zero overlap.

**Push policy at delegation time**: do NOT push. Orchestrator will push all commits after W2-2.5 + Wave 3a (W2-3 + W2-4) atomic commits complete.

[CONCISE REPORT FORMAT — 8 items matching W2-2 style]
1. Final commit hash + subject
2. §7.3.3 8 sub-steps matrix (✓/✗ per step)
3. §7.3.4 verification curl result (HTTP 400 + zod issues body)
4. 7 verification gates pass/fail (typecheck / lint / format:check / build / prisma generate / unit tests / validation.e2e-spec)
5. Files modified (path + lines table)
6. Shared schema additions/changes (Q for Q drift potential)
7. Deviations + justification
8. Open questions / follow-ups
```

### 2.3 W2-4 (Prisma seed for mock fixtures — M=2-3d)

#### 2.3.1 Plan reference

`.sisyphus/plans/phase-1-w2.md` v0.10 §A.4 — full 6-section delegation prompt. Reproduced inline below.

#### 2.3.2 Delegation call

```python
task(
  category="unspecified-high",
  load_skills=["git-master"],
  run_in_background=True,
  description="W2-4 Prisma seed (mock users + companies + quote requests via Better Auth signUpEmail)",
  prompt=<§2.3.3 prompt body + §2.3.4 ORCHESTRATOR ADDENDUM>
)
```

#### 2.3.3 Prompt body (verbatim from plan §A.4)

> See `.sisyphus/plans/phase-1-w2.md` v0.10 §A.4 — full 6-section prompt. Key highlights:
>
> **EXPECTED OUTCOME**: 9 deliverables 1:1 with §7.4.3 sub-steps — fixture triage (3 NOW: users / companies / requests; rest defer to Phase 2) / `00-users.ts` via `auth.api.signUpEmail` + role promotion via raw update / `10-companies.ts` upsert 1:1 / `20-quote-requests.ts` natural-key upsert (schema migration if needed) / `seed.ts` orchestrator with `$transaction` outside Better Auth signup / `seed.e2e-spec.ts` idempotency (2x run, same counts) / npm script `seed:reset` / atomic commit.
>
> **MUST DO**: Follow `apps/api/MIGRATION.md` (W2-2.5 commit `b059cad`) as canonical playbook; `auth.api.signUpEmail` for User creation (NOT raw `prisma.user.create`); password `TempPass!2026` (Q7); role promotion via raw `prisma.user.update` AFTER signup (Q6 server-managed); R1 Session side-effect mitigation (`asResponse:false` OR explicit deleteMany); 3-pass relation order with `console.assert` between passes (R2); §7.4.4 live gate returns `2 2 N`.
>
> **MUST NOT DO**: raw `prisma.user.create` (skips password hash); hardcode other passwords; include Phase 2 fixtures (transaction/dispute/messages/notifications/activityLogs); wrap Better Auth signup in transaction; modify `apps/web/src/data/*.ts`; touch Better Auth / ci.yml / throttler / Swagger / §11 decisions.

#### 2.3.4 ORCHESTRATOR ADDENDUM template

```text
[ORCHESTRATOR ADDENDUM — current state at delegation time (not in plan §A.4, factual update from Sisyphus 2026-06-03)]

**HEAD at delegation**: same as W2-3 (`<handoff commit hash>`). Wave 3a fires both in parallel.

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

**Wave 3a parallel fire context**: W2-3 is firing in parallel. W2-3 touches `apps/api/src/matching/dto/`, `apps/api/src/auth/dto/`, `apps/api/src/app.module.ts`, `packages/shared/src/schemas/`. You touch `apps/api/prisma/` only. Zero overlap.

**Push policy at delegation time**: do NOT push. Orchestrator will push all commits after Wave 3a + W2-2.5 atomic commits complete.

[CONCISE REPORT FORMAT — 8 items matching W2-2 style]
1. Final commit hash + subject
2. §7.4.3 9 sub-steps matrix (✓/✗ per step)
3. §7.4.4 verification pipe result (`prisma migrate reset --skip-seed → db seed → db seed → node -e count` final line: `2 2 N`)
4. 8 verification gates pass/fail (typecheck / lint / format:check / build / prisma generate / unit tests / new seed.e2e-spec / api e2e others)
5. Files modified + new files (path + lines table)
6. Schema migration (if QuoteRequest natural key added): migration filename + DDL
7. Deviations + justification (R1 Session mitigation choice; any Phase 2 fixtures triaged out)
8. Open questions / follow-ups
```

### 2.4 Wave 3a 검증 (양쪽 완료 후)

```bash
# W2-3 + W2-4 모두 완료 후 (system reminders 2개 도착 시):
pnpm -r typecheck && pnpm lint && pnpm format:check
pnpm --filter @rootmatching/api build && pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api test
pnpm --filter @rootmatching/api test:e2e   # auth + validation + seed + others
pnpm --filter @rootmatching/web exec playwright test
pnpm guard:no-mock-auth   # W2-2.5 Tier 2 regression guard

# Live verification
pnpm --filter @rootmatching/api exec prisma migrate reset --force --skip-seed && \
pnpm --filter @rootmatching/api exec prisma db seed && \
pnpm --filter @rootmatching/api exec prisma db seed && \
pnpm --filter @rootmatching/api exec node --env-file=.env -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([p.user.count(), p.company.count(), p.quoteRequest.count()])
  .then(([u,c,q]) => console.log(\`users=\${u} companies=\${c} requests=\${q}\`))
  .finally(() => p.\$disconnect());"
# Expected: users=2 companies=2 requests=N (idempotent on 2nd run)
```

### 2.5 Wave 3b 진입 (W2-3 + W2-4 모두 green 후)

W2-5 (Users + Companies modules, plan §7.5) — single agent, sequential.

→ plan v0.11 시점에 `§A.5` 추가 권장.

---

## 3. 모든 결정사항 / 알려진 이슈

### 3.1 ✅ Q1-Q10 RESOLVED + 모두 APPLIED

| Q                                   | 결정                                                                    | 적용                                                          |
| ----------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| Q1 dual-enum UserRole + AccountType | lowercase admin/member/operator + client/factory                        | ✅ W2-1 `467b73f`                                             |
| Q2 PK strategy                      | `cuid()`                                                                | ✅ W2-1 `467b73f`                                             |
| Q3 Neon CI branching                | Hybrid (ephemeral Neon + Docker pgvector)                               | ⏸ W2-7 적용 예정                                              |
| Q4 Throttler storage                | In-memory MVP + `HORIZONTAL_SCALE_TRIGGER` doc                          | ⏸ W2-6 적용 예정                                              |
| Q5 Better Auth cookies              | `BETTER_AUTH_URL.startsWith('https://')` 기반                           | ✅ W2-2 `f484ad5` — signup curl 응답 verbatim 확인            |
| Q6 additionalFields enum sync       | Prisma SoT + `assertSameSet` boot guard + accountType `validator.input` | ✅ W2-2 `f484ad5` — 5 regression cases PASS                   |
| Q7 Mock 비밀번호                    | dev/CI 고정 `TempPass!2026`                                             | ⏸ W2-4 적용 예정 (MIGRATION.md §3 명문화 완료)                |
| Q8 Option C 위치                    | Direct in `MatchingModule`                                              | ⏸ Wave 4a 적용 예정                                           |
| Q9 Better Auth CLI version          | dry-run FAILED → fallback (c) hand-authored                             | ✅ W2-2 `f484ad5` (deferred: re-attempt when CLI 1.6.x ships) |
| Q10 CI Node 22 mismatch             | ci.yml + package.json engines                                           | ✅ commit `13e90c1`; CI validation pending push               |

### 3.2 W2-2.5 진행 상태

| Tier     | 항목                                      | 상태                             |
| -------- | ----------------------------------------- | -------------------------------- |
| 1 MUST   | §3.1.1 MIGRATION.md                       | ✅ `b059cad`                     |
| 1 MUST   | §3.1.2 PrismaService Pattern (a) backfill | ✅ `23d917a`                     |
| 1 MUST   | §3.1.3 Q9 status update                   | ✅ `5c0b536`                     |
| 2 SHOULD | §3.2.1 mock auth regression guard CI      | ✅ `bec8a14`                     |
| 2 SHOULD | §3.2.2 plan v0.10 + handoff v1.2          | ✅ [this commit]                 |
| 3 NICE   | §3.3.1 husky Node 22 PATH 자동화          | ⏸ Optional (max W2-7 전)         |
| 3 NICE   | §3.3.2 delegation AC pattern doc          | ⏸ Optional                       |
| 3 NICE   | §3.3.3 2 Prisma client 결정               | ⏸ Optional (W2-6에 fold-in 가능) |

### 3.3 🔴 외부 의존성 (사용자가 해결, Blocking phases)

| #   | 항목                                              | Blocking            | Action                                    |
| --- | ------------------------------------------------- | ------------------- | ----------------------------------------- |
| 1   | `(client)/quotes` 라우트-디자인 모순              | Phase 2 진입 전     | 디자인 결정 + 라우트 그룹 이동 PR         |
| 2   | 모두싸인 / 이폼사인 업체 선정 + API 키            | Phase 3 진입 전     | 업체 contract + 키 발급                   |
| 3   | 토스페이먼츠 escrow KYC                           | Phase 4 진입 전     | 사업자 KYC 완료                           |
| 4   | Prod 도메인 확정 (`crossSubDomainCookies.domain`) | W2-2 prod deploy 전 | `rootmatching.com` 확정 or 대체           |
| 5   | Neon region 결정                                  | Prod 이전 시        | us-east-2 → ap-northeast-2 재생성 or 이동 |
| 6   | 카카오 알림톡 비즈니스 계정                       | Phase 5 알림 시     | Bizmsg/NHN 계정 + 템플릿 등록             |

### 3.4 🟡 Deferred (non-blocking)

- Q11 `prisma.config.ts` migration → Prisma 7 upgrade 시
- PrismaService Pattern (a) → (b) refactor → W2-6 또는 Phase 2 trigger 충족 시 (`HORIZONTAL_SCALE_TRIGGER` grep tag)
- 2 Prisma client 버전 공존 (5.22.0 transitive + 6.19.3 direct) → W2-2.5 Tier 3 §3.3.3
- Throttler periodic compaction → Phase 2 traffic 시
- 3 `<img>` LCP lint warning → Phase 2 UI 작업
- Design system upgrade → 별도 wave (visual-engineering category; `docs/specs/design-system-upgrade.md` §10 prompt ready)

### 3.5 무해한 warning (현 시점 무시 가능)

- pnpm `ERR_PNPM_IGNORED_BUILDS` (Prisma engines lazy-download)
- Next.js plugin warning (`Pages directory cannot be found` — App Router라 무해)
- Prisma `package.json#prisma` deprecation (Q11 RESOLVED-DEFERRED)

---

## 4. 핵심 파일 인벤토리

### 4.1 코드 (committed)

#### W2-2 (`f484ad5`):

- `apps/api/src/auth/auth.config.ts` (93 lines, §11.1 canonical template)
- `apps/api/src/auth/auth.config.spec.ts` (70 lines, 5 drift-guard cases)
- `apps/api/src/auth/auth.controller.ts` (13 lines, `/auth/me`)
- `apps/api/src/auth/auth.module.ts` (10 lines)
- `apps/api/src/auth/better-auth.guard.ts` (30 lines)
- `apps/api/src/auth/current-user.decorator.ts` (12 lines)
- `apps/api/src/prisma/prisma.client.ts` (8 lines + W2-2 header)
- `apps/api/src/main.ts` (Express adapter mount; bodyParser:false; cookieParser → CORS → toNodeHandler → json + urlencoded → listen)
- `apps/api/src/app.module.ts` (registers AuthModule)
- `apps/api/test/auth.e2e-spec.ts` (93 lines, 3 cases)
- `apps/api/test/jest-e2e.json` (transformIgnorePatterns for ESM)
- `apps/web/src/lib/auth-client.ts` (25 lines, createAuthClient + inferAdditionalFields)
- `apps/web/src/middleware.ts` (getSessionCookie optimistic redirect)
- `apps/web/src/state/UserContext.tsx` (subscribes useSession; mockCompanies[0] fallback for company)
- `apps/web/src/app/login/page.tsx` (authClient.signIn.email / signUp.email)
- `apps/web/src/app/role-select/page.tsx` (authClient.updateUser({accountType}))
- `apps/web/src/components/auth/AuthModal.tsx` (same auth-client migration)
- `apps/web/playwright.config.ts` (19 lines)
- `apps/web/tests/auth.spec.ts` (33 lines, signup smoke)
- `apps/web/.env.local.example` + `.env.example` (NEXT_PUBLIC_API_URL)
- DELETED: `apps/web/src/lib/auth-cookie.ts`

#### W2-2.5 (`b059cad`, `23d917a`, `5c0b536`, `bec8a14`, [this]):

- `apps/api/MIGRATION.md` (352 lines)
- `apps/api/src/prisma/prisma.service.ts` (+20 line header)
- `apps/api/scripts/check-no-mock-auth.sh` (96 lines, executable)
- `package.json` + `guard:no-mock-auth` script
- `.github/workflows/ci.yml` + matrix task `guard:no-mock-auth`

### 4.2 문서 (committed; living)

- **본 핸드오프 (entry point)**
- `docs/handoffs/2026-06-03-w2-1-complete-w2-2-ready.md` v1.1 (이전 entry-point, frozen)
- `docs/handoffs/2026-06-03-scenario-b-complete-w2-1-ready.md` v1.0 (W2-1 진입 전)
- `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md` v1.0 (Pre-Flight audit trail)
- `docs/handoffs/2026-05-26-phase-1-week-1-complete.md` v1.1 (Phase 1.W1)
- `docs/plans/mvp-roadmap.md` v1.1+ (Phase 1.W2 진행도 갱신)
- `docs/specs/w2-2.5-followup-backlog.md` v0.2 (Tier 1+2 ✅, Tier 3 잔여)
- `docs/specs/prisma-service-pattern.md` v0.1
- `docs/specs/design-system-upgrade.md` v0.1
- `docs/specs/matching-endpoint-design-decision.md`
- `docs/specs/backend-design-mapping.md`
- `docs/specs/rootmatching-erd.md`
- `docs/specs/functional-spec.md`
- `docs/prd/rootmatching-prd.md` v0.4

### 4.3 로컬 전용 (gitignored)

- `.sisyphus/plans/phase-1-w2.md` v0.10 (살아있는 plan; §A.1 W2-1 / §A.2 W2-2 / §A.3 W2-3 / §A.4 W2-4 delegation prompts)
- `apps/api/.env` (Neon credentials + Better Auth secrets)

---

## 5. 환경 정보

```text
OS:           macOS (darwin)
Node:         v22.22.3 (nvm) — 필수 ≥ 22.13
pnpm:         11.3.0 (corepack)
저장소:        /Users/uni-claw/dev/root-match
remote:       origin (push 정책: 명시 요청 시에만)
Neon:         Postgres 18.4 / us-east-2 / branch `production` / pgvector 0.8.1
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
pnpm guard:no-mock-auth   # NEW W2-2.5 Tier 2

# 풀 빌드 + 테스트
pnpm -r run build && pnpm -r test && pnpm --filter @rootmatching/api test:e2e

# Web Playwright
pnpm --filter @rootmatching/web exec playwright test

# Prisma
pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api exec prisma migrate dev --name <name>
pnpm --filter @rootmatching/api exec prisma migrate status
pnpm --filter @rootmatching/api exec prisma studio

# Health smoke
curl -s http://localhost:3001/health/db | jq

# Auth signup smoke (live)
curl -i -X POST http://localhost:3001/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@rootmatching.dev","password":"TempPass!2026","name":"Tester","accountType":"client"}'
# 기대: HTTP 200 + Set-Cookie: better-auth.session_token=...; HttpOnly; SameSite=Lax (NO Secure in dev)
```

---

## 6. 다음 세션 첫 메시지 후보

### 후보 1 — 즉시 Wave 3a 진입 (가장 권장)

> "W2-2 + W2-2.5 Tier 1+2 다 끝났고 handoff doc 읽으면 zero-context. plan §A.3 + §A.4 prompt + ORCHESTRATOR ADDENDUM (handoff §2.2.4 + §2.3.4) 추가해서 W2-3 + W2-4 병렬 fire 해줘."

### 후보 2 — push 먼저 (Q10 CI validation)

> "17+ commits 다 push 해서 CI 통과 확인하자 (Q10 fix validation gate). 그 다음 Wave 3a (W2-3 + W2-4 병렬)."

### 후보 3 — W2-2.5 Tier 3 먼저

> "Wave 3a 진입 전에 W2-2.5 Tier 3 처리하자: §3.3.1 husky 자동화 + §3.3.2 delegation AC pattern doc. 그 다음 Wave 3a."

### 후보 4 — Design system 별도 wave

> "Wave 3a 병렬 진입과 동시에 design system upgrade도 fire하자 (`docs/specs/design-system-upgrade.md` §10 prompt — visual-engineering category). 3 agents 동시 진행."

---

## 7. 참고 문서

| 파일                                                            | 역할                                         |
| --------------------------------------------------------------- | -------------------------------------------- |
| `docs/handoffs/2026-06-03-w2-1-complete-w2-2-ready.md` v1.1     | 이전 entry-point (W2-1 closure 시점, frozen) |
| `docs/handoffs/2026-06-03-scenario-b-complete-w2-1-ready.md`    | Scenario B closure                           |
| `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md`     | Pre-Flight audit trail                       |
| `docs/handoffs/2026-05-26-phase-1-week-1-complete.md`           | Phase 1.W1 완료                              |
| `.sisyphus/plans/phase-1-w2.md` v0.10 §7.3 + §7.4 + §A.3 + §A.4 | Wave 3a sub-steps + delegation prompts       |
| `docs/specs/w2-2.5-followup-backlog.md` v0.2                    | W2-2.5 항목 진행 상태                        |
| `docs/specs/prisma-service-pattern.md` v0.1                     | Pattern (a)/(b) 결정 + trigger               |
| `docs/specs/design-system-upgrade.md` v0.1                      | Toss tokens + 시니어 친화 (별도 wave)        |
| `apps/api/MIGRATION.md` v0.1                                    | W2-4 mock→real user 절차 (canonical)         |
| `docs/plans/mvp-roadmap.md` v1.1+                               | Phase 1.W2 진행도 + Phase 2-6 backlog        |

---

## 8. 변경 이력 (이 핸드오프 문서)

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-06-03 | W2-2 closure (`f484ad5`, 9/9 gates) + W2-2.5 Tier 1 (`b059cad`/`23d917a`/`5c0b536`) + Tier 2 (`bec8a14`/[this]) + design system upgrade spec (`ae4fe12`) 시점 신규 entry-point doc 작성. Wave 3a 진입을 위한 W2-3 + W2-4 delegation 가이드 + ORCHESTRATOR ADDENDUM template 2개 (§2.2.4, §2.3.4) 명시. 17+ commits ahead 상태. Q5/Q6 ✅ APPLIED (W2-2 commit), Q9 ✅ RESOLVED-FALLBACK. plan v0.10 (gitignored) §A.3 + §A.4 canonical prompts. 다음 세션 첫 메시지 후보 4개. 이전 entry-point doc은 historical reference로 보존. |
