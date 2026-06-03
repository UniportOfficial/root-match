import { Controller, Get, UseGuards } from '@nestjs/common';
import type { AuthSession } from './auth.config';
import { BetterAuthGuard } from './better-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(BetterAuthGuard)
  me(@CurrentUser() user: AuthSession['user']): AuthSession['user'] {
    return user;
  }
}
