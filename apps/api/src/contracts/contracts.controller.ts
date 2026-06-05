import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthSession } from '../auth/auth.config';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CancelContractDto,
  CreateContractDto,
} from './dto/create-contract.dto';
import { ContractsService, type ContractRecord } from './contracts.service';

@Controller('contracts')
@UseGuards(BetterAuthGuard)
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthSession['user'],
    @Body() body: CreateContractDto,
  ): Promise<ContractRecord> {
    return this.contracts.create(user.id, body);
  }

  @Get('me')
  listMine(
    @CurrentUser() user: AuthSession['user'],
  ): Promise<ContractRecord[]> {
    return this.contracts.list(user.id);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
  ): Promise<ContractRecord> {
    return this.contracts.get(user.id, id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
    @Body() body: CancelContractDto,
  ): Promise<ContractRecord> {
    return this.contracts.cancel(user.id, id, { reason: body.reason });
  }

  @Get(':id/pdf')
  getPdf(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
  ): Promise<{ url: string }> {
    return this.contracts.getPdfUrl(user.id, id);
  }

  @Get(':id/embed/sign')
  getSignEmbedding(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
    @Query('redirectUrl') redirectUrl?: string,
  ): Promise<{ url: string; expiresAt?: string }> {
    return this.contracts.getSignEmbeddingUrl(user.id, id, redirectUrl);
  }

  @Get(':id/embed/view')
  getViewEmbedding(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
    @Query('redirectUrl') redirectUrl?: string,
  ): Promise<{ url: string; expiresAt?: string }> {
    return this.contracts.getViewEmbeddingUrl(user.id, id, redirectUrl);
  }
}
