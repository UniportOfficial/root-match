import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get(PrismaService);
  });

  describe('GET /health/db — db up + vector enabled', () => {
    it('returns db:up and vectorExtension:enabled when DB responds', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([{ result: 1 }])
        .mockResolvedValueOnce([{ extversion: '0.8.1' }]);

      const result = await controller.getDbHealth();

      expect(result.db).toBe('up');
      expect(result.vectorExtension).toBe('enabled');
      expect(typeof result.latencyMs).toBe('number');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(() => new Date(result.timestamp)).not.toThrow();
    });
  });

  describe('GET /health/db — db up + vector disabled', () => {
    it('returns vectorExtension:disabled when vector extension row is absent', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([{ result: 1 }])
        .mockResolvedValueOnce([]);

      const result = await controller.getDbHealth();

      expect(result.db).toBe('up');
      expect(result.vectorExtension).toBe('disabled');
    });
  });

  describe('GET /health/db — db down', () => {
    it('returns db:down when DB throws', async () => {
      prismaService.$queryRaw.mockRejectedValueOnce(
        new Error('Connection refused'),
      );

      const result = await controller.getDbHealth();

      expect(result.db).toBe('down');
      expect(result.vectorExtension).toBe('disabled');
    });
  });
});
