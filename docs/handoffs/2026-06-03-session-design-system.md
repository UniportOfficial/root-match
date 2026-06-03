# Session Entry-Point — Design System Upgrade (Toss + 시니어 친화 WCAG AAA)

> **Session scope**: Toss canonical design tokens 적용 + 50-70대 공장 운영자를 위한 universal-design overlay (no "시니어 모드" 분리). **단일 visual-engineering agent fire**. 이 세션에서는 **backend 작업하지 않음** (별도 Session B Wave 3a).

| 항목            | 값                                                                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 세션 ID (예상)  | Next session #2 of 2 (Session B Wave 3a와 독립; 순서 무관)                                                                                                                                                                             |
| 시작 시점 HEAD  | `7641e8a` 이상 (Session B 먼저 완료시 그 hash)                                                                                                                                                                                         |
| 작업 범위       | `apps/web/tailwind.config.ts`, `apps/web/src/app/globals.css`, `apps/web/src/components/ui/*`, `docs/design-system.md`                                                                                                                 |
| 작업 금지       | `apps/api/**` 전체 (Session B 영역), `.github/workflows/ci.yml`, `packages/shared/**`, `apps/web/src/lib/auth-client.ts` (W2-2 산출물), `apps/web/src/state/UserContext.tsx` (W2-2 산출물), `apps/web/src/middleware.ts` (W2-2 산출물) |
| Agent 수        | 1 (visual-engineering category + frontend-ui-ux skill)                                                                                                                                                                                 |
| 예상 wall-clock | 1-1.5 engineer-day agent time                                                                                                                                                                                                          |
| 결과물          | 1 atomic commit — `feat(web,design): adopt toss tokens + senior-friendly overlay (WCAG AAA)`                                                                                                                                           |
| Next session 후 | Phase 2 페이지 디자인 작업 시 본 token 적용; mvp-roadmap.md Phase 2.2 진입                                                                                                                                                             |

---

## 1. 이번 세션 목표

`docs/specs/design-system-upgrade.md` v0.1 spec을 visual-engineering agent에게 위임하여 atomic commit으로 완료.

### 1.1 Why now?

- W2-2 완료로 `apps/web/` 인증 영역 충돌 해제 (commit `f484ad5`)
- Wave 3a (W2-3 + W2-4)는 `apps/api/` + `packages/shared/`만 건드림 → 동시 또는 순서 무관 진행 가능
- Phase 2 (발주 + 매칭 MVP) 진입 전 design system 정합화로 신규 페이지들이 처음부터 새 token 사용
- 시니어 친화 WCAG AAA 적용은 코드 변경 후 시각 회귀 검증 필요 → 별도 atomic session 권장

### 1.2 핵심 spec 출처

| 문서                                                          | 역할                                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `docs/specs/design-system-upgrade.md` v0.1 (commit `ae4fe12`) | **canonical spec** — full diff + token tables + acceptance criteria + delegation prompt §10 |
| `docs/design-system.md` (stale, 281 lines)                    | 현재 디자인 시스템 doc — 본 session에서 갱신 필요 (Vue references, 옛 routes 등)            |
| `apps/web/tailwind.config.ts` (43 lines)                      | 현재 token 정의 — 본 session에서 Toss 정합화                                                |
| `apps/web/src/app/globals.css` (17 lines)                     | 현재 base styles — 본 session에서 18px base + `*:focus-visible` 추가                        |
| `apps/web/src/components/ui/AppButton.tsx` (53 lines)         | 현재 button — XL variant + ghost + loading 추가                                             |
| `apps/web/src/components/ui/AppBadge.tsx` (31 lines)          | 현재 badge — size prop + text-xs 제거                                                       |

### 1.3 What NOT in this session

- ❌ Backend 작업 (W2-3, W2-4, W2-5 등 모두 Session B 또는 다음 wave)
- ❌ `apps/web/src/lib/auth-client.ts` 수정 (W2-2 산출물, Better Auth client)
- ❌ `apps/web/src/state/UserContext.tsx` 수정 (W2-2 산출물; useSession 구독)
- ❌ `apps/web/src/middleware.ts` 수정 (W2-2 산출물; getSessionCookie)
- ❌ `apps/web/src/app/login/page.tsx` + `role-select/page.tsx` 수정 (W2-2가 authClient migrate 했음)
- ❌ 신규 라우트 추가 (Phase 2 작업)
- ❌ 모듈 추가 / 페이지 추가 (Phase 2 작업)
- ❌ Push (정책: 명시 요청 시에만)

---

## 2. Quick Reference

```text
저장소:    /Users/uni-claw/dev/root-match
브랜치:    dev-monorepo (local-only commits)
HEAD:      세션 시작 시점에 `git log --oneline -1` 확인 (최소 7641e8a; Session B 먼저 완료시 그 hash)
Node:      22.22.3 (nvm use 22)
pnpm:      11.3.0 (corepack)

핵심 문서 (이번 session에서 참조):
  - 본 핸드오프 (Session C entry-point)
  - docs/handoffs/2026-06-03-w2-2-complete-wave-3a-ready.md v1.2 (master reference; W2-2/W2-2.5 closure 전체 컨텍스트)
  - docs/specs/design-system-upgrade.md v0.1 (canonical spec — full diff + tokens + delegation prompt §10)

연구 source (이미 수집 완료, 추가 librarian 불필요):
  - Toss tokens: bg_90d34694 (7m 20s, 2026-06-03) — TDS Mobile docs + @toss/tds-colors npm package
  - 시니어 UX: bg_1150fd82 (3m 22s, 2026-06-03) — WCAG 2.2 AAA + KCI Hangul 시니어 연구 + KB스타뱅킹 큰글씨뱅킹 pattern
  - 모두 docs/specs/design-system-upgrade.md §11에 인용 + 토큰 값에 반영됨
```

### 검증 명령 boilerplate

```bash
# 매 변경 후
pnpm -r typecheck && pnpm lint && pnpm format:check

# Web build
pnpm --filter @rootmatching/web build

# Visual smoke (manual, dev server)
pnpm dev &
sleep 8
# Browse 5 routes in browser:
#   /            (landing)
#   /login       (auth)
#   /(client)/request   (form-heavy, 시니어 친화 중요)
#   /(client)/matching  (results display)
#   /(common)/transactions/[id]  (steppers, complex layout)
# Capture screenshots for before/after comparison

# Accessibility validation
pnpm --filter @rootmatching/web exec playwright test   # auth smoke still PASS
# Optional: lighthouse + axe-core (see §5)

# Mock auth guard (regression)
pnpm guard:no-mock-auth
```

### Commit boilerplate (husky 호환)

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
git commit -m "..."
```

---

## 3. 이전 작업 요약 (one-liner)

- **W2-1** ✅ `467b73f` — Prisma 6 + Neon + pgvector + initial migration + /health/db
- **W2-2** ✅ `f484ad5` — Better Auth 1.6 integration + cookie sync + mock auth removal (9/9 gates). `apps/web/` 인증 영역 정착.
- **W2-2.5 Tier 1+2** ✅ `b059cad`/`23d917a`/`5c0b536`/`bec8a14`/`02f8178`/`7641e8a` — MIGRATION.md + PrismaService Pattern (a) backfill + Q9 status + mock auth regression guard CI + handoff v1.2 + backlog v0.3
- **Design system spec** ✅ `ae4fe12` — `docs/specs/design-system-upgrade.md` v0.1 (Toss + WCAG AAA 시니어 친화) — **본 session에서 execute**

**전체 컨텍스트**: `docs/handoffs/2026-06-03-w2-2-complete-wave-3a-ready.md` v1.2 참조 (master doc).

---

## 4. 이번 세션 작업 — 1 agent fire

### 4.1 Design system upgrade delegation

#### 4.1.1 Delegation call

```python
task(
  category="visual-engineering",
  load_skills=["frontend-ui-ux"],
  run_in_background=True,
  description="Adopt Toss design tokens + senior-friendly overlay (WCAG AAA)",
  prompt=<§4.1.2 prompt body (from spec §10) + §4.1.3 ORCHESTRATOR ADDENDUM>
)
```

#### 4.1.2 Prompt body (from `docs/specs/design-system-upgrade.md` §10)

```text
[TASK]
Execute the design system upgrade per docs/specs/design-system-upgrade.md.

[EXPECTED OUTCOME]
1. apps/web/tailwind.config.ts: full diff per §7 of the spec doc applied byte-by-byte
2. apps/web/src/app/globals.css: base font-size 18px, *:focus-visible 3px+2px, button/a min-height 48px
3. apps/web/src/components/ui/AppButton.tsx: md/lg/xl sizes + primary/secondary/ghost/danger variants + loading prop
4. apps/web/src/components/ui/AppBadge.tsx: sm/md/lg sizes + text-xs removed
5. apps/web/src/components/ui/ProcessStepper.tsx: token-aware, active state strengthened
6. docs/design-system.md: stale Vue references → React, old routes → route groups, senior px specifics added
7. Lighthouse a11y audit run on 5 representative routes (landing, login, (client)/request, (client)/matching, (common)/transactions/[id]); score ≥ 95 on each
8. WCAG AAA contrast verified (axe or pa11y on same 5 routes)
9. Single atomic commit: 'feat(web,design): adopt toss tokens + senior-friendly overlay (WCAG AAA)'

[REQUIRED TOOLS]
- mcp_Read, mcp_Edit, mcp_Write
- mcp_Bash (Node 22 prefix; pnpm; git; lighthouse; axe-core; playwright for screenshot)
- mcp_Lsp_diagnostics (after each component edit)

[MUST DO]
- Node 22 in every bash (Q10): source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && ...
- Use the diff in §7 of the spec doc verbatim for tailwind.config.ts
- Reference Toss hex values (#3182f6, #03b26c, #ffc342, #f04452, grey scale) — these are canonical
- Senior-friendly tokens (sr-* fontSize prefix) MUST be additive (don't remove default Tailwind sizes)
- All buttons MUST have min-height 48px enforced via globals.css OR component-level Tailwind class
- Body text contrast on white background MUST be ≥ 9:1 (use #333d4b grey800 for body)
- Husky pre-commit Node 22 PATH: export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH" BEFORE git commit
- Update docs/design-system.md inline-with code changes (no stale references)
- Visual smoke 5 routes manually verify on localhost (start dev server, navigate, screenshot in DevTools)

[MUST NOT DO]
- Create "시니어 모드" toggle (universal design > segregated mode)
- Remove existing Tailwind utility classes (e.g., text-xs) — only add new sr-* sizes
- Use #94a3b8 ink-400 for body text (only disabled/placeholder)
- Use #ffc342 warning for text on white (1.4:1 contrast — use warning-text #dd7d02 paired with warning-bg #fff9e7)
- Hardcode hex values in components (always reference token via Tailwind theme)
- Touch apps/api/ (not in scope; Session B territory)
- Touch packages/shared/ (not in scope; Session B territory)
- Modify W2-2 commit f484ad5 (atomic; this is a separate feat commit)
- Modify W2-2 산출물: apps/web/src/lib/auth-client.ts, apps/web/src/state/UserContext.tsx, apps/web/src/middleware.ts, apps/web/src/app/login/page.tsx, apps/web/src/app/role-select/page.tsx (Better Auth integration; design system 작업은 token + globals + ui components만)
- Use auto-dismiss for critical UI (modals, error toasts)
- Touch .github/workflows/ci.yml (Q10 fix already in 13e90c1)

[CONTEXT]
- W2-2 (Better Auth) is complete (commit f484ad5). apps/web/ no longer in flux. Auth integration files (auth-client.ts, UserContext.tsx, middleware.ts, login/page.tsx, role-select/page.tsx, AuthModal.tsx) are W2-2 산출물 — do NOT modify in this design system work.
- Current state read-only-verified: tailwind.config.ts uses #2563eb brand, ink-700 #475569, text-xs badge, 38-44px buttons
- 3 Tailwind warnings exist (img element) — pre-existing, NOT this scope to fix
- Toss canonical reference: https://tossmini-docs.toss.im/tds-mobile/foundation/colors/ + @toss/tds-colors npm package
- Senior UX research: WCAG 2.2 AAA + KCI Hangul senior smartphone study + KB스타뱅킹 큰글씨뱅킹 pattern (universal not segregated)
- Lighthouse target: a11y ≥ 95 on 5 routes
- Branch: dev-monorepo at HEAD (verify via git log)
- DO NOT push — push policy is set by orchestrator (after Session B + this Session both done)
- Session B (Wave 3a W2-3 + W2-4) may be running in parallel OR already done — does NOT affect this session (different directories)
```

#### 4.1.3 ORCHESTRATOR ADDENDUM template

```text
[ORCHESTRATOR ADDENDUM — current state at delegation time (not in spec §10, factual update from Sisyphus 2026-06-03)]

**HEAD at delegation**: <검증: git log --oneline -1, 최소 7641e8a; Session B 먼저 완료시 그 commit>
Working tree clean expected. Push policy: deferred until Session B + this Session both complete.

**Design spec ground truth**: `docs/specs/design-system-upgrade.md` v0.1 (commit `ae4fe12`) — 609 lines, 13 sections. §7에 정확한 tailwind.config.ts diff (verbatim 적용); §3-§5에 token specifications (color/typography/tap target + focus); §6에 component patterns; §8 마이그레이션 순서 Phase A-E; §9 acceptance criteria 11개; §10 본 prompt 출처; §11 references (Toss + WCAG sources).

**Current code state** (read-only verified):
- `apps/web/tailwind.config.ts` (43 lines): brand=`#2563eb` (NOT Toss `#3182f6`), ink-700=`#475569` (need stronger contrast), semantic colors use Tailwind defaults (emerald/amber/red, NOT Toss green500/yellow500/red500), border radius 6/8/12 (need 8/12/16/20/pill scale)
- `apps/web/src/app/globals.css` (17 lines): NO html font-size override (Tailwind default 16px), NO `*:focus-visible` AAA rules, NO min-height enforcement
- `apps/web/src/components/ui/AppButton.tsx` (53 lines): md (text-sm ~38-40px), lg (text-base ~44px); NO XL, NO ghost variant, NO loading prop
- `apps/web/src/components/ui/AppBadge.tsx` (31 lines): text-xs (12px) only; NO size prop; uses Tailwind hardcoded colors (emerald-50, amber-50 etc., NOT brand tokens)
- `apps/web/src/components/ui/ProcessStepper.tsx`: 별도 read 필요 (token 갱신만 권장)
- `docs/design-system.md` (281 lines): STALE — Vue file references (`AppButton.vue`, `lucide-vue-next`), 옛 routes (`/client/request` 형태로 route groups 시점 이전 표기), 시니어 친화 언급은 모호 (구체 px 없음)

**W2-2 산출물 INTACT 유지 영역** (DO NOT modify):
- `apps/web/src/lib/auth-client.ts` (25 lines) — Better Auth client
- `apps/web/src/state/UserContext.tsx` — useSession 구독 + mockCompanies[0] fallback
- `apps/web/src/middleware.ts` — getSessionCookie + optimistic redirect
- `apps/web/src/app/login/page.tsx`, `apps/web/src/app/role-select/page.tsx`, `apps/web/src/components/auth/AuthModal.tsx` — authClient.signIn/signUp.email / updateUser migration
- `apps/web/src/app/(client)/*`, `(common)/*` 페이지들 — 페이지 자체는 변경 안 함; token 갱신 후 자동 반영
- `apps/web/playwright.config.ts`, `tests/auth.spec.ts` — W2-2 smoke

**Session B 병렬 fire context** (있을 수 있음):
- Wave 3a (W2-3 nestjs-zod + W2-4 Prisma seed)가 `apps/api/` + `packages/shared/`에 commit 추가 중일 가능성
- 본 session은 `apps/web/` + `docs/design-system.md`만 건드림 → **zero conflict**
- Session B agent commits이 도착하면 `git log` 상 추가 commit visible; 본 session 작업에 영향 없음

**Husky pre-commit Node 22 PATH**: MANDATORY. `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` before EVERY `git commit`.

**Push policy at delegation time**: do NOT push. Orchestrator will push after Session B + this Session both complete.

**Visual smoke routes** (5 routes per spec §9):
1. `/` — landing (`apps/web/src/app/page.tsx`)
2. `/login` — auth (`apps/web/src/app/login/page.tsx`) — W2-2 산출물; 만질 일 없음
3. `/(client)/request` — form-heavy, 시니어 친화 가장 중요
4. `/(client)/matching` — matching results
5. `/(common)/transactions/[id]` — ProcessStepper 사용

**Lighthouse + axe target**: ≥ 95 a11y score on 모든 5 routes. WCAG AAA contrast (body text ≥ 7:1 on white, 권장 ≥ 9:1).

[CONCISE REPORT FORMAT — 9 items per spec §9 acceptance criteria + standard format]
1. Final commit hash + subject (`feat(web,design): adopt toss tokens + senior-friendly overlay (WCAG AAA)`)
2. spec §9 11개 acceptance criteria matrix (✓/✗ per item)
3. tailwind.config.ts diff applied (§7) — 적용된 token 모두 list
4. globals.css 추가 라인 (base font-size, focus-visible, min-height)
5. AppButton md/lg/xl + ghost + loading 검증 (스크린샷 4컷: 4 variants × 3 sizes)
6. AppBadge sm/md/lg 검증 (스크린샷 4컷: 4 variants × 3 sizes)
7. Lighthouse 5 routes 점수표 (a11y / performance / best practices / SEO)
8. WCAG AAA contrast 검증 결과 (axe 또는 pa11y output)
9. docs/design-system.md 갱신 항목 list (Vue → React 변경 위치 / route groups / 시니어 px 추가)
10. Files modified (path + lines added/removed table)
11. Deviations + justification (e.g., warning token 처리 / ProcessStepper 변경 범위)
12. Open questions / follow-ups (e.g., Phase 2 페이지가 새 token 자동 반영 여부; dark mode 검토 필요 여부)
```

---

## 5. Validation (agent 완료 알림 도착 후)

```bash
# 1. Background result 수집
background_output(task_id="<design system task_id>")

# 2. 12-item report 검증 (위 §4.1.3 CONCISE REPORT FORMAT)

# 3. 전체 verification gates
pnpm -r typecheck && pnpm lint && pnpm format:check
pnpm --filter @rootmatching/web build
pnpm guard:no-mock-auth   # W2-2.5 Tier 2 regression guard (W2-2 산출물 유지 확인)

# 4. W2-2 sanity (auth flow 영향 없는지)
pnpm --filter @rootmatching/web exec playwright test
# Expected: auth.spec.ts PASS (W2-2 산출물 INTACT)

# 5. Visual smoke (manual, dev server)
pnpm dev &
sleep 8
# Browser에서 5 routes 방문 + screenshot:
#   http://localhost:3000/
#   http://localhost:3000/login
#   http://localhost:3000/request
#   http://localhost:3000/matching
#   http://localhost:3000/transactions/<id>

# 6. Lighthouse audit (각 route)
# Browser DevTools → Lighthouse → Accessibility category → Generate report
# Expected: ≥ 95 점수 on each

# 7. WCAG AAA contrast check
# Browser DevTools → axe-core extension → Run scan
# Expected: 0 contrast violations on body text
# Body text computed style: color should be `rgb(51, 61, 75)` (= #333d4b grey800)

# 8. Tap target 검증
# Browser DevTools → Inspect → Computed → min-height
# All buttons: ≥ 48px (primary CTAs ≥ 56px)

# 9. Focus ring 검증
# Tab through page → focus visible 3px outline + 2px offset, brand color, NOT light blue ring
```

---

## 6. Post-session next steps

### 6.1 본 session 완료 직후

- **Phase 2 진입 준비** — `(client)/quotes` 라우트-디자인 모순 해소 (사용자 외부 의존성 #1, mvp-roadmap §6.1.3)
- **Push 정책 결정**:
  - Option A: Session B + 본 session 완료 후 모든 commits push (Q10 CI validation 한 번에)
  - Option B: 본 session만 push (design system standalone)

### 6.2 본 session 결과를 적용할 후속 작업

- **Phase 2 페이지 작업**: 신규 라우트 추가 시 자동으로 새 token 사용
- **27 기존 라우트 시각 검증**: spec §8 Phase D (visual regression smoke) — 본 session에서 5 routes만 검증함; 나머지 22개는 Phase 2 작업 중에 자연스럽게 갱신
- **Dark mode** (deferred): Phase 2+ 별도 작업
- **다국어** (deferred): Phase 2+ 별도 작업

### 6.3 본 session과 독립적

- **Session B Wave 3a** — `docs/handoffs/2026-06-03-session-wave-3a.md`
  - W2-3 (nestjs-zod) + W2-4 (Prisma seed) 병렬 fire
  - 본 session과 zero conflict
  - 본 session 전후 또는 동시 진행 가능

---

## 7. 첫 메시지 후보

### 후보 1 — 즉시 fire (가장 권장)

> "Design system upgrade fire. handoff §4.1 prompt body + ORCHESTRATOR ADDENDUM 추가해서 visual-engineering + frontend-ui-ux agent background 실행. system reminder 대기."

### 후보 2 — Spec 재확인 먼저

> "먼저 docs/specs/design-system-upgrade.md 한 번 read 한 후 spec 그대로 fire. 변경 사항 검토 후 위임."

---

## 8. 작업 금지 reminder

이번 session에서는 다음 작업 **절대 금지**:

1. ❌ `apps/api/**` 파일 수정 전체 (Session B 영역)
2. ❌ `packages/shared/**` 수정 (Session B 영역)
3. ❌ `apps/web/src/lib/auth-client.ts` (W2-2 산출물; Better Auth client)
4. ❌ `apps/web/src/state/UserContext.tsx` (W2-2 산출물; useSession 구독)
5. ❌ `apps/web/src/middleware.ts` (W2-2 산출물; getSessionCookie)
6. ❌ `apps/web/src/app/login/page.tsx` + `role-select/page.tsx` (W2-2 산출물)
7. ❌ `apps/web/src/components/auth/AuthModal.tsx` (W2-2 산출물)
8. ❌ "시니어 모드" toggle 만들기 (universal design > segregated mode)
9. ❌ 신규 라우트 / 모듈 / 페이지 추가 (Phase 2 작업)
10. ❌ `.github/workflows/ci.yml` 수정 (Q10 fix already in `13e90c1`)
11. ❌ `<img>` LCP lint warning fix (별도 Phase 2 UI 작업)
12. ❌ Push (정책 명시 요청 시에만)

---

## 9. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                                                      |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-06-03 | 초기 작성. Session C (Design System Upgrade, Toss tokens + WCAG AAA 시니어 친화) 전용 entry-point. master doc (`2026-06-03-w2-2-complete-wave-3a-ready.md` v1.2) 분리 — Session B (Wave 3a)와 독립적 실행, zero conflict. |
