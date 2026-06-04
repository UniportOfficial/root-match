# Rootmatching

> 뿌리산업 B2B 수주 매칭 플랫폼 — Next.js 15 + NestJS 11 모노레포

## 개요

- **프로젝트**: Rootmatching (`rootmatching`)
- **도메인**: 한국 뿌리산업(6대 공정) 발주처 ↔ 공장 매칭
- **팀**: 동국대 2026-1 기술창업캡스톤디자인 1 · 이용우 · 박세준 · 서동건 · 장준서

## 브랜치 현황

| 브랜치                         | 용도                                                 |
| ------------------------------ | ---------------------------------------------------- |
| **`dev-monorepo`**             | 🟢 활성 개발 — Phase 1.Week 1 완료 + Chunks 1~4 통합 |
| `main`                         | 팀의 Vue3 + Spring Boot (별도, PRD v0.4 협상 필요)   |
| `archive/vue3-phase0`          | Phase 0 Vue3 프로토타입 아카이브                     |
| `backup/dev-monorepo-20260602` | 2026-06-02 스냅샷                                    |

## 구조

```
rootmatching/
├── apps/
│   ├── web/                        # Next.js 15 + React 19 + Tailwind 3.4
│   │   └── src/
│   │       ├── app/
│   │       │   ├── page.tsx        # 랜딩
│   │       │   ├── layout.tsx      # Noto Sans KR + Korean locale
│   │       │   ├── (client)/       # 발주처 라우트 그룹
│   │       │   │   ├── quotes/             # 공개 견적 모집 게시판
│   │       │   │   ├── request/            # 새 견적 요청 (RHF + zod)
│   │       │   │   ├── matching/           # AI 매칭 결과
│   │       │   │   └── requests/[id]?/     # 내 요청 목록 + 상세
│   │       │   └── (common)/       # 공통 라우트 그룹
│   │       │       ├── transactions/[id]?/ # 거래 목록 + 진행
│   │       │       ├── disputes/[id]?/     # 분쟁 목록 + 상세
│   │       │       └── mypage/             # 프로필 편집
│   │       ├── components/ui/      # AppBadge 등
│   │       ├── data/               # mock data (Phase 1.Week 2에 Prisma seed로 이전)
│   │       └── lib/cn.ts           # clsx + tailwind-merge
│   └── api/                        # NestJS 11
│       └── src/
│           ├── app.module.ts       # MatchingModule 등록
│           ├── main.ts             # CORS + port 3001
│           └── matching/           # AI 매칭 모듈
│               ├── matching.controller.ts   # POST /matching/recommend
│               ├── matching.module.ts
│               ├── services/                # VectorSearch + AiMatching
│               └── fixtures/                # mock 공장 데이터
├── packages/
│   └── shared/                     # 공용 zod schemas + 도메인 타입
│       └── src/types/              #   matching, requests, transactions, disputes
└── .github/workflows/ci.yml
```

## 요구 환경

- **Node.js ≥ 22.13.0** (pnpm 11.3.0 요구사항)
- pnpm 11.3.0 (corepack으로 자동 활성화)

## 시작하기

```bash
# 1. Node 22 활성화 (nvm 사용 시)
nvm install 22 && nvm use 22

# 2. pnpm 활성화
corepack enable
corepack prepare pnpm@11.3.0 --activate

# 3. 의존성 설치
pnpm install

# 4. shared 패키지 빌드 (web/api가 의존)
pnpm --filter @rootmatching/shared run build

# 5. 환경변수 설정
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# OPENAI_API_KEY 채우기 (선택 — 미설정 시 dev/test에서는 mock 추천 자동 반환)

# 6. 개발 서버 (web :3000 + api :3001 병렬)
pnpm dev
```

### AI 매칭 mock fallback 정책

`POST /matching/recommend` 동작은 `OPENAI_API_KEY`와 `NODE_ENV`에 따라 분기됩니다.

| 환경       | `OPENAI_API_KEY` | `MATCHING_MOCK_FALLBACK` | 동작                                                     |
| ---------- | ---------------- | ------------------------ | -------------------------------------------------------- |
| dev/test   | 설정             | (무관)                   | 실제 OpenAI 호출 (text-embedding-3-small + GPT-4o)       |
| dev/test   | 미설정           | (무관)                   | **deterministic mock 추천 자동 반환** (Logger.warn 출력) |
| production | 설정             | (무관)                   | 실제 OpenAI 호출                                         |
| production | 미설정           | 미설정 또는 `false`      | **500 throw** (silent mock 금지)                         |
| production | 미설정           | `"true"`                 | mock 추천 반환 (명시적 opt-in)                           |

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

## 기술 스택

- **Frontend**: Next.js 15.5 (App Router) + React 19 + TypeScript 5.7 + Tailwind 3.4
  - 폼: React Hook Form + zod
  - 아이콘: Lucide React
  - 클래스 합성: clsx + tailwind-merge
- **Backend**: NestJS 11 + Prisma 6 (Phase 1.Week 2) + PostgreSQL (Neon) + Better Auth (Phase 1.Week 2)
- **AI**: OpenAI text-embedding-3-small + GPT-4o (apps/api/src/matching)
- **Shared**: zod schemas + 도메인 타입 (`@rootmatching/shared`)
- **Tooling**: pnpm workspaces · ESLint 9 (flat) · Prettier 3 · Husky 9 · lint-staged 15
- **Deploy**: Vercel (web) · Railway/Fly.io (api)

## 라우트

| URL                  | 페이지                             | 비고                                                        |
| -------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `/`                  | 랜딩                               |                                                             |
| `/quotes`            | 공개 견적 모집 게시판              | 공장이 발주처 요청을 본다                                   |
| `/request`           | 새 견적 요청 폼                    | 발주처. RHF + zod, 인라인 캘린더, 파일 업로드, AI 매칭 호출 |
| `/matching`          | AI 매칭 결과                       | 발주처. `/request` 결과를 sessionStorage로 받아 표시        |
| `/requests`          | 내 견적 요청 목록                  | 발주처                                                      |
| `/requests/[id]`     | 내 견적 요청 상세                  | 발주처                                                      |
| `/transactions`      | 거래 목록                          | 공통                                                        |
| `/transactions/[id]` | 거래 진행 (스텝퍼 + 타임라인)      | 공통                                                        |
| `/disputes`          | 분쟁 목록                          | 공통                                                        |
| `/disputes/[id]`     | 분쟁 상세 (스텝 + 타임라인 + 증빙) | 공통                                                        |
| `/mypage`            | 프로필 편집                        | 공통                                                        |

## API 엔드포인트

| 메서드 | 경로                  | 동작                                                                      |
| ------ | --------------------- | ------------------------------------------------------------------------- |
| GET    | `/health/db`          | DB + pgvector 상태 확인 (`{ db, vectorExtension, latencyMs, timestamp }`) |
| POST   | `/matching/recommend` | 발주 요청 → 벡터 검색 top-K → GPT-4o 추천 (key 미설정 시 mock fallback)   |

## 다음 작업 (Phase 1.Week 2)

1. Prisma 6 + Neon PostgreSQL 연결
2. Better Auth 통합 (`better-auth` + Prisma adapter, NestJS 안에 내장)
3. 비즈니스 모듈 (Users, Companies)
4. Mock fixtures → Prisma seed 마이그레이션
5. nestjs-zod DTO 검증
6. Swagger + ThrottlerGuard + helmet + nestjs-pino
7. E2E 테스트
