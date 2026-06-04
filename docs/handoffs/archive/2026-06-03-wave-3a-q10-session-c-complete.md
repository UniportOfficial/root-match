# Session Handoff — 2026-06-03 (Wave 3a + Q10 CI 완료 + Session C 통합, Wave 3b 진입 준비)

> 다음 세션이 컨텍스트 없이 이어받을 수 있도록 정리한 **master reference doc**. 이전 master (`docs/handoffs/2026-06-03-w2-2-complete-wave-3a-ready.md` v1.1)는 W2-2 + W2-2.5 closure 시점의 historical reference로 보존; **본 doc이 현재 master**.

**현재 origin/dev-monorepo HEAD `6695887`** (push 완료 시 `[this handoff commit]`). Q10 CI quality matrix **5/5 green** 도달 (run 26884509375). Wave 3a (W2-3 + W2-4) + Session C design system + Q10 CI 모두 closure.

**이번 세션 산출물** (Wave 3a + Q10 + Session C 통합 closure, 단일 세션 multi-stage):

- Wave 3a atomic commits: `b5558a3` W2-3 nestjs-zod + `1b37cbe` W2-4 prisma seed
- Session C atomic commit: `3679a34` design system (toss tokens + WCAG AAA)
- Q10 CI closure cascade: `6cb22d9` (trigger) + `b89f7a6` (dead) + `bf7c0a7` (dead) + `0fe48aa` (allowBuilds map fix) + `7360d4f` (postinstall prisma generate)
- W2-2.5 backlog v0.4: `6695887` (§3.4 신규 6 follow-ups)
- 본 master handoff: `[this commit]`

**다음 작업**: Wave 3b — W2-5 (Users + Companies modules), W2-4 seed users 의존 e2e specs. plan §7.5 / §A.5 (다음 revision에서 정식 작성).

---

## Quick Reference

```text
저장소:        /Users/uni-claw/dev/root-match
활성 브랜치:    dev-monorepo (push 정책: 명시 요청 시에만; Q10 closure 시 한 차례 push 진행)
HEAD:          `6695887` (docs(specs): w2-2.5 backlog v0.4)  — 본 핸드오프 commit 직후 update
origin/dev-monorepo:  `6695887` (synced; push 완료 후 `[this commit]`)

핵심 commit chain (Wave 3a + Q10 + Session C, 새것 → 옛것):
  6695887 docs(specs): w2-2.5 backlog v0.4 (Wave 3a + Q10 + Session C closure + 6 follow-ups)
  7360d4f fix(ci): add postinstall: prisma generate to apps/api          ← Q10 fix #2 (REAL)
  0fe48aa fix(ci): use pnpm 11 allowBuilds map (replaces legacy onlyBuiltDependencies)  ← Q10 fix #1 (REAL)
  bf7c0a7 fix(ci): move pnpm onlyBuiltDependencies to workspace yaml (pnpm 11)  ← dead (legacy field)
  b89f7a6 chore: allow approved postinstall scripts at root package.json (pnpm 11)  ← dead (pnpm 9082)
  6cb22d9 ci: add dev-monorepo to push triggers (Q10 validation unlock)
  3679a34 feat(web,design): adopt toss tokens + senior-friendly overlay (WCAG AAA)   ← Session C
  b5558a3 feat(api): nestjs-zod global validation + matching/auth DTOs   ← Wave 3a W2-3
  1b37cbe feat(api): prisma seed for mock fixtures (...)                 ← Wave 3a W2-4
  01f5c93 docs(handoffs): split next work into 2 session-specific entry-points (B wave-3a + C design-system)
  7641e8a docs(specs): w2-2.5 backlog v0.3
  ...

런타임 요구:    Node ≥ 22.13 (pnpm 11.3.0이 Node 20에서 ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite)
                매 세션 첫 명령: `nvm use 22`
                commit 시 PATH prefix:
                  `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"`
                (husky pre-commit hook이 fresh subshell에서 Node 잡을 때 필요)

핵심 문서:
  - 본 핸드오프 (현재 master, Wave 3b 진입 준비)
  - docs/handoffs/2026-06-03-w2-2-complete-wave-3a-ready.md v1.1 (이전 master, frozen at W2-2/W2-2.5 closure)
  - docs/handoffs/2026-06-03-session-wave-3a.md (Session B entry-point, frozen)
  - docs/handoffs/2026-06-03-session-design-system.md (Session C entry-point, frozen)
  - .sisyphus/plans/phase-1-w2.md v0.10 (gitignored; §A.5 W2-5 prompt 작성 필요)
  - docs/specs/w2-2.5-followup-backlog.md v0.4 (Tier 1+2 W2-2.5 closure + §3.4 신규 6 항목)
  - docs/specs/design-system-upgrade.md v0.1 (Session C 적용 완료)
  - docs/specs/prisma-service-pattern.md v0.1
  - apps/api/MIGRATION.md v0.1 (§8 zod v4 + better-call ADR 추가 필요 — backlog §3.4.4)
  - docs/plans/mvp-roadmap.md v1.1+

다음 작업 순서:
  1. (현 세션 종료 시) git push origin dev-monorepo (commits to push: 6695887 + 본 핸드오프 commit)
  2. (다음 세션) Wave 3b 진입 — W2-5 Users + Companies modules
     - plan §7.5 sub-steps 작성 + §A.5 delegation prompt 작성 (plan revision v0.11)
     - 본 핸드오프 §2 W2-5 진입 가이드 참조
  3. Wave 4: Option C β (W2-6 보안+Swagger 의존)
  4. Wave 5: W2-7 E2E + Neon CI branching
```

---

## 1. Wave 3a + Q10 + Session C closure 요약

### 1.1 Wave 3a — W2-3 + W2-4 (병렬 fire, atomic commits)

| 항목                  | W2-3 (`b5558a3`)                                                                                                                                                                          | W2-4 (`1b37cbe`)                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent                 | Sisyphus-Junior (category: quick), 13m                                                                                                                                                    | Sisyphus-Junior (category: unspecified-high), 12m 40s                                                                                                       |
| Files changed         | 11 (+179 / -68)                                                                                                                                                                           | 9 (+340 / -8)                                                                                                                                               |
| Verification          | 8/8 sub-steps (§7.3.3) + curl gate HTTP 400 + 7 gates pass                                                                                                                                | 9/9 sub-steps (§7.4.3) + live pipe `2 2 3` idempotent + 8 gates pass                                                                                        |
| 주요 파일             | `app.module.ts` (APP_PIPE) / `auth/dto/{login,register}.dto.ts` / `matching/dto/quote-request-draft.dto.ts` / `validation.e2e-spec.ts` / `packages/shared/src/schemas/{matching,user}.ts` | `prisma/seed.ts` (orchestrator) / `seed/{00-users,10-companies,20-quote-requests}.ts` / migration `add_quote_request_natural_key` / `test/seed.e2e-spec.ts` |
| 주요 deviation        | **zod v3 → v4** bump (`.meta({id})` v4 전용) + `better-call@1.3.5` 명시 pin (Better Auth peer 호환)                                                                                       | R1 mitigation choice: 명시 `prisma.session.deleteMany({ where: { userId } })` after user pass (signup outside `$transaction`)                               |
| Resolved Q references | Q6 (role/accountType shared types from W2-2) + R1 (shared zod peerDep) + R2 (no `.transform()`)                                                                                           | Q7 (TempPass!2026) + Q6 (role promotion via raw update) + MIGRATION.md §5 (relation order)                                                                  |

### 1.2 Session C — design system upgrade (`3679a34`)

| 항목                        | 결과                                                                                                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agent                       | Sisyphus-Junior (visual-engineering), frontend-ui-ux skill                                                                                                                                                                                             |
| Files changed               | 7 (apps/web 6 + docs/design-system.md 1)                                                                                                                                                                                                               |
| 주요 파일                   | `apps/web/src/app/globals.css` (18px base + WCAG focus-visible + 48px button minimum) / `tailwind.config.ts` (token 확장 +131 lines) / `apps/web/src/components/{layout/AppHeader,ui/{AppBadge,AppButton,ProcessStepper}}.tsx` (semantic color tokens) |
| Lighthouse a11y (×5 routes) | ✅ 100/100/100/100/100                                                                                                                                                                                                                                 |
| WCAG AAA contrast           | ✅ body 11:1, heading 16.56:1, brand 8.17:1, danger 7.59:1                                                                                                                                                                                             |
| Playwright signup smoke     | ✅ signup → better-auth.session_token → /dashboard (3.7s)                                                                                                                                                                                              |
| 외부 영향                   | Wave 3a apps/api 영역 zero overlap (handoff §8 작업 금지 영역 완전 분리 준수)                                                                                                                                                                          |
| Phase 2 follow-ups          | (a) `(client)/quotes` 라우트-디자인 모순 해소 (mvp-roadmap §6.1.3); (b) 22개 미검증 라우트 visual regression (자연 갱신)                                                                                                                               |

### 1.3 Q10 CI closure (5-commit cascade)

Wave 3a + Session C origin 반영 후 push만으론 CI 미발동 — `.github/workflows/ci.yml`의 `push.branches: [main, dev]`에 `dev-monorepo` 없음. 그 unlock부터 시작해서 pnpm 11 정책 + prisma generate 누락까지 cascade 해소.

| #   | Commit                                                          | 가설/실제                                                    | 결과                                                                                        |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | `6cb22d9 ci: add dev-monorepo to push triggers`                 | dev-monorepo branch trigger                                  | CI 발동 OK, 5/5 fail at install                                                             |
| 2   | `b89f7a6 chore: package.json#pnpm.onlyBuiltDependencies`        | 가설 (틀림): pnpm 11이 `package.json#pnpm` 읽음              | [pnpm/issues/9082](https://github.com/pnpm/pnpm/issues/9082) — workspace에서 무시. **dead** |
| 3   | `bf7c0a7 fix(ci): workspace.yaml onlyBuiltDependencies` (list)  | 가설 (틀림): legacy 형식 honor됨                             | pnpm 11이 `allowBuilds:` (map of bool)로 대체, list 형식 무시. **dead**                     |
| 4   | `0fe48aa fix(ci): use pnpm 11 allowBuilds map`                  | REAL fix: pnpm 11 release notes 형식 (map of `true`/`false`) | install 통과 (10.4s), 5/5 → 3/5 (typecheck/build fail)                                      |
| 5   | `7360d4f fix(ci): add postinstall: prisma generate to apps/api` | REAL fix: 명시적 prisma generate via postinstall             | typecheck/build pass, **5/5 green**                                                         |

**최종 CI run 26884509375** (HEAD `7360d4f`):

| Job                | Conclusion | Duration |
| ------------------ | ---------- | -------- |
| guard:no-mock-auth | ✅         | 25s      |
| format:check       | ✅         | 35s      |
| lint               | ✅         | 31s      |
| typecheck          | ✅         | 39s      |
| build              | ✅         | 55s      |

→ **Q10 CI quality matrix 5/5 green**. dev-monorepo HEAD `7360d4f`의 결합 상태 (Wave 3a + Session C 모두 포함) 정적 분석 + 빌드 통과 증명.

### 1.4 통합 검증 매트릭스 (local + CI)

| Gate                    | Session C local | Session B local       | CI (run 26884509375)               |
| ----------------------- | --------------- | --------------------- | ---------------------------------- |
| typecheck               | ✅              | ✅                    | ✅ 39s                             |
| lint                    | ✅              | ✅                    | ✅ 31s                             |
| format:check            | ✅              | ✅                    | ✅ 35s                             |
| build                   | ✅              | ✅                    | ✅ 55s                             |
| guard:no-mock-auth      | ✅              | ✅                    | ✅ 25s                             |
| Playwright signup smoke | ✅ (3.7s)       | —                     | — (matrix 미포함; §3.4.2)          |
| Lighthouse a11y ×5      | ✅ 100×5        | —                     | — (matrix 미포함)                  |
| WCAG AAA contrast       | ✅              | —                     | — (matrix 미포함)                  |
| api e2e `--runInBand`   | —               | ✅ 5 suites / 8 tests | — (matrix 미포함; §3.4.1 + §3.4.2) |

→ local + CI 양쪽 green. e2e + visual은 CI matrix에 아직 미포함 (`backlog v0.4 §3.4.1/§3.4.2` Tier 2 follow-up).

---

## 2. Wave 3b 진입 가이드 (W2-5 Users + Companies modules)

W2-3 + W2-4 모두 green이므로 Wave 3b 진입 가능. **W2-4 seed users (`hong@techsolution.co.kr` client + `factory@example.kr` factory)에 의존하는 e2e specs 작성**이 핵심.

### 2.1 Plan reference

`.sisyphus/plans/phase-1-w2.md` v0.10에는 §A.1 W2-1 / §A.2 W2-2 / §A.3 W2-3 / §A.4 W2-4 delegation prompts만 정의. **§7.5 (W2-5 sub-steps) + §A.5 (W2-5 delegation prompt) 다음 plan revision에서 정식 작성 필요**.

W2-5 작업 범위 추정 (mvp-roadmap.md / docs/specs/backend-design-mapping.md 참조):

- `apps/api/src/users/`: NestJS module + service + controller (`/users/me` GET, `/users/me` PATCH for profile update)
- `apps/api/src/companies/`: NestJS module + service + controller (`/companies/me` GET, `/companies/me` PATCH)
- DTOs: `packages/shared/src/schemas/` 에 `UserProfileSchema`, `CompanyUpdateSchema` 추가 + W2-3에서 만든 `createZodDto()` pattern 적용
- e2e tests: `apps/api/test/users.e2e-spec.ts` + `companies.e2e-spec.ts` (seed users로 signin → JWT cookie → /users/me 호출)
- 의존: W2-3 (zod DTOs) + W2-4 (seed users) — Wave 3a 모두 closure 완료 ✅

### 2.2 Delegation call (template)

```python
task(
  category="unspecified-high",  # 2 modules + 4 controllers + e2e = SHOULD be unspecified-high
  load_skills=["git-master"],
  run_in_background=True,
  description="W2-5 Users + Companies modules + DTOs + e2e (depends on W2-4 seed users)",
  prompt=<§2.3 prompt body + §2.4 ORCHESTRATOR ADDENDUM>
)
```

### 2.3 Prompt body skeleton (plan §A.5 — 정식 작성 시점에 확장)

```text
[TASK]
Execute Phase 1.W2-5 per .sisyphus/plans/phase-1-w2.md §7.5 (sub-steps 정식 작성 필요). Closes phase-1-W2-5. M=2d.

GOAL: NestJS Users + Companies modules + controllers + DTOs (via nestjs-zod from W2-3) + e2e tests asserting against seed users from W2-4.

[EXPECTED OUTCOME] — N atomic deliverables matching §7.5.3 sub-steps 1:1.

1. `apps/api/src/users/users.module.ts` + `users.service.ts` + `users.controller.ts` (/users/me GET + PATCH)
2. `apps/api/src/companies/companies.module.ts` + `companies.service.ts` + `companies.controller.ts` (/companies/me GET + PATCH)
3. `packages/shared/src/schemas/`: `UserProfileSchema`, `CompanyUpdateSchema` + `.meta({id})` for W2-6 Swagger
4. `apps/api/src/{users,companies}/dto/`: `createZodDto()` from W2-3 pattern
5. `app.module.ts`: register UsersModule + CompaniesModule
6. `apps/api/test/users.e2e-spec.ts`: signin seed user → GET /users/me → expect seed user payload
7. `apps/api/test/companies.e2e-spec.ts`: signin seed user → GET /companies/me → expect seed company payload (테크솔루션 for client, 박공장 가공소 for factory)
8. Single atomic commit: `feat(api): users + companies modules + DTOs + e2e (W2-5)`

[REQUIRED TOOLS]
- mcp_Read, mcp_Write, mcp_Edit
- mcp_Bash (Node 22 prefix; pnpm; git; supertest)
- mcp_Lsp_diagnostics
- mcp_Grep / mcp_Glob

[MUST DO]
- Node 22 in every bash: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && ...`
- Husky pre-commit hook: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` BEFORE every `git commit`.
- Reuse `BetterAuthGuard` from W2-2 (apps/api/src/auth/better-auth.guard.ts) for `/users/me` + `/companies/me` protection
- Reuse `@CurrentUser()` decorator from W2-2 (apps/api/src/auth/current-user.decorator.ts)
- Use `createZodDto()` from W2-3 pattern (apps/api/src/{auth,matching}/dto/*.dto.ts examples)
- e2e tests use seed users (hong@techsolution.co.kr + factory@example.kr) — both signin with TempPass!2026
- `--runInBand` for e2e if backlog §3.4.1 fix not yet applied (avoid jest worker race with seed.e2e-spec)
- Verification gates before commit: typecheck + lint + format:check + build + prisma generate + unit tests + new e2e specs PASS

[MUST NOT DO]
- Use raw `prisma.user.create` / `prisma.company.create` for seed-like operations — this task only READS via service
- Touch Better Auth code (W2-2 territory)
- Touch Prisma schema (W2-4 territory for seed-related migrations)
- Touch nestjs-zod global setup (W2-3 done; reuse pattern only)
- Touch throttler / helmet / Swagger config — W2-6 territory
- Touch `.github/workflows/ci.yml`
- Modify §11 / §11.1 decisions (already RESOLVED)
- Touch `apps/web/**` (not in Wave 3b scope)

[CONTEXT]
- W2-2 (commit `f484ad5`): auth.config.ts + BetterAuthGuard + CurrentUser decorator live
- W2-3 (commit `b5558a3`): `createZodDto()` + APP_PIPE wiring + auth/matching DTOs reference patterns
- W2-4 (commit `1b37cbe`): seed users + companies + prisma.user.update for role promotion
- Wave 3a/Q10 closure: handoff `docs/handoffs/2026-06-03-wave-3a-q10-session-c-complete.md` v1.0
- nestjs-zod, zod v4, better-call@1.3.5 already pinned in apps/api/package.json
```

### 2.4 ORCHESTRATOR ADDENDUM template

```text
[ORCHESTRATOR ADDENDUM — current state at delegation time (not in plan §A.5, factual update from Sisyphus 2026-06-03+)]

**HEAD at delegation**: `<this handoff commit hash>` (docs(handoffs): wave 3a + q10 + session c complete v1.0).
Working tree clean. Push 정책: 명시 요청 시에만 (Q10 closure 시 한 차례 push 완료).

**Wave 3a state** (CI matrix 5/5 green):
- W2-3 `b5558a3`: APP_PIPE global ZodValidationPipe + `createZodDto()` pattern (apps/api/src/{auth,matching}/dto/*.dto.ts 참고)
- W2-4 `1b37cbe`: seed users (hong@techsolution.co.kr client + factory@example.kr factory) + seed companies (테크솔루션 + 박공장 가공소) + 3 quote requests; password `TempPass!2026`; schema migration `add_quote_request_natural_key`
- zod v4 + better-call@1.3.5 pinned (apps/api/package.json) — runtime peer 호환 검증됨

**Session C state** (CI matrix 5/5 green):
- `3679a34`: apps/web design system upgrade (Toss tokens + senior-friendly WCAG AAA). 시각적 변경 only; apps/api / packages/shared / W2-2 산출물 / ci.yml 모두 untouched.

**Q10 closure**:
- ci.yml push triggers + pnpm-workspace.yaml `allowBuilds:` map + apps/api `postinstall: prisma generate` 적용
- CI run 26884509375: 5/5 green (lint 31s / format:check 35s / typecheck 39s / build 55s / guard:no-mock-auth 25s)

**Backlog v0.4 (`6695887`)**:
- §3.4 신규 6 follow-ups; 본 W2-5 작업과 직접 의존하는 항목:
  - §3.4.1: test:e2e `--runInBand` (jest worker race; W2-5 e2e 실행 시 영향) — W2-5 commit 전에 본 fix 먼저 권장 또는 W2-5 commit이 직접 `--runInBand` 채택
  - §3.4.4: MIGRATION.md §8 zod v4 + better-call@1.3.5 ADR (W2-5 작업에는 영향 없음, 별도 task)

**Wave 3a parallel fire context**: W2-3 + W2-4는 atomic commits로 완료, Wave 3b는 sequential (의존성: W2-5 e2e가 W2-4 seed users 의존). 단일 agent.

**Husky pre-commit Node 22 PATH**: MANDATORY. `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` before EVERY `git commit`.

**Push policy at delegation time**: do NOT push. Orchestrator will push after W2-5 atomic commit complete.

[CONCISE REPORT FORMAT — 8 items matching W2-2 / Wave 3a style]
1. Final commit hash + subject (`feat(api): users + companies modules + DTOs + e2e (W2-5)`)
2. §7.5.3 N sub-steps matrix (✓/✗ per step)
3. e2e verification: users.e2e + companies.e2e PASS counts + key assertions
4. N verification gates pass/fail (typecheck / lint / format:check / build / prisma generate / unit tests / new e2e specs / api e2e others)
5. Files modified + new files (path + lines table)
6. Shared schema additions (UserProfileSchema, CompanyUpdateSchema with `.meta({id})` for W2-6)
7. Deviations + justification
8. Open questions / follow-ups
```

### 2.5 Wave 3b 검증 (W2-5 완료 후)

```bash
# 매 변경 후
pnpm -r typecheck && pnpm lint && pnpm format:check
pnpm guard:no-mock-auth

# Wave 3b 검증
pnpm --filter @rootmatching/api build && pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api test          # unit
pnpm --filter @rootmatching/api test:e2e --runInBand   # users + companies + auth + validation + seed + others (race 회피)
pnpm --filter @rootmatching/web exec playwright test

# Live verification
pnpm --filter @rootmatching/api exec prisma migrate reset --force --skip-seed && \
pnpm --filter @rootmatching/api exec prisma db seed && \
pnpm dev &
sleep 8

# signin + /users/me
curl -i -X POST http://localhost:3001/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"hong@techsolution.co.kr","password":"TempPass!2026"}' \
  -c /tmp/cookies.txt
curl -i http://localhost:3001/users/me -b /tmp/cookies.txt
# 기대: HTTP 200 + payload { email: "hong@techsolution.co.kr", name: "홍길동", accountType: "client", role: "admin", ... }

# /companies/me
curl -i http://localhost:3001/companies/me -b /tmp/cookies.txt
# 기대: HTTP 200 + payload { name: "테크솔루션", ... }
```

### 2.6 Wave 4 진입 (W2-5 green 후)

- **W2-6 보안 + Swagger** — throttler + helmet + nestjs-pino + Swagger generation (W2-3의 `.meta({id})` schemas 활용). Q4 (Throttler in-memory MVP + `HORIZONTAL_SCALE_TRIGGER` doc) + Q8 (Option C 위치 결정 시점) 적용.
- **Option C β** — `MatchingModule` 내부 직접 구현 (Q8 결정). W2-1 fixtures를 W2-4 DB로 마이그레이션.

---

## 3. 모든 결정사항 / 알려진 이슈

### 3.1 Q1-Q10 RESOLVED 상태 (Q10 ✅ CI VALIDATED)

| Q                                   | 결정                                                         | 적용                                                                                      |
| ----------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Q1 dual-enum UserRole + AccountType | lowercase admin/member/operator + client/factory             | ✅ W2-1 `467b73f`                                                                         |
| Q2 PK strategy                      | `cuid()`                                                     | ✅ W2-1 `467b73f`                                                                         |
| Q3 Neon CI branching                | Hybrid (ephemeral Neon + Docker pgvector)                    | ⏸ W2-7 적용 예정 (backlog §3.4.2 deps)                                                    |
| Q4 Throttler storage                | In-memory MVP + `HORIZONTAL_SCALE_TRIGGER` doc               | ⏸ W2-6 적용 예정                                                                          |
| Q5 Better Auth cookies              | `BETTER_AUTH_URL.startsWith('https://')` 기반                | ✅ W2-2 `f484ad5`                                                                         |
| Q6 additionalFields enum sync       | Prisma SoT + `assertSameSet` + `accountType validator.input` | ✅ W2-2 `f484ad5`                                                                         |
| Q7 Mock 비밀번호                    | dev/CI 고정 `TempPass!2026`                                  | ✅ W2-4 `1b37cbe` (MIGRATION.md §3 + seed/00-users.ts 적용)                               |
| Q8 Option C 위치                    | Direct in `MatchingModule`                                   | ⏸ Wave 4a 적용 예정                                                                       |
| Q9 Better Auth CLI version          | fallback (c) hand-authored                                   | ✅ W2-2 `f484ad5`                                                                         |
| Q10 CI Node 22 mismatch             | ci.yml + package.json engines                                | ✅ commit `13e90c1` + **Q10 CI validation 5/5 green at run 26884509375 (HEAD `7360d4f`)** |
| Q11 prisma.config.ts migration      | Prisma 7 upgrade 시                                          | ⏸ Deferred (deprecation warn 감수)                                                        |

### 3.2 Wave 3a / Session C / Q10 closure 상태

| Wave/Stage  | 항목                                             | 상태                                      |
| ----------- | ------------------------------------------------ | ----------------------------------------- |
| Wave 3a     | W2-3 nestjs-zod global validation + DTOs         | ✅ `b5558a3`                              |
| Wave 3a     | W2-4 prisma seed + schema migration              | ✅ `1b37cbe`                              |
| Session C   | Design system (Toss tokens + WCAG AAA)           | ✅ `3679a34`                              |
| Q10 closure | ci.yml dev-monorepo push trigger                 | ✅ `6cb22d9`                              |
| Q10 closure | pnpm 11 allowBuilds: map (REAL fix)              | ✅ `0fe48aa`                              |
| Q10 closure | apps/api postinstall: prisma generate (REAL fix) | ✅ `7360d4f`                              |
| Q10 closure | dead intermediate attempts (PR squash 시 정리)   | ⚠️ `b89f7a6` + `bf7c0a7` (backlog §3.4.6) |
| Backlog     | v0.4 (§3.4 신규 6 follow-ups)                    | ✅ `6695887`                              |
| Handoff     | 본 master ref doc                                | ⏳ [this commit]                          |

### 3.3 Post-Wave 3a follow-ups (backlog v0.4 §3.4 reference)

| #      | 항목                                                          | Tier          | 우선순위                                                   |
| ------ | ------------------------------------------------------------- | ------------- | ---------------------------------------------------------- |
| §3.4.1 | apps/api test:e2e `--runInBand` (seed.e2e migrate-reset race) | Tier 2 SHOULD | **Wave 3b W2-5 진입 전 또는 W2-5 commit이 직접 채택 권장** |
| §3.4.2 | CI matrix에 test + test:e2e 추가                              | Tier 2 SHOULD | W2-7 Q3 hybrid CI 결정 시점                                |
| §3.4.3 | GH Actions Node 20 deprecation (deadline 2026-09-16)          | Tier 2 SHOULD | 마감 임박 시 (2026-08~09)                                  |
| §3.4.4 | MIGRATION.md §8 zod v4 + better-call ADR section              | Tier 2 SHOULD | W2-5 commit과 함께 또는 별도 작업                          |
| §3.4.5 | 22개 미검증 라우트 visual regression                          | Tier 3 NICE   | Phase 2 자연 갱신 (별도 작업 불필요)                       |
| §3.4.6 | PR squash 시 dead commit (b89f7a6 + bf7c0a7) 정리             | Tier 3 NICE   | dev-monorepo → main PR 시점                                |

### 3.4 외부 의존성 (사용자 해결, Blocking phases)

| #   | 항목                                 | Blocking        | Action                                                                       |
| --- | ------------------------------------ | --------------- | ---------------------------------------------------------------------------- |
| 1   | `(client)/quotes` 라우트-디자인 모순 | Phase 2 진입 전 | 디자인 결정 + 라우트 그룹 이동 PR (Session C closure에서 Phase 2로 deferred) |
| 2   | 모두싸인/이폼사인 업체 선정 + API 키 | Phase 3 진입 전 | 업체 contract + 키 발급                                                      |
| 3   | 토스페이먼츠 escrow KYC              | Phase 4 진입 전 | 사업자 KYC 완료                                                              |
| 4   | Prod 도메인 확정                     | Prod deploy 전  | `rootmatching.com` 확정 or 대체                                              |
| 5   | Neon region 결정                     | Prod 이전 시    | us-east-2 → ap-northeast-2 재생성                                            |
| 6   | 카카오 알림톡 비즈니스 계정          | Phase 5 알림 시 | Bizmsg/NHN 계정 + 템플릿 등록                                                |

### 3.5 무해한 warning (현 시점 무시 가능)

- Prisma `package.json#prisma` deprecation → Q11 RESOLVED-DEFERRED (Prisma 7 시점)
- Next.js plugin warning (`Pages directory cannot be found`) — App Router라 무해
- 2 `@prisma/client` versions 공존 (5.22.0 transitive + 6.19.3 direct) → backlog §3.3.3
- GitHub Actions Node 20 deprecation warning → backlog §3.4.3 (deadline 2026-09-16 BLOCKING)

---

## 4. 핵심 파일 인벤토리

### 4.1 Wave 3a commits files

#### W2-3 `b5558a3`:

- `apps/api/src/app.module.ts` (APP_PIPE ZodValidationPipe wiring)
- `apps/api/src/auth/dto/login.dto.ts` (NEW, 4 lines, `createZodDto(LoginSchema)`)
- `apps/api/src/auth/dto/register.dto.ts` (NEW, 4 lines, `createZodDto(RegisterSchema)`)
- `apps/api/src/matching/dto/quote-request-draft.dto.ts` (NEW, 6 lines)
- `apps/api/src/matching/matching.controller.ts` (`@Body() body: QuoteRequestDraftDto`)
- `apps/api/test/validation.e2e-spec.ts` (NEW, 51 lines, POST /matching/recommend {} → 400)
- `packages/shared/package.json` (`zod` peerDep + bump to v4)
- `packages/shared/src/schemas/index.ts` (`+1 line`, export matching)
- `packages/shared/src/schemas/matching.ts` (NEW, 26 lines, `QuoteRequestDraftSchema.meta({id})`)
- `packages/shared/src/schemas/user.ts` (`.meta({id})` 추가 on UserRoleSchema/LoginSchema/RegisterSchema)
- `pnpm-lock.yaml` (zod v4 + nestjs-zod + better-call resolution)
- `apps/api/package.json` (`nestjs-zod@5.4.0` + `zod@^4.4.3` + `better-call@1.3.5` pin)

#### W2-4 `1b37cbe`:

- `apps/api/prisma/schema.prisma` (+1 line, `@@unique([clientUserId, projectName])`)
- `apps/api/prisma/migrations/20260603010000_add_quote_request_natural_key/migration.sql` (NEW, 4 lines)
- `apps/api/prisma/seed.ts` (REWRITE, 63 lines, orchestrator with header comment citing MIGRATION.md §5)
- `apps/api/prisma/seed/00-users.ts` (NEW, 57 lines, `auth.api.signUpEmail` + role promotion)
- `apps/api/prisma/seed/10-companies.ts` (NEW, 73 lines, `prisma.company.upsert({where:{userId}})`)
- `apps/api/prisma/seed/20-quote-requests.ts` (NEW, 92 lines, natural-key upsert + `quoteRequestFixtureCount` export)
- `apps/api/test/seed.e2e-spec.ts` (NEW, 55 lines, idempotent counts)
- `apps/api/test/schema.snapshot.spec.ts` (+1 line, natural key field)
- `apps/api/package.json` (`seed:reset` script)

### 4.2 Session C commits files

#### `3679a34`:

- `apps/web/src/app/globals.css` (18px base + WCAG focus-visible 3px outline + 48px button minimum + sr-only)
- `apps/web/tailwind.config.ts` (+131 lines, semantic color tokens — brand/success/warning/danger/surface/ink scales)
- `apps/web/src/components/layout/AppHeader.tsx` (semantic color migration)
- `apps/web/src/components/ui/AppBadge.tsx` (`BadgeSize` type + `yellow|red` variants + semantic tokens)
- `apps/web/src/components/ui/AppButton.tsx` (semantic color migration)
- `apps/web/src/components/ui/ProcessStepper.tsx` (semantic color migration)
- `docs/design-system.md` (+168 / -270 line rework)

### 4.3 Q10 closure commits files

- `6cb22d9 ci.yml`: `push.branches`에 `dev-monorepo` 추가 (`+1 line`)
- `b89f7a6 package.json`: dead `pnpm.onlyBuiltDependencies` 추가 (`+14 lines` — `bf7c0a7`에서 revert)
- `bf7c0a7 pnpm-workspace.yaml`: legacy `onlyBuiltDependencies:` 보강 + placeholder allowBuilds 제거 (dead)
- `0fe48aa pnpm-workspace.yaml`: REAL fix — `allowBuilds:` map of bool (10 packages true) + 3-line header comment citing pnpm/blog/releases/11.0
- `7360d4f apps/api/package.json`: `+1 line` — `"postinstall": "prisma generate"`
- `6695887 docs/specs/w2-2.5-followup-backlog.md`: v0.4 (+194 lines, §3.4 신규 6 항목 + changelog row)

### 4.4 문서 (committed; living)

- **본 핸드오프 (current master)**
- `docs/handoffs/2026-06-03-w2-2-complete-wave-3a-ready.md` v1.1 (이전 master, frozen at W2-2/W2-2.5 closure)
- `docs/handoffs/2026-06-03-session-wave-3a.md` (Session B entry-point, frozen)
- `docs/handoffs/2026-06-03-session-design-system.md` (Session C entry-point, frozen)
- `docs/handoffs/2026-06-03-w2-1-complete-w2-2-ready.md` v1.1 (W2-1 closure 시점, frozen)
- `docs/handoffs/2026-06-03-scenario-b-complete-w2-1-ready.md` v1.0
- `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md` v1.0
- `docs/handoffs/2026-05-26-phase-1-week-1-complete.md` v1.1
- `docs/plans/mvp-roadmap.md` v1.1+
- `docs/specs/w2-2.5-followup-backlog.md` v0.4 (Tier 1+2 ✅ + §3.4 신규 6 항목)
- `docs/specs/prisma-service-pattern.md` v0.1
- `docs/specs/design-system-upgrade.md` v0.1
- `docs/specs/matching-endpoint-design-decision.md`
- `docs/specs/backend-design-mapping.md`
- `docs/specs/rootmatching-erd.md`
- `docs/specs/functional-spec.md`
- `docs/prd/rootmatching-prd.md` v0.4
- `apps/api/MIGRATION.md` v0.1 (§8 ADR section 추가 follow-up — backlog §3.4.4)

### 4.5 로컬 전용 (gitignored)

- `.sisyphus/plans/phase-1-w2.md` v0.10 (살아있는 plan; §A.5 W2-5 prompt 다음 revision에서 추가 필요)
- `apps/api/.env` (Neon credentials + Better Auth secrets)

---

## 5. 환경 정보

```text
OS:           macOS (darwin)
Node:         v22.22.3 (nvm) — 필수 ≥ 22.13
pnpm:         11.3.0 (corepack)
저장소:        /Users/uni-claw/dev/root-match
remote:       origin (push 정책: 명시 요청 시에만; Q10 closure 시 한 차례 완료)
Neon:         Postgres 18.4 / us-east-2 / branch `production` / pgvector 0.8.1
CI:           GitHub Actions, ubuntu-latest, Node 22, pnpm 11.3.0
              quality matrix 5 jobs: lint / format:check / typecheck / build / guard:no-mock-auth
              push.branches: [main, dev, dev-monorepo] (Q10 6cb22d9 unlock)
              pnpm-workspace.yaml allowBuilds: 10 packages (0fe48aa fix)
              apps/api postinstall: prisma generate (7360d4f fix)
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
pnpm guard:no-mock-auth   # W2-2.5 Tier 2 regression guard

# 풀 빌드 + 테스트 (e2e는 --runInBand 권장 until backlog §3.4.1)
pnpm -r run build
pnpm -r test
pnpm --filter @rootmatching/api test:e2e --runInBand

# Web Playwright
pnpm --filter @rootmatching/web exec playwright test

# Prisma
pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api exec prisma migrate dev --name <name>
pnpm --filter @rootmatching/api exec prisma migrate status
pnpm --filter @rootmatching/api exec prisma studio

# Health smoke
curl -s http://localhost:3001/health/db | jq

# W2-3 validation gate
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3001/matching/recommend \
  -H 'Content-Type: application/json' -d '{}'
# 기대: 400

# W2-4 seed pipe (idempotent)
pnpm --filter @rootmatching/api exec prisma migrate reset --force --skip-seed && \
pnpm --filter @rootmatching/api exec prisma db seed && \
pnpm --filter @rootmatching/api exec prisma db seed && \
pnpm --filter @rootmatching/api exec node --env-file=.env -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([p.user.count(), p.company.count(), p.quoteRequest.count()])
  .then(([u,c,q]) => console.log(\`users=\${u} companies=\${c} requests=\${q}\`))
  .finally(() => p.\$disconnect());"
# 기대: users=2 companies=2 requests=3 (idempotent on 2nd run)

# W2-2 + seed signin sanity
curl -i -X POST http://localhost:3001/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"hong@techsolution.co.kr","password":"TempPass!2026"}'
# 기대: HTTP 200 + Set-Cookie: better-auth.session_token=...; HttpOnly; SameSite=Lax (NO Secure in dev)

# CI 상태 확인 (gh)
gh run list --repo "L-dragon-woo/DGU-Technology-start-up-capstone" --branch dev-monorepo --limit 3
```

---

## 6. 다음 세션 첫 메시지 후보

### 후보 1 — 즉시 Wave 3b 진입 (가장 권장)

> "Wave 3a + Q10 + Session C 다 끝났고 origin/dev-monorepo CI 5/5 green. 본 핸드오프 (`docs/handoffs/2026-06-03-wave-3a-q10-session-c-complete.md`) §2 W2-5 진입 가이드 적용해서 fire 해줘. backlog §3.4.1 (`test:e2e --runInBand`)도 W2-5 commit에 fold-in 권장."

### 후보 2 — backlog §3.4 follow-up 먼저 (anti-flake)

> "Wave 3b 진입 전에 backlog §3.4.1 (test:e2e --runInBand) + §3.4.4 (MIGRATION.md §8 zod v4 ADR) 먼저 atomic commits 2개로 처리. 그 다음 Wave 3b W2-5 깨끗한 baseline에서 진입."

### 후보 3 — plan §7.5 + §A.5 정식 작성 먼저

> ".sisyphus/plans/phase-1-w2.md v0.11에 §7.5 (W2-5 sub-steps) + §A.5 (W2-5 delegation prompt) 정식 작성. 본 핸드오프 §2의 skeleton을 plan으로 hoist. 그 다음 Wave 3b fire."

### 후보 4 — Wave 3b + Wave 4 병렬 fire

> "W2-5 (Wave 3b) 와 W2-6 보안+Swagger (Wave 4) 동시 fire. W2-6은 W2-3의 `.meta({id})` schemas만 의존하고 W2-5와 다른 모듈이라 zero conflict. 2 agents 병렬."

---

## 7. 참고 문서

| 파일                                                              | 역할                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `docs/handoffs/2026-06-03-w2-2-complete-wave-3a-ready.md` v1.1    | 이전 master ref (W2-2/W2-2.5 closure 시점, frozen)                      |
| `docs/handoffs/2026-06-03-session-wave-3a.md`                     | Session B entry-point (frozen)                                          |
| `docs/handoffs/2026-06-03-session-design-system.md`               | Session C entry-point (frozen)                                          |
| `docs/handoffs/2026-06-03-w2-1-complete-w2-2-ready.md` v1.1       | W2-1 closure (frozen)                                                   |
| `docs/handoffs/2026-06-03-scenario-b-complete-w2-1-ready.md` v1.0 | Scenario B closure                                                      |
| `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md` v1.0  | Pre-Flight audit                                                        |
| `docs/handoffs/2026-05-26-phase-1-week-1-complete.md` v1.1        | Phase 1.W1 closure                                                      |
| `.sisyphus/plans/phase-1-w2.md` v0.10 §7.5 + §A.5 (작성 필요)     | W2-5 sub-steps + delegation prompt                                      |
| `docs/specs/w2-2.5-followup-backlog.md` v0.4                      | W2-2.5 closure + §3.4 Wave 3a/Q10/C 후속 6항목                          |
| `docs/specs/prisma-service-pattern.md` v0.1                       | Pattern (a)/(b) 결정 + trigger                                          |
| `docs/specs/design-system-upgrade.md` v0.1                        | Session C 적용 spec                                                     |
| `apps/api/MIGRATION.md` v0.1                                      | mock→real user playbook (§8 zod v4 ADR 추가 follow-up — backlog §3.4.4) |
| `docs/plans/mvp-roadmap.md` v1.1+                                 | Phase 1.W2 진행도 + Phase 2-6 backlog                                   |

---

## 8. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v1.0 | 2026-06-03 | 신규 작성 — Wave 3a (W2-3 `b5558a3` + W2-4 `1b37cbe`) + Session C (`3679a34`) + Q10 CI closure 5-commit cascade (`6cb22d9` + `b89f7a6` dead + `bf7c0a7` dead + `0fe48aa` REAL + `7360d4f` REAL) + W2-2.5 backlog v0.4 (`6695887`) 통합 closure 시점 master ref doc. CI run 26884509375 quality matrix 5/5 green (HEAD `7360d4f`). Wave 3b W2-5 (Users + Companies modules) 진입 가이드 (§2) + skeleton delegation prompt + ORCHESTRATOR ADDENDUM template. Q1-Q10 status 갱신 (Q7 ✅ W2-4 적용 / Q10 ✅ CI VALIDATED). Post-Wave 3a follow-ups (§3.3) backlog v0.4 §3.4 6항목 cross-reference. 이전 master `2026-06-03-w2-2-complete-wave-3a-ready.md` v1.1은 historical reference로 보존. |
