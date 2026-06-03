# Mock → Real User Data Migration Playbook

> **목적**: Phase 1.W1에서 도입된 mock 사용자를 W2-2 (Better Auth integration) 완료 후 real Better Auth User 레코드로 전환하는 가이드. dev/CI 환경 자동화, prod 마이그레이션 placeholder 명시.

| 항목         | 값                                                                                     |
| ------------ | -------------------------------------------------------------------------------------- |
| 작성일       | 2026-06-03                                                                             |
| W2-2 commit  | `f484ad5 feat(api,web): better auth 1.6 integration + cookie sync + remove mock auth`  |
| W2-2.5 출처  | `docs/specs/w2-2.5-followup-backlog.md` §3.1.1 (Tier 1 MUST)                           |
| Gap 출처     | plan v0.8 §A.2 [MUST NOT DO] `[Gap C — RESOLVED]` MIGRATION.md 분리 (W2-2 atomic 외부) |
| 적용 시점    | W2-4 (Prisma seed) — dev/CI ; Phase 6 베타 진입 전 — prod (placeholder)                |
| Related spec | `docs/specs/w2-2.5-followup-backlog.md`, plan §7.4 (W2-4 sub-steps)                    |

---

## 1. Mock 계정 인벤토리

Phase 1.W1 시점에 `apps/web/src/data/users.ts`에 하드코딩된 mock 사용자는 2개:

### 1.1 `mockCurrentUser` (client)

| 필드          | 값                                  |
| ------------- | ----------------------------------- |
| `id`          | `'user1'`                           |
| `email`       | `hong@techsolution.co.kr`           |
| `name`        | `홍길동`                            |
| `role`        | `admin`                             |
| `accountType` | `client`                            |
| `position`    | `사업개발팀장`                      |
| `phone`       | `010-1234-5678`                     |
| `company`     | `mockCompanies[0]` (defaultCompany) |

### 1.2 `mockFactoryUser` (factory)

| 필드          | 값                                  |
| ------------- | ----------------------------------- |
| `id`          | `'factory-user1'`                   |
| `email`       | `factory@example.kr`                |
| `name`        | `박공장`                            |
| `role`        | `admin`                             |
| `accountType` | `factory`                           |
| `position`    | `대표`                              |
| `phone`       | `010-2222-3333`                     |
| `company`     | `mockCompanies[0]` (defaultCompany) |

### 1.3 W2-2 이후 사용 상태

W2-2 (`f484ad5`)에서 다음과 같이 처리됨:

- **`apps/web/src/lib/auth-cookie.ts` 삭제**: `rm-auth` + `rm-role` cookie 기반 mock 인증 제거.
- **`UserContext` 리팩토링**: `authClient.useSession()` 구독으로 전환. `company` 필드는 `mockCompanies[0]` fallback 유지 (W2-5에서 real `/companies` API로 교체 예정 — `sessionUserToLocalUser` 함수의 inline comment에 명시됨).
- **`mockCurrentUser` / `mockFactoryUser`**: `apps/web/src/data/users.ts`에 유지. **현재 사용 곳 없음** (W2-2가 모든 consumer 제거). 다만 W2-4 seed에서 reference로 사용될 수 있음.

→ 이 시점 이후 mock 사용자는 **shape reference**로만 의미가 있음. 실제 인증 흐름은 Better Auth로 완전 이관됨.

---

## 2. dev/CI 마이그레이션 절차 (W2-4 seed.ts에서 적용)

W2-4 (Prisma seed, plan §7.4) 구현 시 다음 절차로 mock identities를 Better Auth User 레코드로 변환.

### 2.1 사용 API

Better Auth의 server-side signup API (`@better-auth/api` 또는 `auth.api.signUpEmail`):

```ts
// apps/api/prisma/seed.ts (W2-4 구현)
import { auth } from '../src/auth/auth.config';

await auth.api.signUpEmail({
  body: {
    email: 'hong@techsolution.co.kr',
    password: 'TempPass!2026', // §3 비밀번호 정책 참조
    name: '홍길동',
    accountType: 'client', // additionalFields per Q6
  },
});
// role: 'admin'은 signup 후 별도 update 필요 (Q6 RESOLVED: role.input: false; admin 권한은 server-managed)
```

### 2.2 Idempotency (W2-4 sub-step 5)

`prisma db seed`를 2회 이상 실행해도 중복 user 생성 금지:

```ts
// W2-4에서 구현
const existing = await prisma.user.findUnique({ where: { email: 'hong@techsolution.co.kr' } });
if (!existing) {
  await auth.api.signUpEmail({ body: { email: '...', password: 'TempPass!2026', ... } });
} else {
  // 비밀번호 verify가 필요하면 update를 통해 갱신; 단, Better Auth는 password update API 별도
  console.log('User exists, skipping');
}
```

Better Auth의 signup은 직접 password hash를 처리하므로 raw `prisma.user.create` 사용 금지 (hash 누락으로 signin 불가).

### 2.3 추가 권한 (`role: 'admin'`) 설정

`accountType`은 signup에서 직접 받지만, `role: 'admin'`은 plan §11 Q6 정책상 `role.input: false` (server-managed). seed 직후 raw Prisma update로 설정:

```ts
await prisma.user.update({
  where: { email: 'hong@techsolution.co.kr' },
  data: { role: 'admin' },
});
```

### 2.4 검증

W2-4 acceptance criteria 일부:

```bash
pnpm --filter @rootmatching/api exec prisma migrate reset
pnpm --filter @rootmatching/api db:seed
# 기대: 'hong@techsolution.co.kr', 'factory@example.kr' user 생성됨
# 기대: 2회 실행 시 중복 생성 0
pnpm --filter @rootmatching/api db:seed   # 2nd run
```

```ts
// auth signup으로 생성한 비밀번호가 정상 작동 확인
const response = await auth.api.signInEmail({
  body: { email: 'hong@techsolution.co.kr', password: 'TempPass!2026' },
});
// 기대: 200 + session token
```

---

## 3. 비밀번호 정책

### 3.1 dev/CI 환경

**고정값**: `TempPass!2026`

근거: plan §11 Q7 RESOLVED — `Fixed 'TempPass!2026' in dev/CI, document in seed.ts header; prod blocked until real signup flow`.

요구사항 (Better Auth 기본 password validator):

- 최소 8자 이상 ✅ (`TempPass!2026` = 13자)
- 영문 대소문자 포함 ✅
- 숫자 포함 ✅
- 특수문자 포함 ✅ (`!`)

→ 모든 dev/CI 사용자는 동일한 비밀번호로 로그인 가능. seed.ts header에 명시:

```ts
// apps/api/prisma/seed.ts (W2-4 구현 시 추가)
/**
 * Dev/CI seed users use fixed password `TempPass!2026` (plan §11 Q7 RESOLVED).
 * - Convenient for E2E test fixtures and manual dev workflow.
 * - DO NOT use in production; prod blocked until real signup flow per Q7.
 * - Playwright smoke (apps/web/tests/auth.spec.ts) hardcodes this password.
 */
```

### 3.2 Playwright + E2E 의존성

W2-2에서 이미 다음 위치들이 `TempPass!2026`를 hardcode:

- `apps/web/tests/auth.spec.ts` — Playwright signup smoke
- `apps/api/test/auth.e2e-spec.ts` — supertest signup case
- W2-2 commit body 검증 curl 예시

W2-4 seed가 이 비밀번호를 적용하면 신규 사용자 시나리오뿐 아니라 기존 사용자 로그인 시나리오도 E2E로 검증 가능.

### 3.3 Prod 환경

**금지**: prod에서 `TempPass!2026` 같은 알려진 비밀번호 사용 절대 금지.

Prod 시 사용자는 **반드시 직접 signup**을 통해 password를 등록 (Better Auth의 signup form `apps/web/src/app/login/page.tsx`).

운영자가 admin user를 미리 생성해야 하는 경우는 §4 절차를 따름.

---

## 4. Prod 마이그레이션 절차 (placeholder)

**현 시점: Not Applicable for Phase 1.W2.** Phase 6 베타 진입 전 본 섹션을 구체화.

### 4.1 적용 시점 (예정)

- **Phase 6 베타 직전**: 인천 남동 or 안산 시화 50공장 + 5발주처 온보딩 시.
- **Trigger**: 운영자가 50+5명의 사용자를 초대 + 초기 비밀번호 설정해야 할 시점.

### 4.2 후보 절차 (W2-2.5 시점에는 미확정)

선택지 (Phase 6 직전에 결정):

#### Option A: 사용자 self-signup + 운영자 검증

- 사용자가 직접 회원가입 (Better Auth signup form)
- 운영자가 dashboard에서 verification (`role`/`accountType` 부여, `User.emailVerified=true` 설정)
- 장점: 사용자가 직접 비밀번호 설정 → 보안 ↑
- 단점: 사용자 onboarding 마찰 ↑ (특히 시니어 사용자에게)

#### Option B: 운영자 admin-side bulk creation + 초대 링크

- 운영자가 dashboard에서 사용자 정보 입력 (email, name, accountType, company)
- 시스템이 1회용 reset 토큰 발행 (Better Auth `requestPasswordReset` API 활용)
- 토큰 URL을 SMS/이메일로 사용자에게 발송
- 사용자는 토큰 클릭 → 비밀번호 직접 설정
- 장점: 운영자 주도, 시니어 사용자 부담 적음
- 단점: 토큰 발송 채널 필요 (카카오 알림톡 = Phase 5; 그 전엔 SMS/이메일)

#### Option C: Hybrid

- 발주처: Option A (대표가 직접 가입 + 운영자 검증)
- 공장: Option B (운영자 콜드콜 후 초대 링크 발송)

### 4.3 데이터 마이그레이션 (없음)

Phase 1.W2.5 시점에는 prod DB가 아직 없음 (Neon `production` branch는 dev 용도). Phase 6 베타 시 신규 prod DB 생성 → 이전할 mock data 없음. 따라서 본 섹션은 **신규 사용자 등록 절차**에 집중, 데이터 이전 절차는 정의하지 않음.

만약 Phase 1.W2 ~ Phase 5에서 dev DB에 축적된 테스트 데이터가 있고 일부를 prod로 옮겨야 한다면, 별도 마이그레이션 스크립트 작성 필요 (현재 미정).

### 4.4 Phase 6 진입 시 작성 항목

본 §4를 구체화할 때 결정해야 할 사항:

- [ ] Option A/B/C 중 선택
- [ ] Option B 선택 시 토큰 발송 채널 (SMS/이메일/카카오 알림톡)
- [ ] 운영자 dashboard의 user invite UI 설계 (이미 plan §6.1.3에 admin 모듈로 명시)
- [ ] 초기 50공장+5발주처 데이터 시트 작성 (운영팀 협업)
- [ ] 비밀번호 정책 prod 강화 (최소 길이, complexity, 만료 정책)
- [ ] GDPR/개인정보보호법 compliance (사용자 동의, 데이터 보존 기간)

---

## 5. 관계 데이터 처리 순서

W2-4 seed가 관계 데이터를 idempotent하게 생성하려면 다음 의존 순서 준수:

### 5.1 의존 그래프

```text
User (Better Auth signup으로 생성)
  ↓ (User.id를 FK로 사용)
Profile (1:1, optional — phone/position 등 부가 정보)
  ↓
Company (User가 소속한 회사; client는 발주처 회사, factory는 공장)
  ↓ (Company.id를 FK로 사용)
FactoryEmbedding (Company가 factory인 경우만; vector(1536) nullable)
  ↓
QuoteRequest (client User가 작성한 발주 요청; Company FK)
  ↓
MatchRecommendation (QuoteRequest에 대한 AI 추천 결과)
```

### 5.2 seed.ts 절차 (W2-4 구현 가이드)

```ts
// 1. User (Better Auth signup API)
const hongUser = await ensureUser(
  'hong@techsolution.co.kr',
  '홍길동',
  'client',
);
const parkUser = await ensureUser('factory@example.kr', '박공장', 'factory');

// 2. role 설정 (Q6 server-managed)
await prisma.user.update({
  where: { id: hongUser.id },
  data: { role: 'admin' },
});
await prisma.user.update({
  where: { id: parkUser.id },
  data: { role: 'admin' },
});

// 3. Company (현재 mockCompanies[0]는 client + factory가 공유; real seed에서는 분리 필요)
const clientCompany = await ensureCompany('테크솔루션', 'client', {
  userId: hongUser.id,
});
const factoryCompany = await ensureCompany('박공장 가공소', 'factory', {
  userId: parkUser.id,
});

// 4. Profile (선택적, 1:1)
await ensureProfile(hongUser.id, {
  position: '사업개발팀장',
  phone: '010-1234-5678',
});
await ensureProfile(parkUser.id, { position: '대표', phone: '010-2222-3333' });

// 5. FactoryEmbedding (factory만; embedding은 nullable이므로 W2-4에서 NULL로 INSERT, 별도 phase에서 OpenAI embedding 생성)
await ensureFactoryEmbedding(factoryCompany.id, { embedding: null });

// 6. QuoteRequest + MatchRecommendation (mock data 9개 파일 → seed; W2-4 sub-steps 2-4)
// `apps/web/src/data/{factory-data,matching-results,...}.ts`에서 import → Prisma create
// (relation order: QuoteRequest를 먼저, 그 다음 MatchRecommendation)
```

### 5.3 Idempotency 헬퍼

```ts
async function ensureUser(
  email: string,
  name: string,
  accountType: 'client' | 'factory',
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const result = await auth.api.signUpEmail({
    body: { email, password: 'TempPass!2026', name, accountType },
  });
  return result.user;
}

async function ensureCompany(
  name: string,
  type: 'client' | 'factory',
  meta: { userId: string },
) {
  const existing = await prisma.company.findFirst({
    where: { name, userId: meta.userId },
  });
  if (existing) return existing;
  return prisma.company.create({ data: { name, type, userId: meta.userId } });
}
// ... 유사한 ensureProfile, ensureFactoryEmbedding
```

### 5.4 W2-4 → W2-5 phase-out

W2-5 (Users + Companies modules, plan §7.5) 완료 시:

- `apps/web/src/data/users.ts`의 `mockCurrentUser` / `mockFactoryUser` 제거 가능
- `UserContext`의 `mockCompanies[0]` fallback 제거 가능 (real `/companies` API 응답으로 교체)
- 본 MIGRATION.md §1의 "Mock 계정 인벤토리"는 historical reference로 보존

---

## 6. 검증 매트릭스

| 시점            | 검증 항목               | 명령/방법                                                                            | 기대 결과                                         |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| W2-4 commit 후  | `prisma db seed` (1회)  | `pnpm --filter @rootmatching/api db:seed`                                            | exit 0, 2명 user 생성                             |
| W2-4 commit 후  | `prisma db seed` (2회)  | 위 명령 다시 실행                                                                    | exit 0, 중복 0                                    |
| W2-4 commit 후  | seed user 로그인        | curl POST `/api/auth/sign-in/email` with `hong@techsolution.co.kr` + `TempPass!2026` | HTTP 200 + session cookie                         |
| W2-5 commit 후  | `/users/me`             | curl GET `/users/me` with session cookie                                             | 200 + `accountType: client` + company 정보        |
| W2-5 commit 후  | `/companies/:id`        | curl GET `/companies/<id>` with session cookie                                       | 200 + company 정보 (mockCompanies 의존 제거 확인) |
| Phase 6 진입 전 | 운영자 user invite flow | dashboard 통해 초대 → 사용자 비밀번호 설정 → 로그인                                  | Option A/B/C 중 선택된 절차 작동                  |

---

## 7. 변경 이력

| 버전 | 날짜       | 변경                                                                                                                                                                                                                                                                            |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026-06-03 | 초기 작성. W2-2 (`f484ad5`) 완료 시점 mock 계정 2개 인벤토리 + dev/CI signup 절차 + 비밀번호 정책 (TempPass!2026 per Q7) + prod placeholder (Phase 6 베타 진입 시 구체화) + W2-4 seed 관계 의존 순서. W2-2.5 backlog §3.1.1 (Tier 1 MUST) 적용. plan v0.8 §A.2 Gap C 후속 처리. |
