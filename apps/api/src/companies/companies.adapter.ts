import type { Company as PrismaCompany } from '@prisma/client';
import type { Company as SharedCompany } from '@rootmatching/shared';

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
