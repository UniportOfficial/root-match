import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2eApp } from './support/create-e2e-app';

describe('Security headers e2e (W2-6)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp({ swagger: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets helmet headers and omits HSTS outside production', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['cross-origin-opener-policy']).toBe(
      'same-origin-allow-popups',
    );
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(res.headers['strict-transport-security']).toBeUndefined();
  });

  it('responds to credentialed CORS preflight', async () => {
    const res = await request(app.getHttpServer())
      .options('/matching/recommend')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect((response) => expect([200, 204]).toContain(response.status));

    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
