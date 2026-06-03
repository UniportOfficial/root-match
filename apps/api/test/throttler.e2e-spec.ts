import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { prisma } from '../src/prisma/prisma.client';
import { createE2eApp } from './support/create-e2e-app';

const quoteDraft = {
  projectName: 'W2-6 throttle probe',
  processType: 'CNC',
  productItem: '알루미늄 브라켓',
  estimatedQuantity: '100개',
  desiredDeadline: '2026-07-01',
  budgetRange: '500만원 이하',
  detailRequirements: '정밀 공차와 표면처리가 필요합니다.',
};

describe('Throttler e2e (W2-6)', () => {
  let app: INestApplication<App>;

  jest.setTimeout(20_000);

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('default bucket returns 429 on the 31st GET /health within 60s', async () => {
    for (let i = 0; i < 30; i += 1) {
      await request(app.getHttpServer())
        .get('/health')
        .set('X-Forwarded-For', '203.0.113.31')
        .expect(200);
    }

    await request(app.getHttpServer())
      .get('/health')
      .set('X-Forwarded-For', '203.0.113.31')
      .expect(429)
      .expect((res) => expect(res.headers['retry-after']).toBeDefined());
  });

  it('expensive bucket returns 429 on the 6th POST /matching/recommend within 60s', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/matching/recommend')
        .set('X-Forwarded-For', '203.0.113.6')
        .send(quoteDraft)
        .expect((res) => expect([200, 201, 500]).toContain(res.status));
    }

    await request(app.getHttpServer())
      .post('/matching/recommend')
      .set('X-Forwarded-For', '203.0.113.6')
      .send(quoteDraft)
      .expect(429);
  });

  it('auth-strict returns 429 on the 6th POST /api/auth/sign-in/email within 60s', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .set('X-Forwarded-For', '203.0.113.60')
        .send({
          email: `missing-${i}@rootmatching.dev`,
          password: 'TempPass!2026',
        })
        .expect((res) => expect(res.status).not.toBe(429));
    }

    await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('X-Forwarded-For', '203.0.113.60')
      .send({
        email: 'missing-final@rootmatching.dev',
        password: 'TempPass!2026',
      })
      .expect(429)
      .expect((res) => {
        expect(res.headers['retry-after']).toBeDefined();
        expect(res.headers['x-ratelimit-source']).toBe('nestjs-auth-strict');
      });
  });

  it('Better Auth own sign-in limiter returns 429 on the 4th request within 10s', async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .set('X-Forwarded-For', '203.0.113.10')
        .set('X-Skip-Nest-Auth-Strict', '1')
        .send({
          email: `better-auth-${i}@rootmatching.dev`,
          password: 'TempPass!2026',
        })
        .expect((res) => expect(res.status).not.toBe(429));
    }

    await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('X-Forwarded-For', '203.0.113.10')
      .set('X-Skip-Nest-Auth-Strict', '1')
      .send({
        email: 'better-auth-final@rootmatching.dev',
        password: 'TempPass!2026',
      })
      .expect(429)
      .expect((res) =>
        expect(res.headers['x-ratelimit-source']).toBe('better-auth-own'),
      );
  });

  it('Better Auth route is not affected by the NestJS default bucket', async () => {
    for (let i = 0; i < 32; i += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .set('X-Forwarded-For', `198.51.100.${i}`)
        .set('X-Skip-Nest-Auth-Strict', '1')
        .set('X-Skip-Better-Auth-Own-Limiter', '1')
        .send({
          email: `default-skip-${i}@rootmatching.dev`,
          password: 'TempPass!2026',
        })
        .expect((res) =>
          expect(res.headers['x-ratelimit-source']).not.toBe('nestjs-default'),
        );
    }
  });
});
