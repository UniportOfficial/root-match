import { z } from 'zod'

export const UserRoleSchema = z.enum(['client', 'factory', 'operator'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const LoginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const RegisterSchema = z
  .object({
    email: z.string().email('유효한 이메일을 입력하세요.'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    passwordConfirm: z.string().min(8),
    name: z.string().min(1, '이름을 입력하세요.'),
    companyName: z.string().min(1, '회사명을 입력하세요.'),
    role: UserRoleSchema,
    phone: z
      .string()
      .min(1, '연락처를 입력하세요.')
      .regex(/^[\d-+\s()]+$/, '유효한 연락처 형식을 입력하세요.'),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: '이용 약관에 동의해야 합니다.' }),
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  })
export type RegisterInput = z.infer<typeof RegisterSchema>
