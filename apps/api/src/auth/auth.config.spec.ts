// Jest cannot resolve better-auth's ESM-only dist/*.mjs as CommonJS. The pure
// unit test below only needs `assertSameSet` + the readonly enum tuples — the
// betterAuth() factory call inside auth.config.ts is irrelevant here, so we
// stub the module surface and let module-time `assertSameSet` calls execute
// against the real Prisma enums.
jest.mock('better-auth', () => ({
  betterAuth: jest.fn(() => ({ api: {}, $Infer: { Session: {} } })),
}));
jest.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: jest.fn(),
}));
jest.mock('../prisma/prisma.client', () => ({ prisma: {} }));

import {
  ACCOUNT_TYPE_VALUES,
  USER_ROLE_VALUES,
  assertSameSet,
} from './auth.config';

describe('auth.config — enum drift guard (Q6)', () => {
  it('exports the canonical Prisma-mirrored tuples', () => {
    const byLocale = (a: string, b: string): number => a.localeCompare(b);
    expect([...USER_ROLE_VALUES].sort(byLocale)).toEqual(
      ['admin', 'member', 'operator'].sort(byLocale),
    );
    expect([...ACCOUNT_TYPE_VALUES].sort(byLocale)).toEqual(
      ['client', 'factory'].sort(byLocale),
    );
  });

  it('assertSameSet passes when both sides match', () => {
    expect(() =>
      assertSameSet(
        'UserRole',
        ['admin', 'member', 'operator'],
        USER_ROLE_VALUES,
      ),
    ).not.toThrow();
    expect(() =>
      assertSameSet('AccountType', ['client', 'factory'], ACCOUNT_TYPE_VALUES),
    ).not.toThrow();
  });

  it('assertSameSet throws with a descriptive message when ACCOUNT_TYPE_VALUES is mutated to a smaller set', () => {
    const mutatedAuthValues = ['client'] as const;
    expect(() =>
      assertSameSet('AccountType', ['client', 'factory'], mutatedAuthValues),
    ).toThrow(
      /AccountType enum drift: Prisma=\[client,factory\] BetterAuth=\[client\]/,
    );
  });

  it('assertSameSet throws when ACCOUNT_TYPE_VALUES is mutated to add an extra value', () => {
    const mutatedAuthValues = ['client', 'factory', 'unknown'] as const;
    expect(() =>
      assertSameSet('AccountType', ['client', 'factory'], mutatedAuthValues),
    ).toThrow(
      /AccountType enum drift: Prisma=\[client,factory\] BetterAuth=\[client,factory,unknown\]/,
    );
  });

  it('assertSameSet throws when UserRole tuple is replaced with a different set of same length', () => {
    expect(() =>
      assertSameSet(
        'UserRole',
        ['admin', 'member', 'operator'],
        ['admin', 'member', 'visitor'],
      ),
    ).toThrow(/UserRole enum drift/);
  });
});
