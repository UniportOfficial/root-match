# PrismaService Pattern Decision

> **결정**: Pattern (a) "accept dual-pool" 채택 (W2-2 commit `f484ad5`, 2026-06-03). Pattern (b) "composition refactor"는 trigger 조건 충족 시 진행하도록 deferred.

| 항목               | 값                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| 작성일             | 2026-06-03                                                                                     |
| W2-2 commit        | `f484ad5 feat(api,web): better auth 1.6 integration + cookie sync + remove mock auth`          |
| W2-2.5 출처        | `docs/specs/w2-2.5-followup-backlog.md` §3.1.2 (Tier 1 MUST)                                   |
| Related plan       | `.sisyphus/plans/phase-1-w2.md` v0.8 §11.1 Implementation Note 2 (Combined template line 1142) |
| Grep tag           | `HORIZONTAL_SCALE_TRIGGER` (refactor trigger point in `apps/api/src/prisma/prisma.service.ts`) |
| Estimated refactor | 1-2 engineer-day (Pattern a → b transition, W2-6 또는 Phase 2 traffic 시점)                    |

---

## 1. 현재 상태 — Pattern (a) accept dual-pool

### 1.1 구조

W2-2 (`f484ad5`) 이후 `apps/api/src/prisma/`에 두 개의 PrismaClient consumer가 존재:

```text
apps/api/src/prisma/
├── prisma.client.ts          (W2-2 신규)
│   └── export const prisma = new PrismaClient()   ← module-time singleton
│       (Better Auth의 prismaAdapter가 consume)
└── prisma.service.ts         (Pre-Flight aa99d30)
    └── export class PrismaService extends PrismaClient   ← NestJS DI
        (NestJS modules의 PrismaService injection)
```

### 1.2 Trade-off

**Pros**:

- **Pre-Flight scaffold 보존**: `aa99d30`에서 도입한 `PrismaService extends PrismaClient` 구조 그대로 유지 → 모든 기존 controller/service consumer 수정 불필요 (`apps/api/src/health/health.controller.ts`의 `this.prisma.$queryRaw` 등 그대로 작동)
- **Critical path 단축**: W2-2 5-7 engineer-day 작업 중 PrismaService refactor를 끼우지 않음으로 critical path 충돌 회피
- **롤백 안전성**: W2-2 atomic commit이 PrismaService를 건드리지 않아 revert risk 최소화

**Cons**:

- **이중 connection pool**: 같은 `DATABASE_URL`로 2개 PrismaClient instance가 각자 connection pool 유지 → 메모리 사용량 + 연결 수 marginal 증가
- **`prisma.client.ts` vs `PrismaService` 어느 쪽을 import 할지 모호성**: Better Auth (`auth.config.ts`)는 singleton 사용, NestJS modules는 service 사용 — 규칙 명문화 없으면 신규 코드에서 비일관 가능
- **트랜잭션 분리**: 두 PrismaClient 사이의 transaction 공유 불가 (각자 `$transaction` 별도 처리)

### 1.3 MVP-acceptable 근거

- **Neon pgbouncer ceiling**: 두 PrismaClient pool 모두 Neon의 pgbouncer pool을 거치므로 실제 backend connection 수는 pgbouncer ceiling으로 bound됨. PrismaClient pool은 각자 default 5-10 connections이지만 pgbouncer가 multiplexing → DB 입장에서 실제 동시 backend connection은 훨씬 적음.
- **현재 Phase 1.W2 트래픽**: dev environment + manual test + Playwright smoke = peak 0-5 RPS. Pool churn 측정 불가능 수준.
- **타임 박스**: 5-7 engineer-day W2-2 critical path를 1-2일 더 늘리지 않는 것이 우선 (Phase 1.W2 전체가 16-21 engineer-day인 상황).

### 1.4 컨센션 명문화 (현재 패턴)

신규 코드 작성 시:

| 사용처                       | Import 대상                                                                           | 이유                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Better Auth `auth.config.ts` | `import { prisma } from '../prisma/prisma.client'`                                    | Better Auth prismaAdapter는 module-time singleton 요구 |
| NestJS controller/service    | `constructor(private prisma: PrismaService)` (DI)                                     | NestJS lifecycle (onModuleInit, shutdown hooks) 활용   |
| Prisma raw script (seed)     | `import { prisma } from '../src/prisma/prisma.client'` 또는 직접 `new PrismaClient()` | seed는 NestJS context 밖이므로 singleton 권장          |
| Test (unit)                  | Mock 또는 dedicated `new PrismaClient()`                                              | DI test container의 PrismaService 또는 직접 mock       |

→ 규칙: **Better Auth = singleton, NestJS = service, script = singleton, test = mock**.

---

## 2. Pattern (b) — Composition refactor 절차

### 2.1 목표 구조

PrismaService를 inheritance에서 composition으로 변경:

```ts
// apps/api/src/prisma/prisma.service.ts (Pattern b 적용 후)
import { Injectable, Logger, OnModuleInit, INestApplication } from '@nestjs/common'
import { prisma } from './prisma.client' // 같은 singleton 공유
import type { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name)
  readonly client: PrismaClient = prisma // composition

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(/* ... */)
      }
      this.logger.warn('DATABASE_URL not set — Prisma offline mode.')
      return
    }
    await this.client.$connect()
    this.logger.log('Prisma connected')
  }

  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => {
      void app.close()
    })
  }

  async softHealthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}
```

### 2.2 마이그레이션 단계 (각 atomic commit)

#### Step 1 — PrismaService 자체 refactor

```ts
// 변경 전: extends PrismaClient
// 변경 후: implements OnModuleInit + readonly client: PrismaClient = prisma
```

이 단계만으로는 consumer 호출 사이트가 깨짐 (`this.prisma.$queryRaw` → `this.prisma.client.$queryRaw`).

#### Step 2 — Consumer 호출 사이트 일괄 갱신

영향받는 모든 callsite (현재 W2-2 시점 기준):

```ts
// apps/api/src/health/health.controller.ts:23,26
- this.prisma.$queryRaw`SELECT 1`
+ this.prisma.client.$queryRaw`SELECT 1`

- this.prisma.$queryRaw`SELECT extversion FROM pg_extension WHERE extname='vector'`
+ this.prisma.client.$queryRaw`SELECT extversion FROM pg_extension WHERE extname='vector'`

// health.controller.spec.ts mock도 갱신 필요
- mockResolvedValue(this.prisma.$queryRaw, ...)
+ mockResolvedValue(this.prisma.client.$queryRaw, ...)
```

**Wave 3+** 진입 후 추가될 callsite:

- W2-3 (nestjs-zod DTO): 거의 영향 없음 (DTO 자체는 Prisma 직접 의존 적음)
- W2-4 (seed): `prisma db seed` 외부 script이므로 PrismaService 사용 안 함 → 영향 없음
- W2-5 (Users + Companies modules): controller/service가 PrismaService DI 받음 → `this.prisma.user.findUnique()` → `this.prisma.client.user.findUnique()` 변경 필요

Wave 3 이후 callsite가 늘기 전에 Step 2를 일찍 처리하는 것이 비용 최소화.

#### Step 3 — Codemod 자동화 (선택적)

callsite 수가 많아지면 (W2-5 이후) ast-grep으로 자동 변환:

```bash
ast-grep --pattern 'this.prisma.$METHOD($$$ARGS)' \
  --rewrite 'this.prisma.client.$METHOD($$$ARGS)' \
  --lang ts \
  apps/api/src/
```

단, `this.prisma.client.client.$METHOD` 같은 중복 방지를 위한 검토 필수 (다중 적용 시 idempotent하게).

### 2.3 검증

- `pnpm -r typecheck` → 0 errors
- `pnpm --filter @rootmatching/api test` → 모든 unit pass (mock 갱신 필요)
- `pnpm --filter @rootmatching/api test:e2e` → 모든 e2e pass (`/health/db` 응답 동일)
- 메모리 측정 (선택): refactor 전후 `process.memoryUsage().heapUsed` 비교 → 약간의 감소 예상 (PrismaClient instance 1개 절약)

### 2.4 단일 atomic commit 권장

```
refactor(api): prisma-service composition (single shared PrismaClient instance)

W2-2.5 Pattern (b) trigger met — switching from inheritance to composition.
Before: PrismaService extends PrismaClient (2 instances at runtime).
After: PrismaService composes prisma singleton (1 instance shared with Better Auth).

Changes:
- apps/api/src/prisma/prisma.service.ts: composition pattern
- apps/api/src/health/health.controller.ts: this.prisma.$x → this.prisma.client.$x
- apps/api/src/health/health.controller.spec.ts: mock target updated
- (W2-5+ consumers): same pattern applied

Trigger: <cite specific condition from §3 below>
Doc: docs/specs/prisma-service-pattern.md §2
```

---

## 3. Refactor Trigger Conditions

다음 중 **하나라도 충족 시** Pattern (b) refactor 진행:

### 3.1 Phase transition triggers

- [ ] **W2-6 진입 시점** — Security hardening + Swagger + nestjs-pino. PrismaService instrumentation (request logging, query timing) 추가 시 dual-pool이 복잡도를 키움. W2-6 자체가 `HORIZONTAL_SCALE_TRIGGER` 관련 작업 (Throttler Redis migration 등)을 포함하므로 자연스러운 fold-in 후보.
- [ ] **Phase 2 진입 직전** — 추가 도메인 모듈 (Request, Quote 등) 도입 시 PrismaService consumer가 급증. callsite 갱신 비용이 작을 때 진행.
- [ ] **Multi-instance 배포** — Railway/Fly.io에서 API 인스턴스 2개 이상으로 scale-out 시. Connection pool 수가 2배가 되므로 single-instance 가정 깨짐.

### 3.2 Measurement-driven triggers

다음 중 하나가 측정되면:

- [ ] **Neon connection 사용량 50%+** — Neon free tier가 100 connections (실제로는 pgbouncer가 multiplexing하지만, peak connection 수가 신경 쓰이는 수준)
- [ ] **PrismaClient instance 메모리 30MB+** — `process.memoryUsage()` 측정 시 PrismaClient init footprint이 측정 가능한 크기.
- [ ] **Pool exhaustion 에러 로그** — `PrismaClientKnownRequestError: Connection pool timeout` 발생 (Phase 2 트래픽 시 가능성).
- [ ] **Transaction cross-boundary 요구** — Better Auth user record와 Domain entity (Company/Profile)를 single transaction에서 만들어야 하는 use case 등장 (현재 W2-4 seed에서도 그 정도 정합성은 unnecessary).

### 3.3 Code-quality triggers

- [ ] **import 패턴 비일관** — 신규 코드 작성 시 `prisma.client` vs `PrismaService` 선택 오류 PR review에서 반복 지적.
- [ ] **테스트 어려움** — Pattern (a)의 dual-PrismaClient가 test isolation을 어렵게 만드는 케이스 (1+ 발생 시).

### 3.4 Decision matrix

| 트리거 카테고리    | 1개 충족 | 2개 충족   | 3개 이상 충족 |
| ------------------ | -------- | ---------- | ------------- |
| Phase transition   | 권장     | 권장       | **반드시**    |
| Measurement-driven | 권장     | **반드시** | **반드시**    |
| Code-quality       | 검토     | 권장       | **반드시**    |

`반드시` 행이 되면 별도 sprint로 refactor 진행. `권장`은 다른 작업과 fold-in 가능 (예: W2-6 sub-track으로 추가).

---

## 4. 관련 grep tag

- `HORIZONTAL_SCALE_TRIGGER` — `apps/api/src/prisma/prisma.client.ts` (W2-2 추가) + `prisma.service.ts` (W2-2.5 추가)에 명시. refactor 진행 시 두 위치 모두 grep으로 확인.
- `MIGRATION.md` (apps/api/) — mock→real user 절차. Pattern refactor와 무관하나 W2-2.5 동시 작업.

---

## 5. 참고 문서

- `.sisyphus/plans/phase-1-w2.md` v0.8 §11.1 Implementation Note 2 (Pattern a/b 정의)
- `apps/api/src/prisma/prisma.client.ts` (Pattern (a) singleton; W2-2 신규)
- `apps/api/src/prisma/prisma.service.ts` (Pattern (a) inheritance; Pre-Flight + W2-2.5 header backfill)
- `docs/specs/w2-2.5-followup-backlog.md` §3.1.2 (본 backfill 작업 출처)
- `docs/handoffs/archive/2026-06-03-w2-1-complete-w2-2-ready.md` v1.1 (W2-2 컨텍스트)
- Prisma 공식: "Use a single PrismaClient instance" — https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prismaclient-in-long-running-applications

---

## 6. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                                                                              |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026-06-03 | 초기 작성. W2-2 (`f484ad5`) Pattern (a) 선택 backfill. §1 현재 trade-off + 컨센션 명문화 + §2 Pattern (b) refactor 3-step 절차 + ast-grep codemod 예시 + §3 trigger conditions 3 카테고리 + decision matrix + §4 grep tag + §5 참고 문서. W2-2.5 backlog §3.1.2 (Tier 1 MUST) 완료. plan §11.1 Note 2의 deferred 의사결정 문서화. |
