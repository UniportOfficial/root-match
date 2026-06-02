import { Injectable } from '@nestjs/common';

const EMBEDDING_MODEL = 'text-embedding-3-small';

@Injectable()
export class VectorSearchService {
  private readonly embeddingCache = new Map<string, number[]>();

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
    const [queryEmbedding, ...itemEmbeddings] = await Promise.all([
      this.getEmbedding(queryText),
      ...items.map((item) => this.getEmbedding(getDescription(item))),
    ]);

    const ranked = items.map((item, i) => ({
      item,
      similarity: this.cosineSimilarity(queryEmbedding, itemEmbeddings[i] ?? []),
    }));

    return ranked.sort((a, b) => b.similarity - a.similarity);
  }
}
