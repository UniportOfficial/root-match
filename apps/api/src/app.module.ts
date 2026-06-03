import { BadRequestException, Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MatchingModule } from './matching/matching.module';
import { PrismaModule } from './prisma/prisma.module';

const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: unknown) => {
    if (!(error instanceof ZodError)) {
      return new BadRequestException(['body: Invalid request payload']);
    }

    return new BadRequestException(
      error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'body';
        return `${path}: ${issue.message}`;
      }),
    );
  },
});

@Module({
  imports: [PrismaModule, AuthModule, MatchingModule, HealthModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
