import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module';
import { auth } from './auth/auth.config';

async function bootstrap() {
  // bodyParser:false is mandatory: Better Auth's handler reads the raw request
  // stream and would hang if NestJS' default JSON parser consumed it first
  // (Better Auth docs `integrations/express.mdx:14-35` + `integrations/nestjs.mdx:28-43`).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });

  // 1. cookies before auth — Better Auth needs parsed cookies.
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // 2. CORS credentialed for the Next.js web app.
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // 3. helmet placeholder — full /docs CSP harness deferred to W2-6 sub-track b.

  // 4. Better Auth routes BEFORE json/urlencoded body parsers.
  //    Express 5 splat syntax per librarian bg_607b471d.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/auth/{*splat}', toNodeHandler(auth));

  // 5. Body parsers for non-auth routes.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // 6. Swagger registration deferred to W2-6 sub-track b; listen.
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
