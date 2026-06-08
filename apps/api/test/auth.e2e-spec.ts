import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import request from 'supertest';
import { toNodeHandler } from 'better-auth/node';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getAuth } from '../src/auth/auth.config';
import { prisma } from '../src/prisma/prisma.client';

describe('Auth e2e (W2-2)', () => {
  let app: INestApplication<App>;
  const testEmail = `e2e-auth-${Date.now()}@rootmatching.dev`;
  const testPassword = 'TempPass!2026';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
      bufferLogs: true,
    });
    app.use(cookieParser(process.env.COOKIE_SECRET));
    const expressApp = (app as NestExpressApplication)
      .getHttpAdapter()
      .getInstance();
    expressApp.all('/api/auth/{*splat}', toNodeHandler(await getAuth()));
    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ extended: true, limit: '10mb' }));
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  let sessionCookie = '';

  it('POST /api/auth/sign-up/email sets better-auth.session_token cookie (no Secure on HTTP dev)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Content-Type', 'application/json')
      .send({
        email: testEmail,
        password: testPassword,
        name: 'E2E Tester',
        accountType: 'client',
      });

    expect(response.status).toBe(200);
    const rawSetCookie = response.headers['set-cookie'];
    expect(rawSetCookie).toBeDefined();
    const cookies: string[] = Array.isArray(rawSetCookie)
      ? rawSetCookie.filter((c): c is string => typeof c === 'string')
      : typeof rawSetCookie === 'string'
        ? [rawSetCookie]
        : [];
    const sessionCookieHeader = cookies.find((c) =>
      c.startsWith('better-auth.session_token='),
    );
    expect(sessionCookieHeader).toBeDefined();
    if (!sessionCookieHeader) throw new Error('session cookie not set');
    expect(sessionCookieHeader).toMatch(/Path=\//);
    expect(sessionCookieHeader).toMatch(/HttpOnly/);
    expect(sessionCookieHeader).toMatch(/SameSite=Lax/i);
    expect(sessionCookieHeader).not.toMatch(/Secure/);
    const cookiePart = sessionCookieHeader.split(';')[0];
    if (!cookiePart) throw new Error('session cookie header malformed');
    sessionCookie = cookiePart;
  });

  it('GET /auth/me without cookie returns 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me with cookie returns 200 and the user payload', async () => {
    expect(sessionCookie).toMatch(/^better-auth\.session_token=/);
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', sessionCookie)
      .expect(200);
    expect(response.body.email).toBe(testEmail);
    expect(response.body.name).toBe('E2E Tester');
    expect(response.body.accountType).toBe('client');
    expect(response.body.role).toBe('member');
  });
});
