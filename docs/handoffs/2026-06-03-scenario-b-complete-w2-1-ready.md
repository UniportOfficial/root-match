# Session Handoff — 2026-06-03 (Scenario B 완료, W2-1 진입 준비 완료)

다음 세션이 컨텍스트 없이 이어받을 수 있도록 정리한 entry-point 문서.

**이번 세션 산출물**: Scenario B 5 items 실행 — Pre-Flight 재검증 + Q3-Q6 결정 → plan §11/§11.1/§16 v0.7 fold-in + §A.1/§A.2 W2-1/W2-2 delegation prompts + handoff addendum commit (1 commit).
**다음 작업**:

1. 🔴 **Q10 BLOCKER 수정 (next push 전 필수)** — ci.yml + package.json engines bump
2. 사용자 Neon 셋업 (외부 작업)
3. Wave 1 W2-1 진입 (§A.1 prompt verbatim 위임)

---

## Quick Reference

```text
저장소: /Users/uni-claw/dev/root-match
활성 브랜치: dev-monorepo (local-only commits; 정확한 divergence는 `git rev-list --count HEAD ^aa99d30` 으로 확인)
HEAD: f2faf93 docs(handoffs): scenario B closure addendum (Q3-Q6 RESOLVED, Q10 BLOCKER, §A delegation prompts ready)
      — 또는 이후 amend/push 시점 HEAD; `git log -1 --format='%H %s'`로 검증
parent chain: f2faf93 → 84ffa8a (Pre-Flight handoff) → aa99d30 (Pre-Flight scaffold) → a2e1e64 (housekeeping)
push 상태: 모두 로컬, 미푸시 (사용자 정책)

런타임 요구: Node ≥ 22.13 (pnpm 11.3.0이 Node 20에서 ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite 발생)
            매 세션 첫 명령: `nvm use 22` (또는 fnm/asdf 사용 시 그에 맞게)

핵심 문서:
  - 본 핸드오프 (entry point)
  - docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md
    └ 원본 Pre-Flight 핸드오프 + Scenario B closure addendum (상세 audit trail)
  - .sisyphus/plans/phase-1-w2.md v0.7 (gitignored, 살아있는 문서)
    └ Q1-Q11 모두 결정/처리됨; §11.1 detailed resolutions + §A.1/§A.2 delegation prompts
  - docs/plans/mvp-roadmap.md v1.1
  - docs/specs/{matching-endpoint-design-decision, backend-design-mapping, rootmatching-erd, functional-spec}.md
  - docs/prd/rootmatching-prd.md v0.4 §13

다음 작업 순서:
  1. Q10 BLOCKER 수정 (ci.yml + package.json) — 5분 작업, BEFORE NEXT PUSH
  2. 사용자 Neon 셋업 — 외부, 15-30분
  3. Wave 1 W2-1 진입 (§A.1 prompt) — 2-2.5 engineer-day
```

---

## 세션 목표 (완료)

사용자 입력: `시나리오 B` (ULTRAWORK loop 진입).

Scenario B 정의 (5 items):

1. 0-A 핸드오프 commit
2. 0-B Pre-Flight 재검증 (sanity)
3. 0-C Q3-Q6 결정 토론 → plan §11 업데이트
4. (선택) W2-1/W2-2 delegation prompt 정교화 — 코드 변경 없이 prompt artifact만 작성
5. 세션 종료, Neon은 다음 세션 시작 시

ULTRAWORK 모드로 진행하며 Oracle 반복 라운드 검증을 거쳐 최종 라운드에서 `<promise>VERIFIED</promise>` 도달.

---

## 완료된 작업 요약

상세 audit trail은 `.sisyphus/plans/phase-1-w2.md` §16 v0.7 changelog row 및 `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md` 상단 Session Update 섹션 참조.

### Stage 1: Pre-Flight 7-gate 재검증 (0-B)

Node 22.22.3 + pnpm 11.3.0 환경, HEAD `f2faf93` 시점에서 직접 재실행:

| Gate                                                   | Result                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| `pnpm -r typecheck` (3 workspaces)                     | ✅ Done                                                     |
| `pnpm lint`                                            | ✅ 0 errors, 3 pre-existing `<img>` warnings (Phase 0 잔재) |
| `pnpm format:check`                                    | ✅ clean                                                    |
| `pnpm --filter @rootmatching/api build`                | ✅ nest build success                                       |
| `pnpm --filter @rootmatching/api exec prisma generate` | ✅ success (Q11 deprecation 경고만)                         |
| `pnpm --filter @rootmatching/api test`                 | ✅ 25/25                                                    |
| `pnpm --filter @rootmatching/api test:e2e`             | ✅ 2/2                                                      |

7-gate 모두 green → Scenario B 작업이 코드 변경 없음을 증명 (item 4 "no code changes outside .sisyphus/plans/" constraint 충족).

### Stage 2: Q3-Q6 research → plan §11/§11.1 fold-in (0-C)

6 background agents 병렬 실행 후 결과를 plan §11/§11.1/§16 v0.7에 fold-in:

- `bg_3fdb6ef5` librarian — Q3 Neon CI branching
- `bg_9d411e7d` librarian — Q4 NestJS Throttler storage
- `bg_564897bd` librarian — Q5 Better Auth cookies.secure
- `bg_e29157d8` librarian — Q6 Better Auth additionalFields enum sync
- `bg_376deeee` explore — 기존 env-driven config 패턴 (apps/api/src/)
- `bg_e6959ab7` explore — .github/workflows + e2e test DB inventory

**Q3-Q6 RESOLVED 결정** (Better Auth 1.6.13 source citations + production OSS evidence: Rybbit, Midday, ClassroomIO, Docmost, Daytona, Postiz, AFFiNE, scanopy, mosh-helpdesk, ztnet, nextcrm-app):

- **Q3 Neon CI** → **하이브리드**: ephemeral Neon branch per CI run for e2e gate (W2-7) via `neondatabase/create-branch-action@v6` + `delete-branch-action` + `expires_at` TTL; Docker `pgvector/pgvector:pg16` services block for fast unit/integration tests. Branch-quota guard 권장 (>8 active → fail-fast); 지속적 >10 concurrent PRs면 Neon Launch plan upgrade trigger.
- **Q4 Throttler storage** → **in-memory MVP single-instance** (default `ThrottlerStorageService`, ~437-475 B/key memory footprint). **Explicit migration trigger**: before running >1 API instance/pod, swap to `@nest-lab/throttler-storage-redis@1.2.0` (~302k weekly DLs, peer-dep `>=6.0.0` matches our `@nestjs/throttler@6.5.0`).
- **Q5 Better Auth cookies** → `BETTER_AUTH_URL.startsWith('https://')` 기반 (Better Auth 1.6.13 documented hierarchy: `advanced.useSecureCookies` → dynamic baseURL.protocol → static `baseURL.startsWith("https://")` → `NODE_ENV` fallback). 프로덕션 same-parent-domain → `crossSubDomainCookies` enabled with placeholder `rootmatching.com` (확정 시 실제 prod 도메인으로 교체).
- **Q6 additionalFields enum sync** → **Prisma enum as single SoT** + exported readonly tuple + boot-time `assertSameSet()` drift guard. `role.input: false` (server-managed) + `accountType.input: true` + `accountType.validator.input: z.enum(ACCOUNT_TYPE_VALUES)` (Better Auth array type을 `z.any()`로 변환하므로 input enabled 필드는 명시적 validator 필수).

**🔴 Q10 NEW BLOCKER**: `.github/workflows/ci.yml:42` `node-version: 20` + `package.json:8` `engines.node ">=20.10.0"` 둘 다 pnpm 11.3.0의 Node ≥22.13 요구와 불일치. **Any push to `main` or `dev` will fail at `pnpm install --frozen-lockfile`.** Two-line fix 필요:

```yaml
# .github/workflows/ci.yml line 42
node-version: 22 # was: 20
```

```json
// package.json line 7-9
  "engines": {
    "node": ">=22.13.0",
    "pnpm": ">=9.0.0"
  }
```

**Q11 NEW (deferred)**: Prisma `package.json#prisma` deprecation 경고 (Pre-Flight `prisma generate` 출력). Prisma 7 upgrade 시점에 `apps/api/prisma.config.ts`로 마이그레이션. 현 6.19.3에서는 non-blocking.

### Stage 3: §A.1/§A.2 delegation prompts (item 4 - 선택, 완료)

`.sisyphus/plans/phase-1-w2.md` 끝 부분에 새 Appendix §A 추가:

- **§A.1 W2-1 prompt** (`category="deep"`, `load_skills=["git-master"]`): Prisma 6 + pgvector + initial migration + `/health/db`. 5 high-level deliverables이 §7.1.3의 12 atomic sub-steps에 매핑 (item 1=schema, item 2=sub-steps 2-6, item 3=sub-steps 7+8+10, item 4=sub-step 9, item 5=sub-steps 11+12). Canonical model/enum names (4 Better Auth + 4 domain + 1 pgvector + 4 enums) per §7.1.3 sub-step 1.
- **§A.2 W2-2 prompt** (`category="ultrabrain"`, `load_skills=["git-master", "playwright"]`): Better Auth 1.6 integration. 13 sequential EXPECTED OUTCOME items (prerequisite + auth.config.ts + Q9 dry-run + main.ts mount + ... + atomic commit). Uses §11.1 combined `auth.config.ts` template as **structural canonical reference** (paste-ready with exported `assertSameSet` + `prisma.client.ts` singleton import + dual-pool architectural honest note).

NO code changes outside `.sisyphus/plans/` (item 4 constraint 충족).

### Stage 4: Handoff addendum commit (0-A + 5)

`f2faf93 docs(handoffs): scenario B closure addendum (Q3-Q6 RESOLVED, Q10 BLOCKER, §A delegation prompts ready)` — `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md` 상단에 Scenario B 클로저 addendum 추가, 원본 Pre-Flight 핸드오프 body는 그대로 유지 (Q3-Q6 결정 필요 표는 superseded 마커 + RESOLVED 컬럼 추가).

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

# 현재 상태 확인 (working tree clean expected)
git status                              # → working tree clean
git log --oneline -5
# f2faf93 docs(handoffs): scenario B closure addendum (...)
# 84ffa8a docs(handoffs): phase 1.W2 pre-flight complete, neon gate pending
# aa99d30 chore(api): phase 1.W2 pre-flight (Prisma + Better Auth deps + scaffold)
# a2e1e64 chore: phase 1.W2 housekeeping (...)
# 51102f3 docs(plans): add MVP roadmap and backlog living document

# 핵심 plan 재확인
ls -la .sisyphus/plans/                # → phase-1-w2.md (v0.7)
head -30 .sisyphus/plans/phase-1-w2.md
```

### 1. Pre-Flight 7-gates 즉시 재실행 (변경 없으면 그대로 green)

```bash
pnpm -r typecheck
pnpm lint
pnpm format:check
pnpm --filter @rootmatching/api build
pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api test           # 25/25
pnpm --filter @rootmatching/api test:e2e       # 2/2
```

### 2. 🔴 Q10 BLOCKER 수정 (next push 전 필수, ~5분)

본 핸드오프 + 사용자가 push 정책 확정 시점 사이에 **반드시** 수행. 단독 commit으로 분리:

```bash
# Edit .github/workflows/ci.yml line 42
#   node-version: 20  →  node-version: 22

# Edit package.json lines 7-9
#   "node": ">=20.10.0"  →  "node": ">=22.13.0"

git add .github/workflows/ci.yml package.json
git commit -m "chore(ci): bump CI + repo engines to node 22 (pnpm 11.3.0 requirement)" \
           -m "- ci.yml: actions/setup-node node-version 20 → 22
- package.json: engines.node >=20.10.0 → >=22.13.0
- Resolves Q10 BLOCKER (pnpm 11 imports node:sqlite, stable only on Node ≥22)
- Verifies: pnpm install --frozen-lockfile succeeds in CI on next push"

# Verify
pnpm -r typecheck && pnpm lint   # should still be green
```

> 또는 §A.1 W2-1 commit에 fold-in 가능하나, 분리 권장 (concern separation).

### 3. 사용자 게이트: Neon 셋업 (필수, 외부 작업, 15-30분)

`docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md` §6 Checklist 그대로 (10 step). 요약:

```text
1. https://console.neon.tech 로그인
2. 프로젝트 'rootmatching' 생성 (Postgres 16, Region: ap-northeast-2 권장)
3. Settings → Auth → Neon Auth 비활성화 (Better Auth 자체 호스팅)
4. 기본 브랜치 main 유지 (shadow 자동 처리)
5. POOLED connection string 복사 → apps/api/.env: DATABASE_URL=...
6. DIRECT connection string 복사 → DIRECT_URL=... (pgbouncer 제거)
7. SQL Editor(main) → CREATE EXTENSION IF NOT EXISTS vector; (>= 0.7)
8. 로컬에서 openssl rand -base64 32 → BETTER_AUTH_SECRET + COOKIE_SECRET
   + BETTER_AUTH_URL=http://localhost:3001
9. .env가 gitignored 확인: git check-ignore apps/api/.env
10. 최종 gate: pnpm --filter @rootmatching/api exec prisma db pull
    기대 출력: "Introspected 0 models"
```

### 4. Wave 1 진입 — W2-1 (Prisma + pgvector + initial migration + /health/db)

`.sisyphus/plans/phase-1-w2.md` §A.1의 prompt를 **그대로** 복사해서 `task()` 호출:

```typescript
task(
  category="deep",
  load_skills=["git-master"],
  run_in_background=false,
  description="W2-1 Prisma + pgvector + initial migration + /health/db",
  prompt=/* §A.1 prompt 본문 — line 1424부터 §A.2 시작 직전(line ~1496)까지 verbatim */
)
```

검증 gate (W2-1 완료 시점): `curl -s http://localhost:3001/health/db | jq '.db, .vectorExtension'` → `"up"` + `"enabled"`.

### 5. Wave 2 (W2-2 Better Auth — critical path 5-7d)

W2-1 commit 후 §A.2 prompt 그대로 위임. **첫 행동**은 Q9 dry-run gate (CLI 1.4.21 vs 1.6.13 호환성 smoke). 호환 실패 시 §7.1.3 hand-authored 4 Prisma 모델로 폴백.

---

## 모든 결정사항 / 알려진 이슈

### ✅ Q1-Q9 RESOLVED (Phase 1.W2 plan v0.7 §11)

| Q                          | 결정                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1 UserRole vs AccountType | **Dual-enum**: `UserRole {admin,member,operator}` + `AccountType {client,factory}` (lowercase). 레거시 shared zod는 boundary mapper로 변환 |
| Q2 PK strategy             | `cuid()`                                                                                                                                   |
| Q3 Neon CI branching       | **하이브리드** — ephemeral Neon branch + Docker pgvector services block                                                                    |
| Q4 Throttler storage       | **In-memory MVP** + explicit Redis migration trigger before horizontal scale                                                               |
| Q5 Better Auth cookies     | `BETTER_AUTH_URL.startsWith('https://')` 기반 + prod `crossSubDomainCookies`                                                               |
| Q6 additionalFields enum   | **Prisma SoT + exported `assertSameSet()` boot-time guard** + accountType `validator.input: z.enum(...)`                                   |
| Q7 Mock-user 비밀번호      | dev/CI 고정 `TempPass!2026`                                                                                                                |
| Q8 Where Option C lives    | Direct in `MatchingModule`                                                                                                                 |
| Q9 Better Auth CLI version | `@better-auth/cli@latest` (1.4.21) + W2-2 sub-step 2 dry-run smoke gate                                                                    |
| Wave 시퀀싱                | 3a (W2-3 ∥ W2-4) → 3b (W2-5) → 4a (Option C β) → 4b (W2-6) → 5 (W2-7)                                                                      |

### 🔴 결정됐지만 행동 필요 (next push 전)

| 항목                    | 행동                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| Q10 CI Node 22 mismatch | `ci.yml:42` + `package.json:8` 두 줄 수정 후 단독 commit (위 §2 참조) |

### 🟡 Deferred (non-blocking)

| 항목                             | 처리 시점                |
| -------------------------------- | ------------------------ |
| Q11 `prisma.config.ts` migration | Prisma 7 upgrade 시 함께 |

### 🔴 외부 의존성 (사용자가 해결)

1. **Neon 프로젝트 생성** + DATABASE_URL/DIRECT_URL/BETTER_AUTH_SECRET/COOKIE_SECRET — 본 핸드오프 §3 + plan §6
2. `(client)/quotes` 라우트-디자인 모순 (Phase 2 진입 전 권장) — mvp-roadmap §6.1.3
3. 모두싸인/이폼사인 contract + 토스페이먼츠 KYC (Phase 3+4 진입 전)
4. **프로덕션 도메인 확정** — `crossSubDomainCookies.domain: 'rootmatching.com'`은 placeholder. W2-2 production deploy 전 실제 도메인으로 교체.

### 📋 Documented gaps (plan §16 v0.7 (g)에 기록, doc-only scope 안에서 미해결)

1. **Pre-edit TDD acceptance-criteria list 미작성** — Oracle round 1의 9 drift fixes가 사전 AC list로 예방 가능했을 수단. W2-1 onwards는 ULTRAWORK guard rail per §16 v0.7 (f) 따라 plan agent 호출 → pre-edit AC 작성 필수.
2. **Momus v0.7-delta re-review pending** — plan footer는 여전히 Momus v0.3 verdict만 인용. W2-1 fire 전 Momus 1-shot re-review 권장 (delta scope: §11.1 + §A + Q10/Q11).
3. **Post-§A drift check** — §A.1/§A.2 EXPECTED OUTCOME ↔ §7.1/§7.2 sub-step 1:1 매핑 grep 미실행. §A.1의 5-vs-12 매핑 차이는 clarifying note로 명시되었지만 §A.2 13 items도 동일 체크 권장.

### 무해한 warning (현 시점 무시 가능)

1. **pnpm `ERR_PNPM_IGNORED_BUILDS`** — Prisma engines lazy-download, 동작 영향 없음
2. **lint warning 3개** (`<img>` LCP) — Phase 0 잔재, Phase 2 UI 작업 시 처리 권장
3. **2 Prisma client 버전 공존** (5.22.0 transitive via @better-auth/cli@1.4.21 + 6.19.3 direct) — 실 runtime은 6.19.3, Q9 dry-run에서 영향 확인
4. **Next.js plugin warning** (`Pages directory cannot be found`) — App Router라 무해
5. **Prisma `package.json#prisma` deprecation** — Q11 RESOLVED-DEFERRED

---

## 핵심 파일 인벤토리

### 코드 (committed; Pre-Flight `aa99d30`에서 추가)

- `apps/api/prisma/schema.prisma` (placeholder + pgvector preview) — W2-1에서 전체 schema로 교체
- `apps/api/prisma/seed.ts` (skeleton) — W2-4에서 9 mock fixtures 시드
- `apps/api/src/prisma/prisma.module.ts` (`@Global()` exporting `PrismaService`)
- `apps/api/src/prisma/prisma.service.ts` (offline-tolerant: prod throw, dev/test warn+return)

### 문서 (committed; living)

- `docs/handoffs/2026-06-03-scenario-b-complete-w2-1-ready.md` — **본 핸드오프 (entry point)**
- `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md` — 원본 Pre-Flight 핸드오프 + Scenario B closure addendum (audit trail 상세)
- `docs/handoffs/2026-05-26-phase-1-week-1-complete.md` — Phase 1.W1 완료 핸드오프
- `docs/plans/mvp-roadmap.md` v1.1 — MVP backlog single source of truth
- `docs/specs/matching-endpoint-design-decision.md` — Option C 잠정 Prisma model
- `docs/specs/backend-design-mapping.md` — dev-monorepo 정책 라벨 적용
- `docs/specs/rootmatching-erd.md` — ERD 출처
- `docs/specs/functional-spec.md` — 27 routes + §14 9 acceptance criteria
- `docs/prd/rootmatching-prd.md` v0.4 §13 — Phase 1.W2 정의

### 로컬 전용 (gitignored `.sisyphus/`)

- `.sisyphus/plans/phase-1-w2.md` **v0.7** (1500+ lines, `wc -l`로 정확한 수치) — 살아있는 planning doc
- `.sisyphus/plans/remaining-pages-from-functional-spec.md` — 이전 세션 산출물

---

## 환경 정보

```text
OS: macOS (darwin)
Node: v22.22.3 (nvm 관리) — 필수 ≥ 22.13
pnpm: 11.3.0 (corepack)
저장소: /Users/uni-claw/dev/root-match
remote: origin = git@github.com:... (push 정책: 명시 요청 시에만)
```

### Commit 메시지 컨벤션

```text
feat(scope): summary
fix(scope): summary
chore(scope): summary
docs(scope): summary
test(scope): summary
```

Body는 bullet list 권장. 한국어/영어 혼용 OK.

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

## 다음 세션 첫 메시지 후보

사용자가 Neon 셋업 + Q10 fix 완료 후 다음과 같이 시작 가능:

> "Q10 BLOCKER fix commit 했고, Neon 프로젝트 만들어서 .env 채웠다. prisma db pull도 Introspected 0 models 떴어. .sisyphus/plans/phase-1-w2.md §A.1 W2-1 prompt 그대로 위임해줘."

또는 Q10 fix를 W2-1 commit에 fold-in 하고 싶으면:

> "Neon 셋업 끝. Q10 fix는 W2-1 step 0에 fold-in 하고, 그 위에 §A.1 prompt 그대로 진입해줘."

---

## 참고 문서

| 파일                                                                   | 역할                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `docs/handoffs/2026-06-03-phase-1-w2-preflight-complete.md`            | 원본 Pre-Flight 핸드오프 + Scenario B closure addendum (audit trail 상세) |
| `docs/handoffs/2026-05-26-phase-1-week-1-complete.md`                  | Phase 1.W1 완료 핸드오프 — 도구 인프라/모노레포 셋업 reference            |
| `docs/handoffs/2026-06-02-backend-api-branch-evaluation.md`            | feature/backend-api 브랜치 평가                                           |
| `docs/handoffs/2026-06-02-remaining-pages-functional-spec-complete.md` | functional-spec 잔여 페이지 완료                                          |
| `docs/handoffs/2026-06-02-upstream-divergence-trial-merge.md`          | upstream divergence 분석                                                  |
| `.sisyphus/plans/phase-1-w2.md` v0.7 §11/§11.1/§A                      | Q3-Q11 결정 detail + W2-1/W2-2 delegation prompts                         |

---

## 변경 이력 (이 핸드오프 문서)

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                     |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v1.0 | 2026-06-03 | Scenario B 완료 시점 + W2-1 진입 준비 entry-point doc 신규 생성. 핵심 결정사항 Q1-Q11 요약, Q10 BLOCKER fix 절차, Neon 게이트 + W2-1 §A.1 prompt 위임 방법 정리. 원본 Pre-Flight 핸드오프 (`2026-06-03-phase-1-w2-preflight-complete.md`)는 audit trail 상세본으로 유지. |
