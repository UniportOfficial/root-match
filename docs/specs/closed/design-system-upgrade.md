# Design System Upgrade — Toss 정합 + 시니어 친화

> **Mission**: 토스 디자인 시스템을 token 수준에서 정합하게 가져오고, 그 위에 50-70대 공장 운영자 사용성을 보장하는 universal-design overlay를 layer함. "시니어 모드" 분리 없이 모든 사용자가 더 큰/명확한/대비 높은 UI를 사용.

| 항목             | 값                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------ |
| 작성일           | 2026-06-03                                                                           |
| Trigger          | W2-2 완료 (commit `f484ad5`); apps/web/ 충돌 영역 해제 후                            |
| Wave 위치        | Phase 1.W2.5 또는 Wave 3a와 병렬 (visual-engineering category 별도 agent)            |
| Estimated effort | 1-1.5 engineer-day (token diff + 3개 컴포넌트 + globals.css + design-system.md 갱신) |
| Skills           | `visual-engineering` (category) + `frontend-ui-ux` (skill)                           |
| 의존성           | W2-2 완료 ✅; Wave 3a (W2-3/W2-4)와 충돌 없음 (다른 디렉토리 작업)                   |

---

## 1. TL;DR

| 변경 영역          | 현재                          | 목표                                                | 근거                                    |
| ------------------ | ----------------------------- | --------------------------------------------------- | --------------------------------------- |
| Primary color      | `#2563eb` (Tailwind blue-600) | `#3182f6` (Toss Blue / blue500)                     | Toss canonical                          |
| Base font size     | 16px (Tailwind 기본)          | **18px** (desktop), **20px** (mobile critical)      | WCAG large-scale + KCI 한국 시니어 연구 |
| Touch target min   | ~38-44px (md/lg button)       | **48px** (min) / **56px** (primary)                 | WCAG AAA + 한국 공장 사용 환경          |
| Body text contrast | `#475569` ink-700 (~7.4:1)    | `#333d4b` grey800 (~10:1)                           | AAA `>9:1` for elderly                  |
| Focus ring         | 4px ring `brand-light/100`    | **3px outline + 2px offset, 3:1 contrast**          | WCAG 2.2 AAA focus appearance           |
| Badge text         | `text-xs` (12px)              | `text-sm` (14px) min, `text-base` (16px) for status | 시니어 권장 최소 14-16px                |
| Border radius      | sm:6 / md:8 / lg:12           | sm:8 / md:12 / lg:16 / xl:20 / pill:9999            | Toss 컴포넌트 관행 + 시인성             |
| Semantic colors    | emerald/amber/red Tailwind    | Toss green500/yellow500/red500                      | Toss canonical                          |

---

## 2. 현재 상태 vs 목표 (Gap 분석)

### 2.1 `apps/web/tailwind.config.ts` (43 lines)

| 변경                        | 현재      | →   | 목표                                             | 변경 이유                              |
| --------------------------- | --------- | --- | ------------------------------------------------ | -------------------------------------- |
| `colors.brand.DEFAULT`      | `#2563eb` | →   | `#3182f6`                                        | Toss Blue (blue500)                    |
| `colors.brand.hover`        | `#1d4ed8` | →   | `#2272eb`                                        | Toss blue600                           |
| `colors.brand.light`        | `#dbeafe` | →   | `#e8f3ff`                                        | Toss blue50                            |
| `colors.ink.950`            | `#0f172a` | →   | `#191f28`                                        | Toss grey900                           |
| `colors.ink.700`            | `#475569` | →   | `#333d4b`                                        | Toss grey800 (대비 강화)               |
| `colors.ink.400`            | `#94a3b8` | →   | `#6b7684`                                        | Toss grey600 (대비 강화)               |
| `colors.surface.muted`      | `#f8fafc` | →   | `#f2f4f6`                                        | Toss grey100                           |
| `colors.border.DEFAULT`     | `#e2e8f0` | →   | `#e5e8eb`                                        | Toss grey200                           |
| `colors.border.subtle`      | `#f1f5f9` | →   | `#f2f4f6`                                        | Toss grey100                           |
| `colors.success`            | `#10b981` | →   | `#03b26c`                                        | Toss green500                          |
| `colors.warning`            | `#f59e0b` | →   | `#ffc342`                                        | Toss yellow500                         |
| `colors.danger`             | `#ef4444` | →   | `#f04452`                                        | Toss red500                            |
| **NEW** `colors.toss.*`     | —         | +   | 전체 grey/blue/red/green/yellow 50-900 palette   | 필요 시 hover/active variant 직접 참조 |
| `borderRadius.sm`           | `6px`     | →   | `8px`                                            | 시인성 강화                            |
| `borderRadius.md`           | `8px`     | →   | `12px`                                           | 시인성 강화                            |
| `borderRadius.lg`           | `12px`    | →   | `16px`                                           | Toss card 관행                         |
| **NEW** `borderRadius.xl`   | —         | +   | `20px`                                           | 큰 modal/sheet                         |
| **NEW** `borderRadius.pill` | —         | +   | `9999px`                                         | 토글/태그                              |
| **NEW** `fontSize.tk-*`     | —         | +   | Toss TDS typography scale 매핑 (t1-t7, st1-st13) | 시니어 친화 (최소 15px enforce)        |
| **NEW** `outline.focus`     | —         | +   | `3px solid theme('colors.brand.DEFAULT')`        | WCAG AAA                               |
| **NEW** `boxShadow.toss-*`  | —         | +   | sm/md/lg level 4-5개                             | Toss 컴포넌트 관행 (radius와 정합)     |

### 2.2 `apps/web/src/app/globals.css` (현재 17 lines)

```css
/* 추가 항목 */
@layer base {
  html {
    font-size: 18px; /* base 16 → 18 (시니어 권장) */
  }

  body {
    font-size: 1rem; /* = 18px */
    line-height: 1.6; /* WCAG text-spacing + 시니어 가독성 */
    /* 기존 background, color, font-feature-settings 유지 */
  }

  /* WCAG AAA focus appearance */
  *:focus-visible {
    outline: 3px solid theme('colors.brand.DEFAULT');
    outline-offset: 2px;
    border-radius: 4px; /* outline 자체에 약간의 radius */
  }

  /* 모바일 critical: 모든 button/a은 min tap target */
  button,
  [role='button'],
  a {
    min-height: 48px; /* WCAG AAA */
  }
}

@layer utilities {
  /* 시니어 친화 utility classes */
  .tap-target-min {
    min-height: 48px;
    min-width: 48px;
  }
  .tap-target-primary {
    min-height: 56px;
    min-width: 56px;
  }
  .text-body-senior {
    font-size: 18px;
    line-height: 1.6;
  }
  .text-label-senior {
    font-size: 17px;
    line-height: 1.5;
    font-weight: 500;
  }
}
```

⚠️ **중요**: `html { font-size: 18px }`는 모든 `rem` 단위를 1.125배 키움 → Tailwind의 `text-sm` (0.875rem)가 14px → 15.75px로 자동 보정됨. 이건 의도된 효과 (시니어 권장 최소 14-16px 유지).

### 2.3 `apps/web/src/components/ui/AppButton.tsx` (53 lines)

| 변경                         | 현재                                   | →   | 목표                                                                           |
| ---------------------------- | -------------------------------------- | --- | ------------------------------------------------------------------------------ |
| `sizeStyles.md`              | `px-4 py-2.5 text-sm` (~38-40px h)     | →   | `px-4 py-3 text-base min-h-[48px]` (WCAG AAA)                                  |
| `sizeStyles.lg`              | `px-5 py-3 text-base` (~44px h)        | →   | `px-5 py-3.5 text-lg min-h-[56px]` (시니어 primary)                            |
| **NEW** `sizeStyles.xl`      | —                                      | +   | `px-6 py-4 text-xl min-h-[64px] font-bold` (시니어 critical CTA, 발주/계약 등) |
| `variantStyles.ghost`        | 없음                                   | +   | `text-brand bg-transparent hover:bg-brand-light` (4번째 variant)               |
| Type `ButtonSize`            | `'md' \| 'lg'`                         | →   | `'md' \| 'lg' \| 'xl'`                                                         |
| Type `ButtonVariant`         | `'primary' \| 'secondary' \| 'danger'` | →   | `+ 'ghost'`                                                                    |
| `inline-flex ... rounded-xl` | `rounded-xl` (12px)                    | →   | `rounded-lg` (16px after token update) for visual matchup with cards           |
| **NEW** `loading` prop       | —                                      | +   | Spinner + disabled (Toss `Button loading` 관행)                                |

### 2.4 `apps/web/src/components/ui/AppBadge.tsx` (31 lines)

| 변경              | 현재                                                     | →   | 목표                                                                           |
| ----------------- | -------------------------------------------------------- | --- | ------------------------------------------------------------------------------ |
| Base classes      | `px-3 py-1 text-xs` (12px → 13.5px after html font-size) | →   | `px-3 py-1.5 text-sm` (14px → 15.75px) for default; `text-base` for `lg` size  |
| **NEW** size prop | 없음                                                     | +   | `'sm' \| 'md' \| 'lg'` (sm = 현재 `text-xs`, md = `text-sm`, lg = `text-base`) |
| Variants          | blue/green/amber/slate                                   | →   | + `red` for critical 분쟁; rename `amber → yellow` (Toss 정합)                 |
| Color values      | 직접 `emerald-50` 등 사용                                | →   | `bg-success/10 text-success` 패턴 (token 사용)                                 |

### 2.5 `apps/web/src/components/ui/ProcessStepper.tsx`

(읽기 미완 — 별도 분석 필요. 추정: step text/active state token 갱신 필요)

### 2.6 `docs/design-system.md` (281 lines, STALE)

| Stale 항목                | 현재                                                          | →   | 수정                                                                                                    |
| ------------------------- | ------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------- |
| Line 107                  | `src/components/common/AppButton.vue`                         | →   | `src/components/ui/AppButton.tsx`                                                                       |
| Line 130                  | `src/components/common/AppBadge.vue`                          | →   | `src/components/ui/AppBadge.tsx`                                                                        |
| Line 147                  | `src/components/common/ProcessStepper.vue`                    | →   | `src/components/ui/ProcessStepper.tsx`                                                                  |
| Line 211-220              | routes `/client/request` 등 (옛 구조)                         | →   | `(client)/request` 등 (route groups)                                                                    |
| Line 255                  | `lucide-vue-next`                                             | →   | `lucide-react`                                                                                          |
| Line 9 (시니어 친화 원문) | "고령 공장주도 쉽게 입력할 수 있도록 입력 영역은 크게" (모호) | →   | "고령 공장주를 위한 specific px: body 18px, tap 48-56px, focus 3px outline + 2px offset, contrast >9:1" |
| Color tokens              | `#2563eb` 등 (옛 brand)                                       | →   | Toss 정합 hex (`#3182f6`, `#03b26c`, `#ffc342`, `#f04452`)                                              |
| Form input                | `h-14` (56px) `text-lg`                                       | →   | `h-14` 유지 (이미 시니어 친화 OK); `text-lg` 유지                                                       |
| Card system               | `rounded-2xl` (16px)                                          | →   | `rounded-lg` (16px, token 사용)                                                                         |

---

## 3. 컬러 토큰 specification (Toss + 시니어 overlay)

### 3.1 Brand (Primary)

```ts
// tailwind.config.ts
brand: {
  DEFAULT: '#3182f6',  // Toss blue500
  hover:   '#2272eb',  // Toss blue600
  active:  '#1b64da',  // Toss blue700
  light:   '#e8f3ff',  // Toss blue50
  subtle:  '#c9e2ff',  // Toss blue100
},
```

### 3.2 Neutral (Ink + Surface + Border)

```ts
// 시니어 친화 = 더 강한 대비 (grey800/900 사용)
ink: {
  950: '#191f28',  // Toss grey900 - 최강 강조 (heading, 가장 중요한 텍스트)
  800: '#333d4b',  // Toss grey800 - body text (#fff 대비 10:1 — AAA+)
  600: '#6b7684',  // Toss grey600 - metadata (#fff 대비 5.5:1 — AA, 비주요 정보만)
  400: '#b0b8c1',  // Toss grey400 - disabled/placeholder ONLY (절대 body 사용 금지)
},

surface: {
  DEFAULT: '#ffffff',  // canvas / cards
  muted:   '#f2f4f6',  // Toss grey100 - 페이지 배경
  subtle:  '#f9fafb',  // Toss grey50 - hover, inactive
},

border: {
  DEFAULT: '#e5e8eb',  // Toss grey200
  subtle:  '#f2f4f6',  // Toss grey100 - divider
  strong:  '#d1d6db',  // Toss grey300 - emphasized border
},
```

### 3.3 Semantic

```ts
success: '#03b26c',  // Toss green500
'success-bg': '#f0faf6',  // Toss green50 (badge bg)
warning: '#ffc342',  // Toss yellow500 (주의: 노랑은 흰 배경에 대비 부족 → 텍스트로 사용 시 darker variant 필요)
'warning-bg': '#fff9e7',  // Toss yellow50
'warning-text': '#dd7d02',  // Toss yellow900 (warning에 대한 text contrast 확보)
danger: '#f04452',  // Toss red500
'danger-bg': '#ffeeee',  // Toss red50
info: '#3182f6',    // = brand (Toss는 info=blue 일관)
```

**시니어 친화 caveat**: `warning` 노랑 (#ffc342)은 흰 배경 대비 1.4:1로 텍스트 사용 절대 불가. 항상 dark variant (`#dd7d02`)와 페어로 사용 (예: `bg-warning-bg text-warning-text`).

### 3.4 Full Toss palette (선택적 직접 사용)

```ts
// tailwind.config.ts colors.toss = { ... }
toss: {
  blue: { 50: '#e8f3ff', 100: '#c9e2ff', 200: '#90c2ff', 300: '#64a8ff', 400: '#4593fc', 500: '#3182f6', 600: '#2272eb', 700: '#1b64da', 800: '#1957c2', 900: '#194aa6' },
  grey: { 50: '#f9fafb', 100: '#f2f4f6', 200: '#e5e8eb', 300: '#d1d6db', 400: '#b0b8c1', 500: '#8b95a1', 600: '#6b7684', 700: '#4e5968', 800: '#333d4b', 900: '#191f28' },
  red:    { 50: '#ffeeee', 100: '#ffd4d6', 200: '#feafb4', 300: '#fb8890', 400: '#f66570', 500: '#f04452', 600: '#e42939', 700: '#d22030', 800: '#bc1b2a', 900: '#a51926' },
  green:  { 50: '#f0faf6', 100: '#aeefd5', 200: '#76e4b8', 300: '#3fd599', 400: '#15c47e', 500: '#03b26c', 600: '#02a262', 700: '#029359', 800: '#028450', 900: '#027648' },
  yellow: { 50: '#fff9e7', 100: '#ffefbf', 200: '#ffe69b', 300: '#ffdd78', 400: '#ffd158', 500: '#ffc342', 600: '#ffb331', 700: '#faa131', 800: '#ee8f11', 900: '#dd7d02' },
},
```

---

## 4. 타이포그래피 specification

### 4.1 Toss TDS scale (참고)

```ts
// Toss publishes 20 sizes (t1-t7 = title 1-7, st1-st13 = subtitle 1-13)
// 30px(t1) / 28px(st2) / 26px(t2) / ... / 17px(t5) / 15px(t6) / 13px(t7) / 11px(st13)
```

**Rootmatching 정책**: 시니어 친화로 **13px 이하 금지**, **15px 미만은 metadata 전용**, **base body 18px**.

### 4.2 Rootmatching 매핑

```ts
// tailwind.config.ts theme.extend.fontSize
fontSize: {
  // 시니어 친화 base
  'sr-display':  ['30px', { lineHeight: '40px', fontWeight: '700' }],  // 페이지 hero
  'sr-h1':       ['28px', { lineHeight: '37px', fontWeight: '700' }],  // 페이지 title
  'sr-h2':       ['24px', { lineHeight: '33px', fontWeight: '700' }],  // section title
  'sr-h3':       ['20px', { lineHeight: '29px', fontWeight: '600' }],  // card title
  'sr-h4':       ['18px', { lineHeight: '27px', fontWeight: '600' }],  // subsection
  'sr-body':     ['18px', { lineHeight: '1.6', fontWeight: '400' }],   // BASE (body 기본)
  'sr-body-bold':['18px', { lineHeight: '1.6', fontWeight: '600' }],
  'sr-label':    ['17px', { lineHeight: '1.5', fontWeight: '500' }],   // form label, button
  'sr-input':    ['18px', { lineHeight: '1.5', fontWeight: '400' }],   // input 내부 텍스트
  'sr-button-lg':['18px', { lineHeight: '1.4', fontWeight: '600' }],   // lg button
  'sr-button-xl':['20px', { lineHeight: '1.4', fontWeight: '700' }],   // xl primary CTA
  'sr-help':     ['16px', { lineHeight: '1.7', fontWeight: '400' }],   // help text, error msg
  'sr-metadata': ['15px', { lineHeight: '1.5', fontWeight: '400' }],   // timestamp, count - non-critical만
  // 모바일 critical
  'sr-mobile-cta':   ['20px', { lineHeight: '1.4', fontWeight: '700' }],
  'sr-mobile-body':  ['20px', { lineHeight: '1.6', fontWeight: '400' }],
},
```

### 4.3 Letter spacing

- Body: `tracking-normal` (0)
- Label/Button: `tracking-wide` (+0.01em — 한국어에서 모호하나 의도적)
- Avoid: `tracking-tighter`, `tracking-tight`

---

## 5. Tap target + Focus specification

### 5.1 Touch targets (WCAG AAA + 한국 공장 환경)

| Class                 | min-h/min-w | 용도                                        |
| --------------------- | ----------- | ------------------------------------------- |
| `tap-target-min`      | 48px        | 일반 button, link                           |
| `tap-target-primary`  | 56px        | primary CTA (저장, 제출, 결제)              |
| `tap-target-critical` | 64px        | 발주 확정, 계약 서명 등 되돌릴 수 없는 액션 |

### 5.2 Focus ring (WCAG 2.2 AAA Focus Appearance)

```css
*:focus-visible {
  outline: 3px solid #3182f6; /* brand color, 3:1 contrast minimum */
  outline-offset: 2px; /* 2px gap from element border */
}

/* 대비 부족 영역 (예: brand 배경 위)에서는 white + brand 두 색 outline */
.focus-on-dark:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 0;
  box-shadow: 0 0 0 6px #3182f6; /* outer ring */
}
```

---

## 6. 컴포넌트 패턴 (Toss 정합 + 시니어 친화)

### 6.1 Button

- **Variants**: primary (fill, brand bg) / secondary (border) / ghost (text) / danger (red fill)
- **Sizes**: md (48px) / lg (56px primary) / xl (64px critical)
- **Width**: prefer `display="block"` or `full-width` on mobile primary CTA
- **Loading state**: spinner + label + disabled (Toss 관행)
- **Destructive copy**: 명확한 동사 + 결과 명시 ("작업지시서 삭제하기", "복구할 수 없습니다")

### 6.2 Form (Input + Label)

- Label **항상 표시** (`label always visible`, placeholder only 금지)
- Label `sr-label` (17px, weight 500)
- Input `sr-input` (18px, weight 400), `h-14` (56px) 유지 (현재 OK)
- Help/error text `sr-help` (16px, weight 400)
- Error format: 무엇 + 어떻게 + 예시 ("사업자등록번호 10자리. 예: 123-45-67890")
- Required `*` 항상 표시; aria-required

### 6.3 Modal / Dialog

- **Auto-dismiss 금지** for critical (결제, 계약, 분쟁)
- Confirm dialog: 명확한 액션명 + 결과 + 취소 옵션 동등 강조
- ESC + backdrop click + Cancel button (3가지 닫기 경로)

### 6.4 Toast / Alert

- **Critical**: persistent (사용자가 닫아야 사라짐); 자동 dismiss 금지
- **Non-critical**: ≥ 8초 (Toss 기본 3-5초 → 시니어 친화 늘림)
- `aria-live="polite"` (non-critical) / `aria-live="assertive"` (critical)
- 위치: 모바일 bottom, 데스크톱 top-right

### 6.5 Loading state

- Spinner alone 금지 → 텍스트 동반 ("잠시만 기다려주세요. 견적을 분석하고 있습니다.")
- Skeleton 권장 (Toss `Skeleton` pattern); list / card / detail 3개 패턴

---

## 7. Tailwind config 최종 diff (대표 chunk)

```diff
 const config: Config = {
   content: ['./src/**/*.{ts,tsx,mdx}'],
   theme: {
     extend: {
       fontFamily: {
         sans: ['var(--font-noto-sans-kr)', 'system-ui', 'sans-serif'],
       },
+      fontSize: {
+        'sr-display':    ['30px', { lineHeight: '40px', fontWeight: '700' }],
+        'sr-h1':         ['28px', { lineHeight: '37px', fontWeight: '700' }],
+        'sr-h2':         ['24px', { lineHeight: '33px', fontWeight: '700' }],
+        'sr-h3':         ['20px', { lineHeight: '29px', fontWeight: '600' }],
+        'sr-h4':         ['18px', { lineHeight: '27px', fontWeight: '600' }],
+        'sr-body':       ['18px', { lineHeight: '1.6', fontWeight: '400' }],
+        'sr-body-bold':  ['18px', { lineHeight: '1.6', fontWeight: '600' }],
+        'sr-label':      ['17px', { lineHeight: '1.5', fontWeight: '500' }],
+        'sr-input':      ['18px', { lineHeight: '1.5', fontWeight: '400' }],
+        'sr-button-lg':  ['18px', { lineHeight: '1.4', fontWeight: '600' }],
+        'sr-button-xl':  ['20px', { lineHeight: '1.4', fontWeight: '700' }],
+        'sr-help':       ['16px', { lineHeight: '1.7', fontWeight: '400' }],
+        'sr-metadata':   ['15px', { lineHeight: '1.5', fontWeight: '400' }],
+      },
       colors: {
         brand: {
-          DEFAULT: '#2563eb',
-          hover: '#1d4ed8',
-          light: '#dbeafe',
+          DEFAULT: '#3182f6',   // Toss blue500
+          hover:   '#2272eb',   // Toss blue600
+          active:  '#1b64da',   // Toss blue700
+          light:   '#e8f3ff',   // Toss blue50
+          subtle:  '#c9e2ff',   // Toss blue100
         },
         ink: {
-          950: '#0f172a',
-          700: '#475569',
-          400: '#94a3b8',
+          950: '#191f28',       // Toss grey900
+          800: '#333d4b',       // Toss grey800 (body, contrast 10:1 on #fff)
+          600: '#6b7684',       // Toss grey600 (metadata)
+          400: '#b0b8c1',       // Toss grey400 (disabled/placeholder ONLY)
         },
         surface: {
           DEFAULT: '#ffffff',
-          muted: '#f8fafc',
+          muted:   '#f2f4f6',   // Toss grey100
+          subtle:  '#f9fafb',   // Toss grey50
         },
         border: {
-          DEFAULT: '#e2e8f0',
-          subtle: '#f1f5f9',
+          DEFAULT: '#e5e8eb',   // Toss grey200
+          subtle:  '#f2f4f6',   // Toss grey100
+          strong:  '#d1d6db',   // Toss grey300
         },
-        success: '#10b981',
-        warning: '#f59e0b',
-        danger: '#ef4444',
+        success:        '#03b26c',  // Toss green500
+        'success-bg':   '#f0faf6',  // Toss green50
+        warning:        '#ffc342',  // Toss yellow500
+        'warning-bg':   '#fff9e7',  // Toss yellow50
+        'warning-text': '#dd7d02',  // Toss yellow900 (text on warning-bg)
+        danger:         '#f04452',  // Toss red500
+        'danger-bg':    '#ffeeee',  // Toss red50
+        info:           '#3182f6',  // = brand
+        toss: {
+          // 전체 palette (선택적 직접 참조용)
+          blue:   { 50:'#e8f3ff', 100:'#c9e2ff', 200:'#90c2ff', 300:'#64a8ff', 400:'#4593fc', 500:'#3182f6', 600:'#2272eb', 700:'#1b64da', 800:'#1957c2', 900:'#194aa6' },
+          grey:   { 50:'#f9fafb', 100:'#f2f4f6', 200:'#e5e8eb', 300:'#d1d6db', 400:'#b0b8c1', 500:'#8b95a1', 600:'#6b7684', 700:'#4e5968', 800:'#333d4b', 900:'#191f28' },
+          red:    { 50:'#ffeeee', 100:'#ffd4d6', 200:'#feafb4', 300:'#fb8890', 400:'#f66570', 500:'#f04452', 600:'#e42939', 700:'#d22030', 800:'#bc1b2a', 900:'#a51926' },
+          green:  { 50:'#f0faf6', 100:'#aeefd5', 200:'#76e4b8', 300:'#3fd599', 400:'#15c47e', 500:'#03b26c', 600:'#02a262', 700:'#029359', 800:'#028450', 900:'#027648' },
+          yellow: { 50:'#fff9e7', 100:'#ffefbf', 200:'#ffe69b', 300:'#ffdd78', 400:'#ffd158', 500:'#ffc342', 600:'#ffb331', 700:'#faa131', 800:'#ee8f11', 900:'#dd7d02' },
+        },
       },
       borderRadius: {
-        sm: '6px',
-        md: '8px',
-        lg: '12px',
+        sm:   '8px',
+        md:   '12px',
+        lg:   '16px',
+        xl:   '20px',
+        pill: '9999px',
       },
+      minHeight: {
+        'tap-min':      '48px',
+        'tap-primary':  '56px',
+        'tap-critical': '64px',
+      },
+      boxShadow: {
+        'toss-sm': '0 1px 2px 0 rgba(25, 31, 40, 0.04)',
+        'toss-md': '0 2px 8px 0 rgba(25, 31, 40, 0.06)',
+        'toss-lg': '0 8px 24px 0 rgba(25, 31, 40, 0.08)',
+        'focus-brand': '0 0 0 3px #3182f6, 0 0 0 5px #ffffff',
+      },
     },
   },
   plugins: [],
 }
```

---

## 8. 마이그레이션 순서 (Risk-minimized)

### Phase A (low risk, can do anytime)

1. **`docs/design-system.md` stale 수정** — Vue → React, 옛 routes → route groups, 시니어 px 구체화
2. **`docs/specs/design-system-upgrade.md` (본 doc)** — 작성 완료

### Phase B (medium risk, isolated)

3. **`apps/web/tailwind.config.ts` 전면 갱신** — token diff 적용; 컴포넌트가 token 참조하면 모두 색 변경됨
4. **`apps/web/src/app/globals.css` 갱신** — `font-size: 18px` base, `*:focus-visible`, `min-height: 48px` for buttons/links

### Phase C (medium risk, component-level)

5. **`AppButton.tsx`** — md/lg/xl + ghost variant + loading prop
6. **`AppBadge.tsx`** — size prop + text-xs 제거
7. **`ProcessStepper.tsx`** — token 갱신, active state 강화

### Phase D (visual regression risk)

8. **27개 라우트 전수 screenshot check** — Phase B/C 변경 후
   - Playwright visual regression (선택)
   - 또는 manual smoke (랜딩 / login / `(client)/request` / `(client)/matching` / `(common)/transactions/[id]` 정도)
9. **Lighthouse accessibility audit** — 목표 점수 95+ (현재 점수 측정 후 비교)
10. **WCAG AAA contrast 검증** — DevTools axe 또는 cargo install pa11y-ci

### Phase E (deployment)

11. **단일 atomic commit**: `feat(web,design): adopt toss tokens + senior-friendly overlay (WCAG AAA)`
12. **Push** (Phase A-D 모두 완료 후)

---

## 9. Acceptance criteria

W2-2.5 design system 작업 완료 기준:

- [ ] `tailwind.config.ts` Toss 정합 token + 시니어 overlay 모두 적용
- [ ] `globals.css` base `font-size: 18px` + `*:focus-visible` 3px outline + 2px offset
- [ ] `AppButton` md/lg/xl 3개 size + ghost variant + loading prop
- [ ] `AppBadge` size prop + 최소 14px font
- [ ] `ProcessStepper` token 적용
- [ ] `docs/design-system.md` stale 항목 모두 갱신
- [ ] 27개 라우트 시각적 회귀 없음 (manual smoke)
- [ ] Lighthouse accessibility ≥ 95
- [ ] WCAG AAA contrast 검증 (body text ≥ 9:1 on white)
- [ ] 모든 button/link `min-height: 48px` enforced
- [ ] Single atomic commit pushed

---

## 10. Delegation prompt (when ready to execute)

```python
task(
  category="visual-engineering",
  load_skills=["frontend-ui-ux"],
  run_in_background=True,
  description="Adopt Toss design tokens + senior-friendly overlay (WCAG AAA)",
  prompt="""
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
- Touch apps/api/ (not in scope)
- Modify W2-2 commit f484ad5 (atomic; this is a separate feat commit)
- Use auto-dismiss for critical UI (modals, error toasts)

[CONTEXT]
- W2-2 (Better Auth) is complete (commit f484ad5). apps/web/ no longer in flux.
- Current state read-only-verified: tailwind.config.ts uses #2563eb brand, ink-700 #475569, text-xs badge, 38-44px buttons
- 3 Tailwind warnings exist (img element) — pre-existing, NOT this scope to fix
- Toss canonical reference: https://tossmini-docs.toss.im/tds-mobile/foundation/colors/ + @toss/tds-colors npm package
- Senior UX research: WCAG 2.2 AAA + KCI Hangul senior smartphone study + KB스타뱅킹 큰글씨뱅킹 pattern (universal not segregated)
- Lighthouse target: a11y ≥ 95 on 5 routes
- Branch: dev-monorepo at HEAD f484ad5 (or wherever this fires from)
- DO NOT push — push policy is set by orchestrator (after Wave 3a likely)
"""
)
```

---

## 11. References

### Toss canonical sources

| 문서                   | URL                                                                      |
| ---------------------- | ------------------------------------------------------------------------ |
| TDS Mobile colors      | https://tossmini-docs.toss.im/tds-mobile/foundation/colors/              |
| TDS Mobile typography  | https://tossmini-docs.toss.im/tds-mobile/foundation/typography/          |
| TDS Mobile components  | https://tossmini-docs.toss.im/tds-mobile/components/                     |
| Apps in Toss examples  | https://github.com/toss/apps-in-toss-examples (production package usage) |
| NPM `@toss/tds-colors` | https://www.npmjs.com/package/@toss/tds-colors                           |
| Toss UT 시니어 연구    | https://toss.tech/article/senior-usability-research                      |

### WCAG / 시니어 UX sources

| 문서                                 | URL                                                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| WCAG 2.2 Contrast (AAA)              | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum                                                      |
| WCAG 2.2 Focus Appearance (AAA)      | https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html                                                 |
| WCAG 2.2 Target Size (AAA)           | https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced                                                  |
| WCAG Text Spacing                    | https://www.w3.org/WAI/WCAG21/Understanding/text-spacing                                                          |
| W3C COGA Usable Content              | https://www.w3.org/TR/coga-usable/                                                                                |
| NIA 2023 디지털정보격차 실태조사     | https://www.nia.or.kr/site/nia_kor/ex/bbs/View.do?bcIdx=26517&cbIdx=81623                                         |
| KCI 한국 시니어 스마트폰 타이포 연구 | https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002167407 |
| KB스타뱅킹 큰글씨뱅킹                | https://otalk.kbstar.com/quics?articleId=17291&page=C019391                                                       |

### Research session IDs (Sisyphus internal)

- `bg_90d34694` — Toss design tokens librarian (7m 20s)
- `bg_1150fd82` — Senior UX research librarian (3m 22s)

---

## 12. Out of scope (이 작업에 포함하지 않을 것)

| 항목                                                               | 어디서 처리?                        |
| ------------------------------------------------------------------ | ----------------------------------- |
| W2-2 follow-up (W2-2.5 backlog) — MIGRATION.md / PrismaService doc | 별도 W2-2.5 처리                    |
| W2-3 nestjs-zod DTO, W2-4 Prisma seed                              | Wave 3a 별도 agent                  |
| New page templates / new routes                                    | Phase 2 추가 페이지 작업            |
| 3 `<img>` LCP lint warning                                         | Phase 2 UI 작업 시                  |
| Dark mode                                                          | 별도 Phase 2+                       |
| 다국어 (영어 등)                                                   | 별도 Phase 2+                       |
| 키보드 단축키 system                                               | 별도 Phase 2+                       |
| 한국어 외 폰트 (Latin secondary)                                   | 현재 Noto Sans KR 유지; 변경 불필요 |

---

## 13. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                                            |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026-06-03 | 초기 작성. Toss canonical tokens + WCAG AAA 시니어 overlay + 27 라우트 영향 평가 + Phase A-E 마이그레이션 순서 + 정확한 tailwind diff + delegation prompt. Research session `bg_90d34694` + `bg_1150fd82` 종합. |
