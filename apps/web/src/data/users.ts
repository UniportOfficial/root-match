import type { User } from '@rootmatching/shared'

export const mockCurrentUser: User = {
  id: 'user1',
  email: 'hong@techsolution.co.kr',
  name: '홍길동',
  company: null,
  role: 'admin',
  accountType: 'client',
  position: '사업개발팀장',
  phone: '010-1234-5678',
}

export const mockFactoryUser: User = {
  id: 'factory-user1',
  email: 'factory@example.kr',
  name: '박공장',
  company: null,
  role: 'admin',
  accountType: 'factory',
  position: '대표',
  phone: '010-2222-3333',
}
