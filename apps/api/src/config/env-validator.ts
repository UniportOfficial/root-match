import { z } from 'zod';

/**
 * Production environment schema.
 *
 * Validation policy:
 *   - NODE_ENV !== 'production' → skip (dev/test/staging 자유)
 *   - NODE_ENV === 'production' + 누락 → console.error + process.exit(1) (fail-fast)
 *
 * Required-when-production:
 *   DATABASE_URL: Neon pooled connection string
 *   BETTER_AUTH_SECRET: ≥32 chars (openssl rand -base64 32)
 *   BETTER_AUTH_URL: 공개 API origin (e.g. https://api.rootmatching.com)
 *   COOKIE_SECRET: ≥32 chars
 *   UCANSIGN_API_KEY: developer center 발급
 *   UCANSIGN_WEBHOOK_SECRET: HMAC secret
 *
 * Conditionally-required:
 *   OPENAI_API_KEY OR MATCHING_MOCK_FALLBACK='true': matching mock fallback opt-in
 */
const prodEnvSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required in production'),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, 'BETTER_AUTH_SECRET must be at least 32 chars'),
    BETTER_AUTH_URL: z.url('BETTER_AUTH_URL must be a valid URL'),
    COOKIE_SECRET: z
      .string()
      .min(32, 'COOKIE_SECRET must be at least 32 chars'),
    UCANSIGN_API_KEY: z
      .string()
      .min(1, 'UCANSIGN_API_KEY is required in production'),
    UCANSIGN_WEBHOOK_SECRET: z
      .string()
      .min(1, 'UCANSIGN_WEBHOOK_SECRET is required in production'),
    OPENAI_API_KEY: z.string().optional(),
    MATCHING_MOCK_FALLBACK: z.enum(['true', 'false']).optional(),
  })
  .refine(
    (data) =>
      Boolean(data.OPENAI_API_KEY) || data.MATCHING_MOCK_FALLBACK === 'true',
    {
      message:
        'Either OPENAI_API_KEY or MATCHING_MOCK_FALLBACK="true" must be set in production',
      path: ['OPENAI_API_KEY'],
    },
  );

/**
 * Run on bootstrap. No-op outside production.
 */
export function validateProdEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const result = prodEnvSchema.safeParse(process.env);
  if (result.success) return;

  console.error('[env-validator] Production environment validation failed:');
  for (const issue of result.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'env';
    console.error(`  - ${path}: ${issue.message}`);
  }
  console.error(
    '\nSee apps/api/.env.example production checklist before booting production.',
  );
  process.exit(1);
}
