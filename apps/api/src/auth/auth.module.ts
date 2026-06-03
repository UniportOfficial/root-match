import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BetterAuthGuard } from './better-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [BetterAuthGuard],
  exports: [BetterAuthGuard],
})
export class AuthModule {}
