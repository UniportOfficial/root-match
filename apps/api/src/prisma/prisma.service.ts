import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — NestJS DI-managed Prisma adapter (Pre-Flight commit aa99d30).
 *
 * ARCHITECTURE NOTE (W2-2 W2-2.5 follow-up, 2026-06-03):
 * This service `extends PrismaClient` and coexists with the module-time singleton
 * `apps/api/src/prisma/prisma.client.ts` (created in W2-2 commit f484ad5) which
 * Better Auth's prismaAdapter consumes. As a result, **two PrismaClient instances**
 * exist at runtime — one per class. Each has its own internal connection pool;
 * both pools route through Neon's pgbouncer pool, which is the actual connection
 * ceiling.
 *
 * This is **Pattern (a) — accept dual-pool** per plan §11.1 Implementation Note 2.
 * The MVP impact is bounded by Neon's pgbouncer; we accept the marginal overhead
 * in exchange for not touching the Pre-Flight scaffold on the critical path.
 *
 * Refactor to **Pattern (b) — composition** (`readonly client = prisma`,
 * single shared PrismaClient instance) is deferred. Trigger conditions and
 * refactor procedure: see `docs/specs/prisma-service-pattern.md`.
 *
 * Grep tag for the eventual refactor: HORIZONTAL_SCALE_TRIGGER
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'DATABASE_URL is required in production. Configure apps/api/.env with the Neon pooled connection string.',
        );
      }
      this.logger.warn('DATABASE_URL not set — Prisma offline mode.');
      return;
    }
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => {
      void app.close();
    });
  }

  async softHealthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
