import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import {
  configureApp,
  resetAuthStrictThrottleForTests,
  setupSwagger,
} from '../../src/bootstrap';

export async function createE2eApp(options?: {
  swagger?: boolean;
}): Promise<INestApplication<App>> {
  resetAuthStrictThrottleForTests();
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    bufferLogs: true,
  });
  configureApp(app);
  if (options?.swagger) setupSwagger(app);
  await app.init();
  return app as INestApplication<App>;
}
