import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { toNodeHandler } from 'better-auth/node';
import cookieParser from 'cookie-parser';
import { createHmac } from 'node:crypto';
import { json, urlencoded } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth.config';
import { captureRawBodyForWebhooks } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

const SEED_PASSWORD = 'TempPass!2026';
const SEED_CLIENT_EMAIL = 'hong@techsolution.co.kr';
const WEBHOOK_SECRET = 'test-webhook-secret-32-bytes-min';

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
  if (!sessionCookieHeader) throw new Error('session cookie not set');
  const cookiePart = sessionCookieHeader.split(';')[0];
  if (!cookiePart) throw new Error('session cookie header malformed');
  return cookiePart;
}

async function signIn(
  app: INestApplication<App>,
  email: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .set('Content-Type', 'application/json')
    .send({ email, password: SEED_PASSWORD })
    .expect(200);
  return extractSessionCookie(response);
}

function buildCreateContractBody(title: string): Record<string, unknown> {
  return {
    templateId: 'tmpl_e2e_mock',
    title,
    participants: [
      {
        role: 'client',
        name: '홍길동',
        email: SEED_CLIENT_EMAIL,
        signingOrder: 1,
        signingMethodType: 'email',
      },
      {
        role: 'factory',
        name: '박공장',
        email: 'factory@example.kr',
        signingOrder: 2,
        signingMethodType: 'email',
      },
    ],
  };
}

describe('Contracts webhook HMAC signature verification', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let clientUserId: string;
  let originalSecretEnv: string | undefined;

  beforeAll(async () => {
    originalSecretEnv = process.env.UCANSIGN_WEBHOOK_SECRET;
    process.env.UCANSIGN_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.CONTRACT_GATEWAY = 'mock';

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
    expressApp.all('/api/auth/{*splat}', toNodeHandler(auth));
    app.use(json({ limit: '10mb', verify: captureRawBodyForWebhooks }));
    app.use(urlencoded({ extended: true, limit: '10mb' }));
    await app.init();

    prisma = app.get(PrismaService);
    const user = await prisma.user.findUnique({
      where: { email: SEED_CLIENT_EMAIL },
    });
    if (!user) {
      throw new Error(
        `seed user ${SEED_CLIENT_EMAIL} missing — run \`pnpm prisma:seed\` first`,
      );
    }
    clientUserId = user.id;

    await prisma.contract.deleteMany({ where: { ownerUserId: clientUserId } });
  });

  afterAll(async () => {
    if (prisma && clientUserId) {
      await prisma.contract.deleteMany({
        where: { ownerUserId: clientUserId },
      });
    }
    await app?.close();
    if (originalSecretEnv === undefined) {
      delete process.env.UCANSIGN_WEBHOOK_SECRET;
    } else {
      process.env.UCANSIGN_WEBHOOK_SECRET = originalSecretEnv;
    }
  });

  async function createSentContract(
    sessionCookie: string,
    title: string,
  ): Promise<request.Response> {
    const created = await request(app.getHttpServer())
      .post('/contracts')
      .set('Cookie', sessionCookie)
      .send(buildCreateContractBody(title))
      .expect(201);
    return request(app.getHttpServer())
      .post(`/contracts/${created.body.id}/send`)
      .set('Cookie', sessionCookie)
      .send({})
      .expect(201);
  }

  it('valid HMAC over raw body → 200 and applies state', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createSentContract(sessionCookie, 'STEP 7 — valid sig');

    const payload = {
      eventType: 'signing_completed_all',
      documentId: sent.body.ucansignDocumentId,
      customValue5: sent.body.id,
    };
    const serialized = JSON.stringify(payload);
    const signature = createHmac('sha256', WEBHOOK_SECRET)
      .update(serialized)
      .digest('hex');

    const webhookResponse = await request(app.getHttpServer())
      .post('/webhooks/ucansign')
      .set('Content-Type', 'application/json')
      .set('x-ucansign-signature', signature)
      .send(serialized)
      .expect(200);

    expect(webhookResponse.body).toEqual({
      matched: true,
      contractId: sent.body.id,
    });

    const persisted = await prisma.contract.findUnique({
      where: { id: sent.body.id },
    });
    expect(persisted?.status).toBe('completed');
  });

  it('mismatched HMAC → 401', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createSentContract(sessionCookie, 'STEP 7 — bad sig');

    const payload = {
      eventType: 'signing_completed_all',
      documentId: sent.body.ucansignDocumentId,
      customValue5: sent.body.id,
    };
    const rawBytes = Buffer.from(JSON.stringify(payload), 'utf8');
    const wrongSignature = createHmac('sha256', 'wrong-secret')
      .update(rawBytes)
      .digest('hex');

    await request(app.getHttpServer())
      .post('/webhooks/ucansign')
      .set('Content-Type', 'application/json')
      .set('x-ucansign-signature', wrongSignature)
      .send(rawBytes)
      .expect(401);

    const persisted = await prisma.contract.findUnique({
      where: { id: sent.body.id },
    });
    expect(persisted?.status).toBe('pending');
  });

  it('missing signature header → 401', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createSentContract(
      sessionCookie,
      'STEP 7 — missing sig',
    );

    const payload = {
      eventType: 'signing_completed_all',
      documentId: sent.body.ucansignDocumentId,
      customValue5: sent.body.id,
    };

    await request(app.getHttpServer())
      .post('/webhooks/ucansign')
      .send(payload)
      .expect(401);

    const persisted = await prisma.contract.findUnique({
      where: { id: sent.body.id },
    });
    expect(persisted?.status).toBe('pending');
  });
});
