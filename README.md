# Rootmatching

> 뿌리산업 B2B 수주 매칭 플랫폼 — Next.js + NestJS 모노레포

## 개요

- **프로젝트**: Rootmatching (`rootmatching`)
- **도메인**: 한국 뿌리산업(6대 공정) 발주처 ↔ 공장 매칭
- **팀**: 동국대 2026-1 기술창업캡스톤디자인 1 · 이용우 · 박세준 · 서동건 · 장준서
- **PRD**: [`docs/prd/rootmatching-prd.md`](./docs/prd/rootmatching-prd.md)
- **디자인 시스템**: [`docs/design-system.md`](./docs/design-system.md)

## 구조

```
rootmatching/
├── apps/
│   ├── web/        # Next.js 15 (App Router, React 19) + Tailwind
│   └── api/        # NestJS 11 + Prisma 6 + PostgreSQL
├── packages/
│   └── shared/     # 공용 zod schema, 도메인 타입, 6대 공정 enum
├── docs/
│   ├── prd/        # 제품 요구사항 문서
│   └── design-system.md
└── .github/workflows/ci.yml
```

## 요구 환경

- Node.js >= 20.10.0
- pnpm >= 9.0.0 (corepack으로 자동 활성화)

## 시작하기

```bash
# 1. pnpm 활성화 (한 번만)
corepack enable
corepack prepare pnpm@11.3.0 --activate

# 2. 의존성 설치
pnpm install

# 3. shared 패키지 빌드 (web/api가 의존)
pnpm --filter @rootmatching/shared run build

# 4. 개발 서버 (web + api 병렬)
pnpm dev
```

## 워크스페이스 명령

| 명령                | 동작                               |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | apps/web + apps/api 병렬 개발 서버 |
| `pnpm build`        | 모든 워크스페이스 빌드             |
| `pnpm typecheck`    | TypeScript 타입 체크               |
| `pnpm lint`         | 루트 ESLint 9 flat config 검사     |
| `pnpm lint:fix`     | ESLint 자동 수정                   |
| `pnpm format`       | Prettier 적용                      |
| `pnpm format:check` | Prettier 검증 (CI용)               |
| `pnpm test`         | 단위 테스트                        |

워크스페이스별 명령:

```bash
pnpm --filter @rootmatching/web dev
pnpm --filter @rootmatching/api start:dev
pnpm --filter @rootmatching/shared build
```

## 브랜치 정책

- `main` — production 기준 (현재 비활성)
- `dev` — 활성 개발 브랜치 (현재 Phase 1 모노레포 셋업)
- `dev-vue3-prototype` — Phase 0 Vue 3 프로토타입 아카이브 (참조 전용)

## 기술 스택

- **Frontend**: Next.js 15.5 (App Router) + React 19 + TypeScript 5.7 + Tailwind 3.4
- **Backend**: NestJS 11 + Prisma 6 + PostgreSQL (Neon) + JWT
- **Shared**: zod schemas (`@rootmatching/shared`)
- **Tooling**: pnpm workspaces · ESLint 9 (flat) · Prettier 3 · Husky 9 · lint-staged 15
- **Deploy**: Vercel (web) · Railway/Fly.io (api)
