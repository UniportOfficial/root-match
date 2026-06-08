import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  type NestExpressApplication,
} from '@nestjs/platform-express';
import express, { type Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';
import { validateProdEnv } from '../src/config/env-validator.js';

let serverPromise: Promise<Express> | undefined;

async function bootstrap(): Promise<Express> {
  validateProdEnv();
  const expressApp = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
    { bodyParser: false, bufferLogs: true },
  );
  configureApp(app);
  await app.init();
  return expressApp;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const server = await (serverPromise ??= bootstrap());
  (server as unknown as (req: IncomingMessage, res: ServerResponse) => void)(
    req,
    res,
  );
}
