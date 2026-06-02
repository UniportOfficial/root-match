# Rootmatching — `trial/merge-main-into-monorepo`

> ⚠️ **이 브랜치는 빌드되지 않습니다.** Trial merge 결과를 시각화하기 위한 임시 브랜치입니다.

## 무엇을 머지했나

- **base**: `dev-monorepo` (`aa8eac8`) — Next.js 15 + NestJS 11 + Better Auth + Prisma + Neon 모노레포 (PRD v0.4)
- **merged**: `origin/main` (`603a0b0`) — Vue 3 SPA (frontend/) + Spring Boot 4.0.6 (backend/)

상세 분석은 [`docs/handoffs/2026-06-02-upstream-divergence-trial-merge.md`](./docs/handoffs/2026-06-02-upstream-divergence-trial-merge.md) 참고.

## 머지 결과 디렉토리

```
.
├── apps/                       # 우리 작업 (정식, dev-monorepo)
│   ├── web/                    #   Next.js 15 + React 19
│   └── api/                    #   NestJS 11 (Better Auth + Prisma 예정)
├── packages/
│   └── shared/                 # zod schemas
├── backend/                    # 🆚 upstream Spring Boot (참고 / 협상용, 빌드 제외)
├── frontend/                   # 🆚 upstream Vue 자산 (신규 비즈니스 코드만, Phase 2 포팅용)
│   └── src/
│       ├── services/aiMatching.ts        # AI 매칭
│       ├── services/vectorSearch.ts      # 벡터 검색
│       └── views/...                     # 견적/거래/분쟁 신규 화면
└── docs/
    └── prd/rootmatching-prd.md           # PRD v0.4
```

## 충돌 해결 정책

| 충돌 유형 | 채택 |
|---|---|
| Phase 0 Vue 파일 (우리 삭제 / upstream이 `frontend/`로 옮기며 수정) | **우리 삭제 유지** |
| `public/icon*` (양측이 다른 위치로 rename) | **`apps/web/public/` 채택** |
| upstream 신규 자산 (AI 매칭, 견적, 분쟁, 거래) | **`frontend/`에 받아들임** → Phase 2 포팅 |
| upstream Spring Boot (`backend/`) | **그대로 받아들임** → 협상 자료 |
| `.gitignore` | **양측 머지** |
| `.omx/state/*.json` | **삭제** (도구 상태, 커밋 대상 아님) |

## 정식 작업은 어디서

- 본 작업: [`dev-monorepo`](https://github.com/L-dragon-woo/DGU-Technology-start-up-capstone/tree/dev-monorepo) 브랜치
- 백업 스냅샷: [`backup/dev-monorepo-20260602`](https://github.com/L-dragon-woo/DGU-Technology-start-up-capstone/tree/backup/dev-monorepo-20260602)
- Phase 0 아카이브: [`archive/vue3-phase0`](https://github.com/L-dragon-woo/DGU-Technology-start-up-capstone/tree/archive/vue3-phase0)
