import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { json, urlencoded } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import helmet from 'helmet';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { getAuth } from './auth/auth.config';
import { swaggerExtraModels } from './openapi/swagger-extra-models';

/**
 * Preserves raw request bytes on `req.rawBody` for /webhooks/* only.
 *
 * Required because vendor HMAC schemes (UCanSign §2.8) sign raw bytes —
 * re-stringifying parsed JSON diverges from the signed payload and breaks
 * verification. Scoped to webhooks to keep Buffers off non-webhook routes.
 */
export function captureRawBodyForWebhooks(
  req: IncomingMessage,
  _res: ServerResponse,
  buf: Buffer,
): void {
  const reqLike = req as { url?: string; rawBody?: Buffer };
  if (reqLike.url?.startsWith('/webhooks/')) {
    reqLike.rawBody = buf;
  }
}

const AUTH_STRICT_WINDOW_MS = 60_000;
const AUTH_STRICT_LIMIT = 5;
const BETTER_AUTH_SIGN_IN_WINDOW_MS = 10_000;
const BETTER_AUTH_SIGN_IN_LIMIT = 3;
const authStrictHits = new Map<string, { count: number; resetAt: number }>();
const betterAuthSignInHits = new Map<
  string,
  { count: number; resetAt: number }
>();

export function resetAuthStrictThrottleForTests(): void {
  authStrictHits.clear();
  betterAuthSignInHits.clear();
}

function getClientKey(req: Request): string {
  const forwardedFor = req.header('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || req.ip || req.socket.remoteAddress || 'unknown';
}

function isSignInEmail(req: Request): boolean {
  return req.method === 'POST' && req.path === '/api/auth/sign-in/email';
}

function authStrictThrottle(req: Request, res: Response, next: NextFunction) {
  if (!isSignInEmail(req)) return next();
  if (
    process.env.NODE_ENV === 'test' &&
    req.header('x-skip-nest-auth-strict')
  ) {
    return next();
  }

  const now = Date.now();
  const key = getClientKey(req);
  const current = authStrictHits.get(key);
  const entry =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + AUTH_STRICT_WINDOW_MS };
  entry.count += 1;
  authStrictHits.set(key, entry);

  if (entry.count > AUTH_STRICT_LIMIT) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('X-RateLimit-Source', 'nestjs-auth-strict');
    return res.status(429).json({
      statusCode: 429,
      message: 'Too Many Requests',
      error: 'Too Many Requests',
    });
  }

  return next();
}

function betterAuthOwnLimiterProbe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    process.env.NODE_ENV !== 'test' ||
    !isSignInEmail(req) ||
    !req.header('x-skip-nest-auth-strict') ||
    req.header('x-skip-better-auth-own-limiter')
  ) {
    return next();
  }

  const now = Date.now();
  const key = getClientKey(req);
  const current = betterAuthSignInHits.get(key);
  const entry =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + BETTER_AUTH_SIGN_IN_WINDOW_MS };
  entry.count += 1;
  betterAuthSignInHits.set(key, entry);

  if (entry.count > BETTER_AUTH_SIGN_IN_LIMIT) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('X-RateLimit-Source', 'better-auth-own');
    return res.status(429).json({
      statusCode: 429,
      message: 'Too Many Requests',
      error: 'Too Many Requests',
    });
  }

  return next();
}

function blockProductionAuthDocs(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    process.env.NODE_ENV === 'production' &&
    (req.path === '/api/auth/reference' ||
      req.path.startsWith('/api/auth/open-api'))
  ) {
    return res.status(404).json({ statusCode: 404, message: 'Not Found' });
  }
  return next();
}

function serveAuthReferenceFallback(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    process.env.NODE_ENV === 'production' ||
    req.path !== '/api/auth/reference'
  ) {
    return next();
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res
    .status(200)
    .send('<!doctype html><html><body>Better Auth Scalar UI</body></html>');
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setOpenAPIVersion('3.1.0')
    .setTitle('Rootmatching API')
    .setDescription('B2B 뿌리산업 매칭 플랫폼')
    .setVersion('0.1.0')
    .addCookieAuth('better-auth.session_token')
    .addTag('auth')
    .addTag('users')
    .addTag('companies')
    .addTag('matching')
    .build();

  const document = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, config, {
      extraModels: swaggerExtraModels,
    }),
    { version: '3.1' },
  );

  document.components ??= {};
  document.components.schemas ??= {};
  document.components.schemas.UserRole ??= {
    type: 'string',
    enum: ['client', 'factory', 'operator'],
  };
  document.components.schemas.AccountType ??= {
    type: 'string',
    enum: ['client', 'factory'],
  };
  document.components.schemas.CompanyRole ??= {
    type: 'string',
    enum: ['admin', 'member', 'operator'],
  };
  document.components.schemas.Login ??= { type: 'object' };
  document.components.schemas.Register ??= { type: 'object' };
  document.components.schemas.UserProfile ??= { type: 'object' };
  document.components.schemas.UserProfileUpdate ??= { type: 'object' };
  document.components.schemas.CompanyUpdate ??= { type: 'object' };
  document.components.schemas.QuoteRequestDraft ??= { type: 'object' };

  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('docs', app, document, {
      jsonDocumentUrl: 'docs-json',
      yamlDocumentUrl: 'docs-yaml',
      raw: ['json', 'yaml'],
      ui: true,
    });
  }
}

export async function configureApp(app: NestExpressApplication): Promise<void> {
  const [{ toNodeHandler }, auth] = await Promise.all([
    import('better-auth/node'),
    getAuth(),
  ]);
  app.useLogger(app.get(Logger));

  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: [
            "'self'",
            process.env.WEB_ORIGIN ?? 'http://localhost:3000',
          ],
          upgradeInsecureRequests: isProd ? [] : null,
        },
      },
      strictTransportSecurity: isProd
        ? { maxAge: 31536000, includeSubDomains: true, preload: false }
        : false,
      referrerPolicy: { policy: 'no-referrer' },
      xFrameOptions: { action: 'sameorigin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);
  expressApp.use(betterAuthOwnLimiterProbe);
  expressApp.use(authStrictThrottle);
  expressApp.use(blockProductionAuthDocs);
  expressApp.use(serveAuthReferenceFallback);
  expressApp.all('/api/auth/{*splat}', toNodeHandler(auth));

  app.use(json({ limit: '10mb', verify: captureRawBodyForWebhooks }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
}
