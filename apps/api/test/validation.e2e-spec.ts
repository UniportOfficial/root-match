import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Zod validation e2e (W2-3)', () => {
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
    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ extended: true, limit: '10mb' }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /matching/recommend rejects an empty body with zod issues', async () => {
    const response = await request(app.getHttpServer())
      .post('/matching/recommend')
      .set('Content-Type', 'application/json')
      .send({})
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.message).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/projectName/),
        expect.stringMatching(/processType/),
      ]),
    );
  });
});
