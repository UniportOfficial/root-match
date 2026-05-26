# Session Handoff — 2026-05-26 (Phase 1.Week 1 완료 / Week 2 대기)

다음 세션이 컨텍스트 없이 이어받을 수 있도록 정리한 문서. **Phase 1.Week 1 (모노레포 + 도구 인프라) 100% 완료**, Week 2 (백엔드 기반) 시작 대기.

## Quick Reference (요약)

```
저장소: /Users/b_oxygen/dev/DGU-Technology-start-up-capstone
현재 브랜치: dev (commit a18819e)
직전 브랜치: dev-vue3-prototype (commit a500cbf, Phase 0 보존)
스택: Next.js 15.5.18 + NestJS 11.0.21 + pnpm 11.3.0 workspaces

활성 워크스페이스:
  rootmatching@0.1.0                (루트)
  @rootmatching/web@0.1.0           apps/web/  (Next.js)
  @rootmatching/api@0.0.1           apps/api/  (NestJS)
  @rootmatching/shared@0.0.0        packages/shared/  (zod schemas)

PRD: docs/prd/rootmatching-prd.md (v0.3)
다음 작업: Phase 1.Week 2 — 백엔드 기반 (Prisma + Neon + JWT + bcrypt)
```

---

## 세션 목표 (완료)

PRD v0.3 §13에 정의된 Phase 1.Week 1을 ULTRAWORK 모드로 진행:

1. ✅ Vue 3 Phase 0 코드 보존 (dev → dev-vue3-prototype rename)
2. ✅ 새 dev 브랜치에서 Vue/Vite 잔재 제거 + 모노레포 시작
3. ✅ apps/web (Next.js 15) + apps/api (NestJS 11) + packages/shared init
4. ✅ 루트 도구 인프라: ESLint 9 flat + Prettier 3 + tsconfig.base + Husky 9 + lint-staged 15 + GitHub Actions

---

## 완료된 작업 상세

### ① 브랜치 전략

| 브랜치               | commit                        | 상태                                                          |
| -------------------- | ----------------------------- | ------------------------------------------------------------- |
| `dev`                | `a18819e`                     | **현재 활성**. Phase 1.Week 1 완료. Next.js + NestJS 모노레포 |
| `dev-vue3-prototype` | `a500cbf`                     | Phase 0 Vue 3 + Pinia 프로토타입 보존. main 미반영. 참조 전용 |
| `main`               | `465e8ff fix: login solution` | 이전 상태 그대로 (v0 잔재 포함, 손대지 않음)                  |

```bash
# Vue 3 프로토타입 확인 시
git checkout dev-vue3-prototype
# (현재 위치로 복귀)
git checkout dev
```

### ② Phase 0 cleanup (dev에서 삭제)

- `src/` (Vue 3 코드 전체)
- `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- `tsconfig.json`, `tsconfig.node.json` → `tsconfig.base.json`으로 재작성
- `next-env.d.ts` (v0/Next.js 잔재)
- `pnpm-lock.yaml` (재생성)
- `dist/`, `node_modules/` (재설치)
- `eslint.config.js` (Vue 의존 → React+Node로 재작성)
- `public/` 내 v0 placeholder (apple-icon 등은 apps/web/public으로 이동)

### ③ 모노레포 골격

```
rootmatching/
├── apps/
│   ├── web/              # @rootmatching/web (Next.js 15.5.18)
│   │   ├── src/app/      # App Router (layout.tsx, page.tsx, globals.css)
│   │   ├── public/       # apple-icon, icon-{light,dark}-32x32, icon.svg + Next 기본
│   │   ├── next.config.ts        # transpilePackages: ['@rootmatching/shared']
│   │   ├── eslint.config.mjs     # 루트 config re-export
│   │   ├── tsconfig.json         # extends ../../tsconfig.base.json
│   │   └── package.json
│   └── api/              # @rootmatching/api (NestJS 11.0.21 standard mode)
│       ├── src/          # app.module, app.controller, app.service, main
│       ├── test/         # jest-e2e + app.e2e-spec
│       ├── nest-cli.json
│       ├── tsconfig.json         # extends base + NodeNext module + decorators
│       ├── tsconfig.build.json
│       └── package.json
├── packages/
│   └── shared/           # @rootmatching/shared (zod schemas + 도메인 상수)
│       └── src/
│           ├── schemas/user.ts   # UserRoleSchema, LoginSchema, RegisterSchema
│           ├── constants/processes.ts  # 6대 공정 enum + 한국어 라벨
│           ├── schemas/index.ts
│           ├── constants/index.ts
│           └── index.ts
├── docs/
│   ├── prd/              # PRD v0.3 + 버전 관리 정책
│   │   ├── rootmatching-prd.md
│   │   └── README.md
│   ├── handoffs/         # 본 문서 위치
│   └── design-system.md  # Toss-style 토큰 (Phase 0에서 이식 대기)
├── .husky/
│   └── pre-commit        # pnpm lint-staged
├── .github/workflows/
│   └── ci.yml            # matrix: lint, format:check, typecheck, build
├── eslint.config.mjs     # flat config (React + Node + shared 분기)
├── tsconfig.base.json    # strict + noUncheckedIndexedAccess + noImplicitOverride + decorators
├── pnpm-workspace.yaml   # packages + verifyDepsBeforeRun + onlyBuiltDependencies
├── package.json          # rootmatching @ pnpm@11.3.0
├── .prettierrc.json      # semi:false, singleQuote, trailingComma:all, printWidth:100
├── .prettierignore
├── .gitignore            # Next.js + monorepo 표준 (.next, .turbo, .vercel 등)
└── README.md             # 모노레포 안내
```

### ④ 의존성 (commit 시점)

#### 루트 devDependencies

| 패키지                    | 버전     |
| ------------------------- | -------- |
| typescript                | ^5.7.3   |
| eslint                    | ^9.39.4  |
| typescript-eslint         | ^8.60.0  |
| @eslint/js                | ^9.39.4  |
| eslint-plugin-react       | ^7.37.4  |
| eslint-plugin-react-hooks | ^5.1.0   |
| @next/eslint-plugin-next  | ^15.5.18 |
| eslint-config-prettier    | ^10.1.8  |
| globals                   | ^15.14.0 |
| prettier                  | ^3.8.3   |
| husky                     | ^9.1.7   |
| lint-staged               | ^15.5.2  |
| @types/node               | ^22.10.5 |

#### @rootmatching/web

- next 15.5.18, react 19.1.0, react-dom 19.1.0
- @rootmatching/shared: workspace:\*
- (devDeps) typescript, eslint, eslint-config-next 15.5.18, @types/\*

#### @rootmatching/api

- @nestjs/common, @nestjs/core, @nestjs/platform-express ^11.0.1
- @rootmatching/shared: workspace:\*
- reflect-metadata ^0.2.2, rxjs ^7.8.1
- (devDeps) jest 30, ts-jest, supertest 7, ts-loader, ts-node, etc.

#### @rootmatching/shared

- zod ^3.25.76
- typescript ^5.7.3

설치된 총 패키지: **493개** (4 workspaces 합산)

### ⑤ 검증 결과 (commit 시점)

| 검증              | 명령                                         | 결과                                         |
| ----------------- | -------------------------------------------- | -------------------------------------------- |
| Type check        | `pnpm -r run typecheck`                      | ✅ EXIT 0 (shared / web / api 모두 통과)     |
| Lint              | `pnpm exec eslint .`                         | ✅ EXIT 0 (warning만, error 없음)            |
| Format            | `pnpm exec prettier --check .`               | ✅ All files compliant                       |
| Web build         | `pnpm --filter @rootmatching/web run build`  | ✅ EXIT 0 (Turbopack 1273ms, 5 static pages) |
| API build         | `pnpm --filter @rootmatching/api run build`  | ✅ EXIT 0 (apps/api/dist 생성)               |
| Workspace install | `corepack pnpm install --no-frozen-lockfile` | ✅ EXIT 0                                    |

---

## 다음 세션 시작 방법 (Phase 1.Week 2)

### 0. 환경 확인 (한 번만)

```bash
cd /Users/b_oxygen/dev/DGU-Technology-start-up-capstone
git checkout dev
git log --oneline -3
# → a18819e Phase 1.Week 1 셋업
# → a500cbf Phase 0 + PRD v0.3
# → 465e8ff (main 기준 옛 commit)

# pnpm 활성화 (필요 시)
corepack enable
corepack prepare pnpm@11.3.0 --activate

# 의존성 확인 (이미 설치되어 있을 가능성 큼)
corepack pnpm install --no-frozen-lockfile
```

### 1. 즉시 실행 가능한 검증 명령

```bash
# Type check (3 workspaces 일괄)
corepack pnpm -r run typecheck

# Lint (루트 단일 ESLint flat config)
./node_modules/.bin/eslint .

# Format check
./node_modules/.bin/prettier --check .

# Build 일괄
corepack pnpm -r run build

# 개발 서버 (web + api 병렬)
corepack pnpm run dev
# 또는 개별:
corepack pnpm --filter @rootmatching/web dev     # http://localhost:3000
corepack pnpm --filter @rootmatching/api start:dev  # http://localhost:3000 (port conflict 주의)
```

### 2. Phase 1.Week 2 작업 항목 (PRD v0.4 §13)

**목표: apps/api에 Better Auth 기반 인증 + Prisma + Neon이 동작하는 백엔드 기반 구축**

> ⚠️ **v0.4에서 인증 전략 변경**: ~~자체 JWT (passport-jwt + bcrypt)~~ → **Better Auth 자체 호스팅** (`better-auth` + Prisma adapter, NestJS 안에 내장). 소셜 로그인 빌트인 + Vendor lock-in 0 + 세션·CSRF·rate limiting을 Better Auth가 처리.

1. **Prisma 6 + Neon PostgreSQL 연결**

   ```bash
   corepack pnpm --filter @rootmatching/api add @prisma/client@^6.19.2
   corepack pnpm --filter @rootmatching/api add -D prisma@^6.19.2
   ```

   - `apps/api/prisma/schema.prisma` 생성
   - **Better Auth 표준 테이블**: `User`, `Session`, `Account`, `Verification` (Better Auth CLI `npx @better-auth/cli generate` 로 자동 생성)
   - **비즈니스 도메인 테이블**: `Company` (1:1 with User), `Profile`, 추후 `Request` / `Quote` 등
   - `User.role` Prisma enum: `CLIENT | FACTORY | OPERATOR` — Better Auth `additionalFields`로 확장
   - `.env`에 `DATABASE_URL` (Neon connection string) + `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`
   - `apps/api/src/prisma/{prisma.module.ts, prisma.service.ts}` 생성

2. **Better Auth 통합** (PRD v0.4의 핵심 변경)

   ```bash
   corepack pnpm --filter @rootmatching/api add better-auth
   ```

   - `apps/api/src/auth/better-auth.config.ts`: Better Auth instance + Prisma adapter
     - `emailAndPassword: { enabled: true }`
     - 세션 7일 + httpOnly + SameSite=Strict + Secure(prod)
     - `additionalFields`: `role`, `companyName`, `phone`, `agreeTerms`
   - `apps/api/src/auth/auth.controller.ts`: Better Auth handler를 NestJS controller에 mount (`/api/auth/*` catch-all)
   - `apps/api/src/auth/guards/better-auth.guard.ts`: session 검증 + `req.user` 주입
   - `apps/api/src/auth/decorators/roles.decorator.ts` + `RolesGuard`: 운영자 권한 분리
   - `apps/api/src/auth/auth.module.ts`: 위 컴포넌트 묶음

   > ❌ 사용 안 함: `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`, `bcrypt` — Better Auth가 모두 내장 처리

3. **DTO 검증 (`nestjs-zod`)**

   ```bash
   corepack pnpm --filter @rootmatching/api add nestjs-zod
   ```

   - 인증 외 DTO에 사용 (Request, Quote 등 Phase 2+)
   - 회원가입 추가 필드 검증은 `@rootmatching/shared`의 `RegisterSchema`를 Better Auth `onAfterUser` hook에서 zod 적용

4. **Users / Companies 비즈니스 모듈**
   - `apps/api/src/users/users.{module,service,controller}.ts` — 프로필 조회/수정
   - `apps/api/src/companies/...` — 회사 정보 CRUD
   - 모두 `BetterAuthGuard`로 보호

5. **Swagger OpenAPI**

   ```bash
   corepack pnpm --filter @rootmatching/api add @nestjs/swagger
   ```

   - `main.ts`에 `SwaggerModule.setup('api/docs', ...)`
   - DocumentBuilder cookie security 등록 (Better Auth 세션 쿠키 명시)

6. **보안 + 운영성**

   ```bash
   corepack pnpm --filter @rootmatching/api add \
     @nestjs/throttler helmet nestjs-pino pino pino-http cookie-parser
   corepack pnpm --filter @rootmatching/api add -D pino-pretty @types/cookie-parser
   ```

   - ThrottlerGuard 전역 (분당 100회) + 로그인 분당 5회 별도 제한
   - helmet middleware (CSP는 Better Auth와 충돌 없게 조정)
   - nestjs-pino logger (JSON 구조)
   - cookie-parser 등록 (Better Auth 세션 쿠키 파싱)

7. **E2E 테스트 (Supertest)**
   - `apps/api/test/auth.e2e-spec.ts`:
     - `POST /api/auth/sign-up/email` → 201 + session cookie 발급
     - `POST /api/auth/sign-in/email` → 200 + session cookie
     - `GET /me` (BetterAuthGuard 적용) → 200 + user 정보
     - `POST /api/auth/sign-out` → 200 + 세션 무효화
   - `corepack pnpm --filter @rootmatching/api run test:e2e` 통과

8. **Railway 또는 Fly.io 데모 배포** (Week 4로 연기 권장 — 사용자 결정)

---

## 알려진 이슈 / 결정 필요 사항

### 무해한 warning (현 시점 무시 가능)

1. **`pnpm-workspace.yaml`의 `onlyBuiltDependencies` 적용 안 됨**
   - pnpm 11.3.0이 `package.json`의 `pnpm` field를 무시한다는 경고가 표시됨
   - 실제 build script 차단 항목: sharp@0.34.5 (Next.js 이미지 최적화), unrs-resolver@1.12.2 (ESLint), @nestjs/core@11.1.24
   - **현재 영향 없음**: typecheck / lint / build 모두 통과
   - sharp는 production에서 next/image 최적화에 사용되므로 Phase 1.Week 4 배포 단계에서 처리 필요
   - 해결 후보: `pnpm-workspace.yaml`의 onlyBuiltDependencies 위치를 다시 검토하거나, `pnpm approve-builds` 인터랙티브 1회 실행

2. **Next.js plugin warning (`Pages directory cannot be found`)**
   - ESLint가 `pages/` 또는 `src/pages/`를 찾는데 App Router라 없음
   - 무해. App Router 자체 룰은 자동 적용됨
   - 해결 후보: `eslint.config.mjs`의 next-plugin 룰 중 `@next/next/no-html-link-for-pages`만 off

3. **`apps/web/eslint.config.mjs`는 루트 config re-export stub**
   - Next.js build 내장 lint가 자체 ESLint config 검색하므로 stub 제공
   - 내용: `export { default } from '../../eslint.config.mjs'`
   - 단일 진실원 (루트) 유지 + Next.js 호환

### 결정 필요 (Phase 1.Week 2/3/4에서)

| 항목              | 옵션                                                           | 결정 시점                               |
| ----------------- | -------------------------------------------------------------- | --------------------------------------- |
| Tailwind 버전     | **3.4.19** (Toss 토큰 이식 위해 권장) vs 4.x (CSS-first)       | Week 3 (apps/web Tailwind 수동 설치 시) |
| Server State      | TanStack Query 5 vs **Server Components 위주** (외부 의존성 ↓) | Week 3                                  |
| Turborepo 도입    | 안 함 (3 workspaces라 불필요) vs 도입                          | Week 4 (CI 가속 필요 시)                |
| 운영자 Admin 위치 | **`apps/web/app/(admin)/*` 보호 segment** vs 별도 sub-app      | Phase 5                                 |

### 결정됨 (PRD v0.4 — 2026-05-26 세션)

| 항목              | 결정                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| 인증 라이브러리   | **Better Auth 자체 호스팅** (자체 JWT / Next-Auth 후보 모두 폐기)      |
| 데이터베이스      | **Neon (PostgreSQL serverless)** — 신규 프로젝트, Neon Auth는 비활성화 |
| 세션 / refresh    | **Better Auth Session 7일 (DB 저장)** — rotation + 즉시 revoke 가능    |
| Railway 데모 배포 | Week 4로 연기 (이번 세션 제외)                                         |

### 외부 작업 (사용자가 직접 처리)

1. **Neon 프로젝트 생성**: https://console.neon.tech → PostgreSQL 16 instance → connection string 확보
   - **Neon Auth는 비활성화** (Better Auth를 NestJS 안에 자체 호스팅하므로 불필요)
   - Region 권장: AWS ap-northeast-2 (Seoul) 또는 ap-northeast-1 (Tokyo)
2. **`.env` 환경변수** (apps/api/.env, 다음 세션에서 작성):
   - `DATABASE_URL` (Neon에서 받은 connection string)
   - `BETTER_AUTH_SECRET` (`openssl rand -base64 32`로 생성)
   - `BETTER_AUTH_URL` (개발: `http://localhost:3001`, 운영: 배포 도메인)
3. **Vercel 프로젝트 연동**: `vercel link` → apps/web 디렉토리 지정 → 환경변수 등록
4. **Railway/Fly.io 프로젝트 생성**: apps/api 배포용 (Phase 1.Week 4)
5. **GitHub repo 권한**: dev/main 브랜치 보호 룰 (선택)

---

## Phase 0 자산 이식 매핑 (Week 3 작업 예고)

PRD §16.1에 명시. Phase 0의 검증된 자산을 새 스택으로 옮길 때 참고:

| Phase 0 자산                              | Phase 1 위치 / 방식                                              |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `docs/design-system.md` (Toss-style 토큰) | apps/web/tailwind.config.ts의 theme.extend에 1:1 이식            |
| 21개 라우트 UI 흐름                       | apps/web/src/app/\*\*의 route group으로 재설계 시 참조           |
| AuthModal 폼 검증 (vee-validate + zod)    | React Hook Form + `@hookform/resolvers/zod` + 동일 schema 재사용 |
| 인증 라우터 가드 (`meta.public`)          | apps/web/src/middleware.ts matcher                               |
| Pinia persistence 패턴                    | httpOnly refresh cookie + DB session (백엔드 주도)               |
| LoginResult discriminated union           | shared 패키지에 보존 가치 있음 (이번 시점에는 미반영)            |
| dev-vue3-prototype의 mock data            | apps/api Prisma seed로 재구성 (Phase 1.Week 2~3)                 |

브랜치 비교 시:

```bash
git diff dev-vue3-prototype..dev -- docs/
git show dev-vue3-prototype:docs/design-system.md
```

---

## 환경 정보

```
OS: macOS (darwin)
Node: v22.22.3 (nvm)
pnpm: 11.3.0 (corepack 활성)
Git user: B-oxygen <113986828+B-oxygen@users.noreply.github.com>
저장소: /Users/b_oxygen/dev/DGU-Technology-start-up-capstone
.git remote: origin (확인 안 했음, GitHub일 가능성)
```

### pnpm 11 주의사항

- `package.json`의 `pnpm.onlyBuiltDependencies` field는 pnpm 11에서 무시됨 → `pnpm-workspace.yaml`에 작성
- `pnpm-workspace.yaml`의 `verifyDepsBeforeRun: never`로 명령 실행 전 deps 재확인 비활성화 (현재 적용됨)
- 빌드 hooks (sharp, @nestjs/core 등)는 `onlyBuiltDependencies` 명시 필요

### Commit 메시지 컨벤션

기존 repo 스타일:

- `feat: ...` (한국어 또는 영어 본문)
- `fix: ...` (예: `fix: login solution`, `fix: 화면 깨짐`)
- 다단 commit 메시지 OK (Conventional Commits 느슨하게 따름)

---

## 참고 문서 (이 핸드오프 외)

| 파일                            | 역할                                                          |
| ------------------------------- | ------------------------------------------------------------- |
| `docs/prd/rootmatching-prd.md`  | **PRD v0.3** — 전체 제품 요구사항. §13 로드맵 기준 작업 진행  |
| `docs/prd/README.md`            | PRD 버전 관리 정책                                            |
| `docs/design-system.md`         | Toss-style 디자인 토큰 (Week 3에 Tailwind로 이식)             |
| `README.md`                     | 모노레포 사용 안내                                            |
| `rootmatching-deck v1.7` (외부) | 발표 덱 본문 24장 + Appendix 10장 (비즈니스 메시지 검증 완료) |

---

## 변경 이력 (이 핸드오프 문서)

| 버전 | 날짜       | 변경                                                                                                 |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-05-26 | Phase 1.Week 1 완료 + Week 2 시작 가이드 정리                                                        |
| v1.1 | 2026-05-26 | PRD v0.4 인증 전략 확정(Better Auth 자체 호스팅) 반영. Week 2 가이드 재작성 + 결정됨/외부 작업 갱신. |
