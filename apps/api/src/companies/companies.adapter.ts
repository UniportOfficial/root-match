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
import { TIER_KPI_BASELINE } from './tier-kpi';

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
