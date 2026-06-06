import { Injectable, Logger } from '@nestjs/common';
import type { QuoteRequest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateQuoteRequestInput } from './dto/create-quote-request.dto';

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
}
