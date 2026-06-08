const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': '대시보드',
  '/quotes': '견적 모집 게시판',
  '/request': '새 견적 요청',
  '/matching': 'AI 매칭 결과',
  '/requests': '내 견적 요청',
  '/factory/onboarding': '공장 프로필 등록',
  '/factory/requests': '받은 견적 요청',
  '/contract': '계약 및 결제',
  '/contracts': '계약 현황',
  '/transactions': '거래 진행 현황',
  '/transaction/review': '거래 완료 및 리뷰',
  '/transaction/progress': '거래 진행 상세',
  '/disputes': '분쟁 중재 센터',
  '/disputes/mediation': '분쟁 중재 신청',
  '/companies': '기업 디렉토리',
  '/messages': '메시지',
  '/mypage': '마이페이지',
  '/mypage/analytics': '활동 분석',
  '/mypage/settings': '계정 설정',
}

const DYNAMIC_TITLE_PREFIXES: Array<{ prefix: string; title: string }> = [
  { prefix: '/factories/', title: '공장 상세' },
  { prefix: '/factory/requests/', title: '견적 제출' },
  { prefix: '/requests/', title: '견적 요청 상세' },
  { prefix: '/transactions/', title: '거래 진행 상세' },
  { prefix: '/disputes/', title: '분쟁 상세' },
]

export function resolveTitleForPath(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  for (const { prefix, title } of DYNAMIC_TITLE_PREFIXES) {
    if (pathname.startsWith(prefix)) return title
  }
  return '홈'
}
