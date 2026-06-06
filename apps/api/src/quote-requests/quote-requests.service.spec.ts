import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma, type QuoteRequest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteRequestsService } from './quote-requests.service';

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
    it('returns the record with recommendations when owner matches', async () => {
      const record = { ...makeRecord(), recommendations: [] };
      prisma.quoteRequest.findUnique.mockResolvedValue(record);

      const result = await service.get('user-owner', 'qr-test');

      expect(prisma.quoteRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'qr-test' },
        include: { recommendations: { orderBy: { score: 'desc' } } },
      });
      expect(result).toBe(record);
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
