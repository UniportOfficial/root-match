import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { toNodeHandler } from 'better-auth/node';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getAuth } from '../src/auth/auth.config';
import { prisma } from '../src/prisma/prisma.client';

const seedEmail = 'hong@techsolution.co.kr';
const seedPassword = 'TempPass!2026';
const seedOriginalName = '홍길동';

jest.setTimeout(60_000);

function extractSessionCookie(response: request.Response): string {
  const rawSetCookie = response.headers['set-cookie'];
  const cookies: string[] = Array.isArray(rawSetCookie)
    ? rawSetCookie.filter(
        (cookie): cookie is string => typeof cookie === 'string',
      )
    : typeof rawSetCookie === 'string'
      ? [rawSetCookie]
      : [];
  const sessionCookieHeader = cookies.find((cookie) =>
    cookie.startsWith('better-auth.session_token='),
  );

  if (!sessionCookieHeader) {
    throw new Error('session cookie not set');
  }

  const cookiePart = sessionCookieHeader.split(';')[0];
  if (!cookiePart) {
    throw new Error('session cookie header malformed');
  }

  return cookiePart;
}

describe('Users e2e (W2-5)', () => {
  let app: INestApplication<App>;
  let sessionCookie = '';

  beforeAll(async () => {
    // Schema + seed are provisioned by jest-e2e.globalSetup.ts once per run.
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

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Content-Type', 'application/json')
      .send({ email: seedEmail, password: seedPassword })
      .expect(200);
    sessionCookie = extractSessionCookie(response);
  });

  afterAll(async () => {
    // Restore mutated seed user name so subsequent suites within the same run
    // (or later runs reading existing data) see canonical seed state.
    try {
      await prisma.user.update({
        where: { email: seedEmail },
        data: { name: seedOriginalName },
      });
    } catch {
      // best-effort; non-fatal if user was already cleaned up
    }
    await app?.close();
  });

  it('GET /users/me returns the current authenticated seed user profile', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(response.body).toMatchObject({
      email: 'hong@techsolution.co.kr',
      name: '홍길동',
      accountType: 'client',
      role: 'admin',
    });
  });

  it('PATCH /users/me updates editable profile fields and persists them', async () => {
    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Cookie', sessionCookie)
      .set('Content-Type', 'application/json')
      .send({ name: '홍길동 수정' })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          email: 'hong@techsolution.co.kr',
          name: '홍길동 수정',
          accountType: 'client',
          role: 'admin',
        });
      });

    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(response.body).toMatchObject({
      email: 'hong@techsolution.co.kr',
      name: '홍길동 수정',
      accountType: 'client',
      role: 'admin',
    });
  });

  it('GET /users/me without a session cookie returns 401', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });
});
