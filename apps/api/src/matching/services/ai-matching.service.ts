import { Injectable, Logger } from '@nestjs/common';
import type {
  FactoryRecommendation,
  QuoteRequestDraft,
} from '@rootmatching/shared';
import {
  mockFactoryDetails,
  mockFactoryRecommendations,
} from '@rootmatching/shared/fixtures/factory-data';
import { VectorSearchService } from './vector-search.service';

const TOP_K = 4;
const GPT_MODEL = 'gpt-4o';

const PROCESS_TYPE_LABELS: Record<string, string> = {
  mold: '금형',
  casting: '주조',
  forming: '소성가공',
  welding: '용접',
  surface: '표면처리',
  heat: '열처리',
};

interface GPTMatchResult {
  id: string;
  aiReason: string;
  qualityScore: number;
  deliveryScore: number;
  priceCompetitiveness: number;
  trustScore: number;
  estimateMin: number;
  estimateMax: number;
}

@Injectable()
export class AiMatchingService {
  private readonly logger = new Logger(AiMatchingService.name);

  constructor(private readonly vectorSearch: VectorSearchService) {}

  private get apiKey(): string {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        'OPENAI_API_KEY 환경변수가 설정되지 않았습니다. apps/api/.env에 추가하세요.',
      );
    }
    return key;
  }

  async matchFactories(
    request: QuoteRequestDraft,
  ): Promise<FactoryRecommendation[]> {
    const allIds = mockFactoryRecommendations.map((r) => r.id);

    const ranked = await this.vectorSearch.rankByEmbedding(
      this.describeRequest(request),
      allIds,
      (id) => this.describeFactory(id),
    );
    const topIds = ranked.slice(0, TOP_K).map((r) => r.item);

    if (this.vectorSearch.shouldUseMockFallback()) {
      this.logger.warn(
        `Returning ${topIds.length} mock recommendations (OPENAI_API_KEY missing, NODE_ENV=${process.env.NODE_ENV ?? 'undefined'})`,
      );
      return this.buildMockRecommendations(topIds, request);
    }

    const gptResults = await this.callGPT4o(request, topIds);

    return gptResults.map((gpt) => {
      const rec = mockFactoryRecommendations.find((r) => r.id === gpt.id);
      const detail = mockFactoryDetails[gpt.id];

      return {
        id: gpt.id,
        name: detail?.name ?? rec?.name ?? `공장 ${gpt.id}`,
        location: detail?.location ?? rec?.location ?? '위치 미상',
        processes: detail?.specialty.slice(0, 2) ?? rec?.processes ?? [],
        trustScore: gpt.trustScore,
        deliveryRate: detail?.kpi.deliveryRate ?? rec?.deliveryRate ?? 90,
        reorderRate: detail?.kpi.reorderRate ?? rec?.reorderRate ?? 80,
        estimateMin: gpt.estimateMin,
        estimateMax: gpt.estimateMax,
        aiReason: gpt.aiReason,
        qualityScore: gpt.qualityScore,
        deliveryScore: gpt.deliveryScore,
        priceCompetitiveness: gpt.priceCompetitiveness,
      } satisfies FactoryRecommendation;
    });
  }

  private buildMockRecommendations(
    ids: string[],
    request: QuoteRequestDraft,
  ): FactoryRecommendation[] {
    const processLabel =
      PROCESS_TYPE_LABELS[request.processType] ?? request.processType;

    return ids
      .map((id) => mockFactoryRecommendations.find((r) => r.id === id))
      .filter((r): r is FactoryRecommendation => r !== undefined)
      .map((rec) => {
        const matchesProcess = rec.processes.some((p) =>
          p.includes(processLabel),
        );
        const reasonPrefix = matchesProcess
          ? `[Mock · ${processLabel} 공정 매칭]`
          : '[Mock · API key 미설정]';
        return {
          ...rec,
          aiReason: `${reasonPrefix} ${rec.aiReason}`,
        };
      });
  }

  private describeFactory(id: string): string {
    const detail = mockFactoryDetails[id];

    if (detail) {
      return [
        `공장명: ${detail.name}`,
        `위치: ${detail.location}`,
        `전문 공정: ${detail.specialty.join(', ')}`,
        `보유 설비: ${detail.equipment.join(', ')}`,
        `생산 가능 품목: ${detail.products.join(', ')}`,
        `월 생산 가능량: ${detail.monthlyCapacity}`,
        `납기 준수율: ${detail.kpi.deliveryRate}%`,
        `품질 만족도: ${detail.kpi.qualitySatisfaction}점`,
        `재거래율: ${detail.kpi.reorderRate}%`,
        `평균 응답 시간: ${detail.kpi.avgResponseTime}`,
        `주요 고객사: ${detail.clients.join(', ')}`,
      ].join('\n');
    }

    const rec = mockFactoryRecommendations.find((r) => r.id === id);
    if (rec) {
      return [
        `공장명: ${rec.name}`,
        `위치: ${rec.location}`,
        `전문 공정: ${rec.processes.join(', ')}`,
        `납기 준수율: ${rec.deliveryRate}%`,
        `재거래율: ${rec.reorderRate}%`,
        `품질 점수: ${rec.qualityScore}점`,
        `납기 점수: ${rec.deliveryScore}점`,
        `가격 경쟁력: ${rec.priceCompetitiveness}점`,
      ].join('\n');
    }

    return `공장 ID: ${id}`;
  }

  private describeRequest(request: QuoteRequestDraft): string {
    const processLabel =
      PROCESS_TYPE_LABELS[request.processType] ?? request.processType;
    return [
      `프로젝트명: ${request.projectName}`,
      `공정 유형: ${request.processType} (${processLabel})`,
      `제작 품목: ${request.productItem}`,
      `예상 수량: ${request.estimatedQuantity}`,
      `희망 납기: ${request.desiredDeadline}`,
      `예산 범위: ${request.budgetRange}`,
      `상세 요구사항: ${request.detailRequirements}`,
    ].join('\n');
  }

  private async callGPT4o(
    request: QuoteRequestDraft,
    factoryIds: string[],
  ): Promise<GPTMatchResult[]> {
    const factoryList = factoryIds
      .map((id, i) => `[공장 ${i + 1}]\nID: ${id}\n${this.describeFactory(id)}`)
      .join('\n\n');

    const prompt = `당신은 뿌리산업 B2B 수주 매칭 전문가입니다.
발주처의 요청 조건을 분석하여 각 공장의 적합도를 평가해주세요.

[발주처 요청 조건]
${this.describeRequest(request)}

[후보 공장 목록]
${factoryList}

각 공장에 대해 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.
{
  "matches": [
    {
      "id": "공장 ID (그대로 복사)",
      "aiReason": "이 요청에 이 공장을 추천하는 핵심 이유 2문장 (한국어, 발주 조건과 공장 역량을 구체적으로 연결할 것)",
      "qualityScore": 85,
      "deliveryScore": 90,
      "priceCompetitiveness": 80,
      "trustScore": 88,
      "estimateMin": 350,
      "estimateMax": 450
    }
  ]
}

평가 기준:
- qualityScore: 품질 만족도와 이번 요청의 품질 기준 부합도 (0~100)
- deliveryScore: 납기 준수율과 희망 납기 대응 가능성 (0~100)
- priceCompetitiveness: 요청 예산 범위 내 가격 경쟁력 (0~100)
- trustScore: 거래 이력, 재거래율, 응답성을 반영한 종합 신뢰도 (0~100)
- estimateMin / estimateMax: 이 요청에 대한 예상 견적 범위 (만원 단위 정수, 예산 범위 참고)`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new Error(
        `GPT-4o API 오류: ${error?.error?.message ?? response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = data.choices[0]?.message.content;
    if (!content) {
      throw new Error('GPT-4o 응답이 비어 있습니다.');
    }
    const parsed = JSON.parse(content) as { matches: GPTMatchResult[] };
    return parsed.matches;
  }
}
