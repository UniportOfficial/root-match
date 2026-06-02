import type { User } from '@rootmatching/shared'
import { mockCompanies } from './companies'

const [defaultCompany] = mockCompanies

if (!defaultCompany) {
  throw new Error('mockCurrentUser requires at least one mock company')
}

export const mockCurrentUser: User = {
  id: 'user1',
  email: 'hong@techsolution.co.kr',
  name: '홍길동',
  company: defaultCompany,
  role: 'admin',
  position: '사업개발팀장',
  phone: '010-1234-5678',
}
