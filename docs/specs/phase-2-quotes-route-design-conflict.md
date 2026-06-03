# Phase 2 Follow-up: (client)/quotes 라우트-디자인 모순 분석

> **Session C deferred follow-up (a)** — handoff `2026-06-03-wave-3a-q10-session-c-complete.md` §1.2 + §3.4 외부 dep #1.
> 의사결정 패키지는 `docs/decisions/quotes-route-grouping.md` (별도 작업 #6, 본 doc은 옵션 비교만).

| 항목      | 값                                                       |
| --------- | -------------------------------------------------------- |
| 작성일    | 2026-06-03                                               |
| 트리거    | Session C closure (`3679a34`); Phase 2 진입 blocking     |
| 관련 파일 | `apps/web/src/app/(client)/quotes/page.tsx`              |
| Blocking  | Phase 2 진입 전 결정 필요 (handoff §3.4 외부 dep #1)     |
| 결정 도구 | `docs/decisions/quotes-route-grouping.md` (별도 작업 #6) |

---

## 1. 현재 상태

| 항목           | 값                                                                    |
| -------------- | --------------------------------------------------------------------- |
| 라우트 URL     | `/quotes`                                                             |
| 파일 경로      | `apps/web/src/app/(client)/quotes/page.tsx`                           |
| 라우트 그룹    | `(client)` — 발주처(client) 페르소나 전용 그룹                        |
| 실제 사용자    | **공장(factory)** — 발주처가 올린 견적 요청 공개 게시판을 공장이 조회 |
| DS 컴포넌트    | `AppBadge` (from `@/components/ui/AppBadge`)                          |
| Session C 검증 | Lighthouse a11y 100/100 (Session C 5개 라우트 중 하나로 포함)         |
| README 설명    | "공개 견적 모집 게시판 — 공장이 발주처 요청을 본다"                   |

---

## 2. 문제 정의

### 2.1 페르소나 mismatch

`(client)` 라우트 그룹은 의미상 발주처(client) 전용 구역이다. 그러나 `/quotes`는 공장(factory)이 발주처가 올린 견적 요청을 열람하는 페이지로, 실질적인 1차 사용자가 factory 페르소나다.

```
현재:  (client)/quotes  →  factory 사용자가 접근
기대:  (client)/*       →  client 사용자만 접근 (인증 가드 기준)
```

### 2.2 인증 가드 경계 모호화

Phase 2에서 Better Auth 기반 라우트 가드(미들웨어)를 적용할 때:

- `(client)/*` 전체를 "accountType === 'client' 전용"으로 보호하면 `/quotes`가 공장 사용자에게 차단된다.
- 예외 처리로 `/quotes`만 bypass하면 `(client)` 그룹의 의미가 무너진다.
- 인증 적용 주체(Sisyphus 또는 팀원)가 라우트 그룹 의미를 오해하여 잘못된 가드를 적용할 위험이 있다.

### 2.3 Phase 2 factory 전용 라우트 충돌 예상

Phase 2에서 공장 전용 기능(입찰, 즐겨찾기, 견적 응답 등)이 추가될 경우:

- `(factory)` 그룹이 신설 또는 확장되어야 하는데, 현재 `/quotes`가 `(client)` 그룹에 있어 페르소나 혼재가 심화된다.
- 이미 `apps/web/src/app/(factory)/factory/` 하위에 공장 전용 라우트가 존재한다(`/factory/requests`, `/factory/onboarding` 등). `/quotes`가 `(client)` 안에 있으면 불일치가 가시화된다.

---

## 3. 옵션 비교

### 옵션 (a): (client)/quotes → (common)/quotes 이동

```
apps/web/src/app/(client)/quotes/page.tsx
→ apps/web/src/app/(common)/quotes/page.tsx
```

**Pros:**

- `(common)` 그룹은 client/factory 양쪽이 접근 가능한 공용 구역 — 의미 일치
- 인증 가드 적용 시 예외 처리 없이 자연스럽게 양쪽 페르소나 허용
- Phase 2 인증 미들웨어 설계 단순화

**Cons:**

- 향후 공장 전용 기능(입찰, 즐겨찾기, 견적 응답)이 `/quotes` 또는 `/quotes/[id]`에 추가될 경우 `(common)` → `(factory)` 로 또 이동 필요
- `(common)`은 "양쪽 모두" 의미인데 `/quotes`는 사실 공장이 주 사용자 → 완벽한 의미 일치는 아님

**Effort:**

- 30분: `(client)/quotes/` 디렉토리 이동 → `(common)/quotes/` + import 경로 갱신 + Playwright smoke 재실행
  (URL `/quotes`는 유지, 파일 위치만 이동)

---

### 옵션 (b): (client)/quotes → (factory)/quotes 이동 [권고]

```
apps/web/src/app/(client)/quotes/page.tsx
→ apps/web/src/app/(factory)/quotes/page.tsx
```

현재 `(factory)` 그룹은 `factory/` prefix 하위에 중첩(`(factory)/factory/requests`). 옵션 (b)는 `(factory)` 그룹 직하에 `/quotes`를 두는 방식이다.

**Pros:**

- factory 페르소나 명확화: "공장 사용자가 보는 페이지" 의미 일치
- 향후 공장 전용 기능(`/quotes/[id]/bid`, `/quotes/[id]/save` 등) 확장 시 동일 그룹 내에서 자연스러운 확장
- Phase 2 인증 미들웨어: `(factory)/*` 단순 보호 가능
- 기존 `(factory)/factory/requests` 등과 그룹 일관성 확보

**Cons:**

- `(factory)` 그룹 레이아웃/미들웨어 신설 또는 확장 필요 (현재 `(factory)` 그룹 layout.tsx 존재 여부 확인 필요)
- 파일 이동 + 라우트 가드 패턴 신설 + Playwright smoke 재실행 포함

**Effort:**

- 1-2시간: 파일 이동 + `(factory)` 그룹 layout.tsx/middleware 검토 및 신설 + 라우트 가드 패턴 정의 + Playwright smoke 재실행

---

### 옵션 (c): 현 상태 유지 + 라우트 그룹 의미 재정의

`(client)` 그룹을 "발주처 전용"이 아니라 "발주 관련 기능 전반"으로 의미를 재정의하고 현 상태 유지.

**Pros:**

- 코드 변경 없음
- 즉시 적용 가능

**Cons:**

- 의미 mismatch 영구화: `(client)` 그룹에 factory 페르소나 페이지 공존 → 미래 합류 개발자 혼란
- 인증 적용 시점(Phase 2-3)에 동일 결정을 다시 해야 함 (문제 이월)
- `(factory)/factory/requests` 등 기존 factory 전용 라우트와 비일관성 유지됨

**Effort:**

- 0: 코드 변경 없음 (본 doc 갱신만)

---

## 4. 권고

**권고: 옵션 (b) — Phase 2 진입 시 `/quotes`를 `(factory)` 그룹으로 이동**

근거:

1. factory 페르소나 명확화가 장기적으로 코드 가독성과 인증 가드 설계를 단순화한다.
2. 현재 `(factory)/factory/requests` 등이 이미 존재하므로, `/quotes`도 같은 그룹으로 통일하면 일관성이 확보된다.
3. 옵션 (a)의 `(common)` 이동은 "공장이 주 사용자"라는 사실과 맞지 않아 중간 단계에 불과할 수 있다.

**단, 작업 전 확인 필요:**

- `(factory)` 그룹에 현재 `layout.tsx` 또는 `middleware.ts`가 있는지 확인
- Phase 2에서 `(factory)/*` 인증 가드 적용 대상 라우트 목록 확정 (미확정 시 옵션 (a)로 fallback 가능)
- `/quotes`의 비인증 접근 허용 여부 결정 (공개 게시판이므로 비인증 factory 방문자도 열람 가능할 수 있음)

**사용자 결정 required** → `docs/decisions/quotes-route-grouping.md` (별도 작업 #6)에서 의사결정 패키지로 정리 예정.

---

## 5. 적용 시점

- **Phase 2 진입 첫 commit** (mvp-roadmap v1.1 §Phase 2.1 기준)
- W2-5 + W2-6 + W2-7 모두 closure 후, Phase 2 라우트 가드 설계 시작 시점에 적용
- Phase 2 인증 미들웨어 설계(accountType 기반 라우트 보호) 전에 결정 필수

---

## 6. 검증 계획

파일 이동 후 적용할 검증 게이트:

| 검증 항목                         | 명령                                                                      | 기대값                             |
| --------------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| URL 변경 없음 (/quotes → /quotes) | `curl -I http://localhost:3000/quotes`                                    | HTTP 200                           |
| Playwright smoke (5 routes)       | `pnpm --filter @rootmatching/web exec playwright test`                    | signup + /quotes + /dashboard 통과 |
| Lighthouse a11y /quotes           | `lighthouse http://localhost:3000/quotes --only-categories=accessibility` | ≥ 100 (Session C 수준 유지)        |
| typecheck + build                 | `pnpm -r typecheck && pnpm -r build`                                      | 0 errors                           |

---

## 7. References

| 파일                                                                     | 관련 내용                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------ |
| `docs/handoffs/2026-06-03-wave-3a-q10-session-c-complete.md` §1.2        | Session C 결과 (Lighthouse 100x5 포함)           |
| `docs/handoffs/2026-06-03-wave-3a-q10-session-c-complete.md` §3.4 dep #1 | 본 외부 dep 원문 (Phase 2 진입 blocking)         |
| `apps/web/src/app/(client)/quotes/page.tsx`                              | 현재 파일 위치                                   |
| `apps/web/src/app/(factory)/factory/requests/page.tsx`                   | factory 그룹 참조 예시                           |
| `docs/plans/mvp-roadmap.md` v1.1 §Phase 2.1                              | Phase 2 진입 기준점                              |
| `docs/decisions/quotes-route-grouping.md` (미작성, 별도 작업 #6)         | 의사결정 패키지 — 옵션 확정 + 담당자 + 실행 날짜 |

---

## 8. 변경 이력

| 버전 | 날짜       | 변경                                                                                          |
| ---- | ---------- | --------------------------------------------------------------------------------------------- |
| v0.1 | 2026-06-03 | 신규 작성. Session C deferred follow-up (a). 옵션 a/b/c 비교 + 권고 (b). 결정은 별도 작업 #6. |
