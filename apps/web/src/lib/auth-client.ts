import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

const ACCOUNT_TYPE_VALUES = ['client', 'factory'] as const
const USER_ROLE_VALUES = ['admin', 'member', 'operator'] as const

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: [...USER_ROLE_VALUES], required: true, defaultValue: 'member', input: false },
        accountType: {
          type: [...ACCOUNT_TYPE_VALUES],
          required: true,
          defaultValue: 'client',
          input: true,
        },
      },
    }),
  ],
})

export type AccountTypeValue = (typeof ACCOUNT_TYPE_VALUES)[number]
export type UserRoleValue = (typeof USER_ROLE_VALUES)[number]
