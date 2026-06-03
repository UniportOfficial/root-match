# Decision: /quotes 라우트 그룹 위치

| 항목                             | 내용                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| **Status**                       | PROPOSED (waiting for stakeholder decision)                                             |
| **Stakeholder (decision owner)** | 사용자 (디자인 PM 역할)                                                                 |
| **Deadline**                     | Phase 2 진입 전 (target: 2026-06 중순)                                                  |
| **Decision ID**                  | D-001                                                                                   |
| **Created**                      | 2026-06-03                                                                              |
| **Related external dep**         | handoff §3.4 외부 dep #1 (`docs/handoffs/2026-06-03-wave-3a-q10-session-c-complete.md`) |

---

## 1. 결정 context

현재 라우트 구조:

```
apps/web/src/app/
  (client)/
    quotes/page.tsx          # <-- 현재 위치 (문제)
    request/page.tsx
    matching/page.tsx
    requests/[id]?/page.tsx
  (common)/
    transactions/[id]?/page.tsx
    disputes/[id]?/page.tsx
    mypage/page.tsx
  (factory)/                 # <-- 이미 존재하는 그룹
    factory/onboarding/page.tsx
    factory/requests/page.tsx
    factory/requests/[id]/page.tsx
  quote-requests/page.tsx    # 최상위 라우트 (그룹 없음, 별도 검토 필요)
```

**모순의 핵심**: `/quotes`는 현재 `(client)` 그룹 안에 있지만, README 및 PRD 기준으로 이 페이지는 **공장(factory)이 발주처 견적 요청을 열람하는 공개 게시판**이다. 발주처(client)가 아닌 공장(factory) 페르소나가 주 사용자다.

- **현재**: `(client)/quotes` → 발주처 페르소나 그룹에 위치
- **실제 사용자**: 공장(factory) — 발주처가 올린 견적 요청을 보고 입찰 여부를 결정하는 화면
- **Phase 1 완료 상태**: design system + a11y 검증 완료 (Lighthouse 100/100/100/100/100, WCAG AAA)
- **Phase 2 예정**: 실제 Prisma 데이터 연동 + factory 측 입찰, 즐겨찾기, 대시보드 등 기능 추가

추가 관찰: `(factory)` 라우트 그룹은 이미 존재함 (`factory/onboarding`, `factory/requests`). Option B 적용 시 그룹 신설 비용 없음.

---

## 2. 결정 요구사항

Phase 2 진입 전에 아래 세 가지를 확정해야 한다:

1. **페르소나 정합성**: `/quotes` 라우트가 factory 페르소나 중심임을 라우트 그룹 구조로 명시할지, 공통 접근 가능한 그룹으로 처리할지
2. **인증 경계 명확화**: Phase 2에서 Better Auth 세션 기반 인증 적용 시, `/quotes`에 라우트 가드를 어느 그룹 layout에서 걸지 (현재 `(client)` layout vs 별도 그룹 layout)
3. **확장 계획 정합성**: Phase 2-3에서 예상되는 factory 전용 기능 (`/bids`, `/factory/dashboard`, `/portfolio` 등)과 라우트 구조 일관성

---

## 3. Decision options

### Option A: (client)/quotes → (common)/quotes 이동

**What**: `/quotes`를 `(client)` 그룹에서 `(common)` 그룹으로 이동.

**Effort**: 약 30분 (파일 이동 + import 경로 수정 + Playwright smoke 재실행)

**Pros**:

- 코드 변경량 최소 (1개 디렉토리 이동)
- 양쪽 페르소나(발주처 + 공장) 모두 접근 가능한 구조
- 기존 `(common)` 그룹 (transactions, disputes, mypage)과 UI 일관성 유지
- Phase 2 초기 임시 안으로 유효 (리스크 최소)

**Cons**:

- 향후 factory 전용 기능 (입찰, 즐겨찾기, 대시보드) 추가 시 `(common)` → `(factory)` 이동을 다시 해야 할 가능성
- factory user 페르소나 명확성 부족 — 신규 팀원/AI agent가 `/quotes`가 어떤 페르소나용인지 파악하기 어려움
- `(common)`의 의미가 "양쪽 모두 쓰는 거래/분쟁/마이페이지"인데, `/quotes`는 실질적으로 factory-facing이라 의미 불일치

**Phase 2 영향**: 견적 요청 view(read-only) 기능은 `(common)`에서 처리 가능. factory의 입찰은 `(common)/quotes/[id]/bid` 같은 nested route로 처리하게 되어 구조적으로 어색.

**추천 weight**: 2/5

---

### Option B: (client)/quotes → (factory)/quotes 이동 (기존 그룹 활용)

**What**: 이미 존재하는 `(factory)` 그룹으로 `/quotes`를 이동.

**Effort**: 약 30-45분 (파일 이동 + import 경로 수정 + `(factory)` layout 확인 + Playwright smoke 재실행). `(factory)` 그룹이 이미 존재하므로 그룹 신설 비용 없음.

**Pros**:

- factory 페르소나 명확 — 라우트 구조만 봐도 `/quotes`가 공장용임을 즉시 파악
- Phase 2-3에서 예상되는 factory 전용 기능 (`/bids`, `/factory/dashboard`, `/portfolio`)과 자연스럽게 연결
- `(factory)` 레이아웃 확장 시 (`factory/` 하위 vs `quotes/` 분리 여부) 한 곳에서 결정 가능
- 인증 시점에 `(factory)` layout에서 라우트 가드 한 번에 적용 가능
- 기존 `(factory)/factory/...` 구조와의 일관성 검토 기회 (현재 `factory/` 중첩이 있음 — 관련 Open Question §8 참조)

**Cons**:

- `/quotes`가 인증 전 공개 접근 가능한 페이지인데, `(factory)` 그룹에 인증 가드를 걸면 공개성이 깨질 수 있음 (레이아웃 설계 주의 필요)
- `(factory)/factory/requests`와 `(factory)/quotes` 간 네이밍 혼선 가능 (factory용 requests가 두 군데?)
- SEO: `/quotes` URL 자체는 유지되므로 canonical 영향 없음 (라우트 그룹은 URL에 미포함)

**Phase 2 영향**: factory 전용 layout 적용 가능 (factory 브랜딩, 사이드바 네비 등). 인증 + 라우트 가드 패턴은 Phase 2 첫 commit에서 `/quotes`를 포함해 함께 처리하면 중복 작업 없음.

**추천 weight**: 4/5

---

### Option C: 현 상태 유지 + (client) 그룹 의미 재정의

**What**: 코드 변경 없이 `(client)` 그룹의 의미를 "발주처 페르소나 우선"에서 "발주처 관련 + 공장 viewer 허용"으로 문서 재정의.

**Effort**: 약 5분 (문서·주석 수정만)

**Pros**:

- 코드 변경 없음 — Phase 2 진입 일정에 영향 없음
- 단기 risk 최소

**Cons**:

- 의미 mismatch 영구화 — `(client)` 그룹 이름과 실제 사용자 페르소나가 계속 어긋남
- Phase 2에서 인증/라우트 가드 설계 시 어느 layout에서 어떤 페르소나를 막을지 다시 결정해야 함
- 신규 팀원이나 AI agent가 `(client)` 그룹을 볼 때마다 혼란 유발 — 문서를 읽지 않으면 잘못된 가정으로 코드 작성할 가능성

**Phase 2 영향**: 견적 요청 + factory 기능을 모두 `(client)` 그룹에 묶는 구조가 지속됨. factory 입찰 기능도 `(client)/quotes/[id]/bid`에 놓여야 하는 의미 불일치 가중.

**추천 weight**: 1/5

---

## 4. 권고 (AI orchestrator perspective)

**권고**: **Option B** (기존 `(factory)` 그룹 활용 + `/quotes` 이동)

근거:

1. **`(factory)` 그룹이 이미 존재함**: `apps/web/src/app/(factory)/factory/onboarding/page.tsx`, `(factory)/factory/requests/page.tsx` 등이 구현되어 있어 그룹 신설 비용이 없다. 단순 파일 이동으로 적용 가능.
2. **PRD 페르소나 구조와 정합**: PRD §3에서 공장주(공급측)와 구매담당자(수요측)를 명확히 구분하며, `/quotes`는 "공장이 발주처 요청을 본다"고 README에서도 명시됨. 라우트 그룹이 이 페르소나 경계를 반영하는 것이 유지보수성에 유리.
3. **Phase 2 인증 작업과 병합 효율**: Phase 2 첫 commit에서 Better Auth 기반 인증 + 라우트 가드 패턴을 도입할 때 `(factory)` layout에서 한 번에 처리하면 중복 작업이 없다. 별도 이동 작업을 나중으로 미루면 오히려 총 effort가 증가.

대안: Option A를 Phase 2 시작 시점 임시 조치로 적용하고, Phase 3 시점에 Option B로 점진 마이그레이션하는 방법도 유효. factory 전용 기능 범위가 Phase 2에서 불확실하다면 A → B 순서가 리스크를 낮출 수 있음.

---

## 5. 추가 검토 사항 (사용자 결정 시 고려)

**Factory 측 추가 라우트 (Phase 2-3 예상)**:

- `/quotes` (공개 게시판 열람, 이번 결정 대상)
- `/quotes/[id]/bid` (입찰)
- `/factory/dashboard` (현재 `(factory)/factory/` 하위에 위치 예정)
- `/portfolio` (공장 포트폴리오 공개 페이지)

**인증 + 라우트 가드 설계**:

- `/quotes`는 공개 페이지 (비로그인 factory user도 열람 가능). 입찰(`/quotes/[id]/bid`)은 인증 필요.
- `(factory)` layout에서 전체 가드를 걸면 `/quotes` 공개 접근이 차단될 수 있음 — layout 분리 또는 middleware-based 가드 고려 필요.
- Better Auth session-based vs Next.js middleware-based 선택은 Phase 2 설계 시 결정.

**SEO 영향**:

- 라우트 그룹 (`(factory)`, `(client)`, `(common)`)은 URL에 포함되지 않으므로 `/quotes` URL은 이동 후에도 동일 유지. canonical 영향 없음.

**Design system 호환성**:

- `(factory)` 신설 layout은 Toss 디자인 시스템 그대로 사용 가능 (Session C `3679a34` 결과물 공유).
- factory 전용 브랜딩/사이드바가 필요하면 `(factory)/layout.tsx`에서 별도 AppHeader variant 적용 가능.

**현재 `(factory)` 내부 구조 중첩 문제**:

- 현재 `(factory)/factory/requests/page.tsx` 형태로 `factory/` 디렉토리 중첩이 있음.
- `/quotes`를 이동할 때 `(factory)/quotes/` 로 갈지 `(factory)/factory/quotes/` 로 갈지 — URL 정합성 검토 필요 (현재 factory 라우트들의 URL은 `/factory/requests`이므로, `/quotes`는 `/quotes`로 유지하려면 `(factory)/quotes/`).

---

## 6. 다음 단계

사용자가 결정을 내린 후:

1. 본 문서 STATUS를 `ACCEPTED` (또는 `REJECTED + 대안`)로 업데이트
2. 결정된 옵션에 따라 파일 이동 + import 경로 수정 atomic commit 작성
3. Playwright smoke 재실행으로 라우트 이동 후 렌더링 이상 없음 확인
4. Phase 2 진입 첫 commit에 인증/라우트 가드 패턴과 함께 적용 (Option B 선택 시)
5. `docs/plans/mvp-roadmap.md` v1.3에서 Phase 2 §2.1 라우트 구조 섹션 업데이트

---

## 7. References

- `docs/handoffs/2026-06-03-wave-3a-q10-session-c-complete.md` §3.4 외부 dep #1 (근거 원문: "(client)/quotes 라우트-디자인 모순 해소 (mvp-roadmap §6.1.3); Phase 2 진입 전 Blocking")
- `docs/prd/rootmatching-prd.md` v0.4 §3 페르소나 정의 (공장주/구매담당자 구분)
- `docs/specs/design-system-upgrade.md` v0.1 (Session C 결과, 현재 `/quotes` 디자인 베이스)
- `apps/web/src/app/(client)/quotes/page.tsx` (현재 파일 위치, 이동 대상)
- `apps/web/src/app/(factory)/` (기존 factory 라우트 그룹, Option B 이동 대상)
- `docs/specs/phase-2-quotes-route-design-conflict.md` (분석 base 문서 — 본 문서 작성 시점 미존재, self-contained 모드로 작성)

---

## 8. Open Questions (사용자 결정 시 답변 요청)

**Q1. `/quotes` 공개 접근 정책**

`/quotes`는 비로그인 사용자(공장, 일반 방문자 모두)가 접근 가능한 공개 페이지여야 하는가, 아니면 로그인한 factory 계정만 접근 가능하도록 인증 필수로 변경할 예정인가?

이 결정에 따라 Option B 적용 시 `(factory)` layout의 라우트 가드 설계 방향이 달라진다 (전체 가드 vs 부분 가드 vs middleware 분리).

**Q2. `(factory)` 그룹 내 네이밍 구조 확정**

현재 `(factory)` 그룹 안에 `factory/requests/`, `factory/onboarding/` 형태로 `factory/` 디렉토리가 중첩되어 있다. `/quotes`를 이동할 때 `(factory)/quotes/` (URL: `/quotes`)로 갈지 `(factory)/factory/quotes/` (URL: `/factory/quotes`)로 갈지 결정이 필요하다.

향후 Phase 3에서 한 번 더 라우트 구조를 재정비할 계획이 있는가, 아니면 이번 Phase 2 진입 시점에 factory 라우트 네이밍 컨벤션을 한 번에 확정하는 것이 좋은가?
