import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.config';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService, type UserProfileResponse } from './users.service';

@Controller('users')
@UseGuards(BetterAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(
    @CurrentUser() user: AuthSession['user'],
  ): Promise<UserProfileResponse> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthSession['user'],
    @Body() body: UpdateUserProfileDto,
  ): Promise<UserProfileResponse> {
    return this.usersService.updateProfile(user.id, body);
  }
}
