import { ConfidenceTier } from '@prisma/client';

export interface TierKpiBaseline {
  trustScore: number;
  deliveryRate: number;
  reorderRate: number;
  qualityScore: number;
  deliveryScore: number;
  priceCompetitiveness: number;
  estimateMin: number;
  estimateMax: number;
}

export const TIER_KPI_BASELINE: Record<ConfidenceTier, TierKpiBaseline> = {
  A_CERTIFIED_ROOT: {
    trustScore: 86,
    deliveryRate: 88,
    reorderRate: 65,
    qualityScore: 86,
    deliveryScore: 84,
    priceCompetitiveness: 74,
    estimateMin: 300,
    estimateMax: 500,
  },
  B_LOCAL_STRONG_INSIDE: {
    trustScore: 74,
    deliveryRate: 78,
    reorderRate: 52,
    qualityScore: 74,
    deliveryScore: 74,
    priceCompetitiveness: 70,
    estimateMin: 250,
    estimateMax: 450,
  },
  C_BORDERLINE_INSIDE: {
    trustScore: 60,
    deliveryRate: 65,
    reorderRate: 40,
    qualityScore: 60,
    deliveryScore: 60,
    priceCompetitiveness: 65,
    estimateMin: 200,
    estimateMax: 400,
  },
  D_LOW_CONFIDENCE: {
    trustScore: 50,
    deliveryRate: 55,
    reorderRate: 30,
    qualityScore: 50,
    deliveryScore: 50,
    priceCompetitiveness: 60,
    estimateMin: 200,
    estimateMax: 400,
  },
};
