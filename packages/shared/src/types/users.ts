import type { Company } from './companies.js'

export interface User {
  id: string
  email: string
  name: string
  company: Company
  role: 'admin' | 'member'
  avatar?: string
  position?: string
  phone?: string
}
