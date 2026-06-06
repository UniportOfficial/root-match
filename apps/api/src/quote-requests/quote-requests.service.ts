import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { MatchRecommendation, QuoteRequest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateQuoteRequestInput } from './dto/create-quote-request.dto';
import type { UpdateQuoteRequestInput } from './dto/update-quote-request.dto';

export type QuoteRequestWithRecommendations = QuoteRequest & {
  recommendations: MatchRecommendation[];
};

const TERMINAL_STATUSES = ['CANCELLED', 'CONTRACTED'] as const;

@Injectable()
export class QuoteRequestsService {
  private readonly logger = new Logger(QuoteRequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    input: CreateQuoteRequestInput,
    clientCompanyId?: string | null,
  ): Promise<QuoteRequest> {
    const result = await this.prisma.quoteRequest.upsert({
      where: {
        clientUserId_projectName: {
          clientUserId: userId,
          projectName: input.projectName,
        },
      },
      create: {
        clientUserId: userId,
        clientCompanyId: clientCompanyId ?? undefined,
        projectName: input.projectName,
        processType: input.processType,
        productItem: input.productItem,
        estimatedQuantity: input.estimatedQuantity,
        desiredDeadline: input.desiredDeadline,
        budgetRange: input.budgetRange,
        detailRequirements: input.detailRequirements,
        status: 'NEW',
      },
      update: {},
    });

    this.logger.log(
      `QuoteRequest ${result.id} upserted (user=${userId}, project="${input.projectName}")`,
    );
    return result;
  }

  async list(userId: string): Promise<QuoteRequest[]> {
    return this.prisma.quoteRequest.findMany({
      where: { clientUserId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(
    userId: string,
    id: string,
  ): Promise<QuoteRequestWithRecommendations> {
    const record = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: { recommendations: { orderBy: { score: 'desc' } } },
    });
    if (!record) {
      throw new NotFoundException(`QuoteRequest ${id} not found`);
    }
    if (record.clientUserId !== userId) {
      throw new ForbiddenException();
    }
    return record;
  }

  async update(
    userId: string,
    id: string,
    input: UpdateQuoteRequestInput,
  ): Promise<QuoteRequest> {
    const existing = await this.get(userId, id);
    if (
      TERMINAL_STATUSES.includes(existing.status as 'CANCELLED' | 'CONTRACTED')
    ) {
      throw new ConflictException(
        `Cannot edit QuoteRequest in terminal status '${existing.status}'`,
      );
    }

    try {
      const updated = await this.prisma.quoteRequest.update({
        where: { id },
        data: input,
      });
      this.logger.log(`QuoteRequest ${id} updated (user=${userId})`);
      return updated;
    } catch (error) {
      // Unique violation on (clientUserId, projectName) when renaming to a conflict.
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          `QuoteRequest with projectName "${input.projectName}" already exists for this user`,
        );
      }
      throw error;
    }
  }

  async cancel(userId: string, id: string): Promise<QuoteRequest> {
    const existing = await this.get(userId, id);
    if (existing.status === 'CANCELLED') {
      return existing;
    }
    if (existing.status === 'CONTRACTED') {
      throw new ConflictException(
        `Cannot cancel QuoteRequest in terminal status 'CONTRACTED'`,
      );
    }

    const result = await this.prisma.quoteRequest.updateMany({
      where: {
        id,
        clientUserId: userId,
        status: { notIn: ['CANCELLED', 'CONTRACTED'] },
      },
      data: { status: 'CANCELLED' },
    });
    if (result.count === 0) {
      // Concurrent transition raced us into a terminal state — return current view.
      return this.get(userId, id);
    }

    const updated = await this.prisma.quoteRequest.findUnique({
      where: { id },
    });
    if (!updated) {
      throw new NotFoundException(
        `QuoteRequest ${id} disappeared after cancel`,
      );
    }
    this.logger.log(`QuoteRequest ${id} cancelled (user=${userId})`);
    return updated;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
