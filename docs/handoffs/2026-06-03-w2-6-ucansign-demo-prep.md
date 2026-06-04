# Session Handoff — 2026-06-03 (W2-6 closure + UCanSign vendor + Hackathon demo prep) — v1.2

> 다음 세션이 zero-context로 이어받을 수 있도록 정리한 **master reference doc**. 이전 master (`docs/handoffs/archive/2026-06-03-wave-3a-q10-session-c-complete.md` v1.0)는 Wave 3a/Q10/Session C closure 시점 historical reference로 보존. **본 doc이 현재 master**.

**현재 origin/dev-monorepo HEAD `865461e` → local `f23c144` (demo prep closure) → `[v1.1 handoff commit]`.** W2-6 closure (Wave 4b) + UCanSign vendor 결정 + hackathon demo prep ✅ **CLOSED** (commit `f23c144`, 9 fixes verified + 4 validation gates + Playwright auth + Path A pre-rehearsal smoke 전수 통과).

**v1.1 update (2026-06-04)**:

- **Demo prep atomic commit**: `f23c144` `feat(web): hackathon demo prep — AI matching shine + factory data boost + workflow persist` (12 files, +1002/-407)
- 9 fixes verified (P0 4 + P1 3 + P2 2) — §1.6 매트릭스 ✓
- Validation gates 전수 green: typecheck (3 packages) + lint (0 errors) + format:check + guard:no-mock-auth + build (26 routes) + Playwright auth.spec (signup→cookie→dashboard 3.7s)
- W2-6 live verification 재확인: 9 schemas `/docs-json` + `/health/db` up + `/matching/recommend` mock fallback (Top-1 문래정밀가공 matchScore 97) + Q5 throttler 5/60s
- Path A pre-rehearsal smoke: 15 web routes 307 redirect with query param 보존 (예: `/login?demo=true&redirectTo=/request%3Fdemo%3Dtrue`)
- 본 핸드오프 v1.0 → v1.1 (§1.6 demo prep status update + §3/§6/§7/§10 fold-in)

**v1.0 산출물 (frozen, reference)** (Wave 4b W2-6 + Phase 3 vendor decision + demo prep 통합):

- Wave 3b W2-5 atomic commit: `6451145` Users + Companies modules + DTOs + e2e
- Tier 1 parallel side-quests 5 commits: `e47045c` (MIGRATION §8) + `7cdf6c2` (quotes decision) + `78d0bfa` (mvp-roadmap v1.2) + `08984ff` (Phase 2 follow-up) + `73dbc0d` (W2-6 spec v0.1)
- backlog v0.5: `bb66a4f` (W2-5 closure + §3.4.1/§3.4.4 closed + §3.5/§3.6 added)
- W2-6 spec v0.2: `dbc97d7` (Q1-Q8 user decisions, 7 default + Q5 changed)
- **W2-6 atomic commit**: `ea2bd66` `feat(api): security hardening + swagger + nestjs-pino (W2-6)` — Wave 4b closure
- backlog v0.6: `9a5b5f5` (W2-6 §3.6.1/§3.6.2 closed + §3.7 Phase 3 vendor prep)
- **Plan v0.12** (gitignored): `.sisyphus/plans/phase-1-w2.md` W2-5 closure summary + inline `[RESOLVED v0.12]` markers + §16 changelog v0.12 segment + #3 W2-6 spec landed status fold-in
- Demo prep agent `bg_06bb5b1c` (v1.0 시점 in-flight; v1.1 시점 ✅ CLOSED via `f23c144`)
- v1.0 master handoff: `865461e`

**다음 작업 (다음 세션 첫 액션)**:

1. ✅ ~~`bg_06bb5b1c` retrieve~~ → CLOSED (commit `f23c144`, §1.6 매트릭스 참조)
2. **Path A 10분 manual rehearsal** — 사용자 직접 브라우저 walkthrough (apps/web :3000 + apps/api :3001 ready; signup → request `?demo=true` prefill → AI 매칭 4-step loading → contract → transactions → review → dispute)
3. **Vercel preview 배포** + 시연 환경 검증 (v1.1 push 완료 후 CI/Vercel 자동 트리거 예상)
4. 최종 rehearsal + bug fix (rehearsal 중 발견 이슈)
5. (선택) R1 해결: Prisma seed 4→8 factories (`?demo=true` 의존 제거; backlog §3.5.5와 통합)
6. (병렬) UCanSign vendor 응답 fold-in (backlog §3.7.2/§3.7.3)
7. (해커톤 후) W2-7 (E2E + Neon CI) 진입

---

## Quick Reference

```text
저장소:        /Users/uni-claw/dev/root-match
활성 브랜치:    dev-monorepo (push 정책: 명시 요청 시에만; v1.0 시점 3차례 push + v1.1 시점 1차례 push)
HEAD:          `f23c144` (feat(web): hackathon demo prep ...) → v1.1 핸드오프 commit 후 update
origin/dev-monorepo:  v1.0 시점 `9a5b5f5` (synced); v1.1 시점 `[v1.1 handoff commit]` 포함하여 push

핵심 commit chain (v1.0 + v1.1 통합, 새것 → 옛것):
  [v1.1 handoff commit]: docs(handoffs): v1.1 — demo prep CLOSED + Path A 검증 fold-in
  f23c144  feat(web): hackathon demo prep — AI matching shine + factory data boost + workflow persist  ← Demo prep closure (12 files +1002/-407)
  865461e  docs(handoffs): w2-6 + vendor + demo prep (v1.0, new master ref)
  9a5b5f5  docs(specs): w2-2.5 backlog v0.6 (W2-6 ea2bd66 closure + §3.7 Phase 3 vendor prep)
    ea2bd66  feat(api): security hardening + swagger + nestjs-pino (W2-6)              ← Wave 4b closure
  dbc97d7  docs(specs): w2-6 spec v0.2 Q1-Q8 user decisions
  bb66a4f  docs(specs): w2-2.5 backlog v0.5 (Wave 3b W2-5 closure + §3.4.1/§3.4.4 closed)
  73dbc0d  docs(specs): w2-6 security + swagger spec v0.1 (Wave 4b prep)
  6451145  feat(api): users + companies modules + DTOs + e2e (W2-5)                  ← Wave 3b closure
  08984ff  docs(specs): phase 2 quotes route conflict + lighthouse coverage gap
  78d0bfa  docs(plans): mvp-roadmap v1.2 (Phase 2-6 sub-tasks + external deps cross-ref)
  7cdf6c2  docs(decisions): quotes route grouping decision package (external dep #1 unlock)
  e47045c  docs(api): MIGRATION.md §8 zod v4 + better-call ADR (closes backlog §3.4.4)
  a193ae8  docs(handoffs): wave 3a + q10 + session c complete (v1.0, historical master)
  ...

런타임 요구:    Node ≥ 22.13 (nvm use 22 매 세션 첫 명령)
                commit 시 PATH prefix:
                  `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"`

핵심 문서:
  - 본 핸드오프 (현재 master, demo prep in-flight)
  - docs/handoffs/archive/2026-06-03-wave-3a-q10-session-c-complete.md v1.0 (이전 master, frozen at Wave 3a/Q10/Session C closure)
  - .sisyphus/plans/phase-1-w2.md v0.12 (gitignored; W2-5 closure summary 반영)
  - docs/specs/w2-2.5-followup-backlog.md v0.6 (§3.4.1/§3.4.4/§3.6.1/§3.6.2 closed + §3.5/§3.7 신설)
  - docs/specs/closed/w2-6-security-swagger-spec.md v0.2 (Q1-Q8 ACCEPTED + §8.1 Decisions sub-section)
  - apps/api/MIGRATION.md v0.2 (§8 zod v4 + better-call ADR + §9 HORIZONTAL_SCALE_TRIGGER from W2-6)
  - docs/plans/mvp-roadmap.md v1.2 (Phase 2-6 sub-tasks + 외부 dep cross-ref)
  - docs/decisions/quotes-route-grouping.md (외부 dep #1 decision package — Option B 권장)
  - docs/specs/phase-2-quotes-route-design-conflict.md (Session C 후속)
  - docs/specs/lighthouse-coverage-gap.md (22 routes 미검증 inventory)
  - docs/specs/closed/design-system-upgrade.md v0.1 (Session C 적용 spec)
  - docs/specs/prisma-service-pattern.md v0.1

다음 작업 순서 (v1.1 시점):
  1. ✅ ~~`bg_06bb5b1c` retrieve~~ → CLOSED (commit `f23c144`, §1.6 매트릭스)
  2. Path A 10분 manual rehearsal — 사용자 브라우저 직접 walkthrough (apps/web :3000 + apps/api :3001 ready)
  3. Vercel preview 배포 + 시연 환경 검증 (v1.1 push 후 CI 트리거 예상)
  4. 최종 rehearsal + bug fix
  5. (선택) R1 해결: Prisma seed 4→8 factories (시연 ?demo=true 의존 제거)
  6. (해커톤 후 또는 병렬) W2-7 (E2E + Neon CI) 진입 결정 — Q3 hybrid CI 결정 시점
  7. (병렬) UCanSign vendor 문의 (webhook + sandbox + 가격) → backlog §3.7.2/§3.7.3 resolve
```

---

## 1. 이번 세션 closure 요약

### 1.1 Wave 3b W2-5 (Users + Companies)

| 항목            | 값                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Commit          | `6451145` `feat(api): users + companies modules + DTOs + e2e (W2-5)`                                  |
| Agent           | Sisyphus-Junior `unspecified-high`, 25m 5s                                                            |
| Files changed   | 16 (+523 / -15)                                                                                       |
| Sub-steps       | 9/9 ✓ (8 W2-5 + 1 anti-flake fold-in)                                                                 |
| Verification    | 8 gates pass + e2e 7 suites / 14 tests / 97.479s `--runInBand`                                        |
| Body closures   | `Closes phase-1-W2-5` + `Closes backlog §3.4.1`                                                       |
| Bonus deviation | `seed.e2e-spec.ts` retry hardening (Neon P1001 transient 대응, +44 lines) — twin-layer §3.4.1 closure |

**주요 endpoint** (W2-5 추가):

- `GET /users/me` (BetterAuthGuard) — UserProfile (name + email + accountType + role)
- `PATCH /users/me` — `UserProfileUpdateSchema.pick({ name: true })` (name only)
- `GET /companies/me` — Company 전체 (Prisma model)
- `PATCH /companies/me` — `CompanyUpdateSchema` 10 optional fields + `.refine(>0)`

### 1.2 Tier 1 parallel side-quests (5 commits)

이전 master handoff §6 후보 1 (Wave 3b W2-5 직진 + 통합 push) 채택 시 fire한 5 side-quests + #3 W2-6 spec:

| #   | 작업                                                                             | Commit    | Lines      |
| --- | -------------------------------------------------------------------------------- | --------- | ---------- |
| #1  | MIGRATION.md §8 zod v4 + better-call ADR (Closes backlog §3.4.4)                 | `e47045c` | +105       |
| #2  | plan v0.11/v0.12 (gitignored, §7.5 + §A.5 + §7.5.8 → v0.12 W2-5 closure summary) | —         | —          |
| #3  | W2-6 security + swagger spec v0.1 (Wave 4b prep, 873 lines)                      | `73dbc0d` | +873       |
| #4  | Phase 2 follow-up specs (quotes-route-conflict + lighthouse-coverage-gap)        | `08984ff` | +435       |
| #5  | mvp-roadmap v1.2 (Phase 2-6 sub-tasks + 외부 dep cross-ref)                      | `78d0bfa` | +215 / -47 |
| #6  | quotes route grouping decision package (외부 dep #1 unlock)                      | `7cdf6c2` | +213       |

**중요 finding** (#6 작업 중): `(factory)` 라우트 그룹이 `apps/web`에 이미 존재함 → Option B (factory 그룹 활용) 비용 감소 반영. handoff §3.4 외부 dep #1 status: ⏳ decision package committed, 사용자 결정 대기.

### 1.3 Wave 4b W2-6 closure (보안 + Swagger + nestjs-pino)

| 항목          | 값                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| spec v0.1     | `73dbc0d` 873 lines (#3 Tier 1 side-quest)                                                               |
| spec v0.2     | `dbc97d7` Q1-Q8 user decisions ACCEPTED (7 default + Q5 changed)                                         |
| atomic commit | `ea2bd66` `feat(api): security hardening + swagger + nestjs-pino (W2-6)`                                 |
| Agent         | Sisyphus-Junior `unspecified-high`, 24m 21s                                                              |
| Files changed | 13 (modified 6 + new 6 + lock)                                                                           |
| Sub-steps     | 8/8 ✓ + Q5 fold-in + cleanupOpenApiDoc retroactive                                                       |
| Verification  | 9 gates pass + e2e 10 suites / 24 tests `--runInBand` + 9 schemas `/docs-json` emit + Q5 twin-layer 검증 |
| Body closures | `Closes phase-1-W2-6` + `Closes backlog §3.6.1` + `Closes backlog §3.6.2`                                |

**Q1-Q8 사용자 결정 (spec §8.1 ACCEPTED)**:

- Q1 default: throttler 30 req/60s + expensive 5/60s
- Q2 default: HSTS preload false (Phase 6 prod 재평가)
- Q3 default: `/docs` dev/staging only
- Q4 default: `req.body.email` redaction 포함 (B2B privacy)
- **Q5 CHANGED**: NestJS auth-strict bucket (5 req/60s) on `/api/auth/sign-in/email` — **twin-layer with Better Auth own 3/10s**
- Q6 default: Better Auth `openAPI({})` Scalar UI dev/staging only
- Q7 default: nestjs-pino validated incoming-trust correlation ID
- Q8 default: `cleanupOpenApiDoc()` W2-6 absorb (W2-3 retroactive)

**9 schemas `/docs-json` components.schemas emit 확인** (live curl):
W2-3 (b5558a3): UserRole, AccountType, CompanyRole, Login, Register, QuoteRequestDraft
W2-5 (6451145): UserProfile, UserProfileUpdate, CompanyUpdate

**Q5 twin-layer verification**:

- Better Auth 자체 4번째 sign-in within 10s → 429 (Better Auth own)
- NestJS auth-strict 6번째 within 60s → 429 (NestJS ThrottlerGuard)

**Deviation**: Better Auth raw Express handler가 Nest controllers bypass → `auth-strict`을 pre-handler middleware로 enforce (`ThrottlerModule.forRoot`에 bucket 선언 + middleware로 실제 enforce). MIGRATION.md §9에 HORIZONTAL_SCALE_TRIGGER doc.

### 1.4 Phase 3 vendor 결정 — UCanSign (유캔싸인)

| 항목           | 값                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------- |
| spec doc       | `docs/specs/ucansign-api-reference.md` v0.1 (~580 lines, 10 sections)                           |
| vendor         | UCanSign (유캔싸인, `ucansign.com` / `app.ucansign.com`)                                        |
| 출처           | UCanSign Postman 공식 문서 (publishedId `2s7YfHhcGY`, 2022-09-15)                               |
| 인증           | API KEY → accessToken (30분 만료, Bearer)                                                       |
| Webhook        | ✅ 4 events 명시 (sign_creating / signing_canceled / signing_completed / signing_completed_all) |
| 가격           | ✅ 1건당 100원 + 신규 10건 무료                                                                 |
| 임베딩 페이지  | ✅ 4 endpoints (iframe 통합)                                                                    |
| customValue    | ✅ × 6 필드 (rootmatching internal IDs 매핑)                                                    |
| 모바일 알림톡  | signingMethodType=kakao 제한적                                                                  |
| integrity_hash | vendor 미명시 → 자체 계산 (PDF + audit-trail SHA-256, §3.7.6)                                   |
| PRD 영향       | v0.4 §6.2 "모두싸인 / 이폼사인" → **UCanSign** (PRD v0.5 갱신 필요 — backlog §3.7.4)            |
| FR-5 cover     | P0 5/5 cover + audit-trail 법적 효력 vendor 확인                                                |
| Phase 5 영향   | 카카오 알림톡 비즈 그대로 필요 (외부 dep #6)                                                    |

**Open questions (vendor 문의 needed, backlog §3.7.2 + §3.7.3)**:

- **Tier 1 CRITICAL**: Q1 외국인 본인인증 / Q2 sandbox 환경 / Q3 webhook signing secret + retry / Q4 audit-trail = §4의2 법적 효력
- **Tier 2 SHOULD**: Q5 가격 상세 / Q6 변경계약서 / Q7 integrity_hash 자체 계산 효력 / Q8 multi-tenant + locale

문의서 mock: `docs/vendor-inquiries/ucansign-2026-06-04.md` v1.0 (실제 송부 미진행, DEMO MOCK).

### 1.5 backlog v0.6 update

`docs/specs/w2-2.5-followup-backlog.md` v0.6 (commit `9a5b5f5`):

**Closures (4건)**:

- §3.4.1 ✅ CLOSED (W2-5 `6451145` `--runInBand` fold-in + seed.e2e retry hardening)
- §3.4.4 ✅ CLOSED (MIGRATION §8 `e47045c`)
- §3.6.1 ✅ CLOSED (W2-6 `ea2bd66` Q1-Q8 fold-in)
- §3.6.2 ✅ CLOSED (W2-6 `ea2bd66` cleanupOpenApiDoc retroactive absorb)

**신설 sections**:

- §3.5 (Wave 3b W2-5 후속, 6 항목): role.mapper.ts deferred (§3.5.1) / UserProfileUpdate scope (§3.5.2) / Company.bizNumber schema gap (§3.5.3) / AccountType+CompanyRole single SoT (§3.5.4) / seed.e2e retry hardening 일반화 (§3.5.5) / W2-6 .meta({id}) propagation 검증 (§3.5.6)
- §3.7 (Phase 3 prep, 6 항목): vendor 결정 ✅ closure (§3.7.1, UCanSign) / Tier 1 4건 문의 (§3.7.2) / Tier 2 4건 문의 (§3.7.3) / PRD v0.5 + mvp-roadmap v1.3 갱신 (§3.7.4) / plan §A.7 작성 (§3.7.5) / integrity_hash 자체 계산 패턴 (§3.7.6)

### 1.6 Hackathon demo prep — ✅ CLOSED (v1.1 update)

| 항목            | 값                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Background task | `bg_06bb5b1c` (session `ses_171f986d7ffeBukBPyhqoQeYYT`) — v1.1 시점 cross-session tracker 손실, 작업물은 disk 보존 |
| Agent           | Sisyphus-Junior `visual-engineering` + `frontend-ui-ux` skill                                                       |
| **Commit**      | `f23c144` `feat(web): hackathon demo prep — AI matching shine + factory data boost + workflow persist`              |
| Status          | ✅ CLOSED (12 files +1002/-407; 9 fixes verified; 4 validation gates green)                                         |
| Scope           | 9 fixes (P0 4 + P1 3 + P2 2)                                                                                        |
| 작업 영역       | apps/web/src/\*\* + packages/shared/src/{fixtures/factory-data.ts,types/matching.ts}                                |

**Fix items verified matrix**:

| #   | Tier | Item                                     | 파일                                                           | Verification                                                                                                                     |
| --- | ---- | ---------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | P0   | /request 1-click demo prefill            | `app/(client)/request/page.tsx`                                | ✅ `fillDemoRequest()` + "예시 데이터로 채우기" 버튼 (CNC 절삭+표면처리, 5,000개, 4-6주 납기 7필드 시드)                         |
| 2   | P0   | /matching AI reasoning UI ⭐️ 시연 강조점 | `app/(client)/matching/page.tsx`                               | ✅ 5-metric grid (점수/납기/거리/규모/견적) + `aiReasonBullets` expand/collapse + sidebar progress bar comparison                |
| 3   | P0   | /request 4-step submit loading           | `app/(client)/request/page.tsx` (`MatchingLoadingOverlay`)     | ✅ `matchingLoadingSteps[4]` 임베딩 0.9s → vector search 0.9s → GPT-4o 1.2s → 정리 0.5s ~3.5s + Search/Brain/Sparkles icon pulse |
| 4   | P0   | mock factory data 7-10개 보강            | `packages/shared/src/fixtures/factory-data.ts`                 | ✅ 4→8개 · Top-1 문래정밀가공 matchScore 97 lock · 인천 남동 2/3/7 · 안산 시화 3/4/6 · 6 공정 cover (CNC/금형/소성/용접/표면/열) |
| 5   | P1   | transactions → mediation query prefill   | `app/(common)/{transactions/[id],disputes/mediation}/page.tsx` | ✅ `goToMediation()` 4 params (txn+counterparty+amount+projectName) + form `useMemo`+`defaultValues`+`projectName` field 추가    |
| 6   | P1   | factory/requests/[id] sender = factory   | `app/(factory)/factory/requests/[id]/page.tsx`                 | ✅ `useUserState()` + `currentUser.accountType==='factory'` 분기 + fallback 박공장/문래정밀가공/factory-user1                    |
| 7   | P1   | 발주처 이름 정합화 3-file                | `data/{request,transaction,dispute}Data.ts`                    | ✅ "루트테크" → "테크솔루션 주식회사" 3-file 동기화                                                                              |
| 8   | P2   | WorkflowContext sessionStorage persist   | `state/WorkflowContext.tsx`                                    | ✅ `WORKFLOW_EXTRA_KEY` 새 key + contract/payment/inspection/review persist + 타입가드 + hydration on mount                      |
| 9   | P2   | demo-mode toggle (NEW)                   | `lib/demo-mode.ts` (NEW 17 lines)                              | ✅ `useDemoMode()` hook + `isDemoModeBySearch()` + URL `?demo=true` OR `NEXT_PUBLIC_DEMO_MODE=true` env                          |

**Bonus (non-breaking type extension)**:

- `packages/shared/src/types/matching.ts`: `FactoryRecommendation`에 6 optional 필드 (`matchScore`, `reorderCustomerCount`, `distanceKm`, `employeeCount`, `industrialComplex`, `aiReasonBullets`)

**Validation gates (전수 green)**:

| Gate                      | 결과                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm format:check`       | ✅ All files clean (v1.0 §최종점검의 warning은 husky lint-staged 적용 결과 사라짐)              |
| `pnpm -r typecheck`       | ✅ 3/3 packages clean                                                                           |
| `pnpm lint`               | ✅ 0 errors (3 pre-existing `<img>` warnings in `factories/[id]`/`factory/onboarding` 무관)     |
| `pnpm guard:no-mock-auth` | ✅ PASSED                                                                                       |
| `pnpm -r run build`       | ✅ apps/web 26 routes (/matching 10.1 kB, /request 12.4 kB, Middleware 67.5 kB) · apps/api Done |
| Playwright `auth.spec`    | ✅ 1/1 passed 3.7s (signup → `better-auth.session_token` httpOnly+sameSite=Lax → dashboard)     |

**Live smoke 재확인** (apps/api :3001 + apps/web :3000):

- `/docs-json`: 9 W2-6 schemas + 12 OpenAPI DTO duplicates ✓
- `/health/db`: `{db:"up", vectorExtension:"enabled", latencyMs:~1s}` ✓
- `/matching/recommend` (POST): 4 mock factories, Top-1 문래정밀가공 matchScore 97, `aiReason` prefix `[Mock · 표면처리 공정 매칭]` (OPENAI_API_KEY 빈값 mock fallback 정상)
- W2-6 Q5 throttler twin-layer auth-strict: 401×5 → 429#6 (정확히 5/60s 발동) ✓
- 15 web routes 307 redirect: query param 보존 (예: `/login?demo=true&redirectTo=/request%3Fdemo%3Dtrue`) ✓
- 응답 헤더 `x-ratelimit-remaining-expensive: 4` (W2-6 throttler 실시간 노출)

**알려진 risks (rehearsal 시 참고)**:

| #   | 항목                                                                  | 영향                                                           | 권고                                                                                           |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| R1  | API DB seed = 4 factories (W2-4), frontend fixture = 8 factories      | `/matching` 라이브 모드 API 호출 성공 시 **4개만 표시**        | 시연 시 `?demo=true` URL 일관 사용 권장 (8 enriched 보장) OR backlog §3.5.5 후속에서 seed 갱신 |
| R2  | `OPENAI_API_KEY` 빈값 → `aiReason`에 `[Mock]` prefix                  | 시연 화면에 "Mock" 단어 노출                                   | (a) 실제 OPENAI 키 발급 OR (b) `?demo=true` (프론트 fixture, prefix 우회)                      |
| R3  | 모든 authed route 307 → `/login?...&redirectTo=...`                   | demo URL 직접 진입 시 매번 로그인 우회 못 함                   | rehearsal 시작 시 한 번 signup 후 sessionStorage + cookie 유지                                 |
| R4  | Better Auth 자체 3/10s rate limit 별도 존재                           | rehearsal 중 비번 틀려서 5번 이상 시도 시 429                  | 시연 직전 정확한 비번 메모 (or 새 계정 매번)                                                   |
| R5  | Plan v0.12 (gitignored), `bg_06bb5b1c` task ID는 cross-session 손실됨 | 다음 세션이 task_id로 retrieve 못 함 — disk diff로 검증해야 함 | v1.1 시점 이미 commit `f23c144`로 봉인되어 risk 해소                                           |

---

## 2. Hackathon demo plan v1

### 2.1 시연 컨텍스트

| 항목           | 값                                                           |
| -------------- | ------------------------------------------------------------ |
| 시연 시기      | 이번 주 (3-5일)                                              |
| 시연 시간      | 10분 walkthrough                                             |
| 시연 강조점    | **AI 매칭 (기술 쇼케이스)** — PRD §4.3 3축 Moat 중 기술 차별 |
| Mock OK        | 사용자 명시: "mock 데이터여도 상관없음, 시연만 가능하면 됨"  |
| OPENAI_API_KEY | 빈값 → dev mock fallback 정상 동작 (실제 호출 불필요)        |

### 2.2 Path A 발주처 10분 walkthrough

| 분      | Step            | Page                                                                | 핵심 narration                                   |
| ------- | --------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| 0-1     | Intro           | `/` landing                                                         | 뿌리산업 65,101개 공장 + 분쟁 +42% YoY 문제 정의 |
| 1-2     | 회원가입 + 역할 | `/login` (client) → `/role-select` → `/dashboard`                   | Better Auth scrypt + session + role guard        |
| 2-3.5   | 발주 요청       | `/request` 폼 (demo prefill 1-click → 1.5min 단축)                  | "14일 걸리던 일을 3분에"                         |
| 3.5-6.5 | **AI 매칭** ⭐️  | `/matching` Top-N + 신뢰점수/납기/거리/사유 (4-step loading 첫 ~3s) | vector search + GPT-4o + transparency (PRD §4.3) |
| 6.5-7.5 | 계약            | `/contract` (문래정밀가공 선택, 고정)                               | 전자계약 (UCanSign) + escrow (토스)              |
| 7.5-8.5 | 거래 진행       | `/transactions/TXN-2026-018`                                        | 진행률 + 납품 + 검수                             |
| 8.5-9.5 | 리뷰            | `/transaction/review`                                               | 평판 시스템                                      |
| 9.5-10  | 분쟁 안전망     | `/disputes/DSP-2026-014` (같은 거래의 분쟁)                         | Human-in-the-Loop 4단계                          |

**선택 공장 고정**: 문래정밀가공 (TXN-2026-018 + DSP-2026-014 cross-ref 일관). 다른 공장 선택 시 transaction/dispute 데이터 mismatch.

**새로고침 안전 구간** (P2 #8 적용 후): /matching, /contract, /transaction/review, /messages.

### 2.3 Path B 공장 보조 3분 (선택)

| Step | Page                        | Action                                                       |
| ---- | --------------------------- | ------------------------------------------------------------ |
| 1    | `/factory/onboarding`       | 공장 프로필 등록                                             |
| 2    | `/factory/requests`         | `req-001` 알루미늄 하우징 선택                               |
| 3    | `/factory/requests/req-001` | 견적 금액/납기/제안 작성 → 제출                              |
| 4    | `/messages`                 | 견적 메시지 확인 (sender = factory user — P1 #6 fix 적용 후) |

### 2.4 Path C 분쟁 (참고만, end-to-end 신청 X)

- `/transactions/TXN-2026-018` → "문제 발생, 중재 요청" → `/disputes/mediation?txn=TXN-2026-018&counterparty=문래정밀가공&amount=4200000` (P1 #5 fix 적용 후) → 폼 prefill 확인 → 제출 → `/disputes` redirect → 기존 `/disputes/DSP-2026-014` 클릭하여 상세 설명

**중요**: dispute mediation submit은 신규 생성 X — 기존 case 보여주기만 가능.

### 2.5 Demo 직전 사용자 액션 checklist

- [ ] `pnpm dev` (apps/web :3000 + apps/api :3001 병렬)
- [ ] (선택) OPENAI_API_KEY 실제 발급 (실제 호출 보여주려면; mock도 OK)
- [ ] Vercel preview 또는 localhost (네트워크 안정 시 localhost 권장)
- [ ] Path A pre-rehearsal 1-2회 (cookie/session 정상 + AI 매칭 결과 일관)
- [ ] Browser cache clear + sessionStorage 초기화 (시연 시작 전)
- [ ] 발표자 화면 + 청중 시점 분리 (zoom in font, hide nav)

---

## 3. Phase 1.W2 closure 상태

```text
W2-1      ✅ Prisma + pgvector                       (467b73f)
W2-2      ✅ Better Auth 1.6                         (f484ad5)
W2-2.5    ✅ Tier 1+2 closure                       (b059cad, 23d917a, 02f8178, 6695887 등)
W2-3      ✅ nestjs-zod global validation            (b5558a3)
W2-4      ✅ Prisma seed (mock → DB)                 (1b37cbe)
W2-5      ✅ Users + Companies + DTOs + e2e          (6451145)   ← v1.0 세션
Session C ✅ Design system (Toss + WCAG AAA)         (3679a34)
Q10       ✅ CI matrix 5/5 green                     (multiple)
W2-6      ✅ Security + Swagger + nestjs-pino        (ea2bd66)   ← v1.0 세션 (Wave 4b closure)
Demo prep ✅ Hackathon UX shine + workflow persist   (f23c144)   ← v1.1 update (별도 track)
─────────────────────────────────────────────────────
W2-7      ⏸ E2E + Neon CI branching                  (미시작; Q3 hybrid CI 결정 needed)
```

**Phase 1.W2 ≈ 95% complete** (W2-7만 남음). Hackathon demo prep은 별도 track으로 ✅ closure.

---

## 4. 외부 의존성 6건 status update

| #   | 항목                          | Phase | 이번 세션 update                                               | 다음 action                                   |
| --- | ----------------------------- | ----- | -------------------------------------------------------------- | --------------------------------------------- |
| 1   | `(client)/quotes` 라우트 결정 | 2     | decision package committed (`7cdf6c2`)                         | 사용자 결정 (Option A/B/C, 권장 B)            |
| 2   | **전자계약 vendor 선정**      | 3     | 🔄 **vendor 결정 완료**: UCanSign 채택 + 8 questions 응답 대기 | 사용자 vendor 문의 (§3.7.2/§3.7.3)            |
| 3   | 토스 escrow KYC               | 4     | ⏸ 미착수                                                       | 사용자 사업자 KYC 진행                        |
| 4   | Prod 도메인                   | 6     | ⏸ 미착수                                                       | `rootmatching.com` 확정                       |
| 5   | Neon ap-northeast-2 region    | 6     | ⏸ 미착수                                                       | Prod 이전 시점                                |
| 6   | 카카오 알림톡 비즈            | 5     | ⏸ 미착수                                                       | Bizmsg/NHN 계정 + 비계약 거래 template만 등록 |

---

## 5. backlog v0.6 §3.5 + §3.7 상세

### 5.1 §3.5 Wave 3b W2-5 후속 (6 항목)

| #      | 항목                                                  | Tier          | 의존                                                              |
| ------ | ----------------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| §3.5.1 | `role.mapper.ts` deferred                             | Tier 3 NICE   | Frontend legacy enum 폐기 결정 (Phase 2+)                         |
| §3.5.2 | `UserProfileUpdateSchema` scope expansion             | Tier 3 NICE   | Phase 2 profile UI 작업 시점                                      |
| §3.5.3 | `Company.bizNumber` Prisma schema gap                 | Tier 2 SHOULD | PRD §6 검토 (B2B 사업자등록번호 필수)                             |
| §3.5.4 | `AccountType` + `CompanyRole` single SoT verification | Tier 2 SHOULD | assertSameSet runtime check 추가                                  |
| §3.5.5 | `seed.e2e` retry hardening 일반화                     | Tier 3 NICE   | §3.4.2 CI matrix 추가 시점                                        |
| §3.5.6 | W2-6 Swagger `.meta({id})` propagation                | Tier 2 SHOULD | W2-6 verification에 fold-in (이미 완료, `ea2bd66`로 부분 closure) |

### 5.2 §3.7 Wave 4b W2-6 + Phase 3 prep (6 항목)

| #      | 항목                                                      | Tier          | 의존                                        |
| ------ | --------------------------------------------------------- | ------------- | ------------------------------------------- |
| §3.7.1 | vendor 결정 (UCanSign 채택)                               | Tier 1 MUST   | ✅ **CLOSED** (ucansign-api-reference v0.1) |
| §3.7.2 | webhook 지원 vendor 문의                                  | Tier 1 MUST   | 사용자 vendor 응답                          |
| §3.7.3 | sandbox + 가격 + 변경계약서 vendor 문의                   | Tier 1 MUST   | 사용자 vendor 응답                          |
| §3.7.4 | PRD v0.5 + mvp-roadmap v1.3 갱신 (vendor + Phase 5 scope) | Tier 2 SHOULD | §3.7.2 + §3.7.3 응답 (또는 partial wording) |
| §3.7.5 | plan §A.7 Phase 3 delegation prompt                       | Tier 2 SHOULD | gitignored plan; W2-6 closure 후 작성 가능  |
| §3.7.6 | integrity_hash 자체 계산 패턴 (PDF + audit-trail SHA-256) | Tier 2 SHOULD | Phase 3 e2e test 흡수                       |

---

## 6. 작업 금지 영역 (다음 세션 reminder)

| 영역                                                                                                           | 이유                                                                                                      |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `apps/api/src/{auth,prisma,health,matching,users,companies}/**` core logic                                     | W2-2/W2-3/W2-5/W2-6 frozen — demo prep 시 미터치                                                          |
| `apps/api/src/{main.ts,app.module.ts}`                                                                         | W2-6 closure 후 frozen 추정                                                                               |
| `apps/api/prisma/schema.prisma`                                                                                | W2-4 territory                                                                                            |
| Better Auth code (auth.config.ts)                                                                              | W2-2 + W2-6 fold-in                                                                                       |
| `apps/api/test/{auth,matching,validation,seed,users,companies,throttler,security-headers,swagger}.e2e-spec.ts` | W2-2~W2-6 territories                                                                                     |
| `.github/workflows/ci.yml` (matrix 변경)                                                                       | backlog §3.4.2 territory (W2-7 Q3 hybrid 결정 후)                                                         |
| Force push                                                                                                     | NEVER — dead commits (`b89f7a6`, `bf7c0a7`) 는 dev-monorepo → main PR squash 시점에 정리 (backlog §3.4.6) |

**demo prep 작업 (`f23c144`) 영역 ✅ committed; rehearsal 중 bug fix 외에는 frozen 권장**:

- `apps/web/src/app/(client)/{request,matching}/page.tsx` (UI 강화 commit됨)
- `apps/web/src/app/(common)/{transactions/[id],disputes/mediation}/page.tsx` (prefill commit됨)
- `apps/web/src/app/(factory)/factory/requests/[id]/page.tsx` (sender fix commit됨)
- `apps/web/src/state/WorkflowContext.tsx` (persist commit됨)
- `apps/web/src/data/{requestData,transactionData,disputeData}.ts` (정합화 commit됨)
- `apps/web/src/lib/demo-mode.ts` (NEW, helper commit됨)
- `packages/shared/src/fixtures/factory-data.ts` (보강 commit됨)
- `packages/shared/src/types/matching.ts` (FactoryRecommendation +6 optional 필드 commit됨)

---

## 7. 다음 세션 첫 메시지 후보

### 후보 1 — Path A rehearsal 결과 fold-in + Vercel preview 배포 (가장 권장, v1.1 시점 핵심 path)

> "Path A manual rehearsal 끝났어. 발견 이슈는 [없음 / X 항목]. Vercel preview에 배포해서 시연 환경에서 같은 walkthrough 다시 검증. 발견된 bug fix."

### 후보 2 — Rehearsal 중 bug 발견 시 즉시 fix

> "Path A 중 [구체적 증상]. 본 핸드오프 §1.6 verification 매트릭스랑 비교해서 root cause 찾아서 fix해줘. fix 후 atomic commit + push."

### 후보 3 — R1 해결: Prisma seed 8 factories 반영

> "시연 시 `?demo=true` 의존도 제거하고 싶음. Prisma seed에 frontend fixture 8 factories 동일하게 반영해줘 (W2-4 territory 갱신; backlog §3.5.5와 통합). e2e 영향 검토 + 변경 atomic commit."

### 후보 4 — UCanSign vendor 응답 fold-in (별도 path)

> "UCanSign vendor 문의 응답 받았어. webhook signing=○○ / sandbox=○○ / 가격=○○ / 외국인 인증=○○. backlog §3.7.2/§3.7.3 fold-in + PRD v0.5 갱신 진행."

### 후보 5 — W2-7 진입 (Phase 1.W2 마무리)

> "W2-7 (E2E + Neon CI branching) 진입. Q3 hybrid CI 결정 = ○○ (ephemeral Neon / Docker pgvector / SQLite shim). plan §A.7는 추후."

### 후보 6 — Phase 2 진입 준비 (해커톤 후)

> "해커톤 시연 끝났어. Phase 2 (견적/매칭 persist) 진입 준비. Path A demo prep 산출물 (mock factory + AI reasoning UI) 살리면서 backend persist 추가."

---

## 8. 환경 정보

```text
OS:           macOS (darwin)
Node:         v22.22.3 (nvm) — 필수 ≥ 22.13
pnpm:         11.3.0 (corepack)
저장소:        /Users/uni-claw/dev/root-match
remote:       origin (push 정책: 명시 요청 시에만; 본 세션 3차례 push)
Neon:         Postgres 18.4 / us-east-2 / branch `production` / pgvector 0.8.1
CI:           GitHub Actions, ubuntu-latest, Node 22, pnpm 11.3.0
              quality matrix 5 jobs: lint / format:check / typecheck / build / guard:no-mock-auth
              push.branches: [main, dev, dev-monorepo]
              latest run 26892983228 (HEAD `9a5b5f5`) status: in_progress at handoff
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
pnpm guard:no-mock-auth

# 풀 빌드 + 테스트
pnpm -r run build
pnpm -r test
pnpm --filter @rootmatching/api test:e2e --runInBand     # 10 suites / 24 tests pass

# Web Playwright
pnpm --filter @rootmatching/web exec playwright test

# Prisma
pnpm --filter @rootmatching/api exec prisma generate
pnpm --filter @rootmatching/api exec prisma migrate dev --name <name>
pnpm --filter @rootmatching/api exec prisma migrate status

# Health smoke
curl -s http://localhost:3001/health/db | jq

# W2-6 verification (9 schemas emit)
curl -s http://localhost:3001/docs-json | jq '.components.schemas | keys'
# 기대: ["AccountType", "CompanyRole", "CompanyUpdate", "Login", "QuoteRequestDraft", "Register", "UserProfile", "UserProfileUpdate", "UserRole"]

# W2-6 throttler verification (Q5 twin-layer)
for i in {1..6}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/auth/sign-in/email -H 'Content-Type: application/json' -d '{"email":"hong@techsolution.co.kr","password":"wrong"}'; done
# 기대: 200/200/200/429... (Better Auth own 4th) or 200×5 + 429 (NestJS auth-strict 6th)

# Demo path A 검증 (W2-5/W2-6 commits)
pnpm --filter @rootmatching/api exec prisma migrate reset --force --skip-seed && \
pnpm --filter @rootmatching/api exec prisma db seed
pnpm dev &
sleep 8

# signin + /users/me + /companies/me (W2-5)
curl -i -X POST http://localhost:3001/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"hong@techsolution.co.kr","password":"TempPass!2026"}' -c /tmp/cookies.txt
curl -i http://localhost:3001/users/me -b /tmp/cookies.txt
# 기대: { email: "hong@techsolution.co.kr", name: "홍길동", accountType: "client", role: "admin", ... }
curl -i http://localhost:3001/companies/me -b /tmp/cookies.txt
# 기대: { name: "테크솔루션", ... }

# CI 상태 확인 (gh)
gh run list --repo "L-dragon-woo/DGU-Technology-start-up-capstone" --branch dev-monorepo --limit 3
```

---

## 9. ⚠️ 다음 세션 사용자 immediate action items

1. **UCanSign 신규 가입** (`app.ucansign.com/developer`) + API KEY 발급 + apps/api/.env에 `UCANSIGN_API_KEY` 추가 (Phase 3 진입 시; 현재 추가됨)
2. **UCanSign vendor 문의 8건** (backlog §3.7.2 + §3.7.3):
   - Tier 1: 외국인 본인인증 / sandbox / webhook signing / audit-trail 법적 효력
   - Tier 2: 가격 상세 / 변경계약서 / integrity_hash / multi-tenant
3. (선택) OPENAI_API_KEY 발급 (시연 시 실제 OpenAI 호출 보여주려면)
4. (선택) Vercel preview 환경 변수 setup (시연용 배포)

---

## 10. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.2 | 2026-06-04 | Phase 3 vendor 결정 UCanSign 채택. §1.4 single vendor 정보로 정리 (이전 vendor 후보 비교 정보는 history에서 제거). ucansign-api-reference v0.1 + ucansign vendor inquiry mock v1.0 신설. backlog v0.7 + handoff 파일명 갱신 (`...ucansign-demo-prep.md`). 외부 dep #2 status: 🔄 vendor 결정 완료, 8 questions 응답 대기. 실제 코드 통합은 Phase 3 진입 시.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| v1.1 | 2026-06-04 | Demo prep ✅ CLOSED — `bg_06bb5b1c` 결과 검증 + atomic commit `f23c144` `feat(web): hackathon demo prep — AI matching shine + factory data boost + workflow persist` (12 files +1002/-407). 9 fixes verified (§1.6 매트릭스): P0 (request prefill + matching UI + 4-step loading + 8 factories) + P1 (mediation prefill + factory sender + 발주처 정합화) + P2 (WorkflowContext persist + demo-mode toggle). Bonus: `FactoryRecommendation` 6 optional 필드 (`matchScore`/`reorderCustomerCount`/`distanceKm`/`employeeCount`/`industrialComplex`/`aiReasonBullets`). Validation 전수 green: typecheck (3 pkg) + lint (0 errors) + format:check + guard:no-mock-auth + build (26 routes) + Playwright auth.spec (3.7s). Live W2-6 재확인: 9 schemas + /health/db + /matching/recommend mock fallback (Top-1 문래정밀가공 matchScore 97) + Q5 throttler 5/60s. Path A pre-rehearsal: 15 web routes 307 redirect query param 보존. 5 risks 식별 (R1 DB seed 4 vs fixture 8 / R2 OPENAI mock prefix / R3 middleware auth / R4 Better Auth 3/10s / R5 task tracker 손실은 commit 봉인으로 해소). 다음: Path A 사용자 manual rehearsal → Vercel preview 배포 → 최종 fix. |
| v1.0 | 2026-06-03 | 신규 작성 — Wave 3b W2-5 (`6451145`) + Tier 1 parallel side-quests 5 commits (`e47045c` + `7cdf6c2` + `78d0bfa` + `08984ff` + `73dbc0d`) + plan v0.12 (gitignored) + backlog v0.5 (`bb66a4f`) + W2-6 spec v0.2 (`dbc97d7`) + Wave 4b W2-6 (`ea2bd66`) + Phase 3 vendor reference (`815e782`) + backlog v0.6 (`9a5b5f5`) 통합 closure 시점 master ref doc. CI quality matrix 5/5 green at runs 26890386896 + 26890684223 (HEAD `9a5b5f5`). Hackathon demo prep agent (`bg_06bb5b1c`, in-flight at handoff commit) — visual-engineering + frontend-ui-ux skill, 9 fixes (P0 4 + P1 3 + P2 2) for AI matching shine + mock data 보강 + WorkflowContext persist. Phase 1.W2 ≈ 95% complete (W2-7만 남음). Phase 3 vendor 결정 진행 (외부 dep #2 부분 closure; v1.2에서 UCanSign 최종 결정). 다음 세션 첫 액션: `background_output(task_id="bg_06bb5b1c")` → 9 fixes 결과 검증 → Path A manual rehearsal → Vercel preview 배포 → 최종 rehearsal. 이전 master `2026-06-03-wave-3a-q10-session-c-complete.md` v1.0은 historical reference로 보존.                                                                                                                          |
