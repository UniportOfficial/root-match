import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { QuoteRequest } from '@prisma/client';
import type { AuthSession } from '../auth/auth.config';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { UpdateQuoteRequestDto } from './dto/update-quote-request.dto';
import {
  QuoteRequestsService,
  type QuoteRequestWithRecommendations,
} from './quote-requests.service';

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

  @Get()
  list(@CurrentUser() user: AuthSession['user']): Promise<QuoteRequest[]> {
    return this.quoteRequests.list(user.id);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
  ): Promise<QuoteRequestWithRecommendations> {
    return this.quoteRequests.get(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
    @Body() body: UpdateQuoteRequestDto,
  ): Promise<QuoteRequest> {
    return this.quoteRequests.update(user.id, id, body);
  }

  @Delete(':id')
  cancel(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
  ): Promise<QuoteRequest> {
    return this.quoteRequests.cancel(user.id, id);
  }
}
