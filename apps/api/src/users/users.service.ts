import { Injectable, NotFoundException } from '@nestjs/common';
import type { AccountType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';

export type UserProfileResponse = {
  name: string;
  email: string;
  accountType: AccountType;
  role: UserRole;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        accountType: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: UpdateUserProfileDto,
  ): Promise<UserProfileResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
      select: {
        name: true,
        email: true,
        accountType: true,
        role: true,
      },
    });

    return user;
  }
}
