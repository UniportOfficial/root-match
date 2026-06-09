import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// 프로젝트에서 정의한 커스텀 폰트 토큰을 tailwind-merge가 `font-size` 그룹으로
// 인식하도록 등록한다. 등록하지 않으면 `text-rm-body-d` 같은 폰트 사이즈 토큰이
// `text-white` 같은 텍스트 색상 클래스와 같은 그룹으로 오인되어, 더 뒤에 작성된
// 사이즈 토큰이 색상을 덮어버린다. (예: brand 버튼의 `text-white`가 사라지면서
// 로그인/회원가입 CTA 글자가 거의 검정으로 보이는 현상 — 2026-06-09)
const customFontSizeTokens = [
  'text-rm-display',
  'text-rm-display-m',
  'text-rm-h1',
  'text-rm-h1-m',
  'text-rm-h2',
  'text-rm-h2-m',
  'text-rm-h3',
  'text-rm-body-lg',
  'text-rm-body',
  'text-rm-body-d',
  'text-rm-body-sm',
  'text-rm-caption',
  'text-rm-data-lg',
  'text-rm-data-xl',
  'text-ct-display',
  'text-ct-title1',
  'text-ct-title2',
  'text-ct-title3',
  'text-ct-body-l',
  'text-ct-body',
  'text-ct-body-s',
  'text-ct-caption',
  'text-sr-display',
  'text-sr-h1',
  'text-sr-h2',
  'text-sr-h3',
  'text-sr-h4',
  'text-sr-body',
  'text-sr-body-bold',
  'text-sr-label',
  'text-sr-input',
  'text-sr-button-lg',
  'text-sr-button-xl',
  'text-sr-help',
  'text-sr-metadata',
]

const customTwMerge = extendTailwindMerge<'kr-text-wrap'>({
  extend: {
    classGroups: {
      'font-size': customFontSizeTokens,
      'kr-text-wrap': ['text-kr-keep', 'text-kr-pretty', 'text-kr-balance', 'text-anywhere'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return customTwMerge(clsx(inputs))
}
