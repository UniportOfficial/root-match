import {
  Company,
  Prisma,
  PrismaClient,
  QuoteRequest,
  QuoteRequestStatus,
  User,
} from '@prisma/client';

type PrismaTx = Prisma.TransactionClient | PrismaClient;

const quoteRequestFixtures = [
  {
    projectName: '알루미늄 하우징 시제품 제작',
    processType: '금형 / CNC 정밀가공',
    productItem: '전장 모듈용 알루미늄 케이스',
    estimatedQuantity: '1차 500개, 양산 월 3,000개',
    desiredDeadline: '2026년 5월 20일',
    budgetRange: '3,000만원 ~ 4,500만원',
    detailRequirements:
      '6061 알루미늄 소재 기준으로 CNC 정밀가공과 표면 아노다이징 처리가 필요합니다. 외관 스크래치 기준이 엄격하며, 초도품 검수 후 양산 전환 예정입니다.',
    status: QuoteRequestStatus.NEW,
  },
  {
    projectName: '스틸 브라켓 양산 견적 요청',
    processType: '소성가공 / 표면처리',
    productItem: '차량용 스틸 브라켓',
    estimatedQuantity: '월 10,000개',
    desiredDeadline: '2026년 6월 10일',
    budgetRange: '월 7,000만원 내외',
    detailRequirements:
      '프레스 성형 후 아연도금 처리가 필요합니다. 양산 전 PPAP 수준의 검사 성적서 제출이 가능한 업체를 찾고 있습니다.',
    status: QuoteRequestStatus.REVIEWING,
  },
  {
    projectName: '설비 커버 용접 제작',
    processType: '용접 / 도장',
    productItem: '산업용 설비 커버',
    estimatedQuantity: '초도 30세트',
    desiredDeadline: '2026년 5월 30일',
    budgetRange: '1,200만원 ~ 1,800만원',
    detailRequirements:
      'SS400 판재 절곡 및 용접 후 분체도장 마감이 필요합니다. 설치 현장 납품 가능 여부도 함께 검토해 주세요.',
    status: QuoteRequestStatus.QUOTED,
  },
] as const;

export const quoteRequestFixtureCount = quoteRequestFixtures.length;

export async function seedQuoteRequests(
  prisma: PrismaTx,
  params: { clientUser: User; clientCompany: Company },
): Promise<QuoteRequest[]> {
  const results: QuoteRequest[] = [];

  for (const fixture of quoteRequestFixtures) {
    const quoteRequest = await prisma.quoteRequest.upsert({
      where: {
        clientUserId_projectName: {
          clientUserId: params.clientUser.id,
          projectName: fixture.projectName,
        },
      } as unknown as Prisma.QuoteRequestWhereUniqueInput,
      update: {
        clientCompanyId: params.clientCompany.id,
        processType: fixture.processType,
        productItem: fixture.productItem,
        estimatedQuantity: fixture.estimatedQuantity,
        desiredDeadline: fixture.desiredDeadline,
        budgetRange: fixture.budgetRange,
        detailRequirements: fixture.detailRequirements,
        status: fixture.status,
      },
      create: {
        clientUserId: params.clientUser.id,
        clientCompanyId: params.clientCompany.id,
        projectName: fixture.projectName,
        processType: fixture.processType,
        productItem: fixture.productItem,
        estimatedQuantity: fixture.estimatedQuantity,
        desiredDeadline: fixture.desiredDeadline,
        budgetRange: fixture.budgetRange,
        detailRequirements: fixture.detailRequirements,
        status: fixture.status,
      },
    });

    results.push(quoteRequest);
  }

  return results;
}
