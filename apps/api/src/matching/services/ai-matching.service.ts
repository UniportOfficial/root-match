import { Injectable, Logger } from '@nestjs/common';
import { ConfidenceTier, MatchingSource, Prisma } from '@prisma/client';
import type { Company, FactoryProfile } from '@prisma/client';
import type {
  FactoryRecommendation,
  QuoteRequestDraft,
} from '@rootmatching/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TIER_KPI_BASELINE,
  type TierKpiBaseline,
} from '../../companies/tier-kpi';
import { VectorSearchService } from './vector-search.service';

const TOP_K = 4;
const PREFILTER_TAKE = 20;
const GPT_MODEL = 'gpt-4o';

const PROCESS_TYPE_LABELS: Record<string, string> = {
  mold: '금형',
  casting: '주조',
  forming: '소성가공',
  welding: '용접',
  surface: '표면처리',
  heat: '열처리',
};

// Map broad 6대 공정 → Ppuri processHint substrings (KSIC industry codes are narrower).
// '소성가공' covers 단조/압형/압연/압출/연신 — none of which contain the substring '소성가공'.
const PROCESS_HINT_EXPANSIONS: Record<string, string[]> = {
  주조: ['주조', '주물'],
  금형: ['금형', '주형'],
  소성가공: ['소성가공', '단조', '압형', '압연', '압출', '연신'],
  용접: ['용접'],
  표면처리: ['표면처리', '도금', '도장', '피막'],
  열처리: ['열처리', '공업용로', '전기로'],
};

// CSV `region` is stored as short form ('경기'); BE tolerates long form on input.
const REGION_NORMALIZE: Record<string, string> = {
  서울특별시: '서울',
  서울시: '서울',
  경기도: '경기',
  인천광역시: '인천',
  인천시: '인천',
  경상남도: '경남',
  경상북도: '경북',
  전라남도: '전남',
  전라북도: '전북',
  충청남도: '충남',
  충청북도: '충북',
  강원도: '강원',
  강원특별자치도: '강원',
  제주특별자치도: '제주',
  제주도: '제주',
  대구광역시: '대구',
  대전광역시: '대전',
  광주광역시: '광주',
  부산광역시: '부산',
  울산광역시: '울산',
  세종특별자치시: '세종',
  세종시: '세종',
};

interface ScoreBundle {
  aiReason: string;
  qualityScore: number;
  deliveryScore: number;
  priceCompetitiveness: number;
  trustScore: number;
  estimateMin: number;
  estimateMax: number;
}

interface Candidate {
  company: Company;
  factoryProfile: FactoryProfile | null;
  kpi: TierKpiBaseline;
  processes: string[];
}

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

function normalizeRegion(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return REGION_NORMALIZE[trimmed] ?? trimmed;
}

function deriveProcessesFromHint(
  processHint: string | null,
  requestedLabel: string,
): string[] {
  const labels = new Set<string>();
  if (processHint) labels.add(processHint);
  if (requestedLabel) labels.add(requestedLabel);
  return Array.from(labels);
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
    const candidates = await this.loadCandidates(request);
    if (candidates.length === 0) {
      throw new Error(
        'No matching candidates available. Seed Ppuri Company directory (apps/api/scripts/seed-ppuri.ts) or FactoryProfile fixtures first.',
      );
    }

    const candidateById = new Map(candidates.map((c) => [c.company.id, c]));
    const candidateIds = candidates.map((c) => c.company.id);

    const ranked = await this.vectorSearch.rankByEmbedding(
      this.describeRequest(request),
      candidateIds,
      (id) => this.describeCandidate(this.requireCandidate(candidateById, id)),
    );
    const topIds = ranked.slice(0, TOP_K).map((r) => r.item);

    const useMockFallback = this.vectorSearch.shouldUseMockFallback();
    let recommendations: FactoryRecommendation[];

    if (useMockFallback) {
      this.logger.warn(
        `Returning ${topIds.length} mock recommendations (OPENAI_API_KEY missing, NODE_ENV=${process.env.NODE_ENV ?? 'undefined'})`,
      );
      recommendations = topIds.map((id) =>
        this.toMockRecommendation(
          this.requireCandidate(candidateById, id),
          request,
        ),
      );
    } else {
      const gptResults = await this.callGPT4o(request, topIds, candidateById);
      recommendations = this.assembleFromGpt(gptResults, topIds, candidateById);
    }

    if (request.quoteRequestId) {
      const source = useMockFallback
        ? MatchingSource.DETERMINISTIC_MOCK
        : MatchingSource.OPENAI_ADAPTER;
      return this.persistRecommendations(
        request.quoteRequestId,
        recommendations,
        source,
      );
    }

    return recommendations;
  }

  private async loadCandidates(
    request: QuoteRequestDraft,
  ): Promise<Candidate[]> {
    const koreanLabel =
      PROCESS_TYPE_LABELS[request.processType] ?? request.processType;
    const hintExpansions = PROCESS_HINT_EXPANSIONS[koreanLabel] ?? [
      koreanLabel,
    ];
    const region = normalizeRegion(request.region);

    const tierFilter: Prisma.CompanyWhereInput = {
      confidenceTier: {
        in: [
          ConfidenceTier.A_CERTIFIED_ROOT,
          ConfidenceTier.B_LOCAL_STRONG_INSIDE,
        ],
      },
    };
    const processFilter: Prisma.CompanyWhereInput = {
      OR: hintExpansions.map((h) => ({
        processHint: { contains: h, mode: Prisma.QueryMode.insensitive },
      })),
    };

    const tryQueries: Prisma.CompanyWhereInput[] = [];
    if (region) {
      tryQueries.push({ AND: [tierFilter, processFilter, { region }] });
    }
    tryQueries.push({ AND: [tierFilter, processFilter] });

    // Broaden when first attempt returns fewer than TOP_K to guarantee FE 4-card render.
    // Keep widest accepted set so embedding ranking still has options.
    let widest: (Company & { factoryProfile: FactoryProfile | null })[] = [];
    for (const where of tryQueries) {
      const companies = await this.prisma.company.findMany({
        where,
        include: { factoryProfile: true },
        orderBy: [{ confidenceTier: 'asc' }, { name: 'asc' }],
        take: PREFILTER_TAKE,
      });
      if (companies.length > widest.length) widest = companies;
      if (companies.length >= TOP_K) {
        return companies.map((c) =>
          this.buildCandidate(c, c.factoryProfile, koreanLabel),
        );
      }
    }

    if (widest.length > 0) {
      return widest.map((c) =>
        this.buildCandidate(c, c.factoryProfile, koreanLabel),
      );
    }

    const factoryProfiles = await this.prisma.factoryProfile.findMany({
      include: { company: true },
      take: PREFILTER_TAKE,
    });
    return factoryProfiles.map((fp) =>
      this.buildCandidate(fp.company, fp, koreanLabel),
    );
  }

  private buildCandidate(
    company: Company,
    factoryProfile: FactoryProfile | null,
    requestedLabel: string,
  ): Candidate {
    if (factoryProfile) {
      return {
        company,
        factoryProfile,
        kpi: {
          trustScore: factoryProfile.trustScore,
          deliveryRate: factoryProfile.deliveryRate,
          reorderRate: factoryProfile.reorderRate,
          qualityScore: factoryProfile.qualityScore,
          deliveryScore: factoryProfile.deliveryScore,
          priceCompetitiveness: factoryProfile.priceCompetitiveness,
          estimateMin: factoryProfile.estimateMin,
          estimateMax: factoryProfile.estimateMax,
        },
        processes: factoryProfile.processes,
      };
    }
    const tier = company.confidenceTier ?? ConfidenceTier.D_LOW_CONFIDENCE;
    return {
      company,
      factoryProfile: null,
      kpi: { ...TIER_KPI_BASELINE[tier] },
      processes: deriveProcessesFromHint(company.processHint, requestedLabel),
    };
  }

  private requireCandidate(map: Map<string, Candidate>, id: string): Candidate {
    const candidate = map.get(id);
    if (!candidate) {
      throw new Error(`Candidate not found for id=${id}`);
    }
    return candidate;
  }

  private async persistRecommendations(
    quoteRequestId: string,
    recommendations: FactoryRecommendation[],
    source: MatchingSource,
  ): Promise<FactoryRecommendation[]> {
    const owner = await this.prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      select: { id: true },
    });
    if (!owner) {
      this.logger.warn(
        `Skipping MatchRecommendation persist: quoteRequestId=${quoteRequestId} not found`,
      );
      return recommendations;
    }

    return Promise.all(
      recommendations.map(async (rec) => {
        const score =
          rec.matchScore ??
          Math.round(
            (rec.qualityScore +
              rec.deliveryScore +
              rec.priceCompetitiveness +
              rec.trustScore) /
              4,
          );
        const persisted = await this.prisma.matchRecommendation.upsert({
          where: {
            quoteRequestId_factoryId_source: {
              quoteRequestId,
              factoryId: rec.id,
              source,
            },
          },
          create: {
            quoteRequestId,
            factoryId: rec.id,
            source,
            score,
            qualityScore: rec.qualityScore,
            deliveryScore: rec.deliveryScore,
            priceScore: rec.priceCompetitiveness,
            trustScore: rec.trustScore,
            reason: rec.aiReason,
            estimateMin: rec.estimateMin,
            estimateMax: rec.estimateMax,
          },
          update: {
            score,
            qualityScore: rec.qualityScore,
            deliveryScore: rec.deliveryScore,
            priceScore: rec.priceCompetitiveness,
            trustScore: rec.trustScore,
            reason: rec.aiReason,
            estimateMin: rec.estimateMin,
            estimateMax: rec.estimateMax,
          },
        });
        return { ...rec, recommendationId: persisted.id };
      }),
    );
  }

  private assembleFromGpt(
    gptResults: GPTMatchResult[],
    topIds: string[],
    candidateById: Map<string, Candidate>,
  ): FactoryRecommendation[] {
    const knownIds = new Set(topIds);
    const seenIds = new Set<string>();
    const gptById = new Map<string, GPTMatchResult>();
    for (const gpt of gptResults) {
      if (!knownIds.has(gpt.id)) continue;
      if (seenIds.has(gpt.id)) continue;
      seenIds.add(gpt.id);
      gptById.set(gpt.id, gpt);
    }

    return topIds.map((id) => {
      const candidate = this.requireCandidate(candidateById, id);
      const gpt = gptById.get(id);
      if (gpt) {
        return this.toRecommendation(candidate, {
          aiReason: gpt.aiReason,
          qualityScore: gpt.qualityScore,
          deliveryScore: gpt.deliveryScore,
          priceCompetitiveness: gpt.priceCompetitiveness,
          trustScore: gpt.trustScore,
          estimateMin: gpt.estimateMin,
          estimateMax: gpt.estimateMax,
        });
      }
      this.logger.warn(
        `GPT response missing factoryId=${id}; padding with synthesized scores`,
      );
      return this.toRecommendation(candidate, this.padScores(candidate));
    });
  }

  private padScores(candidate: Candidate): ScoreBundle {
    const c = candidate.company;
    const region = c.region ?? '미상 지역';
    const hintLabel = c.processHint ?? '뿌리공정';
    const tierLabel =
      c.confidenceTier === ConfidenceTier.A_CERTIFIED_ROOT
        ? '인증 뿌리기업'
        : c.confidenceTier === ConfidenceTier.B_LOCAL_STRONG_INSIDE
          ? '산업단지 검증 기업'
          : '검증 기업';
    return {
      aiReason: `[자동 보강] ${region} 소재 ${tierLabel}로 ${hintLabel} 분야 후보. GPT 응답 누락분을 결정성 점수로 보강했습니다.`,
      qualityScore: candidate.kpi.qualityScore,
      deliveryScore: candidate.kpi.deliveryScore,
      priceCompetitiveness: candidate.kpi.priceCompetitiveness,
      trustScore: candidate.kpi.trustScore,
      estimateMin: candidate.kpi.estimateMin,
      estimateMax: candidate.kpi.estimateMax,
    };
  }

  private toMockRecommendation(
    candidate: Candidate,
    request: QuoteRequestDraft,
  ): FactoryRecommendation {
    const processLabel =
      PROCESS_TYPE_LABELS[request.processType] ?? request.processType;
    const matchesProcess = candidate.processes.some(
      (p) => p.includes(processLabel) || processLabel.includes(p),
    );
    const reasonPrefix = matchesProcess
      ? `[Mock · ${processLabel} 공정 매칭]`
      : '[Mock · API key 미설정]';
    const processSummary =
      candidate.processes.length > 0
        ? candidate.processes.join(', ')
        : (candidate.company.processHint ?? '뿌리공정');
    const reasonBody = `${candidate.company.name}이(가) ${processSummary} 분야에서 활동 중입니다.`;
    return this.toRecommendation(candidate, {
      aiReason: `${reasonPrefix} ${reasonBody}`,
      qualityScore: candidate.kpi.qualityScore,
      deliveryScore: candidate.kpi.deliveryScore,
      priceCompetitiveness: candidate.kpi.priceCompetitiveness,
      trustScore: candidate.kpi.trustScore,
      estimateMin: candidate.kpi.estimateMin,
      estimateMax: candidate.kpi.estimateMax,
    });
  }

  private toRecommendation(
    candidate: Candidate,
    scores: ScoreBundle,
  ): FactoryRecommendation {
    const c = candidate.company;
    const fp = candidate.factoryProfile;
    const location = fp?.location ?? c.address ?? c.region ?? '위치 미상';
    return {
      id: c.id,
      name: c.name,
      location,
      processes: candidate.processes,
      trustScore: scores.trustScore,
      deliveryRate: candidate.kpi.deliveryRate,
      reorderRate: candidate.kpi.reorderRate,
      estimateMin: scores.estimateMin,
      estimateMax: scores.estimateMax,
      aiReason: scores.aiReason,
      qualityScore: scores.qualityScore,
      deliveryScore: scores.deliveryScore,
      priceCompetitiveness: scores.priceCompetitiveness,
      industrialComplex: fp?.industrialComplex ?? undefined,
      reorderCustomerCount: fp?.reorderCustomerCount ?? undefined,
      employeeCount: c.employeeCount ?? undefined,
      contactEmail: c.contactEmail ?? undefined,
      contactPhone: c.contactPhone ?? undefined,
      externalId: c.externalId ?? undefined,
      region: c.region ?? undefined,
      industry: c.industry ?? undefined,
      confidenceTier: c.confidenceTier ?? undefined,
      processHint: c.processHint ?? undefined,
    } satisfies FactoryRecommendation;
  }

  private describeCandidate(candidate: Candidate): string {
    const fp = candidate.factoryProfile;
    const c = candidate.company;
    if (fp) {
      const qualityLine =
        fp.qualitySatisfaction != null
          ? `품질 만족도: ${fp.qualitySatisfaction}점`
          : `품질 점수: ${fp.qualityScore}점`;
      return [
        `공장명: ${c.name}`,
        `위치: ${fp.location ?? c.region ?? '미상'}`,
        `전문 공정: ${fp.specialty.join(', ')}`,
        `보유 설비: ${fp.equipment.join(', ')}`,
        `생산 가능 품목: ${fp.products.join(', ')}`,
        `월 생산 가능량: ${fp.monthlyCapacity ?? '미상'}`,
        `납기 준수율: ${fp.deliveryRate}%`,
        qualityLine,
        `재거래율: ${fp.reorderRate}%`,
        `평균 응답 시간: ${fp.avgResponseTime ?? '미상'}`,
        `주요 고객사: ${fp.clients.join(', ')}`,
      ].join('\n');
    }
    return [
      `공장명: ${c.name}`,
      `지역: ${c.region ?? '미상'}`,
      `주소: ${c.address ?? '미상'}`,
      `대표 공정: ${c.processHint ?? '미분류'}`,
      `대표자: ${c.representative ?? '미상'}`,
      `신뢰 등급: ${c.confidenceTier ?? '미상'}`,
      `출처: ${c.sourceTypes.length > 0 ? c.sourceTypes.join(', ') : '미상'}`,
    ].join('\n');
  }

  private describeRequest(request: QuoteRequestDraft): string {
    const processLabel =
      PROCESS_TYPE_LABELS[request.processType] ?? request.processType;
    const lines = [
      `프로젝트명: ${request.projectName}`,
      `공정 유형: ${request.processType} (${processLabel})`,
    ];
    if (request.region) lines.push(`희망 지역: ${request.region}`);
    lines.push(
      `제작 품목: ${request.productItem}`,
      `예상 수량: ${request.estimatedQuantity}`,
      `희망 납기: ${request.desiredDeadline}`,
      `예산 범위: ${request.budgetRange}`,
      `상세 요구사항: ${request.detailRequirements}`,
    );
    return lines.join('\n');
  }

  private async callGPT4o(
    request: QuoteRequestDraft,
    factoryIds: string[],
    candidateById: Map<string, Candidate>,
  ): Promise<GPTMatchResult[]> {
    const factoryList = factoryIds
      .map((id, i) => {
        const candidate = candidateById.get(id);
        if (!candidate) return '';
        return `[공장 ${i + 1}]\nID: ${id}\n${this.describeCandidate(candidate)}`;
      })
      .filter((s) => s.length > 0)
      .join('\n\n');

    const prompt = `당신은 뿌리산업 B2B 수주 매칭 전문가입니다.
발주처의 요청 조건을 분석하여 후보 공장 ${factoryIds.length}곳 각각의 적합도를 평가해주세요.

[발주처 요청 조건]
${this.describeRequest(request)}

[후보 공장 목록]
${factoryList}

⚠ 반드시 후보 공장 ${factoryIds.length}곳 모두에 대해 ${factoryIds.length}개의 매칭 객체를 빠짐없이 반환하세요. 누락·중복·신규 ID 금지. 위 목록의 ID를 그대로 복사하세요.

아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.
{
  "matches": [
    {
      "id": "공장 ID (위 목록에서 그대로 복사)",
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
    return parsed.matches ?? [];
  }
}
