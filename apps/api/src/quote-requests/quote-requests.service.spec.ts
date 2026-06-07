import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  MatchingSource,
  Prisma,
  type MatchRecommendation,
  type QuoteRequest,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  QuoteRequestsService,
  type RecommendationCompanyInfo,
} from './quote-requests.service';

const NOW = new Date('2026-06-06T00:00:00Z');

function makeRecord(overrides: Partial<QuoteRequest> = {}): QuoteRequest {
  return {
    id: 'qr-test',
    clientUserId: 'user-owner',
    clientCompanyId: null,
    projectName: 'Test Project',
    processType: 'mold',
    productItem: 'Widget',
    estimatedQuantity: '1000',
    desiredDeadline: '2026-12-31',
    budgetRange: '1000-2000',
    detailRequirements: 'Detailed requirements',
    status: 'NEW',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeRecommendation(
  overrides: Partial<MatchRecommendation> = {},
): MatchRecommendation {
  return {
    id: 'rec-test',
    quoteRequestId: 'qr-test',
    factoryId: 'factory-a',
    score: 90,
    qualityScore: 85,
    deliveryScore: 80,
    priceScore: 75,
    trustScore: 92,
    reason: 'Good match',
    estimateMin: 1000,
    estimateMax: 2000,
    source: MatchingSource.DETERMINISTIC_MOCK,
    createdAt: NOW,
    ...overrides,
  };
}

function makeCompany(
  overrides: Partial<RecommendationCompanyInfo> = {},
): RecommendationCompanyInfo {
  return {
    id: 'factory-a',
    name: 'Acme Manufacturing',
    region: 'Seoul',
    industry: 'CNC Machining',
    ...overrides,
  };
}

describe('QuoteRequestsService', () => {
  let service: QuoteRequestsService;
  let prisma: {
    quoteRequest: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      upsert: jest.Mock;
    };
    company: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      quoteRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
      },
      company: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteRequestsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(QuoteRequestsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('list()', () => {
    it('returns user records sorted by createdAt desc', async () => {
      const records = [makeRecord({ id: 'qr-1' }), makeRecord({ id: 'qr-2' })];
      prisma.quoteRequest.findMany.mockResolvedValue(records);

      const result = await service.list('user-owner');

      expect(prisma.quoteRequest.findMany).toHaveBeenCalledWith({
        where: { clientUserId: 'user-owner' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(records);
    });
  });

  describe('get()', () => {
    it('returns empty recommendations and uses nested factory include (no extra Company query)', async () => {
      const record = { ...makeRecord(), recommendations: [] };
      prisma.quoteRequest.findUnique.mockResolvedValue(record);

      const result = await service.get('user-owner', 'qr-test');

      expect(prisma.quoteRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'qr-test' },
        include: {
          recommendations: {
            orderBy: { score: 'desc' },
            include: {
              factory: {
                select: { id: true, name: true, region: true, industry: true },
              },
            },
          },
        },
      });
      expect(prisma.company.findMany).not.toHaveBeenCalled();
      expect(result).toEqual({ ...record, recommendations: [] });
    });

    it('maps the relation-loaded factory into the company field', async () => {
      const recommendation = makeRecommendation({ factoryId: 'factory-a' });
      const company = makeCompany({ id: 'factory-a' });
      const record = {
        ...makeRecord(),
        recommendations: [{ ...recommendation, factory: company }],
      };
      prisma.quoteRequest.findUnique.mockResolvedValue(record);

      const result = await service.get('user-owner', 'qr-test');

      expect(prisma.company.findMany).not.toHaveBeenCalled();
      expect(result.recommendations).toEqual([{ ...recommendation, company }]);
    });

    it('maps factory=null (FK was removed before read race) to company=null', async () => {
      const recommendation = makeRecommendation({
        factoryId: 'factory-missing',
      });
      const record = {
        ...makeRecord(),
        recommendations: [{ ...recommendation, factory: null }],
      };
      prisma.quoteRequest.findUnique.mockResolvedValue(record);

      const result = await service.get('user-owner', 'qr-test');

      expect(result.recommendations).toEqual([
        { ...recommendation, company: null },
      ]);
    });

    it('preserves recommendation order and forwards factory metadata for each row', async () => {
      const recommendations = [
        {
          ...makeRecommendation({ id: 'rec-a', factoryId: 'factory-a' }),
          factory: makeCompany({ id: 'factory-a', name: 'Alpha' }),
        },
        {
          ...makeRecommendation({ id: 'rec-b', factoryId: 'factory-b' }),
          factory: makeCompany({
            id: 'factory-b',
            name: 'Beta',
            region: null,
          }),
        },
        {
          ...makeRecommendation({ id: 'rec-c', factoryId: 'factory-c' }),
          factory: null,
        },
      ];
      const record = { ...makeRecord(), recommendations };
      prisma.quoteRequest.findUnique.mockResolvedValue(record);

      const result = await service.get('user-owner', 'qr-test');

      expect(prisma.company.findMany).not.toHaveBeenCalled();
      expect(result.recommendations).toHaveLength(3);
      expect(result.recommendations[0]?.company?.name).toBe('Alpha');
      expect(result.recommendations[1]?.company?.name).toBe('Beta');
      expect(result.recommendations[1]?.company?.region).toBeNull();
      expect(result.recommendations[2]?.company).toBeNull();
    });

    it('throws NotFoundException when the record is missing', async () => {
      prisma.quoteRequest.findUnique.mockResolvedValue(null);

      await expect(service.get('user-owner', 'qr-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when caller is not the owner', async () => {
      const record = {
        ...makeRecord({ clientUserId: 'user-other' }),
        recommendations: [],
      };
      prisma.quoteRequest.findUnique.mockResolvedValue(record);

      await expect(service.get('user-owner', 'qr-test')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update()', () => {
    it('updates editable fields when owner matches and status is editable', async () => {
      const existing = { ...makeRecord(), recommendations: [] };
      const updated = makeRecord({ projectName: 'New Name' });
      prisma.quoteRequest.findUnique.mockResolvedValue(existing);
      prisma.quoteRequest.update.mockResolvedValue(updated);

      const result = await service.update('user-owner', 'qr-test', {
        projectName: 'New Name',
      });

      expect(prisma.quoteRequest.update).toHaveBeenCalledWith({
        where: { id: 'qr-test' },
        data: { projectName: 'New Name' },
      });
      expect(result).toEqual(updated);
    });

    it('rejects update when status is CANCELLED', async () => {
      const existing = {
        ...makeRecord({ status: 'CANCELLED' }),
        recommendations: [],
      };
      prisma.quoteRequest.findUnique.mockResolvedValue(existing);

      await expect(
        service.update('user-owner', 'qr-test', { projectName: 'X' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.quoteRequest.update).not.toHaveBeenCalled();
    });

    it('rejects update when status is CONTRACTED', async () => {
      const existing = {
        ...makeRecord({ status: 'CONTRACTED' }),
        recommendations: [],
      };
      prisma.quoteRequest.findUnique.mockResolvedValue(existing);

      await expect(
        service.update('user-owner', 'qr-test', { projectName: 'X' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.quoteRequest.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException on Prisma P2002 unique violation', async () => {
      const existing = { ...makeRecord(), recommendations: [] };
      prisma.quoteRequest.findUnique.mockResolvedValue(existing);
      prisma.quoteRequest.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.0.0',
        }),
      );

      await expect(
        service.update('user-owner', 'qr-test', { projectName: 'Duplicate' }),
      ).rejects.toThrow(ConflictException);
    });

    it('propagates non-P2002 prisma errors unchanged', async () => {
      const existing = { ...makeRecord(), recommendations: [] };
      const dbError = new Error('connection refused');
      prisma.quoteRequest.findUnique.mockResolvedValue(existing);
      prisma.quoteRequest.update.mockRejectedValue(dbError);

      await expect(
        service.update('user-owner', 'qr-test', { projectName: 'X' }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('cancel()', () => {
    it('soft-deletes by setting status to CANCELLED', async () => {
      const existing = { ...makeRecord(), recommendations: [] };
      const updated = makeRecord({ status: 'CANCELLED' });
      prisma.quoteRequest.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);
      prisma.quoteRequest.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.cancel('user-owner', 'qr-test');

      expect(prisma.quoteRequest.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'qr-test',
          clientUserId: 'user-owner',
          status: { notIn: ['CANCELLED', 'CONTRACTED'] },
        },
        data: { status: 'CANCELLED' },
      });
      expect(result).toEqual(updated);
    });

    it('returns existing record when already CANCELLED (idempotent)', async () => {
      const existing = {
        ...makeRecord({ status: 'CANCELLED' }),
        recommendations: [],
      };
      prisma.quoteRequest.findUnique.mockResolvedValue(existing);

      const result = await service.cancel('user-owner', 'qr-test');

      expect(prisma.quoteRequest.updateMany).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('rejects cancel when status is CONTRACTED', async () => {
      const existing = {
        ...makeRecord({ status: 'CONTRACTED' }),
        recommendations: [],
      };
      prisma.quoteRequest.findUnique.mockResolvedValue(existing);

      await expect(service.cancel('user-owner', 'qr-test')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.quoteRequest.updateMany).not.toHaveBeenCalled();
    });

    it('handles race: count===0 returns current view without throwing', async () => {
      const existing = { ...makeRecord(), recommendations: [] };
      const raced = {
        ...makeRecord({ status: 'CANCELLED' }),
        recommendations: [],
      };
      prisma.quoteRequest.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(raced);
      prisma.quoteRequest.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.cancel('user-owner', 'qr-test');

      expect(result).toBe(raced);
    });
  });
});
