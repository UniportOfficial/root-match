import type { Company } from './companies.js'

export type UserPermission = 'admin' | 'member'

export type AccountType = 'client' | 'factory'

export interface User {
  id: string
  email: string
  name: string
  company: Company
  role: UserPermission
  accountType?: AccountType
  avatar?: string
  position?: string
  phone?: string
}
