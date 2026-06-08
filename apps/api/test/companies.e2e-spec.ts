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

const seedPassword = 'TempPass!2026';

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

async function signIn(
  app: INestApplication<App>,
  email: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .set('Content-Type', 'application/json')
    .send({ email, password: seedPassword })
    .expect(200);

  return extractSessionCookie(response);
}

describe('Companies e2e (W2-5)', () => {
  let app: INestApplication<App>;

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
    await app?.close();
  });

  it('GET /companies/me returns the client company linked to the current user', async () => {
    const sessionCookie = await signIn(app, 'hong@techsolution.co.kr');

    const response = await request(app.getHttpServer())
      .get('/companies/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(response.body).toMatchObject({
      name: '테크솔루션',
      industry: 'IT/소프트웨어',
      region: '서울',
      contactEmail: 'contact@techsolution.co.kr',
    });
  });

  it('GET /companies/me returns the factory company linked to the current user', async () => {
    const sessionCookie = await signIn(app, 'factory@example.kr');

    const response = await request(app.getHttpServer())
      .get('/companies/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(response.body).toMatchObject({
      name: '박공장 가공소',
      industry: '제조/생산',
      region: '경기',
      contactEmail: 'factory@example.kr',
    });
  });

  it('GET /companies/me without a session cookie returns 401', async () => {
    await request(app.getHttpServer()).get('/companies/me').expect(401);
  });
});
