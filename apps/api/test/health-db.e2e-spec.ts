import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('GET /health/db (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with db:up and vectorExtension:enabled', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/db')
      .expect(200);

    expect(response.body.db).toBe('up');
    expect(response.body.vectorExtension).toBe('enabled');
    expect(typeof response.body.latencyMs).toBe('number');
    expect(response.body.latencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof response.body.timestamp).toBe('string');
    expect(Number.isNaN(new Date(response.body.timestamp).getTime())).toBe(
      false,
    );
  });
});
