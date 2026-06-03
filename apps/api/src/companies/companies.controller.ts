import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { Company } from '@prisma/client';
import type { AuthSession } from '../auth/auth.config';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@UseGuards(BetterAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthSession['user']): Promise<Company> {
    return this.companiesService.getMyCompany(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthSession['user'],
    @Body() body: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companiesService.updateMyCompany(user.id, body);
  }
}
