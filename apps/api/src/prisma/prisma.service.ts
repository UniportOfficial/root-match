import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'DATABASE_URL is required in production. Configure apps/api/.env with the Neon pooled connection string (see .sisyphus/plans/phase-1-w2.md §6).',
        );
      }
      this.logger.warn(
        'DATABASE_URL not set — Prisma offline mode (Pre-Flight scaffold or test environment).',
      );
      return;
    }
    await this.$connect();
    this.logger.log('Prisma connected');
  }
}
