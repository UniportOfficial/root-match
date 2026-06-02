import type { Message } from '@rootmatching/shared'

export const mockMessages: Message[] = [
  {
    id: 'msg1',
    senderId: '2',
    senderName: '김영희',
    senderCompany: '그린에너지 코리아',
    receiverId: 'user1',
    receiverName: '홍길동',
    receiverCompany: '테크솔루션 주식회사',
    subject: '협력 제안 문의드립니다',
    content:
      '안녕하세요. 그린에너지 코리아의 김영희입니다.\n\n귀사의 AI 솔루션에 대해 관심이 있어 연락드립니다. ESG 데이터 분석 관련하여 협력 가능성을 논의하고 싶습니다.\n\n편하신 시간에 미팅 가능하실까요?',
    isRead: false,
    createdAt: '2024-04-20T10:30:00',
  },
  {
    id: 'msg2',
    senderId: '3',
    senderName: '박철수',
    senderCompany: '스마트팩토리 주식회사',
    receiverId: 'user1',
    receiverName: '홍길동',
    receiverCompany: '테크솔루션 주식회사',
    subject: 'AI 기반 품질검사 시스템 문의',
    content:
      '안녕하세요. 스마트팩토리의 박철수입니다.\n\n제조 공정 내 AI 기반 품질검사 시스템 도입을 검토 중입니다. 귀사의 솔루션에 대한 상세 자료와 견적을 요청드립니다.',
    isRead: true,
    createdAt: '2024-04-19T14:20:00',
  },
  {
    id: 'msg3',
    senderId: '5',
    senderName: '이미영',
    senderCompany: '메디헬스 솔루션',
    receiverId: 'user1',
    receiverName: '홍길동',
    receiverCompany: '테크솔루션 주식회사',
    subject: '헬스케어 AI 솔루션 파트너십 제안',
    content:
      '안녕하세요. 메디헬스 솔루션의 이미영입니다.\n\n의료 AI 분야에서 귀사와의 기술 파트너십을 제안드립니다. 상호 보완적인 기술력을 바탕으로 시너지를 낼 수 있을 것으로 기대합니다.',
    isRead: true,
    createdAt: '2024-04-18T09:15:00',
  },
  {
    id: 'msg4',
    senderId: '7',
    senderName: '최진우',
    senderCompany: '핀테크랩 코리아',
    receiverId: 'user1',
    receiverName: '홍길동',
    receiverCompany: '테크솔루션 주식회사',
    subject: 'API 연동 기술 협력 문의',
    content:
      '안녕하세요. 핀테크랩 코리아의 최진우입니다.\n\n결제 API와 귀사의 비즈니스 솔루션 연동에 대해 논의하고 싶습니다. 기술 미팅 일정을 잡을 수 있을까요?',
    isRead: false,
    createdAt: '2024-04-17T16:45:00',
  },
]
