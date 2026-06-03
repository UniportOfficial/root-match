import { Company, Prisma, PrismaClient } from '@prisma/client';
import { SeedUsers } from './00-users';

type PrismaTx = Prisma.TransactionClient | PrismaClient;

export type SeedCompanies = {
  clientCompany: Company;
  factoryCompany: Company;
};

export async function seedCompanies(
  prisma: PrismaTx,
  users: SeedUsers,
): Promise<SeedCompanies> {
  const [clientCompany, factoryCompany] = await Promise.all([
    prisma.company.upsert({
      where: { userId: users.clientUser.id },
      update: {
        name: '테크솔루션',
        industry: 'IT/소프트웨어',
        region: '서울',
        size: '중소기업',
        description:
          'AI 기반 비즈니스 솔루션을 제공하는 기업입니다. 머신러닝과 데이터 분석 기술을 활용하여 기업의 디지털 전환을 지원합니다.',
        contactEmail: 'contact@techsolution.co.kr',
        contactPhone: '02-1234-5678',
        website: 'https://techsolution.co.kr',
        establishedYear: 2018,
        employeeCount: 45,
        revenue: '50억원',
      },
      create: {
        userId: users.clientUser.id,
        name: '테크솔루션',
        industry: 'IT/소프트웨어',
        region: '서울',
        size: '중소기업',
        description:
          'AI 기반 비즈니스 솔루션을 제공하는 기업입니다. 머신러닝과 데이터 분석 기술을 활용하여 기업의 디지털 전환을 지원합니다.',
        contactEmail: 'contact@techsolution.co.kr',
        contactPhone: '02-1234-5678',
        website: 'https://techsolution.co.kr',
        establishedYear: 2018,
        employeeCount: 45,
        revenue: '50억원',
      },
    }),
    prisma.company.upsert({
      where: { userId: users.factoryUser.id },
      update: {
        name: '박공장 가공소',
        industry: '제조/생산',
        region: '경기',
        size: '중소기업',
        description: '정밀가공과 양산 대응이 가능한 뿌리산업 공장입니다.',
        contactEmail: 'factory@example.kr',
        contactPhone: '010-2222-3333',
      },
      create: {
        userId: users.factoryUser.id,
        name: '박공장 가공소',
        industry: '제조/생산',
        region: '경기',
        size: '중소기업',
        description: '정밀가공과 양산 대응이 가능한 뿌리산업 공장입니다.',
        contactEmail: 'factory@example.kr',
        contactPhone: '010-2222-3333',
      },
    }),
  ]);

  return { clientCompany, factoryCompany };
}
