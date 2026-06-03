import { Injectable, NotFoundException } from '@nestjs/common';
import type { Company } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCompany(userId: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateMyCompany(
    userId: string,
    data: UpdateCompanyDto,
  ): Promise<Company> {
    await this.getMyCompany(userId);

    return this.prisma.company.update({
      where: { userId },
      data,
    });
  }
}
