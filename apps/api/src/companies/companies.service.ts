import { Injectable, NotFoundException } from '@nestjs/common';
import type { Company, Prisma } from '@prisma/client';
import type { CompanyListResponse } from '@rootmatching/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toSharedCompany } from './companies.adapter';
import type { ListCompaniesDto } from './dto/list-companies.dto';
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

  async listCompanies(query: ListCompaniesDto): Promise<CompanyListResponse> {
    const { keyword, industry, region, size, confidenceTier, page, limit } =
      query;

    const where: Prisma.CompanyWhereInput = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (industry) where.industry = industry;
    if (region) where.region = region;
    if (size) where.size = size;
    if (confidenceTier) where.confidenceTier = confidenceTier;

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy: [{ confidenceTier: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      items: items.map(toSharedCompany),
      total,
      page,
      limit,
    };
  }
}
