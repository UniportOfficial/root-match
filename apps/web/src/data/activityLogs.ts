import type { ActivityLog, DashboardStats } from '@rootmatching/shared'

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'act1',
    type: 'view',
    description: '기업 프로필이 조회되었습니다.',
    targetCompanyId: '2',
    targetCompanyName: '그린에너지 코리아',
    createdAt: '2024-04-20T09:15:00',
  },
  {
    id: 'act2',
    type: 'inquiry',
    description: '협력 문의가 접수되었습니다.',
    targetCompanyId: '3',
    targetCompanyName: '스마트팩토리 주식회사',
    createdAt: '2024-04-19T14:30:00',
  },
  {
    id: 'act3',
    type: 'match',
    description: '새로운 매칭 기업이 발견되었습니다.',
    targetCompanyId: '5',
    targetCompanyName: '메디헬스 솔루션',
    createdAt: '2024-04-18T16:45:00',
  },
  {
    id: 'act4',
    type: 'message',
    description: '메시지가 발송되었습니다.',
    targetCompanyId: '7',
    targetCompanyName: '핀테크랩 코리아',
    createdAt: '2024-04-17T11:00:00',
  },
  {
    id: 'act5',
    type: 'view',
    description: '기업 프로필이 조회되었습니다.',
    targetCompanyId: '8',
    targetCompanyName: '건설테크 주식회사',
    createdAt: '2024-04-16T15:20:00',
  },
]

export const mockDashboardStats: DashboardStats = {
  totalViews: 127,
  totalInquiries: 23,
  totalMatches: 45,
  recentMessages: 4,
}
