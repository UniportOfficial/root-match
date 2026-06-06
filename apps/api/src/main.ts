import 'reflect-metadata';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { validateProdEnv } from './config/env-validator';

async function bootstrap() {
  validateProdEnv();

  const [{ NestFactory }, { AppModule }, { configureApp, setupSwagger }] =
    await Promise.all([
      import('@nestjs/core'),
      import('./app.module.js'),
      import('./bootstrap.js'),
    ]);

  // bodyParser:false is mandatory: Better Auth's handler reads the raw request
  // stream and would hang if NestJS' default JSON parser consumed it first
  // (Better Auth docs `integrations/express.mdx:14-35` + `integrations/nestjs.mdx:28-43`).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });

  configureApp(app);
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
