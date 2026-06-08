import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';
import { AccountType, UserRole } from '@prisma/client';
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

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [webOrigin],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: isProduction,
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

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession['user'];
