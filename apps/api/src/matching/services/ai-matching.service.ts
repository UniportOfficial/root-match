import { Injectable, Logger } from '@nestjs/common';
import type {
  Company,
  FactoryProfile as FactoryProfileRow,
} from '@prisma/client';
import type {
  FactoryRecommendation,
  QuoteRequestDraft,
} from '@rootmatching/shared';
import { PrismaService } from '../../prisma/prisma.service';
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

type FactoryRow = FactoryProfileRow & { company: Company };

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

interface ScoreBundle {
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorSearch: VectorSearchService,
  ) {}

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
    const factories = await this.prisma.factoryProfile.findMany({
      include: { company: true },
    });

    if (factories.length === 0) {
      throw new Error(
        'No factory profiles available. Run `pnpm --filter @rootmatching/api run prisma:seed` first.',
      );
    }

    const factoryById = new Map(factories.map((f) => [f.companyId, f]));
    const candidateIds = factories.map((f) => f.companyId);

    const ranked = await this.vectorSearch.rankByEmbedding(
      this.describeRequest(request),
      candidateIds,
      (id) => this.describeFactory(id, factoryById),
    );
    const topIds = ranked.slice(0, TOP_K).map((r) => r.item);

    if (this.vectorSearch.shouldUseMockFallback()) {
      this.logger.warn(
        `Returning ${topIds.length} mock recommendations (OPENAI_API_KEY missing, NODE_ENV=${process.env.NODE_ENV ?? 'undefined'})`,
      );
      return this.buildMockRecommendations(topIds, factoryById, request);
    }

    const gptResults = await this.callGPT4o(request, topIds, factoryById);

    return gptResults
      .map((gpt): FactoryRecommendation | null => {
        const factory = factoryById.get(gpt.id);
        if (!factory) return null;
        return this.toRecommendation(factory, {
          aiReason: gpt.aiReason,
          qualityScore: gpt.qualityScore,
          deliveryScore: gpt.deliveryScore,
          priceCompetitiveness: gpt.priceCompetitiveness,
          trustScore: gpt.trustScore,
          estimateMin: gpt.estimateMin,
          estimateMax: gpt.estimateMax,
        });
      })
      .filter((r): r is FactoryRecommendation => r !== null);
  }

  private buildMockRecommendations(
    ids: string[],
    factoryById: Map<string, FactoryRow>,
    request: QuoteRequestDraft,
  ): FactoryRecommendation[] {
    const processLabel =
      PROCESS_TYPE_LABELS[request.processType] ?? request.processType;

    return ids
      .map((id) => factoryById.get(id))
      .filter((f): f is FactoryRow => f !== undefined)
      .map((factory) => {
        const matchesProcess = factory.processes.some((p) =>
          p.includes(processLabel),
        );
        const reasonPrefix = matchesProcess
          ? `[Mock · ${processLabel} 공정 매칭]`
          : '[Mock · API key 미설정]';
        const reasonBody = `${factory.company.name}이(가) ${factory.processes.join(', ')} 공정을 보유하고 있습니다.`;
        return this.toRecommendation(factory, {
          aiReason: `${reasonPrefix} ${reasonBody}`,
          qualityScore: factory.qualityScore,
          deliveryScore: factory.deliveryScore,
          priceCompetitiveness: factory.priceCompetitiveness,
          trustScore: factory.trustScore,
          estimateMin: factory.estimateMin,
          estimateMax: factory.estimateMax,
        });
      });
  }

  private toRecommendation(
    factory: FactoryRow,
    scores: ScoreBundle,
  ): FactoryRecommendation {
    return {
      id: factory.companyId,
      name: factory.company.name,
      location: factory.location ?? factory.company.region ?? '위치 미상',
      processes: factory.processes,
      trustScore: scores.trustScore,
      deliveryRate: factory.deliveryRate,
      reorderRate: factory.reorderRate,
      estimateMin: scores.estimateMin,
      estimateMax: scores.estimateMax,
      aiReason: scores.aiReason,
      qualityScore: scores.qualityScore,
      deliveryScore: scores.deliveryScore,
      priceCompetitiveness: scores.priceCompetitiveness,
      industrialComplex: factory.industrialComplex ?? undefined,
      reorderCustomerCount: factory.reorderCustomerCount ?? undefined,
      employeeCount: factory.company.employeeCount ?? undefined,
      contactEmail: factory.company.contactEmail ?? undefined,
      contactPhone: factory.company.contactPhone ?? undefined,
    } satisfies FactoryRecommendation;
  }

  private describeFactory(
    companyId: string,
    factoryById: Map<string, FactoryRow>,
  ): string {
    const factory = factoryById.get(companyId);
    if (!factory) return `공장 ID: ${companyId}`;

    const qualityLine =
      factory.qualitySatisfaction != null
        ? `품질 만족도: ${factory.qualitySatisfaction}점`
        : `품질 점수: ${factory.qualityScore}점`;

    return [
      `공장명: ${factory.company.name}`,
      `위치: ${factory.location ?? factory.company.region ?? '미상'}`,
      `전문 공정: ${factory.specialty.join(', ')}`,
      `보유 설비: ${factory.equipment.join(', ')}`,
      `생산 가능 품목: ${factory.products.join(', ')}`,
      `월 생산 가능량: ${factory.monthlyCapacity ?? '미상'}`,
      `납기 준수율: ${factory.deliveryRate}%`,
      qualityLine,
      `재거래율: ${factory.reorderRate}%`,
      `평균 응답 시간: ${factory.avgResponseTime ?? '미상'}`,
      `주요 고객사: ${factory.clients.join(', ')}`,
    ].join('\n');
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
    factoryById: Map<string, FactoryRow>,
  ): Promise<GPTMatchResult[]> {
    const factoryList = factoryIds
      .map(
        (id, i) =>
          `[공장 ${i + 1}]\nID: ${id}\n${this.describeFactory(id, factoryById)}`,
      )
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
