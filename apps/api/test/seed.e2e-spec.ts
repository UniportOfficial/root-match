import { execFileSync } from 'child_process';
import { join } from 'path';
import { prisma } from '../src/prisma/prisma.client';
import { quoteRequestFixtureCount } from '../prisma/seed/20-quote-requests';

const apiRoot = join(__dirname, '..');

jest.setTimeout(60_000);

function runPrisma(args: string[]): void {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      execFileSync('pnpm', ['exec', 'prisma', ...args], {
        // NOSONAR S4036 — trusted CI dev command, args are constant string literals
        cwd: apiRoot,
        stdio: 'inherit',
        env: process.env,
      });
      return;
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2_000);
    }
  }
}

async function counts(): Promise<{
  users: number;
  companies: number;
  quoteRequests: number;
}> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const [users, companies, quoteRequests] = await Promise.all([
        prisma.user.count(),
        prisma.company.count(),
        prisma.quoteRequest.count(),
      ]);

      return { users, companies, quoteRequests };
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }
      await prisma.$disconnect();
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2_000);
    }
  }

  throw new Error('unreachable seed count retry state');
}

/**
 * Seed idempotency check.
 *
 * Note: destructive migrate reset moved to jest-e2e.globalSetup.ts.
 * This spec verifies db seed can run repeatedly against an already-seeded
 * DB without changing counts (upsert semantics).
 */
describe('Prisma seed e2e (W2-4)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seeds mock users, companies, quote requests idempotently', async () => {
    await expect(counts()).resolves.toEqual({
      users: 2,
      companies: 2,
      quoteRequests: quoteRequestFixtureCount,
    });

    runPrisma(['db', 'seed']);

    await expect(counts()).resolves.toEqual({
      users: 2,
      companies: 2,
      quoteRequests: quoteRequestFixtureCount,
    });
  });
});
