# RootMatching Design System

RootMatching은 뿌리산업 B2B 거래를 다루는 업무형 플랫폼입니다. 화면은 신뢰감, 안정감, 명확한 진행 상태를 중심으로 설계합니다.

## Design Principles

- **Trust First**: 계약, 결제, 분쟁, 정산처럼 민감한 흐름은 차분한 블루와 명확한 상태 표시를 사용합니다.
- **Operational Clarity**: 사용자가 다음 행동을 바로 알 수 있도록 CTA, 진행 단계, 상태 배지를 가까이 배치합니다.
- **Universal Senior-Friendly UX**: 별도 “시니어 모드” 없이 모든 사용자에게 body 18px, 주요 CTA 56-64px, 최소 탭 타깃 48px, focus 3px outline + 2px offset, 본문 대비 9:1+를 기본 제공합니다.
- **Responsive by Default**: 데스크톱은 2컬럼 업무 화면, 모바일은 단일 컬럼으로 자연스럽게 전환합니다.

## Color Tokens

### Primary

| Token              | Value     | Usage                                            |
| ------------------ | --------- | ------------------------------------------------ |
| `--primary`        | `#3182f6` | Toss blue500; primary CTA, active nav, key icons |
| `--primary-hover`  | `#2272eb` | Toss blue600; primary CTA hover                  |
| `--primary-active` | `#1b64da` | Toss blue700; pressed state                      |
| `--primary-light`  | `#e8f3ff` | Toss blue50; active background, info badge       |
| `--primary-subtle` | `#c9e2ff` | Toss blue100; focus/selected borders             |

### Neutral

| Token                | Value     | Usage                                                       |
| -------------------- | --------- | ----------------------------------------------------------- |
| `--background`       | `#f2f4f6` | Toss grey100; app page background                           |
| `--surface`          | `#ffffff` | Cards, panels, forms                                        |
| `--surface-subtle`   | `#f9fafb` | Toss grey50; inactive/hover surface                         |
| `--border`           | `#e5e8eb` | Toss grey200; default border                                |
| `--border-light`     | `#f2f4f6` | Toss grey100; dividers                                      |
| `--border-strong`    | `#d1d6db` | Toss grey300; emphasized border                             |
| `--text-primary`     | `#191f28` | Toss grey900; heading emphasis                              |
| `--text-body`        | `#333d4b` | Toss grey800; body copy, 9:1+ on white                      |
| `--text-body-compat` | `#333d4b` | Existing `ink-700` utility alias mapped to body contrast    |
| `--text-secondary`   | `#333d4b` | Senior overlay for existing `ink-600` utility usage         |
| `--text-muted`       | `#333d4b` | Senior overlay for existing visible `ink-400` utility usage |

> Canonical Toss grey600 (`#6b7684`) and grey400 (`#b0b8c1`) remain available under `toss.grey.*`. The app-level `ink-600`/`ink-400` aliases are intentionally strengthened because existing screens use those utilities for visible helper text, not only disabled placeholders.

### Semantic

| Token            | Value     | Usage                                    |
| ---------------- | --------- | ---------------------------------------- |
| `--success`      | `#03b26c` | Toss green500; 완료, 검수 승인, 재거래   |
| `--success-bg`   | `#f0faf6` | Toss green50; success badge bg           |
| `--warning`      | `#ffc342` | Toss yellow500; icon/accent only         |
| `--warning-bg`   | `#fff9e7` | Toss yellow50; warning badge bg          |
| `--warning-text` | `#dd7d02` | Toss yellow900; warning text on light bg |
| `--error`        | `#f04452` | Toss red500; 삭제, 위험, 분쟁            |
| `--error-bg`     | `#ffeeee` | Toss red50; danger badge bg              |

> `#ffc342`는 흰 배경에서 텍스트 대비가 부족하므로 본문/배지 텍스트에는 절대 사용하지 않습니다. 경고 텍스트는 `warning-text`를 사용합니다.

## Typography

- Font family: `Noto Sans KR`, system sans-serif
- Root: `html { font-size: 18px; }` so default rem-based type scales up for senior-friendly readability.
- Page display: `text-sr-display` (30px / 40px / 700)
- Page title: `text-sr-h1` (28px / 37px / 700)
- Section title: `text-sr-h2` (24px / 33px / 700)
- Card title: `text-sr-h3` or `text-sr-h4`
- Body: `text-sr-body`, `text-ink-800` (`#333d4b`, 9:1+ on white)
- Label/Button: `text-sr-label` / `text-sr-button-lg` / `text-sr-button-xl`
- Help/error: `text-sr-help`
- Metadata/helper text: `text-sr-metadata`, `text-ink-600` (senior overlay maps to `#333d4b` until all visible helper copy is migrated). Use `toss.grey.400` only for disabled/placeholder-only states.

Do not use negative letter spacing. Keep Korean labels compact and readable.

## Spacing & Radius

| Token             | Value    | Usage                         |
| ----------------- | -------- | ----------------------------- |
| `--sidebar-width` | `260px`  | Desktop sidebar               |
| `--header-height` | `64px`   | App header                    |
| `--radius-sm`     | `8px`    | Small controls                |
| `--radius-md`     | `12px`   | Buttons, inputs               |
| `--radius-lg`     | `16px`   | Cards, panels                 |
| `--radius-xl`     | `20px`   | Large modal/sheet             |
| `--radius-pill`   | `9999px` | Pills, badges, round controls |

Common layout:

- Page padding: `px-4 py-8 sm:px-6 lg:px-8`
- Max width: `max-w-7xl` for main app pages
- Section/card padding: `p-5 sm:p-7` or `p-6 sm:p-8`
- Grid gap: `gap-6` to `gap-8`

## Layout Patterns

### App Shell

- `AppSidebar`: fixed desktop sidebar
- `AppHeader`: sticky top header
- `AppLayout`: wraps all authenticated/workflow pages
- Landing and role selection use `meta.layout = 'none'`

### Two Column Workflow

Use for forms and review flows:

```html
<div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
  <main>...</main>
  <aside class="lg:sticky lg:top-8 lg:self-start">...</aside>
</div>
```

### Full Width Workflow

Use for list/search screens:

```html
<div class="mx-auto max-w-7xl">
  <header>...</header>
  <section>filters</section>
  <main>list</main>
</div>
```

## Components

### AppButton

File: `src/components/ui/AppButton.tsx`

Variants:

- `primary`: main action
- `secondary`: alternate action
- `ghost`: low-emphasis text action
- `danger`: destructive action

Sizes:

- `md`: default action, `min-height: 48px`
- `lg`: primary workflow CTA, `min-height: 56px`
- `xl`: critical CTA, `min-height: 64px`

Props: `variant`, `size`, `fullWidth`, `loading`. Loading state shows spinner + label and disables the button.

Usage:

```tsx
<AppButton type="submit" size="lg" fullWidth loading={isSubmitting}>
  저장하기
</AppButton>
```

### AppBadge

File: `src/components/ui/AppBadge.tsx`

Variants:

- `blue`: default status/info
- `green`: success/complete
- `yellow`: reviewing/warning (`amber` remains a compatibility alias)
- `red`: critical dispute/destructive status
- `slate`: neutral metadata

Sizes: `sm`, `md` (default), `lg`. Badge text starts at `text-sm`; `text-xs` is not used in `AppBadge`.

Usage:

```tsx
<AppBadge variant="green" size="md">
  거래 완료
</AppBadge>
```

### ProcessStepper

File: `src/components/ui/ProcessStepper.tsx`

Use for contract, transaction, dispute, request handling progress.

- Uses auto-fit grid: adapts to narrow side panels and wide content sections.
- Current step uses `brand` fill, `brand-light` card background, and a strengthened `brand-subtle` ring.
- Completed steps use `success` / `success-bg`.
- Future steps use neutral `surface-subtle` and `ink-600`.

Usage:

```tsx
<ProcessStepper steps={steps} currentStep={3} />
```

## Form System

Input style:

```html
class="h-14 w-full rounded-lg border border-border-strong px-4 text-sr-input outline-none transition
focus:border-brand"
```

Textarea style:

```html
class="w-full rounded-lg border border-border-strong px-4 py-3 text-sr-input outline-none transition
focus:border-brand"
```

Guidelines:

- Labels are always visible.
- Required fields use red asterisk.
- Use `text-sr-input` and `h-14` (56px) for primary workflow forms.
- Use 2-column grids on desktop, 1-column on mobile.
- File uploads use dashed border and clear accepted file context.

## Card System

Default card:

```html
class="rounded-lg border border-border bg-white p-5 shadow-toss-sm sm:p-7"
```

Compact data cell:

```html
class="rounded-md bg-surface-subtle p-4"
```

Interactive list card:

```html
class="rounded-lg border border-border bg-white p-5 shadow-toss-sm transition
hover:border-brand-subtle hover:shadow-toss-md"
```

## Navigation

Primary app routes (Next.js App Router route groups are filesystem-only; public URLs omit group names):

- `/dashboard`
- `(client)/request` → `/request`
- `(client)/matching` → `/matching`
- `(client)/requests` → `/requests`
- `(client)/requests/[id]` → `/requests/[id]`
- `/factory/onboarding`
- `/factory/requests`
- `/factory/requests/:id`
- `(common)/factories/[id]` → `/factories/[id]`
- `(client)/contract` → `/contract`
- `(common)/transactions` → `/transactions`
- `(common)/transactions/[id]` → `/transactions/[id]`
- `(common)/disputes/mediation` → `/disputes/mediation`

Sidebar active state:

- Active background: `--primary-light`
- Active text/icon: `--primary`

## Workflow Patterns

### Client Request Flow

`(client)/request` (`/request`) → `(client)/matching` (`/matching`) → `(common)/factories/[id]` (`/factories/[id]`) or `(client)/contract` (`/contract`)

### Factory Received Request Flow

`(factory)/factory/requests` (`/factory/requests`) → `(factory)/factory/requests/[id]` (`/factory/requests/[id]`) → `(client)/contract` (`/contract`)

### Contract & Transaction Flow

`(client)/contract` (`/contract`) → `(common)/transactions/[id]` (`/transactions/[id]`) → `(client)/transaction/review` (`/transaction/review`) → `(common)/dashboard` (`/dashboard`)

Problem branch:

`(common)/transactions/[id]` (`/transactions/[id]`) → `(common)/disputes/mediation` (`/disputes/mediation`) → `(client)/transaction/review` (`/transaction/review`)

## Responsive Rules

- Main forms: `grid-cols-1 sm:grid-cols-2`
- Page shell side panels: `grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]`
- Stepper: auto-fit grid with `minmax(220px, 1fr)`
- Tables should be avoided for mobile-critical flows; use cards.
- Header/sidebar remains desktop oriented; mobile sidebar behavior exists but needs a menu trigger if full mobile nav is required.

## Icon Usage

Use `lucide-react`.

Common mapping:

- Request: `FileText`, `Inbox`, `Send`
- Factory: `Factory`
- Contract: `FileSignature`, `ShieldCheck`, `CreditCard`
- Transaction: `PackageCheck`, `Truck`, `ClipboardCheck`
- Dispute: `AlertTriangle`, `Handshake`
- Success: `CheckCircle`

## Tone

Use direct, reassuring Korean labels:

- Good: `검수 승인하고 리뷰 작성`
- Good: `문제 발생, 중재 신청`
- Good: `견적 제출하고 계약으로 이동`
- Avoid vague labels like `확인`, `다음`, `처리`

## Current Brand Direction

- Primary color: blue
- Canonical Toss tokens: blue `#3182f6`, green `#03b26c`, yellow `#ffc342`, red `#f04452`, grey body `#333d4b`
- Surface-heavy B2B SaaS style
- Avoid decorative gradients except controlled hero/CTA sections
- Avoid orange as primary brand color
- Status colors should remain semantic and limited
