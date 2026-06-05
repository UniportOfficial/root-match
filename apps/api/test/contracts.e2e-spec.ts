import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { toNodeHandler } from 'better-auth/node';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth.config';
import { PrismaService } from '../src/prisma/prisma.service';

const SEED_PASSWORD = 'TempPass!2026';
const SEED_CLIENT_EMAIL = 'hong@techsolution.co.kr';

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
    quoteRequestId: 'qr_e2e_mock',
    acceptedQuoteId: 'q_e2e_mock',
    clientCompanyId: 'c_client_mock',
    factoryCompanyId: 'c_factory_mock',
  };
}

describe('Contracts e2e (STEP 6)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let clientUserId: string;

  async function createDraft(
    sessionCookie: string,
    title: string,
  ): Promise<request.Response> {
    return request(app.getHttpServer())
      .post('/contracts')
      .set('Cookie', sessionCookie)
      .send(buildCreateContractBody(title))
      .expect(201);
  }

  async function sendContract(
    sessionCookie: string,
    contractId: string,
    body: Record<string, unknown> = {},
  ): Promise<request.Response> {
    return request(app.getHttpServer())
      .post(`/contracts/${contractId}/send`)
      .set('Cookie', sessionCookie)
      .send(body)
      .expect(201);
  }

  async function createAndSend(
    sessionCookie: string,
    title: string,
  ): Promise<request.Response> {
    const created = await createDraft(sessionCookie, title);
    return sendContract(sessionCookie, created.body.id);
  }

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
    expressApp.all('/api/auth/{*splat}', toNodeHandler(auth));
    app.use(json({ limit: '10mb' }));
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
  });

  it('POST /contracts persists a Contract row as draft via the mock gateway', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);

    const response = await createDraft(sessionCookie, 'STEP 6 — draft create');

    expect(response.body).toMatchObject({
      ownerUserId: clientUserId,
      title: 'STEP 6 — draft create',
      status: 'draft',
      ucansignTemplateId: 'tmpl_e2e_mock',
      quoteRequestId: 'qr_e2e_mock',
      acceptedQuoteId: 'q_e2e_mock',
    });
    expect(typeof response.body.id).toBe('string');
    expect(response.body.ucansignDocumentId).toBeNull();
    expect(response.body.sentAt).toBeNull();
    expect(Array.isArray(response.body.participants)).toBe(true);
    expect(response.body.participants).toHaveLength(2);
    expect(response.body.participants[0]).toMatchObject({
      role: 'client',
      name: '홍길동',
      signingOrder: 1,
      status: 'need_signing',
    });
    expect(response.body.participants[1]).toMatchObject({
      role: 'factory',
      name: '박공장',
      signingOrder: 2,
      status: 'need_signing',
    });

    const persisted = await prisma.contract.findUnique({
      where: { id: response.body.id },
      include: { participants: true },
    });
    expect(persisted?.status).toBe('draft');
    expect(persisted?.ucansignDocumentId).toBeNull();
    expect(persisted?.sentAt).toBeNull();
    expect(persisted?.participants).toHaveLength(2);
  });

  it('GET /contracts/me returns the persisted contracts owned by the user', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);

    const response = await request(app.getHttpServer())
      .get('/contracts/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toMatchObject({
      ownerUserId: clientUserId,
    });
  });

  it('GET /contracts/:id returns the contract with sorted participants', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const created = await createDraft(sessionCookie, 'STEP 6 — get one');

    const detail = await request(app.getHttpServer())
      .get(`/contracts/${created.body.id}`)
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(detail.body.id).toBe(created.body.id);
    expect(
      detail.body.participants.map((p: { role: string }) => p.role),
    ).toEqual(['client', 'factory']);
  });

  it('POST /contracts/:id/send transitions a draft to pending with vendor document id', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const draft = await createDraft(sessionCookie, 'STEP 6 — send draft');

    const sent = await sendContract(sessionCookie, draft.body.id);

    expect(sent.body).toMatchObject({
      id: draft.body.id,
      status: 'pending',
    });
    expect(sent.body.ucansignDocumentId).toMatch(/^mock-doc-/);
    expect(typeof sent.body.sentAt).toBe('string');

    const persisted = await prisma.contract.findUnique({
      where: { id: draft.body.id },
    });
    expect(persisted?.status).toBe('pending');
    expect(persisted?.ucansignDocumentId).toMatch(/^mock-doc-/);
    expect(persisted?.sentAt).not.toBeNull();
  });

  it('POST /contracts/:id/send without resend on pending contract returns 409', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(sessionCookie, 'STEP 6 — send twice');

    await request(app.getHttpServer())
      .post(`/contracts/${sent.body.id}/send`)
      .set('Cookie', sessionCookie)
      .send({})
      .expect(409);
  });

  it('POST /contracts/:id/send with { resend: true } on pending contract returns 201 (reminder)', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(sessionCookie, 'STEP 6 — resend');
    const originalDocId = sent.body.ucansignDocumentId;

    const reminded = await sendContract(sessionCookie, sent.body.id, {
      resend: true,
    });

    expect(reminded.body.status).toBe('pending');
    expect(reminded.body.ucansignDocumentId).toBe(originalDocId);
  });

  it('POST /contracts/:id/send on completed contract returns 409', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(sessionCookie, 'STEP 6 — send completed');

    await request(app.getHttpServer())
      .post('/webhooks/ucansign')
      .send({
        eventType: 'signing_completed_all',
        documentId: sent.body.ucansignDocumentId,
        customValue5: sent.body.id,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/contracts/${sent.body.id}/send`)
      .set('Cookie', sessionCookie)
      .send({ resend: true })
      .expect(409);
  });

  it('POST /contracts/:id/send without a session cookie returns 401', async () => {
    await request(app.getHttpServer())
      .post('/contracts/some-contract-id/send')
      .send({})
      .expect(401);
  });

  it('POST /contracts/:id/send with { resend: true } on in_progress contract returns 201 (reminder)', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(
      sessionCookie,
      'STEP 6 — in_progress reminder',
    );

    await request(app.getHttpServer())
      .post('/webhooks/ucansign')
      .send({
        eventType: 'signing_completed',
        documentId: sent.body.ucansignDocumentId,
        customValue5: sent.body.id,
        participantId: 'mock-participant-1',
        participantSigningOrder: 1,
        participantName: '홍길동',
      })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get(`/contracts/${sent.body.id}`)
      .set('Cookie', sessionCookie)
      .expect(200);
    expect(detail.body.status).toBe('in_progress');

    const reminded = await sendContract(sessionCookie, sent.body.id, {
      resend: true,
    });

    expect(reminded.body.status).toBe('in_progress');
    expect(reminded.body.ucansignDocumentId).toBe(sent.body.ucansignDocumentId);
  });

  it('POST /contracts/:id/send with { resend: true } on pending contract missing vendor document returns 404', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(
      sessionCookie,
      'STEP 6 — missing vendor doc reminder',
    );

    await prisma.contract.update({
      where: { id: sent.body.id },
      data: { ucansignDocumentId: null },
    });

    await request(app.getHttpServer())
      .post(`/contracts/${sent.body.id}/send`)
      .set('Cookie', sessionCookie)
      .send({ resend: true })
      .expect(404);
  });

  it('GET /contracts/:id/pdf returns the mock gateway signed URL after send', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(sessionCookie, 'STEP 6 — pdf');

    const pdf = await request(app.getHttpServer())
      .get(`/contracts/${sent.body.id}/pdf`)
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(pdf.body.url).toMatch(/^https:\/\/mock\.rootmatching\.local\//);
  });

  it('GET /contracts/:id/audit-trail returns the mock audit-trail URL with expiry after send', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(sessionCookie, 'STEP 6 — audit-trail');

    const auditTrail = await request(app.getHttpServer())
      .get(`/contracts/${sent.body.id}/audit-trail`)
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(auditTrail.body.url).toMatch(
      /^https:\/\/mock\.rootmatching\.local\/contracts\/.+-audit\.pdf$/,
    );
    expect(typeof auditTrail.body.expiresAt).toBe('string');
  });

  it('POST /contracts/:id/cancel transitions status to cancelled and persists reason', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(sessionCookie, 'STEP 6 — cancel');

    const cancelled = await request(app.getHttpServer())
      .post(`/contracts/${sent.body.id}/cancel`)
      .set('Cookie', sessionCookie)
      .send({ reason: 'e2e cancel reason' })
      .expect(201);

    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.cancelledReason).toBe('e2e cancel reason');
    expect(cancelled.body.cancelledAt).not.toBeNull();

    const persisted = await prisma.contract.findUnique({
      where: { id: sent.body.id },
    });
    expect(persisted?.status).toBe('cancelled');
  });

  it('GET /contracts/:id/embed/sign returns the mock sign-embedding URL with redirectUrl honored after send', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(sessionCookie, 'STEP 6 — embed sign');

    const embed = await request(app.getHttpServer())
      .get(`/contracts/${sent.body.id}/embed/sign`)
      .query({ redirectUrl: 'https://example.com/contracts/done' })
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(embed.body.url).toMatch(
      new RegExp(
        `^https://mock\\.rootmatching\\.local/contracts/.+/embed/sign$`,
      ),
    );
    expect(typeof embed.body.expiresAt).toBe('string');
  });

  it('GET /contracts/:id/embed/view returns the mock view-embedding URL after send', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(sessionCookie, 'STEP 6 — embed view');

    const embed = await request(app.getHttpServer())
      .get(`/contracts/${sent.body.id}/embed/view`)
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(embed.body.url).toMatch(
      new RegExp(
        `^https://mock\\.rootmatching\\.local/contracts/.+/embed/view$`,
      ),
    );
  });

  it('POST /webhooks/ucansign signing_completed_all marks the contract completed', async () => {
    const sessionCookie = await signIn(app, SEED_CLIENT_EMAIL);
    const sent = await createAndSend(sessionCookie, 'STEP 6 — webhook');

    const webhookResponse = await request(app.getHttpServer())
      .post('/webhooks/ucansign')
      .send({
        eventType: 'signing_completed_all',
        documentId: sent.body.ucansignDocumentId,
        customValue5: sent.body.id,
      })
      .expect(200);

    expect(webhookResponse.body).toEqual({
      matched: true,
      contractId: sent.body.id,
    });

    const persisted = await prisma.contract.findUnique({
      where: { id: sent.body.id },
      include: { participants: true },
    });
    expect(persisted?.status).toBe('completed');
    expect(persisted?.completedAt).not.toBeNull();
    expect(persisted?.participants.every((p) => p.status === 'completed')).toBe(
      true,
    );
  });

  it('POST /webhooks/ucansign with an unknown documentId returns matched=false', async () => {
    const webhookResponse = await request(app.getHttpServer())
      .post('/webhooks/ucansign')
      .send({
        eventType: 'signing_completed_all',
        documentId: 'mock-doc-does-not-exist',
        customValue5: 'unknown-contract-id',
      })
      .expect(200);

    expect(webhookResponse.body).toEqual({ matched: false });
  });

  it('GET /contracts/me without a session cookie returns 401', async () => {
    await request(app.getHttpServer()).get('/contracts/me').expect(401);
  });
});
