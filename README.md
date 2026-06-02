# Rootmatching

> 뿌리산업 B2B 수주 매칭 플랫폼 — Next.js + NestJS 모노레포

## 개요

- **프로젝트**: Rootmatching (`rootmatching`)
- **도메인**: 한국 뿌리산업(6대 공정) 발주처 ↔ 공장 매칭
- **팀**: 동국대 2026-1 기술창업캡스톤디자인 1 · 이용우 · 박세준 · 서동건 · 장준서
- **PRD**: [`docs/prd/rootmatching-prd.md`](./docs/prd/rootmatching-prd.md) (v0.4)
- **디자인 시스템**: [`docs/design-system.md`](./docs/design-system.md)

## 브랜치 현황 (2026-06-02)

| 브랜치 | 용도 |
|---|---|
| **`trial/merge-main-into-monorepo`** | 🔧 **현재 브랜치** — upstream/main과의 통합 진행 중 (Chunk 1 완료: Spring 폐기 + AI 매칭 NestJS 이식) |
| `dev-monorepo` | Phase 1.Week 1 모노레포 정식 (verification 통과 후 trial로 fast-forward 예정) |
| `main` | 팀의 Vue3 + Spring Boot (별도 진행 중, PRD v0.4 협상 필요) |
| `archive/vue3-phase0` | Phase 0 Vue3 프로토타입 아카이브 |
| `backup/dev-monorepo-20260602` | 2026-06-02 스냅샷 |

자세한 분기 배경: [`docs/handoffs/2026-06-02-upstream-divergence-trial-merge.md`](./docs/handoffs/2026-06-02-upstream-divergence-trial-merge.md)

## 구조

```
rootmatching/
├── apps/
│   ├── web/        # Next.js 15 (App Router, React 19) + Tailwind
│   └── api/        # NestJS 11
│       └── src/
│           ├── app.module.ts
│           └── matching/        # 🆕 AI 매칭 모듈 (upstream PR #1에서 이식)
│               ├── services/    #   VectorSearchService + AiMatchingService
│               └── fixtures/    #   Phase 1.Week 2에서 Prisma seed로 이전
├── packages/
│   └── shared/     # zod schemas + 도메인 타입 (FactoryRecommendation 등)
├── docs/
│   ├── prd/        # PRD v0.4 (Better Auth + Prisma + Neon)
│   ├── handoffs/   # 세션 인계 문서
│   └── design-system.md
└── .github/workflows/ci.yml
```

## 요구 환경

- **Node.js ≥ 22.13.0** (pnpm 11.3.0 요구사항)
- pnpm 11.3.0 (corepack으로 자동 활성화)

## 시작하기

```bash
# 1. Node 22 활성화 (nvm 사용 시)
nvm install 22
nvm use 22

# 2. pnpm 활성화
corepack enable
corepack prepare pnpm@11.3.0 --activate

# 3. 의존성 설치
pnpm install

# 4. shared 패키지 빌드
pnpm --filter @rootmatching/shared run build

# 5. 환경변수 설정
cp apps/api/.env.example apps/api/.env
# OPENAI_API_KEY 채우기

# 6. 개발 서버 (web + api 병렬)
pnpm dev
```

## 워크스페이스 명령

| 명령 | 동작 |
|---|---|
| `pnpm dev` | apps/web + apps/api 병렬 개발 서버 |
| `pnpm build` | 모든 워크스페이스 빌드 |
| `pnpm typecheck` | TypeScript 타입 체크 |
| `pnpm lint` | 루트 ESLint 9 flat config 검사 |
| `pnpm lint:fix` | ESLint 자동 수정 |
| `pnpm format` | Prettier 적용 |
| `pnpm format:check` | Prettier 검증 (CI용) |
| `pnpm test` | 단위 테스트 |

## 기술 스택

- **Frontend**: Next.js 15.5 (App Router) + React 19 + TypeScript 5.7 + Tailwind 3.4
- **Backend**: NestJS 11 + Prisma 6 (예정) + PostgreSQL (Neon) + Better Auth (예정)
- **AI**: OpenAI text-embedding-3-small + GPT-4o (apps/api/src/matching)
- **Shared**: zod schemas + 도메인 타입 (`@rootmatching/shared`)
- **Tooling**: pnpm workspaces · ESLint 9 (flat) · Prettier 3 · Husky 9 · lint-staged 15
- **Deploy**: Vercel (web) · Railway/Fly.io (api)
