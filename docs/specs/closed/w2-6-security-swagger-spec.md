# W2-6 Security + Swagger Spec (Wave 4b prep)

> **목적**: Wave 4b W2-6 (NestJS 11 보안 + Swagger generation) 진입 전 사전 조사 + 작업 계획. 실제 구현은 본 spec 기반으로 W2-5 closure 후 별도 delegation으로 진행.

| 항목             | 값                                                                             |
| ---------------- | ------------------------------------------------------------------------------ |
| 작성일           | 2026-06-03                                                                     |
| 의존 컨텍스트    | handoff §2.6 (Wave 4 진입) + Q4 (Throttler in-memory MVP) + Q8 (Option C 위치) |
| 작업 범위        | spec 문서만 (실제 구현 NOT in scope of this commit)                            |
| 적용 시점        | W2-5 (Users + Companies modules) green 후                                      |
| Estimated effort | 1-1.5 engineer-day (실제 구현 시점)                                            |
| 참고 plan        | `.sisyphus/plans/phase-1-w2.md` §A.6 (다음 revision에서 정식 작성 필요)        |
| 참고 handoff     | `docs/handoffs/2026-06-03-wave-3a-q10-session-c-complete.md` v1.0 §2.6         |

---

## 0. Background + 의사결정 요약

### 0.1 W2-6의 위치 (Wave 4 진입)

Wave 3a + Q10 + Session C closure (HEAD `a193ae8`) → Wave 3b (W2-5 Users + Companies modules; 진행 중) → **Wave 4a (Option C β) + Wave 4b (W2-6 본 spec)**.

W2-6는 W2-3 (nestjs-zod + `.meta({id})` schemas, commit `b5558a3`) + W2-5 (Users + Companies + `UserProfile`/`UserProfileUpdate`/`CompanyUpdate` schemas, commit `6451145`)에 의존 — 본 spec 작성 직전 모두 closure 확인. Option C β (Q8 — Direct in MatchingModule)와는 zero overlap (다른 모듈, 다른 파일).

### 0.2 핵심 발견 (3 librarian research 종합)

본 spec 작성 과정에서 발견된 **W2-3 follow-up 항목**:

1. **`cleanupOpenApiDoc()` 누락 (CRITICAL)**: W2-3에서 `.meta({ id })` 추가는 정확했으나, OpenAPI emit이 정상 동작하려면 `SwaggerModule.createDocument()` 결과를 `cleanupOpenApiDoc()`으로 후처리해야 함. W2-3 시점에는 Swagger setup이 없었으므로 자연스럽게 deferred됐지만, **W2-6 §4에 필수 포함**되어야 함. (출처: nestjs-zod README L598-L607; cleanupOpenApiDoc.ts L357-L364)

2. **Better Auth 자체 rate limiter 존재**: Better Auth 1.6은 production default `100/60s` + `/sign-in/email` 전용 strict rule `3/10s`를 내장. Q4 NestJS Throttler는 **Better Auth route를 skip** 하고 일반 API route만 보호하는 것이 best practice. (출처: better-auth/docs/concepts/rate-limit)

3. **Better Auth 자체 OpenAPI plugin 존재**: `openAPI()` plugin이 `/api/auth/reference`에서 Scalar UI를 serve하고 `auth.api.generateOpenAPISchema()`로 OpenAPI 3.0 JSON emit 가능. **NestJS 측에서 proxy controller로 wrap할 필요 없음**. (출처: better-auth/docs/plugins/open-api)

### 0.3 W2-6 dependencies (final)

```text
W2-3 b5558a3 (nestjs-zod global + .meta({id})) ✅
   ↓
W2-5 6451145 (Users + Companies + UserProfile/UserProfileUpdate/CompanyUpdate .meta({id})) ✅
   ↓
W2-6 (본 spec)
   ├─ §1 Throttler (Q4 적용)
   ├─ §2 helmet + CORS
   ├─ §3 nestjs-pino
   └─ §4 Swagger (cleanupOpenApiDoc 필수)
```

### 0.4 Currently-declared `.meta({id})` schemas (W2-3 + W2-5 combined)

`packages/shared/src/schemas/` 현황 (W2-6 Swagger emit 대상):

| Schema              | File          | Source commit  | Notes                             |
| ------------------- | ------------- | -------------- | --------------------------------- |
| `UserRole`          | `user.ts`     | W2-3 `b5558a3` | enum: client / factory / operator |
| `AccountType`       | `user.ts`     | W2-3 `b5558a3` | enum: client / factory            |
| `CompanyRole`       | `user.ts`     | W2-3 `b5558a3` | enum: admin / member / operator   |
| `Login`             | `user.ts`     | W2-3 `b5558a3` | sign-in DTO                       |
| `Register`          | `user.ts`     | W2-3 `b5558a3` | sign-up DTO                       |
| `UserProfile`       | `user.ts`     | W2-5 `6451145` | GET /users/me response shape      |
| `UserProfileUpdate` | `user.ts`     | W2-5 `6451145` | PATCH /users/me body (pick: name) |
| `CompanyUpdate`     | `company.ts`  | W2-5 `6451145` | PATCH /companies/me body          |
| `QuoteRequestDraft` | `matching.ts` | W2-3 `b5558a3` | POST /matching/recommend body     |

총 9개 schema 식별. W2-6 verification §4.6에서 본 list가 OpenAPI `components.schemas`에 모두 emit되는지 확인.

---

## 1. Throttler (NestJS 11 + @nestjs/throttler 6.x)

**Decision context**: Q4 RESOLVED-DEFERRED → "In-memory MVP + `HORIZONTAL_SCALE_TRIGGER` doc". 본 §은 그 적용 방안.

### 1.1 Versions

| Package             | Version   | Compatibility / Note                                                                                                                                                                                                                     |
| ------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nestjs/throttler` | `^6.5.0`  | npm latest stable; peer `@nestjs/common/core ^11.0.0` ([package.json L98-L101](https://github.com/nestjs/throttler/blob/509821ca2720ecb2adacabbfb1f5b588cd708145/package.json#L98-L101))                                                 |
| Storage (MVP)       | in-memory | Built-in `ThrottlerStorageService`; activates when no `storage` option provided ([throttler.providers.ts L16-L22](https://github.com/nestjs/throttler/blob/509821ca2720ecb2adacabbfb1f5b588cd708145/src/throttler.providers.ts#L16-L22)) |
| TTL unit            | ms        | v6 changed from seconds → ms; use `seconds()`/`minutes()` helpers for readability ([README L47-L56](https://github.com/nestjs/throttler/blob/509821ca2720ecb2adacabbfb1f5b588cd708145/README.md#L47-L56))                                |
| Exceeded status     | **429**   | `ThrottlerException` returns `HttpStatus.TOO_MANY_REQUESTS` (not 403) ([throttler.exception.ts L10-L13](https://github.com/nestjs/throttler/blob/509821ca2720ecb2adacabbfb1f5b588cd708145/src/throttler.exception.ts#L10-L13))           |

```bash
pnpm --filter @rootmatching/api add @nestjs/throttler@^6.5.0
```

### 1.2 Configuration (paste-ready)

```ts
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler'

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: seconds(60), // milliseconds in v6
          limit: 30, // B2B MVP: 30 req/min/IP
        },
      ],
    }),
    // ... existing modules (AuthModule, MatchingModule, UsersModule, CompaniesModule, PrismaModule)
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... existing providers (APP_PIPE ZodValidationPipe from W2-3)
  ],
})
export class AppModule {}
```

**Rationale**:

- `30 req/min/IP` baseline은 B2B 저-volume 트래픽 가정. 공식 README 예제는 `10/min`이지만 internal API 사용 시 false positive 우려. ([README L47-L56](https://github.com/nestjs/throttler/blob/509821ca2720ecb2adacabbfb1f5b588cd708145/README.md#L47-L56))
- 글로벌 guard via `APP_GUARD` provider는 공식 권장 ([README L58-L64](https://github.com/nestjs/throttler/blob/509821ca2720ecb2adacabbfb1f5b588cd708145/README.md#L58-L64), [test/app/app.module.ts L6-L13](https://github.com/nestjs/throttler/blob/509821ca2720ecb2adacabbfb1f5b588cd708145/test/app/app.module.ts#L6-L13)).
- `name: 'default'` named throttler는 향후 추가 throttler (e.g., `'auth-strict'`)와의 호환성 유지.

### 1.3 Skip routes

| Route                               | Strategy                                                       | Rationale                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/health/*`                         | `@SkipThrottle({ default: true })`                             | Liveness/readiness probes는 안정적이어야 함; throttler가 monitoring 깨뜨릴 가능성                                |
| `/docs`, `/docs-json`, `/docs-yaml` | `@SkipThrottle({ default: true })`                             | Swagger UI는 multiple assets 로드; IP-based throttle 시 false positive                                           |
| `/api/auth/*` (Better Auth)         | **Better Auth 자체 limiter 사용 (NestJS throttler skip 권장)** | Better Auth 1.6 prod default `100/60s` + `/sign-in/email` strict `3/10s` 내장; 중복 throttle 시 retry-after 충돌 |

```ts
// apps/api/src/health/health.controller.ts (existing)
import { SkipThrottle } from '@nestjs/throttler'

@SkipThrottle({ default: true })
@Controller('health')
export class HealthController {
  @Get('db')
  check() {
    /* ... */
  }
}
```

**Better Auth route skip 구현 방법** (선택지):

- Better Auth는 NestJS controller가 아닌 `expressApp.all('/api/auth/{*splat}', toNodeHandler(auth))` 형태로 raw mount. `ThrottlerGuard`는 NestJS controller에만 적용되므로 **자동으로 skip됨**.
- 단, AppModule global guard가 모든 request에 hit한다면 별도 middleware 필요. 검증 사항.

**Open question 1**: 추가 strict throttle을 NestJS 측에서도 두어야 하는가? (Better Auth의 throttle이 prod에서 신뢰 가능하다면 추가 layer는 불필요. defense-in-depth 관점에선 `/api/auth/sign-in/email` 별도 strict throttler 추가 검토.)

### 1.4 HORIZONTAL_SCALE_TRIGGER (Redis migration 시점)

In-memory storage는 다음 조건 중 하나 이상 충족 시 Redis로 마이그레이션 필수:

- **2개 이상의 NestJS instance/pod이 동일 public traffic을 서비스** (load balancer 뒤). In-memory counter는 process-local이라 분산 시 counter fragment.
- **Autoscaling 또는 rolling deploy** 활성화. 요청이 다른 pod에 도달하면 counter 무력화.
- **Serverless/ephemeral runtime** (Vercel Edge functions 등). Memory state는 cold start 또는 isolate 사이에 휘발.
- **Multi-region/AZ 배포**: rate limit 공유 필요.
- **Operational requirement**: rate-limit telemetry가 restart 후에도 보존되어야 함 또는 중앙 모니터링 필요.
- **Security trigger**: 분산 abuse 시도 관찰 시 (한 source가 여러 pod에 분산해서 제한 우회).

(출처: [@nestjs/throttler README L407-L411](https://github.com/nestjs/throttler/blob/509821ca2720ecb2adacabbfb1f5b588cd708145/README.md#L407-L411), Better Auth rate-limit docs)

**Redis migration code (when triggered)**:

```bash
pnpm --filter @rootmatching/api add @nest-lab/throttler-storage-redis ioredis
```

```ts
// apps/api/src/app.module.ts (Redis variant)
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

ThrottlerModule.forRoot({
  throttlers: [{ name: 'default', ttl: seconds(60), limit: 30 }],
  storage: new ThrottlerStorageRedisService(redis),
})
```

`@nest-lab/throttler-storage-redis` is canonical for ioredis (Nest 11 + @nestjs/throttler 6+ supported; [package.json L26-L31](https://github.com/jmcdo29/nest-lab/blob/4ed4b21cce43cef3b294b0556592e42c1218afc5/packages/throttler-storage-redis/package.json#L26-L31)).

### 1.5 Verification

```ts
// apps/api/test/throttler.e2e-spec.ts (W2-6 신규)
import request from 'supertest'

describe('Throttler (limit=2, ttl=1s for test)', () => {
  it('allows N requests within ttl', async () => {
    for (let i = 0; i < 2; i++) {
      await request(app.getHttpServer()).get('/some-route').expect(200)
    }
  })

  it('returns 429 on N+1 request', async () => {
    await request(app.getHttpServer())
      .get('/some-route')
      .expect(429)
      .expect((res) => {
        expect(res.headers['retry-after']).toBeDefined()
      })
  })

  it('resets after ttl', async () => {
    await new Promise((r) => setTimeout(r, 1100))
    await request(app.getHttpServer()).get('/some-route').expect(200)
  })
})
```

Test module은 `ttl: 1000, limit: 2` override. Production TTL/limit으로 e2e 돌리면 너무 느림. ([공식 e2e 패턴](https://github.com/nestjs/throttler/blob/509821ca2720ecb2adacabbfb1f5b588cd708145/test/controller.e2e-spec.ts#L114-L162))

**Note**: `--runInBand` (backlog §3.4.1) 적용 후 본 spec 추가 가능.

---

## 2. helmet + CORS 정책

### 2.1 Versions

| Package  | Version  | Note                                                                                                                                                                                                                              |
| -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `helmet` | `^8.2.0` | npm latest (2026-05-22 published); type-only `@types/helmet`은 helmet v6+에서 내장이라 별도 설치 불요 ([package.json L1-L4](https://github.com/helmetjs/helmet/blob/5aaf5447692a18512e5b93ebdde7dc3a0f67674a/package.json#L1-L4)) |

```bash
pnpm --filter @rootmatching/api add helmet@^8.2.0
```

### 2.2 Configuration (paste-ready, B2B API + same-instance Swagger UI)

```ts
// apps/api/src/main.ts (excerpt)
import helmet from 'helmet'

const isProd = process.env.NODE_ENV === 'production'

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        // Swagger UI compat: inline bootstrap/style
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", process.env.WEB_ORIGIN ?? 'http://localhost:3000'],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
    strictTransportSecurity: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: false }
      : false,
    referrerPolicy: { policy: 'no-referrer' },
    xFrameOptions: { action: 'sameorigin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginEmbedderPolicy: false, // Swagger/API compat
  }),
)
```

### 2.3 Rationale per directive

| Directive                      | Value                                               | Rationale                                                                                                                                |
| ------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src`                  | `'self'`                                            | helmet 기본값 ([README L121-L134](https://github.com/helmetjs/helmet/blob/5aaf5447692a18512e5b93ebdde7dc3a0f67674a/README.md#L121-L134)) |
| `script-src`                   | `'self'`, `'unsafe-inline'`                         | Swagger UI는 inline bootstrap 스크립트 사용 ([swagger-ui issue #10655](https://github.com/swagger-api/swagger-ui/issues/10655))          |
| `style-src`                    | `'self'`, `https:`, `'unsafe-inline'`               | helmet 기본 style policy + Swagger UI inline style 호환                                                                                  |
| `strict-transport-security`    | prod only, 1y, includeSubDomains, preload=**false** | HSTS 활성화하면 되돌리기 어려움; `preload: true`는 소유자 승인 필요 ([hstspreload.org](https://hstspreload.org/))                        |
| `referrer-policy`              | `no-referrer`                                       | helmet 기본값; B2B internal API는 referrer leak 방지                                                                                     |
| `x-frame-options`              | `SAMEORIGIN`                                        | helmet 기본값 ([README L548-L575](https://github.com/helmetjs/helmet/blob/5aaf5447692a18512e5b93ebdde7dc3a0f67674a/README.md#L548-L575)) |
| `cross-origin-resource-policy` | `same-origin`                                       | API가 cross-origin embed 대상이 아님; cross-origin은 imgSrc/fontSrc 등에서 필요할 때만                                                   |
| `cross-origin-opener-policy`   | `same-origin-allow-popups`                          | 미래에 Swagger OAuth/social popup flow 활성화할 경우 대비                                                                                |
| `cross-origin-embedder-policy` | disabled                                            | helmet 기본값 (off); Swagger/CDN 자산 로딩 시 호환성 우선                                                                                |

### 2.4 main.ts ordering (definitive)

```ts
// apps/api/src/main.ts (final order)
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  bodyParser: false,
  bufferLogs: true, // §3 nestjs-pino 의존
})

// 1. Logger replacement (HTTP middleware 아님; create 직후)
app.useLogger(app.get(Logger))

// 2. helmet — MUST precede CORS + routes + body parsers
app.use(helmet(helmetOptions))

// 3. Cookie parser (Better Auth가 cookie 읽기 위해 필요)
app.use(cookieParser(process.env.COOKIE_SECRET))

// 4. CORS (helmet 이후 OK)
app.enableCors({
  origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
})

// 5. Better Auth raw handler (JSON body parser BEFORE; Better Auth가 raw stream 요구)
const expressApp = app.getHttpAdapter().getInstance()
expressApp.all('/api/auth/{*splat}', toNodeHandler(auth))

// 6. Body parsers (non-auth routes용)
app.use(json({ limit: '10mb' }))
app.use(urlencoded({ extended: true, limit: '10mb' }))

// 7. ValidationPipe는 APP_PIPE provider로 이미 적용됨 (W2-3 b5558a3)

// 8. Swagger setup (§4 참고)
// SwaggerModule.setup(...)

await app.listen(process.env.PORT ?? 3001)
```

**Citation**: NestJS Helmet docs는 "Helmet/global middleware should come **before** other `app.use()` calls or setup functions that may call `app.use()`"라고 명시 (<https://docs.nestjs.com/security/helmet>). Maintainer comment: "set helmet before `app.enableCors()`" (<https://github.com/nestjs/nest/issues/5699>).

### 2.5 Policy decision flags

- **HSTS preload**: 본 spec은 `preload: false` 권장 (v0.1). 활성화 전 소유자 승인 필요 (모든 subdomain HTTPS 보장 + 12개월 이상 유지 commitment).
- **CSP `unsafe-inline`**: 현실적 compromise. 향후 hardening track으로 nonce/hash 기반 CSP 검토.
- **CORP `same-origin`**: 현재 API가 외부 embed 대상 아님. cross-origin asset serve 필요 시 `cross-origin`으로 완화.

---

## 3. nestjs-pino 도입

### 3.1 Versions

| Package       | Version   | Note                                                                                                                                                                               |
| ------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nestjs-pino` | `^4.6.1`  | Latest stable; peer `@nestjs/common ^11.0.0` ([package.json L77-L81](https://github.com/iamolegga/nestjs-pino/blob/1e169c290eca03951761b31d15719df2cccd328a/package.json#L77-L81)) |
| `pino`        | `^10.x`   | peer dep ([package.json L65-L80](https://github.com/iamolegga/nestjs-pino/blob/1e169c290eca03951761b31d15719df2cccd328a/package.json#L65-L80))                                     |
| `pino-http`   | `^11.0.0` | peer dep ([nestjs-pino package.json L77-L81](https://github.com/iamolegga/nestjs-pino/blob/1e169c290eca03951761b31d15719df2cccd328a/package.json#L77-L81))                         |
| `pino-pretty` | `^13.1.3` | Dev only; nestjs-pino README가 별도 install 요구 ([README L288-L300](https://github.com/iamolegga/nestjs-pino/blob/1e169c290eca03951761b31d15719df2cccd328a/README.md#L288-L300))  |

```bash
pnpm --filter @rootmatching/api add nestjs-pino pino pino-http
pnpm --filter @rootmatching/api add -D pino-pretty
```

### 3.2 Configuration (paste-ready)

```ts
// apps/api/src/app.module.ts (excerpt)
import { LoggerModule } from 'nestjs-pino'
import { randomUUID } from 'node:crypto'

const isProd = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        enabled: !isTest,
        level: isTest ? 'silent' : isProd ? 'info' : 'debug',

        transport:
          !isProd && !isTest
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,

        // Correlation ID: validated incoming-trust
        genReqId: (req, res) => {
          const incoming = req.headers['x-request-id']
          const requestId = Array.isArray(incoming) ? incoming[0] : incoming
          if (requestId && /^[A-Za-z0-9._:-]{8,128}$/.test(requestId)) {
            res.setHeader('X-Request-Id', requestId)
            return requestId
          }
          const generated = randomUUID()
          res.setHeader('X-Request-Id', generated)
          return generated
        },

        // PII / secret redaction
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-api-key"]',
            'req.headers["x-csrf-token"]',
            'req.body.password',
            'req.body.confirmPassword',
            'req.body.currentPassword',
            'req.body.newPassword',
            'req.body.token',
            'req.body.accessToken',
            'req.body.refreshToken',
            'req.body.email',
            'res.headers.set-cookie',
          ],
          censor: '[Redacted]',
          remove: false,
        },

        // Health endpoint은 log volume 줄이기 위해 skip
        autoLogging: {
          ignore: (req) =>
            req.url === '/health' || req.url === '/health/db' || req.url?.startsWith('/docs-json'),
        },

        // 4xx → warn, 5xx → error
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return 'error'
          if (res.statusCode >= 400) return 'warn'
          return 'info'
        },
      },
    }),
    // ... existing modules
  ],
})
export class AppModule {}
```

### 3.3 Logger replacement (main.ts)

```ts
// apps/api/src/main.ts
import { Logger } from 'nestjs-pino'

const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  bodyParser: false,
  bufferLogs: true, // NESTED logs를 LoggerModule init까지 buffer
})

app.useLogger(app.get(Logger)) // create 직후
```

Evidence: nestjs-pino docs는 `bufferLogs: true` + `app.useLogger(app.get(Logger))`를 명시적으로 요구 ([README L67-L73](https://github.com/iamolegga/nestjs-pino/blob/1e169c290eca03951761b31d15719df2cccd328a/README.md#L67-L73)).

이후 services에서 `import { Logger } from '@nestjs/common'`을 그대로 사용하면 됨. nestjs-pino가 NestJS의 Logger token을 hijack하여 pino로 라우팅 ([README L549-L567](https://github.com/iamolegga/nestjs-pino/blob/1e169c290eca03951761b31d15719df2cccd328a/README.md#L549-L567)).

### 3.4 Test config

```ts
// Test 환경에서는 enabled=false로 jest stdout 오염 방지
LoggerModule.forRoot({
  pinoHttp: {
    enabled: !isTest,
    level: isTest ? 'silent' : isProd ? 'info' : 'debug',
    autoLogging: isTest ? false : { ignore: (req) => req.url === '/health' },
  },
})
```

서비스 unit test에서 `@InjectPinoLogger` 사용 시 `getLoggerToken()`으로 mock provide ([README L387-L405](https://github.com/iamolegga/nestjs-pino/blob/1e169c290eca03951761b31d15719df2cccd328a/README.md#L387-L405)).

### 3.5 Better Auth 통합 정책

**Recommendation**: Better Auth logger는 **별도 유지** (W2-6 v0.1 권장):

```ts
// apps/api/src/auth/auth.config.ts (existing, update)
export const auth = betterAuth({
  // ... existing config
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    disabled: process.env.NODE_ENV === 'test',
  },
})
```

**Reason**:

- Better Auth config는 NestJS DI 외부에서 생성됨. nestjs-pino의 request-scoped context를 bridge하기 non-trivial.
- Better Auth logger는 자체 `log(level, message, ...args)` custom hook 지원 ([options.mdx L728-L772](https://github.com/better-auth/better-auth/blob/a6f38c72ee3423ae80b0595fec3b4a61158c374d/docs/content/docs/reference/options.mdx#L728-L772)). 향후 hardening 시 shared pino root logger로 routing 가능.
- Prod에서 `warn` level로 volume 제어 + dev에서 `info`로 디버깅 보조.

### 3.6 Policy decision flags

- **Email redaction**: 본 spec은 `req.body.email` redaction 포함 권장 (B2B privacy default). 디버깅 시 visible 필요하면 stable user/company ID로 대체 logging 패턴 도입.
- **Correlation ID trust mode**: 본 spec은 **validated incoming-trust** (regex 검증 후 통과; 실패 시 UUID 생성). Vercel/Railway proxy 기반 chain에서 자동 correlation 유지.
- **autoLogging skip**: `/health/*` + `/docs-json` 만 skip. 향후 `/metrics` 등 추가 시 list 확장.

---

## 4. Swagger generation

### 4.1 Versions

| Package           | Version   | Note                                                                                                                                                                               |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nestjs/swagger` | `^11.4.4` | NestJS 11 호환 (`@nestjs/common/core ^11.0.1` peer) ([package.json L84-L90](https://github.com/nestjs/swagger/blob/df45bfacfa79c7e29d1c26adf684c0f83b447970/package.json#L84-L90)) |
| `nestjs-zod`      | `^5.4.0`  | Already pinned in apps/api/package.json (W2-3 `b5558a3`); supports zod v4 + .meta({id}) → components.schemas                                                                       |
| `zod`             | `^4.4.3`  | Already pinned (W2-3); v4 required for `.meta({id})` syntax                                                                                                                        |

```bash
pnpm --filter @rootmatching/api add @nestjs/swagger@^11.4.4
```

### 4.2 CRITICAL: cleanupOpenApiDoc() 필수

**핵심 발견**: W2-3에서 추가된 `.meta({ id: 'X' })` schemas는 `cleanupOpenApiDoc()` 후처리 없이는 `components.schemas.X`로 emit되지 **않음**.

```ts
// apps/api/src/main.ts (Swagger setup)
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'

const swaggerConfig = new DocumentBuilder()
  .setOpenAPIVersion('3.1.0')
  .setTitle('Rootmatching API')
  .setDescription('B2B 매칭 platform API (뿌리산업 발주처 ↔ 공장)')
  .setVersion(process.env.npm_package_version ?? '0.1.0')
  .setContact(
    'Rootmatching API Support',
    'https://rootmatching.co.kr',
    'support@rootmatching.co.kr',
  )
  .setLicense('Proprietary', 'https://rootmatching.co.kr/terms')
  .addServer('http://localhost:3001', 'Local development')
  .addServer('https://staging-api.rootmatching.co.kr', 'Staging')
  .addServer('https://api.rootmatching.co.kr', 'Production')
  .addTag('auth', 'Better Auth-managed authentication (see /api/auth/reference)')
  .addTag('users', 'User profile APIs (W2-5)')
  .addTag('companies', 'Company profile APIs (W2-5)')
  .addTag('matching', 'AI-driven B2B matching workflow')
  .addCookieAuth(
    'better-auth.session_token',
    {
      type: 'apiKey',
      in: 'cookie',
      description: 'Better Auth session cookie (HttpOnly, SameSite=Lax)',
    },
    'betterAuthCookie',
  )
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Future bearer token (Phase 2+)',
    },
    'bearer',
  )
  .build()

const rawDoc = SwaggerModule.createDocument(app, swaggerConfig, {
  autoTagControllers: false, // @ApiTags() 명시 강제
  operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`,
})

// CRITICAL: nestjs-zod .meta({id}) → components.schemas 변환
const openApiDoc = cleanupOpenApiDoc(rawDoc, { version: '3.1' })

const exposeDocs = process.env.NODE_ENV !== 'production'
if (exposeDocs) {
  SwaggerModule.setup('docs', app, openApiDoc, {
    useGlobalPrefix: false,
    jsonDocumentUrl: 'docs-json',
    yamlDocumentUrl: 'docs-yaml',
    ui: true,
    raw: ['json', 'yaml'],
  })
}
```

**Sources**:

- `cleanupOpenApiDoc()` 필수성: nestjs-zod README L598-L607 ([github](https://github.com/BenLorantfy/nestjs-zod/blob/cd5e0888a7786a69451926942cc2d78b5c34101c/README.md#L598-L607))
- `.meta({id})` → components.schemas: cleanupOpenApiDoc.ts L357-L364 ([github](https://github.com/BenLorantfy/nestjs-zod/blob/cd5e0888a7786a69451926942cc2d78b5c34101c/packages/nestjs-zod/src/cleanupOpenApiDoc.ts#L357-L364))
- E2E test confirming `#/components/schemas/<id>` emit: openapi.test.ts L388-L414 ([github](https://github.com/BenLorantfy/nestjs-zod/blob/cd5e0888a7786a69451926942cc2d78b5c34101c/packages/nestjs-zod/src/__e2e_tests__/openapi.test.ts#L388-L414))

### 4.3 Controller decorator pattern

```ts
// apps/api/src/companies/companies.controller.ts (example)
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { CompanyUpdateDto } from './dto/company-update.dto'
import { CompanyDto } from './dto/company.dto'

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  @Patch('me')
  @ApiOperation({ summary: 'Update current user’s company profile' })
  @ZodResponse({ type: CompanyDto, description: 'Updated company profile' })
  async update(@Body() body: CompanyUpdateDto) {
    // ...
  }
}
```

**Notes**:

- `@ApiTags()`: per controller; `autoTagControllers: false`로 explicit tagging 강제 ([interface L52-L58](https://github.com/nestjs/swagger/blob/df45bfacfa79c7e29d1c26adf684c0f83b447970/lib/interfaces/swagger-document-options.interface.ts#L52-L58))
- `@ApiOperation()`: summary/description ([source L15-L29](https://github.com/nestjs/swagger/blob/df45bfacfa79c7e29d1c26adf684c0f83b447970/lib/decorators/api-operation.decorator.ts#L15-L29))
- `@ZodResponse()`: 일반 `@ApiResponse({ type })` 대신 사용. nestjs-zod가 output schema 자동 선택 ([README L651-L657](https://github.com/BenLorantfy/nestjs-zod/blob/cd5e0888a7786a69451926942cc2d78b5c34101c/README.md#L651-L657))

**Caveat**: `@ZodResponse()`로 emit되는 response schema는 zod "output" 버전이라 component id에 `_Output` suffix가 자동 추가됨 ([README L737-L741](https://github.com/BenLorantfy/nestjs-zod/blob/cd5e0888a7786a69451926942cc2d78b5c34101c/README.md#L737-L741)). 예: `UserProfileSchema` → `components.schemas.UserProfile` (request) + `UserProfile_Output` (response). 의식적 패턴.

### 4.4 Better Auth route 처리 정책

**Decision**: Better Auth 자체 OpenAPI plugin 활용 (W2-6 v0.1 권장). NestJS 측에서 proxy controller wrap 금지.

**Rationale**:

- Better Auth `openAPI()` plugin은 core + 모든 활성 plugin endpoint를 자동 문서화
- `/api/auth/reference`에서 Scalar UI serve
- `auth.api.generateOpenAPISchema()`로 OpenAPI 3.0 JSON programmatic 추출 가능
- OpenAPI 3.0 emit (NestJS 3.1과 다름 — 통합 시 dialect mismatch 주의)
- 출처: [better-auth/docs/plugins/open-api.mdx L6-L55](https://github.com/better-auth/better-auth/blob/ad60333d1517142d688c61b6ccee14b4c30864ae/docs/content/docs/plugins/open-api.mdx#L6-L55)

**Implementation**:

```ts
// apps/api/src/auth/auth.config.ts (existing, add plugin)
import { betterAuth } from 'better-auth'
import { openAPI } from 'better-auth/plugins'

export const auth = betterAuth({
  // ... existing config (Q5 cookies, Q6 enums, Q9 plugins)
  plugins: [
    openAPI(), // → /api/auth/reference (Scalar UI) + /api/auth/open-api/generate-schema (JSON)
    // ... other plugins
  ],
})
```

**NestJS Swagger UI에서의 표현**:

- `auth` tag description에 Better Auth docs link 명시: `'Authentication via Better Auth — see /api/auth/reference'`
- Production exposure는 `/docs`와 `/api/auth/reference` 둘 다 환경별 gating (§4.6)

### 4.5 Production exposure 정책

**Recommendation**: B2B platform 특성상 `/docs`는 production 미노출.

```ts
const exposeDocs = process.env.NODE_ENV !== 'production'
// OR (partner access 필요 시): exposeDocs = process.env.EXPOSE_DOCS === 'true'
```

옵션 (production 노출 필요 시):

1. **Skip** (default): production에서 `/docs` 404
2. **Basic Auth gate**: middleware로 `Authorization: Basic ...` 검사 후 통과
3. **IP allowlist**: WAF (Cloudflare/Vercel)에서 office IP만 허용
4. **JSON only**: `ui: false, raw: ['json']`로 UI 숨기고 client codegen용 JSON만 serve

`SwaggerModule.setup()`은 `ui` + `raw` 옵션 별도 제어 가능 ([interface L23-L37](https://github.com/nestjs/swagger/blob/df45bfacfa79c7e29d1c26adf684c0f83b447970/lib/interfaces/swagger-custom-options.interface.ts#L23-L37)).

### 4.6 Verification

```ts
// apps/api/test/swagger.e2e-spec.ts (W2-6 신규)
import request from 'supertest'

describe('OpenAPI document', () => {
  it('serves valid OpenAPI 3.1 JSON', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200)

    // Basic shape
    expect(res.body.openapi).toMatch(/^3\.1\./)
    expect(Object.keys(res.body.paths ?? {}).length).toBeGreaterThan(0)
    expect(Object.keys(res.body.components?.schemas ?? {}).length).toBeGreaterThan(0)

    // W2-3 .meta({id}) bet validation (b5558a3)
    expect(res.body.components.schemas.UserRole).toBeDefined()
    expect(res.body.components.schemas.AccountType).toBeDefined()
    expect(res.body.components.schemas.CompanyRole).toBeDefined()
    expect(res.body.components.schemas.Login).toBeDefined()
    expect(res.body.components.schemas.Register).toBeDefined()
    expect(res.body.components.schemas.QuoteRequestDraft).toBeDefined()

    // W2-5 .meta({id}) bet validation (6451145)
    expect(res.body.components.schemas.UserProfile).toBeDefined()
    expect(res.body.components.schemas.UserProfileUpdate).toBeDefined()
    expect(res.body.components.schemas.CompanyUpdate).toBeDefined()

    // $ref usage (component reuse)
    expect(JSON.stringify(res.body)).toContain('#/components/schemas/UserRole')
  })

  it('exposes Swagger UI at /docs', async () => {
    await request(app.getHttpServer()).get('/docs').expect(200)
  })
})
```

**CI lint (선택사항)**:

```bash
# Redocly CLI (swagger-cli deprecated)
pnpm --filter @rootmatching/api dlx @redocly/cli@latest lint http://localhost:3001/docs-json --extends=minimal
```

Reference: [Redocly migration from swagger-cli](https://redocly.com/docs/cli/guides/migrate-from-swagger-cli).

---

## 5. Option C β 위치 (Q8 reference — Wave 4a)

본 spec과 **별도 작업** (W2-6 territory 아님). 본 §은 cross-reference 목적.

**Decision** (handoff §2.6 + Q8): Direct in `MatchingModule`. W2-1 fixtures (`apps/api/src/matching/fixtures/`)를 W2-4 DB로 마이그레이션.

**Wave 4a 작업 (별도 spec/delegation)**:

- `apps/api/src/matching/services/vector-search.service.ts` 수정
- W2-1 `fixtures/factories.ts` → DB 기반 `prisma.company.findMany({ where: { factory: { isNot: null } } })`
- pgvector top-K query 적용 (W1.1 시점 Neon pgvector 0.8.1 설치 완료)
- `matching/factory-embeddings.service.ts` (NEW) — embeddings table 관리 (apps/api/prisma/schema.prisma `FactoryEmbedding` model 활용)

**Wave 4a vs Wave 4b 분리**:

- Wave 4a (Option C β): `matching/` 내부 변경; e2e: AI 추천 결과가 fixtures → DB 기반으로 전환
- Wave 4b (W2-6 본 spec): `main.ts` + `app.module.ts` global concerns; matching/\* 영역 untouched

**Dependency order**: W2-5 (Users + Companies) green → Wave 4a (Option C β; W2-4 seed companies + factory embeddings 필요) → Wave 4b (W2-6 본 spec). 단, Wave 4a와 Wave 4b는 zero file overlap이라 병렬 fire도 가능 (orchestrator decision).

---

## 6. W2-6 작업 순서 (sub-steps proposal)

본 spec 기반으로 작성될 plan §A.6 delegation prompt의 sub-steps. 단일 atomic commit 또는 logical 분할 (각자 별도 commit) 선택 가능.

### 6.1 Recommended sub-step order (8 steps)

| #   | Sub-step                                                                                                                             | Files                                                                                                                 | Atomic? | Verification gate                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| 1   | `pnpm add` deps (helmet@^8.2.0, @nestjs/throttler@^6.5.0, @nestjs/swagger@^11.4.4, nestjs-pino@^4.6.1, pino, pino-http, pino-pretty) | `apps/api/package.json` + `pnpm-lock.yaml`                                                                            | ✅      | `pnpm install --frozen-lockfile` PASS                                                      |
| 2   | helmet wiring in main.ts (§2.4 ordering 준수)                                                                                        | `apps/api/src/main.ts`                                                                                                | ✅      | typecheck + lint PASS + 기존 e2e regression 없음                                           |
| 3   | nestjs-pino wiring (LoggerModule + useLogger + bufferLogs)                                                                           | `apps/api/src/app.module.ts` + `main.ts`                                                                              | ✅      | typecheck + lint + 기존 e2e PASS + `--runInBand` 적용                                      |
| 4   | Throttler wiring (APP_GUARD provider + skip routes)                                                                                  | `apps/api/src/app.module.ts` + `apps/api/src/health/health.controller.ts` (@SkipThrottle)                             | ✅      | typecheck + lint + 신규 `test/throttler.e2e-spec.ts` PASS                                  |
| 5   | Better Auth logger config update (level=warn prod) + openAPI() plugin 추가                                                           | `apps/api/src/auth/auth.config.ts`                                                                                    | ✅      | `/api/auth/reference` 200 + Better Auth 기존 e2e PASS                                      |
| 6   | Swagger setup (DocumentBuilder + cleanupOpenApiDoc + SwaggerModule.setup)                                                            | `apps/api/src/main.ts` + 각 controller `@ApiTags`/`@ApiOperation`/`@ZodResponse` 적용 (auth/matching/users/companies) | ✅      | 신규 `test/swagger.e2e-spec.ts` PASS (components.schemas count > 0 + W2-3 schemas defined) |
| 7   | E2E suite 신규 추가 (throttler.e2e-spec + swagger.e2e-spec)                                                                          | `apps/api/test/throttler.e2e-spec.ts` (NEW) + `apps/api/test/swagger.e2e-spec.ts` (NEW)                               | ✅      | `pnpm --filter @rootmatching/api test:e2e --runInBand` 모두 PASS                           |
| 8   | HORIZONTAL_SCALE_TRIGGER doc 작성                                                                                                    | `apps/api/MIGRATION.md` §9 (신규 section) — Redis migration trigger + code snippet                                    | ✅      | markdown lint PASS                                                                         |

**Single atomic commit option**: 위 8 sub-step을 `feat(api): security + swagger generation (W2-6)`로 단일 commit.
**Multi-commit option**: helmet + pino (logical block A) → throttler + better-auth (logical block B) → swagger + tests (logical block C) → MIGRATION.md (logical block D) — 4 commits.

**Recommendation**: 단일 atomic commit (Wave 3a W2-3/W2-4 패턴과 일관). Sub-step boundaries는 commit body에 자세히 cite.

### 6.2 Pre-conditions (W2-6 진입 전 충족 필요)

- ✅ W2-3 `b5558a3` (nestjs-zod + `.meta({id})` schemas)
- ✅ W2-5 `6451145` (Users + Companies modules + `UserProfile`/`UserProfileUpdate`/`CompanyUpdate` schemas)
- ✅ backlog §3.4.1 (`test:e2e --runInBand`) fold-in by W2-5 `6451145` (commit body: "Closes backlog §3.4.1")
- ✅ backlog §3.4.4 (`MIGRATION.md §8 zod v4 + better-call ADR`) closed by `e47045c`
- 권장 ✅ Wave 4a (Option C β) — 본 spec과 zero file overlap이라 병렬 fire 가능 (orchestrator decision)

### 6.3 Forbidden territory (W2-6 NOT in scope)

- `apps/api/src/matching/**` (Wave 4a Option C β territory)
- `apps/web/**` (Phase 1.W2 NOT in scope)
- `.github/workflows/ci.yml` (Q10 closure 후 안정; backlog §3.4.2가 후속)
- Prisma schema 변경 (W2-4 closure 후 freeze; throttler 내부 storage 만 사용)
- Redis 실제 도입 (HORIZONTAL_SCALE_TRIGGER 만 doc; 실제 마이그레이션은 trigger 조건 충족 시점)

### 6.4 Verification matrix (W2-6 완료 기준)

| Gate                                                              | Command                                                                                             | Pass criteria                                                                                                                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck                                                         | `pnpm -r typecheck`                                                                                 | exit 0                                                                                                                                                                                  |
| Lint                                                              | `pnpm lint`                                                                                         | exit 0                                                                                                                                                                                  |
| Format                                                            | `pnpm format:check`                                                                                 | exit 0                                                                                                                                                                                  |
| Build                                                             | `pnpm -r run build`                                                                                 | exit 0                                                                                                                                                                                  |
| Mock auth regression                                              | `pnpm guard:no-mock-auth`                                                                           | exit 0                                                                                                                                                                                  |
| Existing e2e (auth, matching, validation, seed, users, companies) | `pnpm --filter @rootmatching/api test:e2e --runInBand`                                              | All PASS (zero regression from W2-3/W2-4/W2-5)                                                                                                                                          |
| Throttler e2e (신규)                                              | (포함됨 위)                                                                                         | `limit + 1` 요청 → 429 + retry-after header                                                                                                                                             |
| Swagger e2e (신규)                                                | (포함됨 위)                                                                                         | `/docs-json` 200 + openapi=3.1 + components.schemas 9개 (UserRole, AccountType, CompanyRole, Login, Register, QuoteRequestDraft, UserProfile, UserProfileUpdate, CompanyUpdate) defined |
| Helmet smoke                                                      | `curl -I http://localhost:3001/health/db`                                                           | response에 `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer` 포함                                                                                |
| Pino log shape                                                    | `pnpm --filter @rootmatching/api dev` 실행 후 `curl /health/db` (skip된 endpoint이므로 출력 없어야) | `/users/me` 호출 시 JSON log 1줄 (prod-like)                                                                                                                                            |
| Better Auth `/api/auth/reference`                                 | `curl http://localhost:3001/api/auth/reference`                                                     | Scalar UI HTML 응답 (openAPI() plugin 작동 확인)                                                                                                                                        |

---

## 7. References

### 7.1 Decision references (handoff + plan)

- `docs/handoffs/2026-06-03-wave-3a-q10-session-c-complete.md` v1.0:
  - §2.6 Wave 4 진입 가이드
  - §3.1 Q4 (Throttler in-memory MVP) + Q8 (Option C Direct in MatchingModule) RESOLVED
  - §1.1 Wave 3a — W2-3 `b5558a3` `.meta({id})` schemas baseline
- `docs/specs/w2-2.5-followup-backlog.md` v0.4:
  - §3.4.1 (`test:e2e --runInBand`) — W2-6 e2e 실행 시 의존
  - §3.4.4 (`MIGRATION.md §8 zod v4 + better-call ADR`) — 본 spec과 별도 작업
- `.sisyphus/plans/phase-1-w2.md` v0.10:
  - §A.6 (다음 revision에서 정식 작성) — 본 spec이 prompt body skeleton 제공

### 7.2 Librarian research sources (2026-06-03)

#### §1 Throttler (bg_bb8d4d30, 3m 42s)

- `@nestjs/throttler` repo: <https://github.com/nestjs/throttler> (commit `509821c`)
- README L47-L56 (ttl unit), L58-L64 (APP_GUARD), L132-L152 (@SkipThrottle), L172-L181 (@Throttle), L407-L411 (storage), L413-L443 (helpers), L447-L451 (Redis providers)
- src/throttler.providers.ts L16-L22 (default in-memory storage)
- src/throttler.exception.ts L10-L13 (429 status)
- src/index.ts L1-L10 (public exports)
- test/controller.e2e-spec.ts L114-L162 (e2e pattern)
- `@nest-lab/throttler-storage-redis`: <https://github.com/jmcdo29/nest-lab/blob/4ed4b21cce43cef3b294b0556592e42c1218afc5/packages/throttler-storage-redis>
- Better Auth rate-limit: <https://better-auth.com/docs/concepts/rate-limit>
- Better Auth rate-limit source: <https://github.com/better-auth/better-auth/blob/ad60333d1517142d688c61b6ccee14b4c30864ae/docs/content/docs/concepts/rate-limit.mdx>

#### §2 helmet + §3 nestjs-pino (bg_e84d0eff, 4m 11s)

- helmet repo: <https://github.com/helmetjs/helmet> (commit `5aaf544`)
- README L53-L66 (CSP defaults), L121-L134 (defaults), L188-L209 (COEP), L248-L270 (CORP), L313-L328 (referrer), L365-L384 (HSTS), L548-L575 (X-Frame)
- NestJS Helmet docs: <https://docs.nestjs.com/security/helmet>
- nestjs-pino repo: <https://github.com/iamolegga/nestjs-pino> (commit `1e169c2`)
- README L55-L63 (forRoot shape), L67-L73 (bufferLogs + useLogger), L232-L279 (config interface), L281-L300 (pino-pretty), L387-L405 (test mocking), L524-L533 (migration), L549-L567 (services pattern)
- pino-http: <https://github.com/pinojs/pino-http> (commit `4122038`)
- README L95-L101 (genReqId warning), L145-L154 (example), L421-L429 (body redaction)
- pino redaction: <https://github.com/pinojs/pino/blob/ff0dc5c/docs/redaction.md>
- Better Auth logger options: <https://github.com/better-auth/better-auth/blob/a6f38c72/docs/content/docs/reference/options.mdx#L728-L772>
- swagger-ui CSP issue: <https://github.com/swagger-api/swagger-ui/issues/10655>
- HSTS preload requirements: <https://hstspreload.org/>

#### §4 Swagger generation (bg_2ef8a2b2, 4m 48s)

- nestjs-zod repo: <https://github.com/BenLorantfy/nestjs-zod> (commit `cd5e088`)
- README L584-L741 (OpenAPI integration full section)
- README L594-L607 (cleanupOpenApiDoc 필수성)
- README L637-L657 (@ZodResponse + \_Output suffix)
- README L697-L735 (`.meta({id})` → components)
- packages/nestjs-zod/src/dto.ts L199-L239 (metadata preservation)
- packages/nestjs-zod/src/cleanupOpenApiDoc.ts L39-L70 + L357-L364 (id → component mapping)
- packages/nestjs-zod/src/**e2e_tests**/openapi.test.ts L388-L414 (test confirming emit)
- @nestjs/swagger repo: <https://github.com/nestjs/swagger> (commit `df45bfa`)
- lib/document-builder.ts L35-L129 (metadata/servers/tags), L208-L279 (auth helpers)
- lib/swagger-module.ts L42-L49 (controller scanning)
- lib/interfaces/swagger-document-options.interface.ts L52-L58 (autoTagControllers)
- lib/interfaces/swagger-custom-options.interface.ts L23-L37 (ui/raw options)
- Better Auth openAPI plugin: <https://github.com/better-auth/better-auth/blob/ad60333d/docs/content/docs/plugins/open-api.mdx>
- Redocly CLI migration: <https://redocly.com/docs/cli/guides/migrate-from-swagger-cli>

---

## 8. Open questions (user decision needed)

| #   | Question                                                                                                 | Default if no decision                                     | Impact                                                         |
| --- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| Q1  | Throttler `ttl/limit` 기본값 (MVP `30/60s`)이 적절한가? 더 보수적 (`10/60s`) 또는 관대 (`100/60s`) 필요? | `30/60s` (B2B 저-volume 가정)                              | 사용자 unwanted throttle (false positive) 또는 underprotection |
| Q2  | HSTS `preload: true` 활성화 시기? (모든 subdomain HTTPS 보장 + 12mo commitment 필요)                     | `false` (v0.1)                                             | Browser 영구 캐싱; 되돌리기 어려움                             |
| Q3  | Swagger `/docs` production 노출 정책?                                                                    | `process.env.NODE_ENV !== 'production'`로 dev/staging only | Partner/client codegen 접근성                                  |
| Q4  | `req.body.email` redaction을 prod logger에 포함할 것인가?                                                | 포함 (B2B privacy default)                                 | 디버깅 시 user identification 어려움                           |
| Q5  | `/api/auth/sign-in/email`에 NestJS-level strict throttle 추가? (Better Auth 자체 `3/10s` 외)             | NestJS 측 추가 안함 (Better Auth 자체 limiter 신뢰)        | Defense-in-depth vs. retry-after 충돌 가능성                   |
| Q6  | Better Auth `openAPI()` plugin 활성화 시 prod에서 `/api/auth/reference` Scalar UI 노출?                  | dev/staging only (`/docs`와 동일 gating)                   | Partner API 문서 접근성                                        |
| Q7  | nestjs-pino correlation ID trust mode? (validated incoming vs. zero-trust always-generate)               | Validated incoming-trust (Vercel/Railway proxy 호환)       | 상위 proxy ID 보존 vs. 사용자 controllable 위험                |
| Q8  | `cleanupOpenApiDoc()` 누락 발견 — W2-3 backlog 항목으로 추가할 것인가, 본 spec 시점에 한 번에 처리?      | 본 spec 시점에 처리 (W2-6 §6.1 sub-step 6)                 | W2-3 commit body 정정 vs. W2-6 단일 적용 일관성                |

### 8.1 Decisions (v0.2, 2026-06-03)

사용자 결정 수렴 완료. 7 default 채택 + Q5 변경. Spec status **PROPOSED → ACCEPTED**.

| Q   | 결정                                                                                                                              | 변경 사항 (vs §8 default)                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Q1  | ✅ `30 req / 60s` default + `expensive` bucket `5 req / 60s` for `/matching/recommend` (OpenAI-bound)                             | (default 채택)                                                           |
| Q2  | ✅ HSTS `preload: false` (v0.1)                                                                                                   | (default 채택; Phase 6 prod 진입 시 재평가)                              |
| Q3  | ✅ `/docs` dev/staging only (`process.env.NODE_ENV !== 'production'`)                                                             | (default 채택)                                                           |
| Q4  | ✅ `req.body.email` redaction 포함 (B2B privacy default)                                                                          | (default 채택)                                                           |
| Q5  | ⚙️ **CHANGED** — NestJS-level strict throttle 추가: named bucket `auth-strict` (5 req / 60s) applied to `/api/auth/sign-in/email` | **변경**: defense-in-depth 강화. Better Auth 자체 `3/10s`도 그대로 유지. |
| Q6  | ✅ Better Auth `openAPI()` plugin Scalar UI dev/staging only                                                                      | (default 채택; `/docs`와 동일 gating)                                    |
| Q7  | ✅ nestjs-pino correlation ID `validated incoming-trust` mode                                                                     | (default 채택; Vercel/Railway proxy 호환)                                |
| Q8  | ✅ `cleanupOpenApiDoc()` W2-6 absorb (§6.1 sub-step 6)                                                                            | (default 채택; W2-3 backlog 별도 commit 불필요)                          |

**Q5 변경의 W2-6 §1 적용 사항** (W2-6 agent가 본 §8.1 결정 기준으로 적용; spec §1.2 paste-ready config는 v0.1 그대로 — 적용은 plan §A.6 delegation prompt MUST DO에 명시):

1. `ThrottlerModule.forRoot({ throttlers: [...] })`에 새 throttler 추가:

   ```ts
   { name: 'auth-strict', ttl: seconds(60), limit: 5 }
   ```

   기존 throttlers (`default`, `expensive`)에 이어서 `auth-strict` 1개 추가 (총 3 buckets).

2. Better Auth proxy controller (또는 Better Auth handler가 mount된 라우트)의 `/api/auth/sign-in/email` handler에 다음 decorator 적용:

   ```ts
   @Throttle({
     default: { limit: 0 },                              // disable default bucket
     'auth-strict': { limit: 5, ttl: seconds(60) },      // enforce strict bucket
   })
   ```

   `default` bucket을 `limit: 0`으로 disable 후 `auth-strict`만 enforce — `30/60s` default가 sign-in route에 적용되지 않도록.

3. **검증** (W2-6 verification gate에 fold-in):
   - **Better Auth 자체 `3/10s` short-window**: 4번째 sign-in within 10s → Better Auth가 직접 429 응답
   - **NestJS `auth-strict 5/60s` long-window**: 6번째 sign-in within 60s → NestJS ThrottlerGuard가 429 응답
   - twin-layer 동작 시 retry-after 헤더 충돌 발생하면 NestJS 측이 우선 (downstream에서 차단)

4. **W2-6 commit body**에 Q5 결정 인용 + auth-strict bucket 적용 명시.

---

## 9. Changelog

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| v0.2 | 2026-06-03 | **§8 Q1-Q8 사용자 결정 수렴 완료 (7 default + Q5 변경) — §8.1 Decisions sub-section 신설. Spec status PROPOSED → ACCEPTED.** Q1-Q4/Q6-Q8 모두 v0.1 default 채택 (보수적 + privacy-first); Q5만 변경 — `/api/auth/sign-in/email`에 NestJS-level strict throttle 추가 (named bucket `auth-strict` 5 req / 60s) → Better Auth 자체 `3/10s` short-window + NestJS `5/60s` long-window twin-layer defense-in-depth. §1.2 paste-ready throttler 코드는 v0.1 그대로 유지; Q5 fold-in은 W2-6 agent가 §8.1 결정 + plan §A.6 delegation prompt MUST DO 기준으로 적용 (auth-strict bucket 추가 + sign-in handler `@Throttle` decorator + retry-after twin-layer 검증). plan §A.6 (W2-6 delegation prompt) 작성 + W2-6 fire (Wave 4b) unlock. Closes backlog §3.6.1 acceptance criteria 일부 (spec v0.2 + status flip).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |     |
| v0.1 | 2026-06-03 | 초기 작성. 3 librarian research 종합 (bg_bb8d4d30 throttler + bg_e84d0eff helmet/pino + bg_2ef8a2b2 swagger). 작성 중 W2-5 `6451145` (Users + Companies + UserProfile/UserProfileUpdate/CompanyUpdate `.meta({id})`) closure 확인 → §0.4 schema inventory 9개 정식 명시, §4.6 verification 9 components 모두 assert, §6.2 pre-conditions 모두 ✅, backlog §3.4.1 (`test:e2e --runInBand`) + §3.4.4 (MIGRATION.md §8 ADR) 모두 closed (e47045c) 확인. §1 Throttler @nestjs/throttler@^6.5.0 + 30/60s MVP + 429 status + APP_GUARD + Better Auth 자체 limiter skip + HORIZONTAL_SCALE_TRIGGER + Redis migration via @nest-lab/throttler-storage-redis. §2 helmet@^8.2.0 + paste-ready config (CSP unsafe-inline for Swagger compat, HSTS prod-only preload=false, X-Frame SAMEORIGIN, CORP same-origin, COOP same-origin-allow-popups, COEP off) + main.ts ordering (useLogger → helmet → cookieParser → cors → Better Auth raw → parsers). §3 nestjs-pino@^4.6.1 + pino-pretty dev + JSON prod + validated incoming-trust X-Request-Id + PII redaction (auth/cookie/password/email/token) + autoLogging skip /health + /docs-json + Better Auth logger 별도 유지 (level=warn prod). §4 @nestjs/swagger@^11.4.4 + **CRITICAL**: `cleanupOpenApiDoc()` 필수 (W2-3 `.meta({id})` schemas → components.schemas 변환) + DocumentBuilder full config (3.1.0 + addCookieAuth `better-auth.session_token` + addBearerAuth future + 4 tags) + Better Auth `openAPI()` plugin via Scalar UI (proxy controller 금지) + production exposure dev/staging only. §5 Option C β cross-reference (Q8 Direct in MatchingModule, Wave 4a 별도 작업). §6 8-step sub-step proposal + single atomic commit recommendation + verification matrix. §7 References (handoff + plan + 3 librarian sources). §8 8 open questions (Q1-Q8) user decision needed. 본 spec은 documentation only — 실제 구현은 W2-5 closure 후 plan §A.6 delegation으로 진행. |
