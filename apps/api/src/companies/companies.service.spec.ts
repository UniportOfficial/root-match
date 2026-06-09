import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ConfidenceTier,
  type Company,
  type FactoryProfile,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CompaniesService } from './companies.service';
import type { ListCompaniesDto } from './dto/list-companies.dto';

const NOW = new Date('2026-06-06T00:00:00Z');

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 'company-a',
    userId: null,
    name: 'Acme Manufacturing',
    industry: '제조/생산',
    region: '경기',
    size: null,
    description: null,
    contactEmail: null,
    contactPhone: null,
    website: null,
    establishedYear: null,
    employeeCount: null,
    revenue: null,
    externalId: 'C0000001',
    confidenceTier: ConfidenceTier.A_CERTIFIED_ROOT,
    processHint: '금속단조제품 제조업',
    address: '경기 안산시',
    lat: 37.3,
    lng: 126.8,
    kakaoId: null,
    representative: '홍길동',
    sourceTypes: ['kpic_or_root_cert'],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeFactoryProfile(
  overrides: Partial<FactoryProfile> = {},
): FactoryProfile {
  return {
    id: 'fp-1',
    companyId: 'company-a',
    location: '경기 안산시 단원구',
    processes: ['CNC 절삭', '표면처리'],
    trustScore: 95,
    deliveryRate: 96,
    reorderRate: 88,
    qualityScore: 94,
    deliveryScore: 95,
    priceCompetitiveness: 86,
    estimateMin: 400,
    estimateMax: 500,
    industrialComplex: '시화국가산업단지',
    reorderCustomerCount: 22,
    verified: true,
    specialty: ['알루미늄 CNC'],
    equipment: ['CNC 머시닝센터 6대'],
    products: ['알루미늄 하우징'],
    monthlyCapacity: '8,000개',
    clients: ['삼성전자 1차 협력사', 'LG전자 2차'],
    qualitySatisfaction: 4.6,
    avgResponseTime: '평일 4시간 이내',
    locationLat: 37.3,
    locationLng: 126.8,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildQuery(
  overrides: Partial<ListCompaniesDto> = {},
): ListCompaniesDto {
  return {
    keyword: undefined,
    industry: undefined,
    region: undefined,
    size: undefined,
    confidenceTier: undefined,
    page: 1,
    limit: 20,
    ...overrides,
  } as ListCompaniesDto;
}

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: {
    company: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      company: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  describe('getMyCompany', () => {
    it('returns the company when found', async () => {
      const company = makeCompany({ userId: 'user-1' });
      prisma.company.findUnique.mockResolvedValue(company);

      const result = await service.getMyCompany('user-1');

      expect(result).toBe(company);
      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('throws NotFoundException when company missing', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.getMyCompany('user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findMyCompany', () => {
    it('returns the company when found', async () => {
      const company = makeCompany({ userId: 'user-1' });
      prisma.company.findUnique.mockResolvedValue(company);

      const result = await service.findMyCompany('user-1');

      expect(result).toBe(company);
      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('returns null instead of throwing when company missing', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      const result = await service.findMyCompany('user-1');

      expect(result).toBeNull();
    });
  });

  describe('listCompanies', () => {
    it('returns paginated items with default ordering', async () => {
      const companies = [makeCompany(), makeCompany({ id: 'company-b' })];
      prisma.company.findMany.mockResolvedValue(companies);
      prisma.company.count.mockResolvedValue(2);

      const result = await service.listCompanies(buildQuery());

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.name).toBe('Acme Manufacturing');
      expect(result.items[0]?.confidenceTier).toBe('A_CERTIFIED_ROOT');
      expect(prisma.company.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ confidenceTier: 'asc' }, { name: 'asc' }],
        skip: 0,
        take: 20,
      });
    });

    it('applies keyword OR clause on name and description', async () => {
      prisma.company.findMany.mockResolvedValue([]);
      prisma.company.count.mockResolvedValue(0);

      await service.listCompanies(buildQuery({ keyword: 'forge' }));

      const call = prisma.company.findMany.mock.calls[0]?.[0];
      expect(call?.where.OR).toEqual([
        { name: { contains: 'forge', mode: 'insensitive' } },
        { description: { contains: 'forge', mode: 'insensitive' } },
      ]);
    });

    it('applies confidenceTier and region filters with pagination skip', async () => {
      prisma.company.findMany.mockResolvedValue([]);
      prisma.company.count.mockResolvedValue(0);

      await service.listCompanies(
        buildQuery({
          confidenceTier: ConfidenceTier.A_CERTIFIED_ROOT,
          region: '경기',
          page: 3,
          limit: 10,
        }),
      );

      expect(prisma.company.findMany).toHaveBeenCalledWith({
        where: {
          confidenceTier: ConfidenceTier.A_CERTIFIED_ROOT,
          region: '경기',
        },
        orderBy: [{ confidenceTier: 'asc' }, { name: 'asc' }],
        skip: 20,
        take: 10,
      });
    });

    it('returns empty list with zero total when DB is empty', async () => {
      prisma.company.findMany.mockResolvedValue([]);
      prisma.company.count.mockResolvedValue(0);

      const result = await service.listCompanies(buildQuery());

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('returns CompanyDetail with real FactoryProfile (isSynthesized=false)', async () => {
      const company = makeCompany();
      const factoryProfile = makeFactoryProfile();
      prisma.company.findUnique.mockResolvedValue({
        ...company,
        factoryProfile,
      });

      const result = await service.getById('company-a');

      expect(result.id).toBe('company-a');
      expect(result.name).toBe('Acme Manufacturing');
      expect(result.factoryProfile).not.toBeNull();
      expect(result.factoryProfile?.isSynthesized).toBe(false);
      expect(result.factoryProfile?.trustScore).toBe(95);
      expect(result.factoryProfile?.deliveryRate).toBe(96);
      expect(result.factoryProfile?.specialty).toEqual(['알루미늄 CNC']);
      expect(result.factoryProfile?.industrialComplex).toBe('시화국가산업단지');
      expect(result.factoryProfile?.location).toBe('경기 안산시 단원구');
    });

    it('returns CompanyDetail with synthesized profile when FactoryProfile missing (isSynthesized=true, A-tier verified)', async () => {
      const company = makeCompany({
        confidenceTier: ConfidenceTier.A_CERTIFIED_ROOT,
        processHint: '알루미늄 주조업',
      });
      prisma.company.findUnique.mockResolvedValue({
        ...company,
        factoryProfile: null,
      });

      const result = await service.getById('company-a');

      expect(result.factoryProfile).not.toBeNull();
      expect(result.factoryProfile?.isSynthesized).toBe(true);
      expect(result.factoryProfile?.trustScore).toBe(86);
      expect(result.factoryProfile?.deliveryRate).toBe(88);
      expect(result.factoryProfile?.qualityScore).toBe(86);
      expect(result.factoryProfile?.verified).toBe(true);
      expect(result.factoryProfile?.specialty).toEqual([]);
      expect(result.factoryProfile?.processes).toEqual(['알루미늄 주조업']);
      expect(result.factoryProfile?.location).toBe('경기 안산시');
    });

    it('throws NotFoundException when company missing', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.getById('unknown')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('calls findUnique with include factoryProfile and only once (prevents N+1)', async () => {
      const company = makeCompany();
      prisma.company.findUnique.mockResolvedValue({
        ...company,
        factoryProfile: null,
      });

      await service.getById('company-a');

      expect(prisma.company.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: 'company-a' },
        include: { factoryProfile: true },
      });
    });
  });
});
