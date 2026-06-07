import { AccountType, Prisma, PrismaClient, User } from '@prisma/client';
import { auth } from '../../src/auth/auth.config';

const SEED_PASSWORD = 'TempPass!2026';

type FactoryProfileSeed = {
  location?: string;
  processes: string[];
  trustScore: number;
  deliveryRate: number;
  reorderRate: number;
  qualityScore: number;
  deliveryScore: number;
  priceCompetitiveness: number;
  estimateMin: number;
  estimateMax: number;
  industrialComplex?: string;
  reorderCustomerCount?: number;
  verified: boolean;
  specialty: string[];
  equipment: string[];
  products: string[];
  monthlyCapacity?: string;
  clients: string[];
  qualitySatisfaction?: number;
  avgResponseTime?: string;
  locationLat?: number;
  locationLng?: number;
};

type FactorySeedEntry = {
  email: string;
  contactName: string;
  companyName: string;
  region: string;
  description: string;
  contactPhone: string;
  employeeCount: number;
  profile: FactoryProfileSeed;
};

const FACTORY_SEED: FactorySeedEntry[] = [
  {
    email: 'contact@munlae-precision.co.kr',
    contactName: '문래정밀가공 담당자',
    companyName: '문래정밀가공',
    region: '서울',
    contactPhone: '02-2630-1471',
    description:
      'CNC 정밀가공과 표면처리 양쪽 공정을 보유한 영등포 문래 기계금속 집적지의 중소 가공소.',
    employeeCount: 18,
    profile: {
      location: '서울 영등포구 문래동 · 안산/시화 23km 대응권',
      processes: ['CNC 절삭', '표면처리', '금형'],
      trustScore: 95,
      deliveryRate: 97,
      reorderRate: 91,
      qualityScore: 96,
      deliveryScore: 97,
      priceCompetitiveness: 88,
      estimateMin: 400,
      estimateMax: 500,
      industrialComplex: '문래 기계금속 집적지',
      reorderCustomerCount: 28,
      verified: true,
      specialty: ['CNC 정밀가공', '표면처리', '알루미늄 하우징'],
      equipment: [
        '5축 CNC 머시닝센터',
        '3축 CNC 4대',
        '정밀 연삭기',
        '표면 거칠기 측정기',
      ],
      products: [
        '알루미늄 하우징',
        '전장 모듈 케이스',
        '정밀 브라켓',
        '금형 부품',
      ],
      monthlyCapacity: '월 5,000개 이상',
      clients: ['테크솔루션 주식회사', '스마트기어(주)', '중견 제조사 다수'],
      qualitySatisfaction: 4.8,
      avgResponseTime: '1시간 40분',
    },
  },
  {
    email: 'sales@namdong-alpha.co.kr',
    contactName: '남동알파정밀 담당자',
    companyName: '(주)남동알파정밀',
    region: '인천',
    contactPhone: '032-815-3320',
    description:
      '인천 남동국가산업단지 내 CNC·아노다이징 협력망이 촘촘한 정밀가공 업체.',
    employeeCount: 32,
    profile: {
      location: '인천 남동구 고잔동 · 남동국가산업단지',
      processes: ['CNC 절삭', '표면처리', '열처리'],
      trustScore: 93,
      deliveryRate: 94,
      reorderRate: 87,
      qualityScore: 93,
      deliveryScore: 94,
      priceCompetitiveness: 84,
      estimateMin: 420,
      estimateMax: 520,
      industrialComplex: '인천 남동국가산업단지',
      reorderCustomerCount: 22,
      verified: true,
      specialty: ['CNC 절삭', '표면처리', '열처리'],
      equipment: ['CNC 머시닝센터 6대', '3차원 측정기', '초음파 세척 라인'],
      products: ['방열판', '알루미늄 케이스', '정밀 지그'],
      monthlyCapacity: '월 8,000개',
      clients: ['전자부품 제조사', '자동화 장비사'],
      qualitySatisfaction: 4.6,
      avgResponseTime: '2시간',
    },
  },
  {
    email: 'info@sihwa-housing.co.kr',
    contactName: '시화하우징ENG 담당자',
    companyName: '시화하우징ENG',
    region: '경기',
    contactPhone: '031-498-7211',
    description:
      '안산·시화권 근접성이 높고 알루미늄 케이스류 가공 후 후처리까지 통제 가능한 업체.',
    employeeCount: 27,
    profile: {
      location: '경기 안산시 단원구 · 안산 시화MTV',
      processes: ['CNC 절삭', '용접', '표면처리'],
      trustScore: 90,
      deliveryRate: 92,
      reorderRate: 84,
      qualityScore: 91,
      deliveryScore: 92,
      priceCompetitiveness: 90,
      estimateMin: 390,
      estimateMax: 490,
      industrialComplex: '안산 시화MTV',
      reorderCustomerCount: 19,
      verified: true,
      specialty: ['CNC 절삭', '용접 보강', '표면처리 협력'],
      equipment: ['CNC 머시닝센터 3대', '용접 부스 2개', '도장 부스'],
      products: ['알루미늄 케이스', '정밀 브라켓'],
      monthlyCapacity: '월 3,000개',
      clients: ['중견 제조사 다수'],
      qualitySatisfaction: 4.5,
      avgResponseTime: '3시간',
    },
  },
  {
    email: 'info@jungwang-surface.co.kr',
    contactName: '정왕표면기술 담당자',
    companyName: '(주)정왕표면기술',
    region: '경기',
    contactPhone: '031-431-5882',
    description:
      '표면 거칠기와 외관 기준이 까다로운 요청에 강점을 보유한 시화공단 업체.',
    employeeCount: 21,
    profile: {
      location: '경기 시흥시 정왕동 · 시화국가산업단지',
      processes: ['표면처리', '열처리', 'CNC 절삭'],
      trustScore: 88,
      deliveryRate: 89,
      reorderRate: 79,
      qualityScore: 90,
      deliveryScore: 89,
      priceCompetitiveness: 86,
      estimateMin: 360,
      estimateMax: 470,
      industrialComplex: '시화국가산업단지',
      reorderCustomerCount: 14,
      verified: true,
      specialty: ['Ra 0.8 이하 표면처리', '열처리'],
      equipment: ['아노다이징 라인', '도금 라인', '열처리로'],
      products: ['표면처리 부품', '열처리 부품'],
      monthlyCapacity: '월 4,000개',
      clients: ['CNC 협력사', '중소 제조사'],
      qualitySatisfaction: 4.4,
      avgResponseTime: '3시간',
    },
  },
  {
    email: 'sales@daesung-diecasting.co.kr',
    contactName: '대성다이캐스팅공업 담당자',
    companyName: '대성다이캐스팅공업',
    region: '인천',
    contactPhone: '032-580-4421',
    description:
      '알루미늄 주조 기반 대량화에 강한 검단산업단지 다이캐스팅 전문 업체.',
    employeeCount: 45,
    profile: {
      location: '인천 서구 오류동 · 검단산업단지',
      processes: ['주조', '금형', '표면처리'],
      trustScore: 84,
      deliveryRate: 86,
      reorderRate: 73,
      qualityScore: 86,
      deliveryScore: 84,
      priceCompetitiveness: 78,
      estimateMin: 470,
      estimateMax: 620,
      industrialComplex: '검단산업단지',
      reorderCustomerCount: 11,
      verified: true,
      specialty: ['알루미늄 다이캐스팅', '후가공'],
      equipment: ['다이캐스팅기 4대', '후가공 라인'],
      products: ['주조 부품', '대량 양산품'],
      monthlyCapacity: '월 10,000개 이상',
      clients: ['자동차 부품사', '중견 제조사'],
      qualitySatisfaction: 4.3,
      avgResponseTime: '4시간',
    },
  },
  {
    email: 'contact@banwol-press.co.kr',
    contactName: '반월프레스메탈 담당자',
    companyName: '반월프레스메탈',
    region: '경기',
    contactPhone: '031-419-2308',
    description:
      '안산 반월공단 근접성과 금형·프레스 역량을 보유한 양산 부품 업체.',
    employeeCount: 16,
    profile: {
      location: '경기 안산시 단원구 · 반월국가산업단지',
      processes: ['소성가공', '금형', '용접'],
      trustScore: 81,
      deliveryRate: 83,
      reorderRate: 69,
      qualityScore: 80,
      deliveryScore: 82,
      priceCompetitiveness: 91,
      estimateMin: 330,
      estimateMax: 430,
      industrialComplex: '반월국가산업단지',
      reorderCustomerCount: 9,
      verified: false,
      specialty: ['프레스', '금형'],
      equipment: ['프레스기 5대', '금형 제작 라인'],
      products: ['프레스 부품', '판금 부품'],
      monthlyCapacity: '월 6,000개',
      clients: ['중소 제조사'],
      qualitySatisfaction: 4.1,
      avgResponseTime: '4시간',
    },
  },
  {
    email: 'info@younghung-ht.co.kr',
    contactName: '영흥열처리 담당자',
    companyName: '영흥열처리',
    region: '인천',
    contactPhone: '032-822-7196',
    description:
      '후처리 전문성을 보유한 남동공단 내 열처리·표면처리 전문 업체.',
    employeeCount: 12,
    profile: {
      location: '인천 남동구 논현동 · 남동국가산업단지',
      processes: ['열처리', '표면처리'],
      trustScore: 76,
      deliveryRate: 78,
      reorderRate: 65,
      qualityScore: 78,
      deliveryScore: 76,
      priceCompetitiveness: 92,
      estimateMin: 250,
      estimateMax: 360,
      industrialComplex: '인천 남동국가산업단지',
      reorderCustomerCount: 7,
      verified: false,
      specialty: ['열처리', '표면처리 후공정'],
      equipment: ['열처리로 2대', '표면처리 라인'],
      products: ['열처리 부품', '후처리 부품'],
      monthlyCapacity: '월 5,000개',
      clients: ['CNC 협력사'],
      qualitySatisfaction: 4.0,
      avgResponseTime: '5시간',
    },
  },
  {
    email: 'sales@hangang-welding.co.kr',
    contactName: '한강용접정공 담당자',
    companyName: '한강용접정공',
    region: '경기',
    contactPhone: '031-988-4150',
    description: '소형 용접·판금 구조물에 특화된 김포 양촌산업단지 중소 공장.',
    employeeCount: 9,
    profile: {
      location: '경기 김포시 양촌읍 · 양촌산업단지',
      processes: ['용접', '소성가공', '표면처리'],
      trustScore: 72,
      deliveryRate: 69,
      reorderRate: 61,
      qualityScore: 70,
      deliveryScore: 66,
      priceCompetitiveness: 87,
      estimateMin: 300,
      estimateMax: 430,
      industrialComplex: '양촌산업단지',
      reorderCustomerCount: 5,
      verified: false,
      specialty: ['용접', '판금'],
      equipment: ['용접기 4대', '판금 절단기'],
      products: ['용접 구조물', '판금 부품'],
      monthlyCapacity: '월 2,000개',
      clients: ['중소 제조사'],
      qualitySatisfaction: 3.9,
      avgResponseTime: '6시간',
    },
  },
];

// User/company already seeded by 00-users + 10-companies; W3 only attaches a
// baseline FactoryProfile so 박공장 joins the matching candidate pool.
const PARK_FACTORY_PROFILE: FactoryProfileSeed = {
  location: '경기 (수도권 산업단지)',
  processes: ['CNC 절삭', '용접', '표면처리'],
  trustScore: 80,
  deliveryRate: 90,
  reorderRate: 70,
  qualityScore: 80,
  deliveryScore: 80,
  priceCompetitiveness: 80,
  estimateMin: 300,
  estimateMax: 450,
  reorderCustomerCount: 4,
  verified: false,
  specialty: ['CNC 절삭', '용접'],
  equipment: ['CNC 머시닝센터', '용접기'],
  products: ['일반 산업용 부품'],
  monthlyCapacity: '월 1,000개',
  clients: ['테크솔루션 주식회사'],
  qualitySatisfaction: 4.2,
  avgResponseTime: '4시간',
};

async function ensureFactoryUser(
  prisma: PrismaClient,
  entry: FactorySeedEntry,
): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { email: entry.email },
  });

  if (!existing) {
    await auth.api.signUpEmail({
      body: {
        email: entry.email,
        password: SEED_PASSWORD,
        name: entry.contactName,
        accountType: AccountType.factory,
      },
    });
  }

  return prisma.user.update({
    where: { email: entry.email },
    data: { role: 'admin', emailVerified: true },
  });
}

async function upsertFactoryCompany(
  tx: Prisma.TransactionClient,
  userId: string,
  entry: FactorySeedEntry,
) {
  return tx.company.upsert({
    where: { userId },
    update: {
      name: entry.companyName,
      industry: '제조/생산',
      region: entry.region,
      size: '중소기업',
      description: entry.description,
      contactEmail: entry.email,
      contactPhone: entry.contactPhone,
      employeeCount: entry.employeeCount,
    },
    create: {
      userId,
      name: entry.companyName,
      industry: '제조/생산',
      region: entry.region,
      size: '중소기업',
      description: entry.description,
      contactEmail: entry.email,
      contactPhone: entry.contactPhone,
      employeeCount: entry.employeeCount,
    },
  });
}

async function upsertFactoryProfile(
  tx: Prisma.TransactionClient,
  companyId: string,
  profile: FactoryProfileSeed,
) {
  return tx.factoryProfile.upsert({
    where: { companyId },
    update: profile,
    create: { companyId, ...profile },
  });
}

async function ensureFactoryUsers(prisma: PrismaClient) {
  return Promise.all(
    FACTORY_SEED.map(async (entry) => ({
      entry,
      user: await ensureFactoryUser(prisma, entry),
    })),
  );
}

async function cleanupSignupSessions(
  prisma: PrismaClient,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
}

async function backfillParkFactoryProfile(
  tx: Prisma.TransactionClient,
): Promise<void> {
  const parkFactoryCompany = await tx.company.findFirst({
    where: { name: '박공장 가공소' },
  });
  if (parkFactoryCompany) {
    await upsertFactoryProfile(tx, parkFactoryCompany.id, PARK_FACTORY_PROFILE);
  }
}

export async function seedFactories(prisma: PrismaClient): Promise<void> {
  const userEntries = await ensureFactoryUsers(prisma);
  await cleanupSignupSessions(
    prisma,
    userEntries.map(({ user }) => user.id),
  );

  await prisma.$transaction(async (tx) => {
    for (const { entry, user } of userEntries) {
      const company = await upsertFactoryCompany(tx, user.id, entry);
      await upsertFactoryProfile(tx, company.id, entry.profile);
    }
    await backfillParkFactoryProfile(tx);
  });
}
