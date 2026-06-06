import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { QuoteRequest } from '@prisma/client';
import type { AuthSession } from '../auth/auth.config';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { QuoteRequestsService } from './quote-requests.service';

@Controller('quote-requests')
@UseGuards(BetterAuthGuard)
export class QuoteRequestsController {
  constructor(private readonly quoteRequests: QuoteRequestsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthSession['user'],
    @Body() body: CreateQuoteRequestDto,
  ): Promise<QuoteRequest> {
    const clientCompanyId =
      (user as { companyId?: string | null }).companyId ?? null;
    return this.quoteRequests.create(user.id, body, clientCompanyId);
  }
}
