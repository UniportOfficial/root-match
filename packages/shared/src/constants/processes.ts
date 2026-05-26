import { z } from 'zod'

export const ProcessCategorySchema = z.enum([
  'casting',
  'mold',
  'plastic-working',
  'heat-treatment',
  'surface-treatment',
  'welding',
])
export type ProcessCategory = z.infer<typeof ProcessCategorySchema>

export const PROCESS_CATEGORY_LABELS: Record<ProcessCategory, string> = {
  casting: '주조',
  mold: '금형',
  'plastic-working': '소성가공',
  'heat-treatment': '열처리',
  'surface-treatment': '표면처리',
  welding: '용접',
}

export const PROCESS_CATEGORIES = Object.keys(PROCESS_CATEGORY_LABELS) as readonly ProcessCategory[]
