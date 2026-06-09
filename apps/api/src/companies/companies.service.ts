import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Company,
  ConfidenceTier,
  Prisma,
  QuoteRequestStatus,
} from '@prisma/client';
import type { CompanyDetail, CompanyListResponse } from '@rootmatching/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toSharedCompany, toSharedCompanyDetail } from './companies.adapter';
import type { ListCompaniesDto } from './dto/list-companies.dto';
import type { UpdateCompanyDto } from './dto/update-company.dto';

const MOCK_FIELDS = [
  'currentMonthAmount',
  'escrowBalance',
  'settlementPending',
  'settlementPendingDueDate',
  'settlementCompleted',
  'monthlyAmounts',
  'unreadMessages',
] as const;

type CompaniesSummaryResponse = {
  totalCompanies: number;
  verifiedCompanies: number;
  activeRegions: number;
  confidenceTierCounts: Record<
    | 'A_CERTIFIED_ROOT'
    | 'B_LOCAL_STRONG_INSIDE'
    | 'C_BORDERLINE_INSIDE'
    | 'D_LOW_CONFIDENCE',
    number
  >;
  regionDistribution: { region: string; count: number }[];
  quoteRequestStatusCounts: {
    pending: number;
    awaitingResponse: number;
    decisionRequired: number;
    ongoing: number;
  };
  pendingInquiries: number;
  currentMonthAmount: number;
  escrowBalance: number;
  settlementPending: number;
  settlementPendingDueDate: string;
  settlementCompleted: number;
  monthlyAmounts: { month: string; amount: number; isCurrent: boolean }[];
  unreadMessages: number;
  meta: {
    mockFields: typeof MOCK_FIELDS;
  };
};

const EMPTY_CONFIDENCE_TIER_COUNTS: CompaniesSummaryResponse['confidenceTierCounts'] =
  {
    A_CERTIFIED_ROOT: 0,
    B_LOCAL_STRONG_INSIDE: 0,
    C_BORDERLINE_INSIDE: 0,
    D_LOW_CONFIDENCE: 0,
  };

const CONFIDENCE_TIER_KEY: Record<
  ConfidenceTier,
  keyof CompaniesSummaryResponse['confidenceTierCounts']
> = {
  A_CERTIFIED_ROOT: 'A_CERTIFIED_ROOT',
  B_LOCAL_STRONG_INSIDE: 'B_LOCAL_STRONG_INSIDE',
  C_BORDERLINE_INSIDE: 'C_BORDERLINE_INSIDE',
  D_LOW_CONFIDENCE: 'D_LOW_CONFIDENCE',
};

const EMPTY_QUOTE_REQUEST_STATUS_COUNTS: CompaniesSummaryResponse['quoteRequestStatusCounts'] =
  {
    pending: 0,
    awaitingResponse: 0,
    decisionRequired: 0,
    ongoing: 0,
  };

const QUOTE_REQUEST_STATUS_BUCKET: Partial<
  Record<
    QuoteRequestStatus,
    keyof CompaniesSummaryResponse['quoteRequestStatusCounts']
  >
> = {
  NEW: 'pending',
  REVIEWING: 'awaitingResponse',
  MATCHED: 'decisionRequired',
  QUOTED: 'decisionRequired',
};

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCompany(userId: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  findMyCompany(userId: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { userId },
    });
  }

  async getById(id: string): Promise<CompanyDetail> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { factoryProfile: true },
    });

    if (!company) {
      throw new NotFoundException(`Company ${id} not found`);
    }

    return toSharedCompanyDetail(company);
  }

  async updateMyCompany(
    userId: string,
    data: UpdateCompanyDto,
  ): Promise<Company> {
    await this.getMyCompany(userId);

    return this.prisma.company.update({
      where: { userId },
      data,
    });
  }

  async getSummary(userId: string): Promise<CompaniesSummaryResponse> {
    const [
      totalCompanies,
      verifiedCompanies,
      regionGroups,
      confidenceTierGroups,
      quoteRequestStatusGroups,
      ongoingContracts,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({
        where: {
          confidenceTier: { in: ['A_CERTIFIED_ROOT', 'B_LOCAL_STRONG_INSIDE'] },
        },
      }),
      this.prisma.company.groupBy({
        by: ['region'],
        where: { region: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { region: 'desc' } },
      }),
      this.prisma.company.groupBy({
        by: ['confidenceTier'],
        _count: { _all: true },
      }),
      this.prisma.quoteRequest.groupBy({
        by: ['status'],
        where: { clientUserId: userId },
        _count: { _all: true },
      }),
      this.prisma.contract.count({
        where: { ownerUserId: userId, status: 'in_progress' },
      }),
    ]);

    const confidenceTierCounts = { ...EMPTY_CONFIDENCE_TIER_COUNTS };
    for (const group of confidenceTierGroups) {
      if (group.confidenceTier) {
        confidenceTierCounts[CONFIDENCE_TIER_KEY[group.confidenceTier]] =
          group._count._all;
      }
    }

    const quoteRequestStatusCounts = {
      ...EMPTY_QUOTE_REQUEST_STATUS_COUNTS,
      ongoing: ongoingContracts,
    };
    for (const group of quoteRequestStatusGroups) {
      const bucket = QUOTE_REQUEST_STATUS_BUCKET[group.status];
      if (bucket) {
        quoteRequestStatusCounts[bucket] += group._count._all;
      }
    }

    const regionDistribution = regionGroups.slice(0, 5).map((group) => ({
      region: group.region ?? '미분류',
      count: group._count._all,
    }));
    const otherRegionCount = regionGroups
      .slice(5)
      .reduce((sum, group) => sum + group._count._all, 0);
    if (otherRegionCount > 0) {
      regionDistribution.push({ region: '기타', count: otherRegionCount });
    }

    return {
      totalCompanies,
      verifiedCompanies,
      activeRegions: regionGroups.length,
      confidenceTierCounts,
      regionDistribution,
      quoteRequestStatusCounts,
      pendingInquiries: quoteRequestStatusCounts.pending,
      currentMonthAmount: 12400000,
      escrowBalance: 4200000,
      settlementPending: 2800000,
      settlementPendingDueDate: '2026-06-30T00:00:00.000Z',
      settlementCompleted: 8600000,
      monthlyAmounts: [
        { month: '2026-04', amount: 7300000, isCurrent: false },
        { month: '2026-05', amount: 9800000, isCurrent: false },
        { month: '2026-06', amount: 12400000, isCurrent: true },
      ],
      unreadMessages: 0,
      meta: {
        mockFields: MOCK_FIELDS,
      },
    };
  }

  async listCompanies(query: ListCompaniesDto): Promise<CompanyListResponse> {
    const { keyword, industry, region, size, confidenceTier, page, limit } =
      query;

    const where: Prisma.CompanyWhereInput = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (industry) where.industry = industry;
    if (region) where.region = region;
    if (size) where.size = size;
    if (confidenceTier) where.confidenceTier = confidenceTier;

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy: [{ confidenceTier: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      items: items.map(toSharedCompany),
      total,
      page,
      limit,
    };
  }
}
