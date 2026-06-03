import { PrismaClient } from '@prisma/client';

// Module-time singleton consumed by Better Auth's prismaAdapter.
// Pattern (a) per phase-1-w2.md §11.1 Implementation Note 2: coexists with
// `PrismaService extends PrismaClient` (Pre-Flight aa99d30) → two PrismaClient
// instances bounded by Neon's pgbouncer pool. Compose-not-extend refactor
// (HORIZONTAL_SCALE_TRIGGER) deferred to W2-6.
export const prisma = new PrismaClient();
