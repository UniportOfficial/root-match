import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DbHealthPayload {
  db: 'up' | 'down';
  vectorExtension: 'enabled' | 'disabled';
  latencyMs: number;
  timestamp: string;
}

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('db')
  async getDbHealth(): Promise<DbHealthPayload> {
    const start = Date.now();

    let db: 'up' | 'down' = 'down';
    let vectorExtension: 'enabled' | 'disabled' = 'disabled';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'up';

      const rows = await this.prisma.$queryRaw<
        { extversion: string }[]
      >`SELECT extversion FROM pg_extension WHERE extname = 'vector'`;
      if (rows.length > 0) {
        vectorExtension = 'enabled';
      }
    } catch {
      db = 'down';
    }

    return {
      db,
      vectorExtension,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}
