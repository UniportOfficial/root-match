import { prisma } from '../src/prisma/prisma.client';
import { seedCompanies } from './seed/10-companies';
import { seedQuoteRequests } from './seed/20-quote-requests';
import { seedUsers } from './seed/00-users';

/**
 * Phase 1.W2-4 mock fixture seed.
 *
 * Triage catalog for `apps/web/src/data/*.ts`:
 * - Seed NOW: `users.ts` → User, `companies.ts` → Company,
 *   `requestData.ts` → QuoteRequest.
 * - Defer to Phase 2: `transactionData.ts`, `disputeData.ts`, `messages.ts`,
 *   `notifications.ts`, `activityLogs.ts` (mvp-roadmap §2.2-§2.5 scope).
 *
 * Relation order follows `apps/api/MIGRATION.md` §5 (관계 데이터 처리 순서):
 * User first (Better Auth signup), then Company, then QuoteRequest. Company and
 * QuoteRequest are wrapped in one Prisma transaction for relational integrity;
 * Better Auth signup is intentionally outside the transaction because it is not
 * transactional and creates a Session side-effect (R1).
 *
 * Dev/CI seed users use fixed password `TempPass!2026` (Q7 RESOLVED). Do not
 * use this in production; prod is blocked until the real signup flow. Because
 * `role` is server-managed (`role.input: false`, Q6 RESOLVED), this seed signs
 * users up with `accountType`, then promotes `role: admin` and
 * `emailVerified: true` through raw Prisma updates.
 *
 * R1 mitigation: after the user pass, seed-created Better Auth sessions are
 * deleted explicitly. This keeps the sanctioned signup/hash/account path while
 * leaving the seeded database free of one-off seed sessions.
 */
async function main(): Promise<void> {
  const users = await seedUsers(prisma);
  console.assert(users.clientUser, 'client user not created');
  console.assert(users.factoryUser, 'factory user not created');

  await prisma.session.deleteMany({
    where: { userId: { in: [users.clientUser.id, users.factoryUser.id] } },
  });

  await prisma.$transaction(async (tx) => {
    const companies = await seedCompanies(tx, users);
    console.assert(companies.clientCompany, 'client company not created');
    console.assert(companies.factoryCompany, 'factory company not created');

    const quoteRequests = await seedQuoteRequests(tx, {
      clientUser: users.clientUser,
      clientCompany: companies.clientCompany,
    });
    console.assert(
      quoteRequests.length > 0,
      'quote requests not created from fixture data',
    );
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
