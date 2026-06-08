import { AccountType, PrismaClient, User } from '@prisma/client';
import { getAuth } from '../../src/auth/auth.config';

const SEED_PASSWORD = 'TempPass!2026';

const seedUserInputs = [
  {
    email: 'hong@techsolution.co.kr',
    name: '홍길동',
    accountType: AccountType.client,
  },
  {
    email: 'factory@example.kr',
    name: '박공장',
    accountType: AccountType.factory,
  },
] as const;

export type SeedUsers = {
  clientUser: User;
  factoryUser: User;
};

async function ensureUser(
  prisma: PrismaClient,
  input: (typeof seedUserInputs)[number],
): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!existing) {
    await (
      await getAuth()
    ).api.signUpEmail({
      body: {
        email: input.email,
        password: SEED_PASSWORD,
        name: input.name,
        accountType: input.accountType,
      },
    });
  }

  return prisma.user.update({
    where: { email: input.email },
    data: { role: 'admin', emailVerified: true },
  });
}

export async function seedUsers(prisma: PrismaClient): Promise<SeedUsers> {
  const clientUser = await ensureUser(prisma, seedUserInputs[0]);
  const factoryUser = await ensureUser(prisma, seedUserInputs[1]);

  console.assert(clientUser, 'client user not created');
  console.assert(factoryUser, 'factory user not created');

  return { clientUser, factoryUser };
}
