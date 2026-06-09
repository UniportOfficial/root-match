import { AccountType, UserRole } from '@prisma/client';
import { Resend } from 'resend';
import { z } from 'zod';
import { prisma } from '../prisma/prisma.client';

// Env-driven derivation (Q5) — secure-cookie hierarchy mirrors Better Auth 1.6.13
// packages/better-auth/src/cookies/index.ts L47-L69.
const isProduction = process.env.NODE_ENV === 'production';

const betterAuthUrl =
  process.env.BETTER_AUTH_URL ??
  (isProduction ? 'https://api.rootmatching.com' : 'http://localhost:3001');

const webOrigin =
  process.env.WEB_ORIGIN ??
  (isProduction ? 'https://web.rootmatching.com' : 'http://localhost:3000');

// Enum SoT mirror (Q6) — Prisma `prisma/schema.prisma` is the canonical source.
export const USER_ROLE_VALUES = ['admin', 'member', 'operator'] as const;
export const ACCOUNT_TYPE_VALUES = ['client', 'factory'] as const;

export function assertSameSet(
  name: string,
  prismaValues: readonly string[],
  authValues: readonly string[],
): void {
  const a = [...prismaValues].sort((x, y) => x.localeCompare(y));
  const b = [...authValues].sort((x, y) => x.localeCompare(y));
  if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
    throw new Error(
      `${name} enum drift: Prisma=[${a.join(',')}] BetterAuth=[${b.join(',')}]. ` +
        `Update apps/api/src/auth/auth.config.ts to match prisma/schema.prisma.`,
    );
  }
}

assertSameSet('UserRole', Object.values(UserRole), USER_ROLE_VALUES);
assertSameSet('AccountType', Object.values(AccountType), ACCOUNT_TYPE_VALUES);

// Lazy factory — better-auth and its plugins are ESM-only, so we defer the
// top-level import to runtime via dynamic import() and cache the resolved
// instance via a Promise singleton (race-safe across concurrent cold starts).
// Return type is inferred to preserve the precise Auth<options-with-additionalFields> shape.
let authPromise: ReturnType<typeof buildAuth> | undefined;

async function buildAuth() {
  const [{ betterAuth }, { prismaAdapter }, { openAPI }] = await Promise.all([
    import('better-auth'),
    import('better-auth/adapters/prisma'),
    import('better-auth/plugins'),
  ]);
  return betterAuth({
    baseURL: betterAuthUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [webOrigin],
    database: prismaAdapter(prisma, { provider: 'postgresql' }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: isProduction,
      sendResetPassword: async ({ user, token }) => {
        if (!process.env.RESEND_API_KEY) {
          throw new Error('RESEND_API_KEY is not configured');
        }
        const resetUrl = `${webOrigin}/reset-password?token=${token}`;
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
          from: process.env.AUTH_EMAIL_FROM ?? 'onboarding@resend.dev',
          to: user.email,
          subject: 'RootMatch 비밀번호 재설정 안내',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h1 style="font-size: 20px; margin: 0 0 16px;">RootMatch 비밀번호 재설정</h1>
              <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
                ${user.name ?? ''}님, 안녕하세요.
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 24px;">
                아래 버튼을 눌러 새 비밀번호를 설정해주세요. 본인이 요청하지 않았다면 이 메일을 무시해도 됩니다.
              </p>
              <p style="margin: 0 0 24px;">
                <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  비밀번호 재설정하기
                </a>
              </p>
              <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
                버튼이 작동하지 않으면 다음 링크를 복사해 주세요:<br />
                <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
              </p>
              <p style="font-size: 12px; color: #9ca3af; line-height: 1.6; margin-top: 24px;">
                이 링크는 보안을 위해 일정 시간 후 만료됩니다.
              </p>
            </div>
          `,
        });
        if (error) {
          throw new Error(`Resend email send failed: ${error.message}`);
        }
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (!process.env.RESEND_API_KEY) {
          throw new Error('RESEND_API_KEY is not configured');
        }
        const verificationUrl = url.replace(
          /^https?:\/\/[^/]+\/api\/auth/,
          `${webOrigin}/_api/api/auth`,
        );
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
          from: process.env.AUTH_EMAIL_FROM ?? 'onboarding@resend.dev',
          to: user.email,
          subject: 'RootMatch 이메일 인증을 완료해주세요',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h1 style="font-size: 20px; margin: 0 0 16px;">RootMatch 이메일 인증</h1>
              <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
                ${user.name}님, 가입을 환영합니다.
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 24px;">
                아래 버튼을 눌러 이메일 인증을 완료해주세요.
              </p>
              <p style="margin: 0 0 24px;">
                <a href="${verificationUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  이메일 인증하기
                </a>
              </p>
              <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
                버튼이 작동하지 않으면 다음 링크를 복사해 주세요:<br />
                <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
          `,
        });
        if (error) {
          throw new Error(`Resend email send failed: ${error.message}`);
        }
      },
    },

    logger: {
      level: isProduction ? 'warn' : 'info',
      disabled: process.env.NODE_ENV === 'test',
    },

    advanced: {
      useSecureCookies: betterAuthUrl.startsWith('https://'),
      ...(isProduction && process.env.AUTH_COOKIE_DOMAIN
        ? {
            crossSubDomainCookies: {
              enabled: true,
              domain: process.env.AUTH_COOKIE_DOMAIN,
            },
          }
        : {}),
      defaultCookieAttributes: {
        sameSite: 'lax',
        path: '/',
        httpOnly: true,
        secure: betterAuthUrl.startsWith('https://'),
      },
    },

    // Q6: role server-managed (input:false), accountType user-selected (input:true).
    // accountType requires explicit validator.input because Better Auth
    // packages/better-auth/src/db/to-zod.ts L27-L35 maps Array type to z.any().
    user: {
      additionalFields: {
        role: {
          type: [...USER_ROLE_VALUES],
          required: true,
          defaultValue: 'member',
          input: false,
        },
        accountType: {
          type: [...ACCOUNT_TYPE_VALUES],
          required: true,
          defaultValue: 'client',
          input: true,
          validator: { input: z.enum(ACCOUNT_TYPE_VALUES) },
        },
      },
    },

    plugins: [openAPI({})],
  });
}

export function getAuth() {
  return (authPromise ??= buildAuth());
}

export type AuthSession = Awaited<
  ReturnType<typeof getAuth>
>['$Infer']['Session'];
export type AuthUser = AuthSession['user'];
