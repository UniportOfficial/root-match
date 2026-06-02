import { Injectable } from '@nestjs/common';

const EMBEDDING_MODEL = 'text-embedding-3-small';

@Injectable()
export class VectorSearchService {
  private readonly embeddingCache = new Map<string, number[]>();

  /** Returns true when `OPENAI_API_KEY` is set and non-blank. */
  hasApiKey(): boolean {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  }

  /**
   * Gates the deterministic mock fallback (AIM-004 in `docs/specs/`).
   * Never silently mocks in production — prod must either have an API key or
   * opt-in explicitly via `MATCHING_MOCK_FALLBACK=true`.
   */
  shouldUseMockFallback(): boolean {
    if (this.hasApiKey()) return false;
    if (process.env.NODE_ENV === 'production') {
      return process.env.MATCHING_MOCK_FALLBACK === 'true';
    }
    return true;
  }

  private get apiKey(): string {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        'OPENAI_API_KEY 환경변수가 설정되지 않았습니다. apps/api/.env에 추가하세요.',
      );
    }
    return key;
  }

  async getEmbedding(text: string): Promise<number[]> {
    const cached = this.embeddingCache.get(text);
    if (cached) {
      return cached;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new Error(
        `Embedding API 오류: ${error?.error?.message ?? response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      data: { embedding: number[] }[];
    };
    const embedding = data.data[0]?.embedding;
    if (!embedding) {
      throw new Error('Embedding API 응답이 비어 있습니다.');
    }
    this.embeddingCache.set(text, embedding);
    return embedding;
  }

  /** Cosine similarity in [-1, 1]. Returns 0 for zero-magnitude or mismatched vectors. */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      const ai = a[i] ?? 0;
      const bi = b[i] ?? 0;
      dot += ai * bi;
      magA += ai * ai;
      magB += bi * bi;
    }

    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    if (denom === 0) return 0;
    return dot / denom;
  }

  async rankByEmbedding<T>(
    queryText: string,
    items: T[],
    getDescription: (item: T) => string,
  ): Promise<Array<{ item: T; similarity: number }>> {
    if (this.shouldUseMockFallback()) {
      // Deterministic mock fallback (Jaccard, no network) — see AIM-004 in docs/specs/.
      const queryTokens = this.tokenize(queryText);
      const ranked = items.map((item) => {
        const itemTokens = this.tokenize(getDescription(item));
        const similarity = this.jaccardSimilarity(queryTokens, itemTokens);
        return { item, similarity };
      });
      return ranked.sort((a, b) => b.similarity - a.similarity);
    }

    const [queryEmbedding, ...itemEmbeddings] = await Promise.all([
      this.getEmbedding(queryText),
      ...items.map((item) => this.getEmbedding(getDescription(item))),
    ]);

    const ranked = items.map((item, i) => ({
      item,
      similarity: this.cosineSimilarity(
        queryEmbedding,
        itemEmbeddings[i] ?? [],
      ),
    }));

    return ranked.sort((a, b) => b.similarity - a.similarity);
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .split(/[\s,.\n:/]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2),
    );
  }

  /** Jaccard similarity in [0, 1]. Returns 0 when both sets are empty. */
  private jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 0;
    let intersection = 0;
    for (const token of a) {
      if (b.has(token)) intersection += 1;
    }
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }
}
