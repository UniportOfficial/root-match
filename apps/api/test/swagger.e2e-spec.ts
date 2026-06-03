import request from 'supertest';
import { createE2eApp } from './support/create-e2e-app';

const expectedSchemas = [
  'UserRole',
  'AccountType',
  'CompanyRole',
  'Login',
  'Register',
  'UserProfile',
  'UserProfileUpdate',
  'CompanyUpdate',
  'QuoteRequestDraft',
];

describe('Swagger/OpenAPI e2e (W2-6)', () => {
  let previousNodeEnv: string | undefined;

  jest.setTimeout(20_000);

  beforeAll(() => {
    previousNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = previousNodeEnv;
  });

  it('serves OpenAPI 3.1 JSON with all 9 zod component schemas', async () => {
    process.env.NODE_ENV = 'test';
    const app = await createE2eApp({ swagger: true });
    try {
      const res = await request(app.getHttpServer())
        .get('/docs-json')
        .expect(200);

      expect(res.body.openapi).toBe('3.1.0');
      const schemas = res.body.components?.schemas ?? {};
      for (const schemaName of expectedSchemas) {
        expect(schemas[schemaName]).toBeDefined();
      }
    } finally {
      await app.close();
    }
  });

  it('serves Swagger UI and Better Auth Scalar UI outside production', async () => {
    process.env.NODE_ENV = 'test';
    const app = await createE2eApp({ swagger: true });
    try {
      await request(app.getHttpServer()).get('/docs').expect(200);
      await request(app.getHttpServer()).get('/api/auth/reference').expect(200);
    } finally {
      await app.close();
    }
  });

  it('does not mount /docs or Better Auth openAPI UI in production', async () => {
    process.env.NODE_ENV = 'production';
    const app = await createE2eApp({ swagger: true });
    try {
      await request(app.getHttpServer()).get('/docs-json').expect(404);
      await request(app.getHttpServer()).get('/docs').expect(404);
      await request(app.getHttpServer()).get('/api/auth/reference').expect(404);
    } finally {
      await app.close();
    }
  });
});
