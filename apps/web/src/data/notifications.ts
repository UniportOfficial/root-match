import type { Notification } from '@rootmatching/shared'

export const mockNotifications: Notification[] = [
  {
    id: 'noti1',
    type: 'message',
    title: '새 메시지 도착',
    content: '그린에너지 코리아에서 메시지가 도착했습니다.',
    isRead: false,
    createdAt: '2024-04-20T10:30:00',
    link: '/messages/msg1',
  },
  {
    id: 'noti2',
    type: 'match',
    title: '새로운 매칭 기업',
    content: '귀사와 관심 분야가 일치하는 3개 기업이 있습니다.',
    isRead: false,
    createdAt: '2024-04-19T15:00:00',
    link: '/companies',
  },
  {
    id: 'noti3',
    type: 'inquiry',
    title: '기업 프로필 조회',
    content: '5개 기업에서 귀사의 프로필을 조회했습니다.',
    isRead: true,
    createdAt: '2024-04-18T11:20:00',
    link: '/mypage/analytics',
  },
  {
    id: 'noti4',
    type: 'system',
    title: '프로필 업데이트 권장',
    content: '기업 프로필을 업데이트하여 매칭률을 높여보세요.',
    isRead: true,
    createdAt: '2024-04-17T09:00:00',
    link: '/mypage/profile',
  },
]
