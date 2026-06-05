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

describe('VectorSearchService', () => {
  let service: VectorSearchService;
  let envSnapshot: Record<EnvKey, string | undefined>;

  beforeEach(() => {
    envSnapshot = snapshotEnv();
    service = new VectorSearchService();
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
    jest.restoreAllMocks();
  });

  describe('hasApiKey', () => {
    it('returns false when OPENAI_API_KEY is undefined', () => {
      delete process.env.OPENAI_API_KEY;
      expect(service.hasApiKey()).toBe(false);
    });

    it('returns false when OPENAI_API_KEY is only whitespace', () => {
      process.env.OPENAI_API_KEY = '   ';
      expect(service.hasApiKey()).toBe(false);
    });

    it('returns true when OPENAI_API_KEY has a real value', () => {
      process.env.OPENAI_API_KEY = 'sk-test-1234';
      expect(service.hasApiKey()).toBe(true);
    });
  });

  describe('shouldUseMockFallback', () => {
    it('returns false when API key is present regardless of NODE_ENV', () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.NODE_ENV = 'production';
      expect(service.shouldUseMockFallback()).toBe(false);
    });

    it('returns true in non-production when API key is missing', () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'development';
      expect(service.shouldUseMockFallback()).toBe(true);
    });

    it('blocks mock fallback in production when MATCHING_MOCK_FALLBACK is unset', () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'production';
      delete process.env.MATCHING_MOCK_FALLBACK;
      expect(service.shouldUseMockFallback()).toBe(false);
    });

    it('blocks mock fallback in production when MATCHING_MOCK_FALLBACK is not "true"', () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'production';
      process.env.MATCHING_MOCK_FALLBACK = 'false';
      expect(service.shouldUseMockFallback()).toBe(false);
    });

    it('allows mock fallback in production when MATCHING_MOCK_FALLBACK="true"', () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'production';
      process.env.MATCHING_MOCK_FALLBACK = 'true';
      expect(service.shouldUseMockFallback()).toBe(true);
    });
  });

  describe('rankByEmbedding (mock fallback)', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';
    });

    it('does not call fetch when using mock fallback', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      const items = ['a', 'b', 'c'];
      await service.rankByEmbedding('query', items, (id) => `desc-${id}`);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('ranks more-overlapping items higher (Jaccard determinism)', async () => {
      const items = ['mold-factory', 'casting-factory'];
      const result = await service.rankByEmbedding(
        '금형 정밀 가공 알루미늄',
        items,
        (id) => (id === 'mold-factory' ? '금형 정밀 가공 전문' : '주조 전문'),
      );
      expect(result).toHaveLength(2);
      expect(result[0]?.item).toBe('mold-factory');
      expect(result[0]?.similarity ?? 0).toBeGreaterThan(
        result[1]?.similarity ?? 0,
      );
    });

    it('returns similarity scores in [0, 1]', async () => {
      const result = await service.rankByEmbedding(
        'foo',
        ['a', 'b'],
        () => 'bar',
      );
      for (const entry of result) {
        expect(entry.similarity).toBeGreaterThanOrEqual(0);
        expect(entry.similarity).toBeLessThanOrEqual(1);
      }
    });

    it('preserves every input item exactly once', async () => {
      const items = ['x', 'y', 'z'];
      const result = await service.rankByEmbedding('any', items, () => 'desc');
      const got = result.map((r) => r.item).sort((a, b) => a.localeCompare(b));
      expect(got).toEqual(['x', 'y', 'z']);
    });
  });

  describe('cosineSimilarity', () => {
    it('returns 0 for two zero vectors', () => {
      expect(service.cosineSimilarity([0, 0], [0, 0])).toBe(0);
    });

    it('returns 1 for identical unit vectors', () => {
      expect(service.cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    });

    it('returns 0 for length-mismatched vectors', () => {
      expect(service.cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });
  });
});
