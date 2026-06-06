import { Logger } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
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

type FactoryRow = FactoryProfileRow & { company: Company };

const NOW = new Date('2026-06-06T00:00:00Z');

function makeCompany(
  overrides: Partial<Company> & Pick<Company, 'id' | 'name'>,
): Company {
  return {
    userId: `user-${overrides.id}`,
    industry: '제조/생산',
    region: '서울',
    size: '중소기업',
    description: null,
    contactEmail: `${overrides.id}@example.kr`,
    contactPhone: '02-0000-0000',
    website: null,
    establishedYear: null,
    employeeCount: 20,
    revenue: null,
    externalId: null,
    confidenceTier: null,
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

function makeFactory(
  id: string,
  processes: string[],
  overrides: Partial<FactoryProfileRow> = {},
  companyName = `공장-${id}`,
): FactoryRow {
  const profile: FactoryProfileRow = {
    id: `profile-${id}`,
    companyId: id,
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
  return {
    ...profile,
    company: makeCompany({ id, name: companyName }),
  };
}

const TEST_FACTORIES: FactoryRow[] = [
  makeFactory('factory-mold', ['금형', 'CNC 절삭'], {
    specialty: ['금형 정밀가공', '알루미늄 하우징', 'CNC 절삭'],
    equipment: ['5축 CNC', '머시닝센터'],
    products: ['알루미늄 하우징', '정밀 케이스'],
  }),
  makeFactory('factory-cast', ['주조', '표면처리']),
  makeFactory('factory-weld', ['용접', '소성가공']),
  makeFactory('factory-surf', ['표면처리', '열처리']),
  makeFactory('factory-heat', ['열처리']),
];

const sampleRequest: QuoteRequestDraft = {
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
  let findManyMock: jest.Mock;

  let quoteRequestFindUniqueMock: jest.Mock;
  let matchRecommendationUpsertMock: jest.Mock;

  beforeEach(async () => {
    envSnapshot = snapshotEnv();
    findManyMock = jest.fn().mockResolvedValue(TEST_FACTORIES);
    quoteRequestFindUniqueMock = jest.fn();
    matchRecommendationUpsertMock = jest.fn();
    const prismaStub = {
      factoryProfile: { findMany: findManyMock },
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

  describe('matchFactories (mock fallback path)', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });

    it('returns 4 recommendations without calling fetch', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');

      const result = await service.matchFactories(sampleRequest);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(4);
      for (const rec of result) {
        expect(rec.id).toBeDefined();
        expect(rec.name).toBeDefined();
        expect(rec.aiReason).toBeDefined();
      }
    });

    it('returns Company.id as recommendation id (D2 mapping)', async () => {
      const result = await service.matchFactories(sampleRequest);
      const ids = result.map((r) => r.id);
      for (const id of ids) {
        expect(TEST_FACTORIES.map((f) => f.companyId)).toContain(id);
      }
    });

    it('queries factory profiles with company include once per call', async () => {
      await service.matchFactories(sampleRequest);
      expect(findManyMock).toHaveBeenCalledTimes(1);
      expect(findManyMock).toHaveBeenCalledWith({
        include: { company: true },
      });
    });

    it('ranks deterministically across repeated calls', async () => {
      const first = await service.matchFactories(sampleRequest);
      const second = await service.matchFactories(sampleRequest);
      expect(second.map((r) => r.id)).toEqual(first.map((r) => r.id));
    });

    it('process-matching factories carry "[Mock · {label} 공정 매칭]" prefix', async () => {
      const result = await service.matchFactories(sampleRequest);
      const moldMatch = result.find((r) => r.processes.includes('금형'));
      expect(moldMatch).toBeDefined();
      expect(moldMatch?.aiReason).toMatch(/^\[Mock · 금형 공정 매칭\]/);
    });

    it('non-matching factories carry "[Mock · API key 미설정]" prefix', async () => {
      const result = await service.matchFactories(sampleRequest);
      const nonMatching = result.filter(
        (r) => !r.processes.some((p) => p.includes('금형')),
      );
      expect(nonMatching.length).toBeGreaterThan(0);
      for (const rec of nonMatching) {
        expect(rec.aiReason).toMatch(/^\[Mock · API key 미설정\]/);
      }
    });

    it('logs Logger.warn() exactly once per matchFactories call', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      warnSpy.mockClear();
      await service.matchFactories(sampleRequest);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toEqual(
        expect.stringContaining('mock recommendations'),
      );
    });

    it('uses Korean label fallback for unknown process types', async () => {
      const requestWithUnknown: QuoteRequestDraft = {
        ...sampleRequest,
        processType: 'unknown-process',
      };
      const result = await service.matchFactories(requestWithUnknown);
      for (const rec of result) {
        expect(rec.aiReason).toMatch(/^\[Mock · API key 미설정\]/);
      }
    });

    it('throws when factoryProfile.findMany returns empty', async () => {
      findManyMock.mockResolvedValueOnce([]);
      await expect(service.matchFactories(sampleRequest)).rejects.toThrow(
        /No factory profiles available/,
      );
    });

    it('maps DB columns into FactoryRecommendation contract', async () => {
      const result = await service.matchFactories(sampleRequest);
      const moldMatch = result.find((r) => r.processes.includes('금형'));
      expect(moldMatch).toBeDefined();
      expect(moldMatch?.location).toBeTruthy();
      expect(moldMatch?.contactEmail).toMatch(/@/);
      expect(moldMatch?.deliveryRate).toBeGreaterThan(0);
      expect(moldMatch?.reorderRate).toBeGreaterThan(0);
    });
  });

  describe('matchFactories (OpenAI path)', () => {
    it('hits api.openai.com/v1/embeddings when OPENAI_API_KEY is present', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key';
      process.env.NODE_ENV = 'test';

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('network blocked in test'));

      await expect(service.matchFactories(sampleRequest)).rejects.toThrow();
      expect(fetchSpy).toHaveBeenCalled();

      const firstCallUrl = String(fetchSpy.mock.calls[0]?.[0] ?? '');
      expect(firstCallUrl).toContain('api.openai.com');
      expect(firstCallUrl).toContain('embeddings');
    });
  });

  describe('matchFactories (conditional persistence)', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });

    it('skips persistence when quoteRequestId is absent', async () => {
      const result = await service.matchFactories(sampleRequest);

      expect(quoteRequestFindUniqueMock).not.toHaveBeenCalled();
      expect(matchRecommendationUpsertMock).not.toHaveBeenCalled();
      for (const rec of result) {
        expect(rec.recommendationId).toBeUndefined();
      }
    });

    it('skips persistence when quoteRequestId is provided but not found', async () => {
      quoteRequestFindUniqueMock.mockResolvedValue(null);
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');

      const result = await service.matchFactories({
        ...sampleRequest,
        quoteRequestId: 'qr-missing',
      });

      expect(quoteRequestFindUniqueMock).toHaveBeenCalledWith({
        where: { id: 'qr-missing' },
        select: { id: true },
      });
      expect(matchRecommendationUpsertMock).not.toHaveBeenCalled();
      for (const rec of result) {
        expect(rec.recommendationId).toBeUndefined();
      }
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('qr-missing'),
      );
    });

    it('persists each recommendation and attaches recommendationId when quoteRequestId resolves', async () => {
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
        ...sampleRequest,
        quoteRequestId: 'qr-real',
      });

      expect(result).toHaveLength(4);
      expect(matchRecommendationUpsertMock).toHaveBeenCalledTimes(4);

      for (const rec of result) {
        expect(rec.recommendationId).toBe(`mr-${rec.id}`);
        expect(TEST_FACTORIES.map((f) => f.companyId)).toContain(rec.id);
      }

      const firstRec = result[0];
      if (!firstRec) throw new Error('expected at least one recommendation');
      const firstCall = matchRecommendationUpsertMock.mock.calls[0][0];
      expect(firstCall.where).toEqual({
        quoteRequestId_factoryId_source: {
          quoteRequestId: 'qr-real',
          factoryId: firstRec.id,
          source: 'DETERMINISTIC_MOCK',
        },
      });
      expect(firstCall.create).toEqual(
        expect.objectContaining({
          quoteRequestId: 'qr-real',
          factoryId: firstRec.id,
          source: 'DETERMINISTIC_MOCK',
          qualityScore: expect.any(Number),
          deliveryScore: expect.any(Number),
          priceScore: expect.any(Number),
          trustScore: expect.any(Number),
          score: expect.any(Number),
        }),
      );
      expect(firstCall.update).toEqual(
        expect.objectContaining({
          score: firstCall.create.score,
          qualityScore: firstCall.create.qualityScore,
        }),
      );
    });

    it('preserves recommendation order after persistence', async () => {
      quoteRequestFindUniqueMock.mockResolvedValue({ id: 'qr-real' });
      matchRecommendationUpsertMock.mockImplementation(
        ({
          create,
        }: {
          create: { factoryId: string; quoteRequestId: string };
        }) =>
          Promise.resolve({
            id: `mr-${create.factoryId}`,
            quoteRequestId: create.quoteRequestId,
            factoryId: create.factoryId,
          }),
      );

      const baseline = await service.matchFactories(sampleRequest);
      const persisted = await service.matchFactories({
        ...sampleRequest,
        quoteRequestId: 'qr-real',
      });

      expect(persisted.map((r) => r.id)).toEqual(baseline.map((r) => r.id));
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

      await expect(service.matchFactories(sampleRequest)).rejects.toThrow(
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

      const result = await service.matchFactories(sampleRequest);

      expect(result).toHaveLength(4);
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
