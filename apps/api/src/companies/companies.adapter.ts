import {
  ConfidenceTier,
  type Company as PrismaCompany,
  type FactoryProfile as PrismaFactoryProfile,
} from '@prisma/client';
import type {
  Company as SharedCompany,
  CompanyDetail as SharedCompanyDetail,
  CompanyFactoryProfile as SharedCompanyFactoryProfile,
} from '@rootmatching/shared';

// Mirrored from apps/api/src/matching/services/ai-matching.service.ts:63-104
// (Oracle 2026-06-07 baseline). Local copy keeps Item 2 scope minimal — any future
// dedup is a separate refactor.
const TIER_KPI_BASELINE: Record<
  ConfidenceTier,
  Pick<
    SharedCompanyFactoryProfile,
    | 'trustScore'
    | 'deliveryRate'
    | 'reorderRate'
    | 'qualityScore'
    | 'deliveryScore'
    | 'priceCompetitiveness'
    | 'estimateMin'
    | 'estimateMax'
  >
> = {
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

export function toSharedCompany(c: PrismaCompany): SharedCompany {
  return {
    id: c.id,
    name: c.name,
    industry: c.industry ?? '',
    region: c.region ?? '',
    size: c.size ?? '',
    description: c.description ?? '',
    tags: [],
    contactEmail: c.contactEmail ?? '',
    contactPhone: c.contactPhone ?? '',
    website: c.website ?? '',
    establishedYear: c.establishedYear ?? 0,
    employeeCount: c.employeeCount ?? 0,
    revenue: c.revenue ?? '',
    certifications: [],
    createdAt: c.createdAt.toISOString().slice(0, 10),
    externalId: c.externalId ?? undefined,
    confidenceTier: c.confidenceTier ?? undefined,
    processHint: c.processHint ?? undefined,
    address: c.address ?? undefined,
    lat: c.lat ?? undefined,
    lng: c.lng ?? undefined,
    kakaoId: c.kakaoId ?? undefined,
    representative: c.representative ?? undefined,
    sourceTypes: c.sourceTypes.length > 0 ? c.sourceTypes : undefined,
  };
}

export function toSharedCompanyDetail(
  c: PrismaCompany & { factoryProfile: PrismaFactoryProfile | null },
): SharedCompanyDetail {
  return {
    ...toSharedCompany(c),
    factoryProfile: c.factoryProfile
      ? toFactoryProfileFromReal(c.factoryProfile)
      : toFactoryProfileSynthesized(c),
  };
}

function toFactoryProfileFromReal(
  fp: PrismaFactoryProfile,
): SharedCompanyFactoryProfile {
  return {
    isSynthesized: false,
    location: fp.location,
    processes: fp.processes,
    trustScore: fp.trustScore,
    deliveryRate: fp.deliveryRate,
    reorderRate: fp.reorderRate,
    qualityScore: fp.qualityScore,
    deliveryScore: fp.deliveryScore,
    priceCompetitiveness: fp.priceCompetitiveness,
    estimateMin: fp.estimateMin,
    estimateMax: fp.estimateMax,
    industrialComplex: fp.industrialComplex,
    reorderCustomerCount: fp.reorderCustomerCount,
    verified: fp.verified,
    specialty: fp.specialty,
    equipment: fp.equipment,
    products: fp.products,
    monthlyCapacity: fp.monthlyCapacity,
    clients: fp.clients,
    qualitySatisfaction: fp.qualitySatisfaction,
    avgResponseTime: fp.avgResponseTime,
  };
}

function toFactoryProfileSynthesized(
  c: PrismaCompany,
): SharedCompanyFactoryProfile {
  const tier = c.confidenceTier ?? ConfidenceTier.D_LOW_CONFIDENCE;
  const baseline = TIER_KPI_BASELINE[tier];
  return {
    isSynthesized: true,
    location: c.address ?? c.region ?? null,
    processes: c.processHint ? [c.processHint] : [],
    trustScore: baseline.trustScore,
    deliveryRate: baseline.deliveryRate,
    reorderRate: baseline.reorderRate,
    qualityScore: baseline.qualityScore,
    deliveryScore: baseline.deliveryScore,
    priceCompetitiveness: baseline.priceCompetitiveness,
    estimateMin: baseline.estimateMin,
    estimateMax: baseline.estimateMax,
    industrialComplex: null,
    reorderCustomerCount: null,
    verified: tier === ConfidenceTier.A_CERTIFIED_ROOT,
    specialty: [],
    equipment: [],
    products: [],
    monthlyCapacity: null,
    clients: [],
    qualitySatisfaction: null,
    avgResponseTime: null,
  };
}
