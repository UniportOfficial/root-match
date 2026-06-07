import { Logger } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ConfidenceTier } from '@prisma/client';
import type {
  Company,
  FactoryProfile as FactoryProfileRow,
} from '@prisma/client';
import type { QuoteRequestDraft } from '@rootmatching/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AiMatchingService } from './ai-matching.service';
import { VectorSearchService } from './vector-search.service';

const ENV_KEYS = [
  'OPENAI_API_KEY',
  'NODE_ENV',
  'MATCHING_MOCK_FALLBACK',
] as const;
type EnvKey = (typeof ENV_KEYS)[number];

function snapshotEnv(): Record<EnvKey, string | undefined> {
  return Object.fromEntries(
    ENV_KEYS.map((key) => [key, process.env[key]]),
  ) as Record<EnvKey, string | undefined>;
}

function restoreEnv(snapshot: Record<EnvKey, string | undefined>): void {
  for (const key of ENV_KEYS) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

type CompanyWithFactoryProfile = Company & {
  factoryProfile: FactoryProfileRow | null;
};

const NOW = new Date('2026-06-07T00:00:00Z');

function makeCompany(
  overrides: Partial<Company> & Pick<Company, 'id' | 'name'>,
): Company {
  return {
    userId: null,
    industry: null,
    region: '경기',
    size: null,
    description: null,
    contactEmail: null,
    contactPhone: null,
    website: null,
    establishedYear: null,
    employeeCount: null,
    revenue: null,
    externalId: null,
    confidenceTier: ConfidenceTier.A_CERTIFIED_ROOT,
    processHint: null,
    address: null,
    lat: null,
    lng: null,
    kakaoId: null,
    representative: null,
    sourceTypes: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeFactoryProfile(
  companyId: string,
  processes: string[],
  overrides: Partial<FactoryProfileRow> = {},
): FactoryProfileRow {
  return {
    id: `profile-${companyId}`,
    companyId,
    location: '서울',
    processes,
    trustScore: 90,
    deliveryRate: 95,
    reorderRate: 80,
    qualityScore: 90,
    deliveryScore: 90,
    priceCompetitiveness: 85,
    estimateMin: 300,
    estimateMax: 400,
    industrialComplex: null,
    reorderCustomerCount: null,
    verified: false,
    specialty: processes,
    equipment: ['장비'],
    products: ['부품'],
    monthlyCapacity: '월 3,000개',
    clients: ['고객사'],
    qualitySatisfaction: null,
    avgResponseTime: null,
    locationLat: null,
    locationLng: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

const FACTORY_PROFILES_WITH_COMPANY: Array<
  FactoryProfileRow & { company: Company }
> = [
  {
    ...makeFactoryProfile('factory-mold', ['금형', 'CNC 절삭'], {
      specialty: ['금형 정밀가공', '알루미늄 하우징', 'CNC 절삭'],
      equipment: ['5축 CNC', '머시닝센터'],
      products: ['알루미늄 하우징', '정밀 케이스'],
    }),
    company: makeCompany({ id: 'factory-mold', name: '공장-mold' }),
  },
  {
    ...makeFactoryProfile('factory-cast', ['주조', '표면처리']),
    company: makeCompany({ id: 'factory-cast', name: '공장-cast' }),
  },
  {
    ...makeFactoryProfile('factory-weld', ['용접', '소성가공']),
    company: makeCompany({ id: 'factory-weld', name: '공장-weld' }),
  },
  {
    ...makeFactoryProfile('factory-surf', ['표면처리', '열처리']),
    company: makeCompany({ id: 'factory-surf', name: '공장-surf' }),
  },
  {
    ...makeFactoryProfile('factory-heat', ['열처리']),
    company: makeCompany({ id: 'factory-heat', name: '공장-heat' }),
  },
];

const PPURI_COMPANIES: CompanyWithFactoryProfile[] = [
  {
    ...makeCompany({
      id: 'ppuri-1',
      name: '주식회사 와이씨에프',
      region: '경기',
      processHint: '주형 및 금형 제조업',
      externalId: 'C0000001',
      confidenceTier: ConfidenceTier.A_CERTIFIED_ROOT,
      representative: '홍길동',
      sourceTypes: ['kpic_or_root_cert'],
    }),
    factoryProfile: null,
  },
  {
    ...makeCompany({
      id: 'ppuri-2',
      name: '(주)인아',
      region: '경기',
      processHint: '금형',
      externalId: 'C0000002',
      confidenceTier: ConfidenceTier.A_CERTIFIED_ROOT,
    }),
    factoryProfile: null,
  },
  {
    ...makeCompany({
      id: 'ppuri-3',
      name: '대성주조',
      region: '경기',
      processHint: '알루미늄주물 주조업',
      externalId: 'C0000003',
      confidenceTier: ConfidenceTier.A_CERTIFIED_ROOT,
    }),
    factoryProfile: null,
  },
  {
    ...makeCompany({
      id: 'ppuri-4',
      name: '경기금형',
      region: '경기',
      processHint: '금형',
      externalId: 'C0000004',
      confidenceTier: ConfidenceTier.B_LOCAL_STRONG_INSIDE,
    }),
    factoryProfile: null,
  },
];

const sampleMoldRequest: QuoteRequestDraft = {
  projectName: '알루미늄 하우징 시제품',
  processType: 'mold',
  productItem: '전장 모듈용 알루미늄 케이스',
  estimatedQuantity: '초도 500개, 양산 월 3,000개',
  desiredDeadline: '2026-12-31',
  budgetRange: '3,000만원 ~ 4,500만원',
  detailRequirements: '6061 알루미늄 정밀 가공 및 표면 아노다이징',
};

describe('AiMatchingService', () => {
  let service: AiMatchingService;
  let envSnapshot: Record<EnvKey, string | undefined>;
  let companyFindManyMock: jest.Mock;
  let factoryProfileFindManyMock: jest.Mock;
  let quoteRequestFindUniqueMock: jest.Mock;
  let matchRecommendationUpsertMock: jest.Mock;

  beforeEach(async () => {
    envSnapshot = snapshotEnv();
    companyFindManyMock = jest.fn().mockResolvedValue([]);
    factoryProfileFindManyMock = jest
      .fn()
      .mockResolvedValue(FACTORY_PROFILES_WITH_COMPANY);
    quoteRequestFindUniqueMock = jest.fn();
    matchRecommendationUpsertMock = jest.fn();
    const prismaStub = {
      company: { findMany: companyFindManyMock },
      factoryProfile: { findMany: factoryProfileFindManyMock },
      quoteRequest: { findUnique: quoteRequestFindUniqueMock },
      matchRecommendation: { upsert: matchRecommendationUpsertMock },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiMatchingService,
        VectorSearchService,
        { provide: PrismaService, useValue: prismaStub },
      ],
    }).compile();

    service = module.get(AiMatchingService);
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
    jest.restoreAllMocks();
  });

  describe('matchFactories (FactoryProfile fallback path — mock fallback)', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });

    it('falls back to FactoryProfile when Company directory has no match', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');

      const result = await service.matchFactories(sampleMoldRequest);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(4);
      expect(companyFindManyMock).toHaveBeenCalled();
      expect(factoryProfileFindManyMock).toHaveBeenCalled();
      for (const rec of result) {
        expect(rec.id).toBeDefined();
        expect(rec.name).toBeDefined();
        expect(rec.aiReason).toBeDefined();
      }
    });

    it('returns Company.id as recommendation id (quote-requests join compat)', async () => {
      const result = await service.matchFactories(sampleMoldRequest);
      const ids = result.map((r) => r.id);
      for (const id of ids) {
        expect(FACTORY_PROFILES_WITH_COMPANY.map((f) => f.companyId)).toContain(
          id,
        );
      }
    });

    it('ranks deterministically across repeated calls', async () => {
      const first = await service.matchFactories(sampleMoldRequest);
      const second = await service.matchFactories(sampleMoldRequest);
      expect(second.map((r) => r.id)).toEqual(first.map((r) => r.id));
    });

    it('process-matching factories carry "[Mock · 금형 공정 매칭]" prefix', async () => {
      const result = await service.matchFactories(sampleMoldRequest);
      const moldMatch = result.find((r) => r.processes.includes('금형'));
      expect(moldMatch).toBeDefined();
      expect(moldMatch?.aiReason).toMatch(/^\[Mock · 금형 공정 매칭\]/);
    });

    it('throws when both Company and FactoryProfile sources return empty', async () => {
      factoryProfileFindManyMock.mockResolvedValueOnce([]);
      await expect(service.matchFactories(sampleMoldRequest)).rejects.toThrow(
        /No matching candidates available/,
      );
    });
  });

  describe('matchFactories (Phase 4 — Company directory path)', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });

    it('uses Ppuri Company candidates when matches exist (skips FactoryProfile fallback)', async () => {
      companyFindManyMock.mockResolvedValueOnce(PPURI_COMPANIES);

      const result = await service.matchFactories({
        ...sampleMoldRequest,
        region: '경기',
      });

      expect(result).toHaveLength(4);
      expect(factoryProfileFindManyMock).not.toHaveBeenCalled();
      const ids = result.map((r) => r.id);
      for (const id of ids) {
        expect(PPURI_COMPANIES.map((c) => c.id)).toContain(id);
      }
    });

    it('attaches Ppuri metadata (externalId, region, confidenceTier, processHint) to recommendation', async () => {
      companyFindManyMock.mockResolvedValueOnce(PPURI_COMPANIES);

      const result = await service.matchFactories({
        ...sampleMoldRequest,
        region: '경기',
      });

      const ppuri = result.find((r) => r.id === 'ppuri-1');
      expect(ppuri).toBeDefined();
      expect(ppuri?.externalId).toBe('C0000001');
      expect(ppuri?.region).toBe('경기');
      expect(ppuri?.confidenceTier).toBe('A_CERTIFIED_ROOT');
      expect(ppuri?.processHint).toBe('주형 및 금형 제조업');
    });

    it('synthesizes A-tier KPI for Company-only candidates (no FactoryProfile)', async () => {
      companyFindManyMock.mockResolvedValueOnce([PPURI_COMPANIES[0]!]);

      const result = await service.matchFactories({
        ...sampleMoldRequest,
        region: '경기',
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.trustScore).toBe(86);
      expect(result[0]?.deliveryRate).toBe(88);
      expect(result[0]?.qualityScore).toBe(86);
    });

    it('normalizes long-form region (경기도 → 경기) before query', async () => {
      companyFindManyMock.mockResolvedValueOnce(PPURI_COMPANIES);

      await service.matchFactories({
        ...sampleMoldRequest,
        region: '경기도',
      });

      const firstCall = companyFindManyMock.mock.calls[0]?.[0];
      const andClauses = firstCall?.where?.AND;
      expect(Array.isArray(andClauses)).toBe(true);
      const regionClause = (andClauses as { region?: string }[]).find(
        (clause) => clause.region !== undefined,
      );
      expect(regionClause?.region).toBe('경기');
    });

    it('retries without region when region-filtered query returns empty', async () => {
      companyFindManyMock
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(PPURI_COMPANIES);

      const result = await service.matchFactories({
        ...sampleMoldRequest,
        region: '제주',
      });

      expect(companyFindManyMock).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(4);
      const secondCallWhere = companyFindManyMock.mock.calls[1]?.[0]?.where;
      const secondAnd = secondCallWhere?.AND as { region?: string }[];
      const hasRegionClause = secondAnd.some((c) => c.region !== undefined);
      expect(hasRegionClause).toBe(false);
    });

    it('expands 금형 process to processHint OR list (금형, 주형)', async () => {
      companyFindManyMock.mockResolvedValueOnce(PPURI_COMPANIES);

      await service.matchFactories(sampleMoldRequest);

      const firstCall = companyFindManyMock.mock.calls[0]?.[0];
      const processFilter = (
        firstCall.where.AND as { OR?: Array<{ processHint?: unknown }> }[]
      ).find((c) => Array.isArray(c.OR));
      expect(processFilter).toBeDefined();
      const orHints = processFilter?.OR ?? [];
      const hintSubstrings = orHints
        .map((h) => (h.processHint as { contains?: string })?.contains)
        .filter(Boolean);
      expect(hintSubstrings).toEqual(expect.arrayContaining(['금형', '주형']));
    });

    it('filters confidenceTier to A+B only (excludes C/D directory rows)', async () => {
      companyFindManyMock.mockResolvedValueOnce(PPURI_COMPANIES);

      await service.matchFactories(sampleMoldRequest);

      const firstCall = companyFindManyMock.mock.calls[0]?.[0];
      const tierFilter = (
        firstCall.where.AND as { confidenceTier?: { in?: ConfidenceTier[] } }[]
      ).find((c) => c.confidenceTier !== undefined);
      expect(tierFilter?.confidenceTier?.in).toEqual([
        ConfidenceTier.A_CERTIFIED_ROOT,
        ConfidenceTier.B_LOCAL_STRONG_INSIDE,
      ]);
    });

    it('caps candidate pool at PREFILTER_TAKE (20)', async () => {
      companyFindManyMock.mockResolvedValueOnce(PPURI_COMPANIES);

      await service.matchFactories(sampleMoldRequest);

      const firstCall = companyFindManyMock.mock.calls[0]?.[0];
      expect(firstCall.take).toBe(20);
    });
  });

  describe('matchFactories (GPT defensive validation — Phase 4 GPT < 4 fix)', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key';
      process.env.NODE_ENV = 'test';
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      companyFindManyMock.mockResolvedValueOnce(PPURI_COMPANIES);
    });

    function stubGptResponse(matches: unknown[]): jest.SpyInstance {
      const embedJson = (data: unknown) =>
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      const embedding = Array.from({ length: 1536 }, (_, i) => (i % 7) / 10);
      return jest
        .spyOn(global, 'fetch')
        .mockImplementation(async (url: string | URL | Request) => {
          const target =
            typeof url === 'string'
              ? url
              : url instanceof URL
                ? url.toString()
                : url.url;
          if (target.includes('embeddings')) {
            return embedJson({ data: [{ embedding }] });
          }
          if (target.includes('chat/completions')) {
            return embedJson({
              choices: [
                {
                  message: { content: JSON.stringify({ matches }) },
                },
              ],
            });
          }
          throw new Error(`Unexpected fetch URL in test: ${target}`);
        });
    }

    it('pads to exactly 4 when GPT returns only 2 matches', async () => {
      stubGptResponse([
        {
          id: 'ppuri-1',
          aiReason: 'GPT 응답 1',
          qualityScore: 88,
          deliveryScore: 88,
          priceCompetitiveness: 80,
          trustScore: 90,
          estimateMin: 300,
          estimateMax: 500,
        },
        {
          id: 'ppuri-2',
          aiReason: 'GPT 응답 2',
          qualityScore: 85,
          deliveryScore: 85,
          priceCompetitiveness: 78,
          trustScore: 88,
          estimateMin: 280,
          estimateMax: 480,
        },
      ]);

      const result = await service.matchFactories({
        ...sampleMoldRequest,
        region: '경기',
      });

      expect(result).toHaveLength(4);
      const paddedRecs = result.filter((r) =>
        r.aiReason.startsWith('[자동 보강]'),
      );
      expect(paddedRecs).toHaveLength(2);
    });

    it('drops unknown IDs returned by GPT (hallucinated factory)', async () => {
      stubGptResponse([
        {
          id: 'ppuri-1',
          aiReason: 'OK',
          qualityScore: 80,
          deliveryScore: 80,
          priceCompetitiveness: 75,
          trustScore: 85,
          estimateMin: 300,
          estimateMax: 500,
        },
        {
          id: 'fake-hallucinated-id',
          aiReason: 'should be dropped',
          qualityScore: 99,
          deliveryScore: 99,
          priceCompetitiveness: 99,
          trustScore: 99,
          estimateMin: 100,
          estimateMax: 200,
        },
      ]);

      const result = await service.matchFactories({
        ...sampleMoldRequest,
        region: '경기',
      });

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.id)).not.toContain('fake-hallucinated-id');
    });

    it('dedupes when GPT returns the same ID twice', async () => {
      stubGptResponse([
        {
          id: 'ppuri-1',
          aiReason: 'first',
          qualityScore: 88,
          deliveryScore: 88,
          priceCompetitiveness: 80,
          trustScore: 90,
          estimateMin: 300,
          estimateMax: 500,
        },
        {
          id: 'ppuri-1',
          aiReason: 'duplicate',
          qualityScore: 60,
          deliveryScore: 60,
          priceCompetitiveness: 60,
          trustScore: 60,
          estimateMin: 100,
          estimateMax: 200,
        },
      ]);

      const result = await service.matchFactories({
        ...sampleMoldRequest,
        region: '경기',
      });

      const ppuri1Recs = result.filter((r) => r.id === 'ppuri-1');
      expect(ppuri1Recs).toHaveLength(1);
      expect(ppuri1Recs[0]?.aiReason).toBe('first');
    });
  });

  describe('matchFactories (conditional persistence)', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });

    it('skips persistence when quoteRequestId is absent', async () => {
      const result = await service.matchFactories(sampleMoldRequest);

      expect(quoteRequestFindUniqueMock).not.toHaveBeenCalled();
      expect(matchRecommendationUpsertMock).not.toHaveBeenCalled();
      for (const rec of result) {
        expect(rec.recommendationId).toBeUndefined();
      }
    });

    it('persists each recommendation with factoryId = Company.id', async () => {
      companyFindManyMock.mockResolvedValueOnce(PPURI_COMPANIES);
      quoteRequestFindUniqueMock.mockResolvedValue({ id: 'qr-real' });
      matchRecommendationUpsertMock.mockImplementation(
        ({
          create,
        }: {
          create: { quoteRequestId: string; factoryId: string };
        }) =>
          Promise.resolve({
            id: `mr-${create.factoryId}`,
            quoteRequestId: create.quoteRequestId,
            factoryId: create.factoryId,
          }),
      );

      const result = await service.matchFactories({
        ...sampleMoldRequest,
        region: '경기',
        quoteRequestId: 'qr-real',
      });

      expect(result).toHaveLength(4);
      expect(matchRecommendationUpsertMock).toHaveBeenCalledTimes(4);

      for (const rec of result) {
        expect(rec.recommendationId).toBe(`mr-${rec.id}`);
        expect(PPURI_COMPANIES.map((c) => c.id)).toContain(rec.id);
      }

      const firstCall = matchRecommendationUpsertMock.mock.calls[0][0];
      expect(firstCall.where.quoteRequestId_factoryId_source.source).toBe(
        'DETERMINISTIC_MOCK',
      );
    });
  });

  describe('matchFactories (production safety)', () => {
    it('production without API key throws instead of silently mocking', async () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'production';
      delete process.env.MATCHING_MOCK_FALLBACK;

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('network blocked in test'));

      await expect(service.matchFactories(sampleMoldRequest)).rejects.toThrow(
        /OPENAI_API_KEY/,
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('production with MATCHING_MOCK_FALLBACK="true" allows mock path', async () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'production';
      process.env.MATCHING_MOCK_FALLBACK = 'true';
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      const result = await service.matchFactories(sampleMoldRequest);

      expect(result).toHaveLength(4);
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
