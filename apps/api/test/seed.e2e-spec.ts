import { execFileSync } from 'child_process';
import { join } from 'path';
import { prisma } from '../src/prisma/prisma.client';
import { quoteRequestFixtureCount } from '../prisma/seed/20-quote-requests';

const apiRoot = join(__dirname, '..');

jest.setTimeout(60_000);

function runPrisma(args: string[]): void {
  execFileSync('pnpm', ['exec', 'prisma', ...args], {
    cwd: apiRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

async function counts(): Promise<{
  users: number;
  companies: number;
  quoteRequests: number;
}> {
  const [users, companies, quoteRequests] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.quoteRequest.count(),
  ]);

  return { users, companies, quoteRequests };
}

describe('Prisma seed e2e (W2-4)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seeds mock users, companies, quote requests idempotently', async () => {
    runPrisma(['migrate', 'reset', '--force', '--skip-seed']);
    runPrisma(['db', 'seed']);

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
