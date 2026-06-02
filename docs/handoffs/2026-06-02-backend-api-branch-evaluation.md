# Session Handoff — 2026-06-02 Backend-API Branch Evaluation

## TL;DR

`origin/feature/backend-api` 브랜치는 **upstream-divergence-trial-merge v1.2 (옵션 A 결정) 이후 백엔드 팀이 계속 진행한 작업**입니다. 본 평가에서 그 결과물을 검토하고, **백엔드 설계 문서 3종은 채택**, **Spring Boot 코드 / Vue 프런트 / MySQL docker-compose는 거부**로 결론냈습니다.

채택 결과는 `docs/specs/`로 통합되었으며, Phase 1.W2 Prisma + Better Auth 작업의 reference로 사용됩니다.

---

## 1. Context (왜 평가했나)

### 1.1 직전 세션 상태

- Branch: `dev-monorepo`
- 마지막 commit: `b6f66fa` (UserContext cookie hydration fix)
- 핸드오프: `docs/handoffs/2026-06-02-remaining-pages-functional-spec-complete.md`

### 1.2 사용자 요청

> "origin/feature/backend-api 여기서 추가된 내용들도 확인하고 받아들일 거 있으면 받아들이고 너무 별로면 우리 대로 가자"

평가 → 제안 → 사용자 확정 → 채택/거부 적용 패턴으로 진행.

---

## 2. Branch Divergence 분석

### 2.1 두 브랜치 비교

| 항목           | `dev-monorepo` (우리)                                       | `origin/feature/backend-api` (그쪽)                      |
| -------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| 분기점         | `603a0b0` (Merge PR #2)                                     | 동일                                                     |
| 추가 commits   | 13개 (Wave A~F + Oracle fixes + cookie hydration + handoff) | 9개 (Spring backend + frontend reorg + ERD + DB + RAG)   |
| 디렉터리       | `apps/{web,api}` + `packages/shared` (monorepo)             | `frontend/` + `backend/` (split)                         |
| Frontend stack | Next.js 15 + React 19 + Tailwind 3.4                        | Vue 3 + Vite + Pinia                                     |
| Backend stack  | NestJS 11 (in progress)                                     | **Spring Boot 4.0.6 + Java 17**                          |
| Database       | Neon PostgreSQL (예정, Phase 1.W2)                          | **MySQL 8.4 (Docker)** + H2 (test)                       |
| ORM            | Prisma 6 (예정)                                             | **Spring Data JPA + Lombok**                             |
| API contract   | direct DTO 응답 (`POST /matching/recommend` 1-step)         | **`{ success, message, data }` envelope + 32 endpoints** |
| 인증           | Better Auth (예정)                                          | mock `Bearer mock-session-token`                         |

### 2.2 `feature/backend-api`의 9개 commits

```
4976813 text : work_log.md
45282c9 feat : rag 기반 데이터 검색 기능 추가
deb9f35 feat : DB table 생성
cd4f73c feat : docker mySQL
eccc02b docs: 정리 RootMatching backend 설계 및 mock API
8eb5bad chore: baseline before rootmatching omx run
89b87fd chore : add api funtional-spec
8644a60 chore: merge main and resolve PR conflicts
58e19e9 chore: move frontend project into frontend directory
```

---

## 3. 채택 결정 — 3개 문서 (docs/specs/)

### 3.1 채택 표

| 자료                             | 목적지                                         | 채택 사유                                                                                   |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `docs/rootmatching-erd.md`       | `docs/specs/rootmatching-erd.md` (557줄)       | Mermaid ERD + 22 테이블 + 인덱스 + enum + 제약. Phase 1.W2 Prisma schema의 60-70% reference |
| `docs/backend-api-contract.md`   | `docs/specs/backend-api-contract.md` (174줄)   | 32 endpoint 도메인별 정리. NestJS API 모듈 설계 시 endpoint shape reference                 |
| `docs/backend-design-mapping.md` | `docs/specs/backend-design-mapping.md` (995줄) | 9개 도메인 enum 제안 + 인덱스 DDL 예시 + mock→DB 전환 13단계                                |

### 3.2 헤더 메모 정책

각 채택 문서의 최상단에 다음을 명시:

1. **출처**: `origin/feature/backend-api` commit `4976813`, 채택일 `2026-06-02`
2. **원작성 가정**: Spring Boot + MySQL + JPA + Vue 3
3. **dev-monorepo 적용 컨텍스트**: NestJS 11 + Prisma 6 + Neon PostgreSQL + Better Auth + Next.js 15
4. **정책 정렬 차이표**: 원본 가정 vs dev-monorepo 정책 (Spring→NestJS, MySQL→Postgres, JPA→Prisma, Bearer token→Better Auth cookie, FULLTEXT→tsvector 등)
5. **사용 범위**: Phase 1.W2/W3에서 어떤 부분을 우선 활용할지
6. **충돌 시 우선순위**: 본 문서 < `functional-spec.md` < `rootmatching-prd.md`

### 3.3 채택한 핵심 자산

**ERD에서**:

- Mermaid 다이어그램 (22 테이블)
- `MATCH_RECOMMENDATIONS`, `FACTORY_QUOTES`, `CONTRACTS`, `TRANSACTIONS`, `DISPUTES`, `MESSAGES` 등 풍부한 관계 정의
- 상태 enum 권장값
- 인덱스/unique 제약 권장
- attachment owner*type 분리 (QUOTE_REQUEST, FACTORY_PORTFOLIO, MESSAGE, TRANSACTION*\*, DISPUTE_EVIDENCE)

**API Contract에서**:

- 32+ endpoint method/path/body/auth 표
- `POST /quote-requests` + `POST /:id/match` 2-step 모델 (현재 우리 1-step과 다름)
- Mock attachment metadata 규칙 (`{ name, size, type, url: null, mockOnly: true }`)
- Validation error envelope 구조

**Design Mapping에서**:

- 9개 도메인 enum 명세 (UserRole, QuoteRequestStatus, FactoryQuoteStatus, MatchingSource, ContractStatus, TransactionStatus, DisputeType, DisputeStatus, NotificationType, ReviewNextAction)
- 중복/애매한 상태 개선안 (한글 label + 영문 key 중복 저장 금지)
- 인덱스/unique 제약 권장 DDL 예시
- mock→DB 전환 13단계 (이 순서 그대로 우리 Phase 1.W2~Phase 3 로드맵으로 사용 가능)

---

## 4. 거부 결정

### 4.1 거부 표

| 자료                                                  | 거부 사유                                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `backend/**` (Spring Boot 4.0.6 + Java 17, 90+ files) | `upstream-divergence-trial-merge` v1.1에서 이미 폐기 결정. NestJS + Prisma + Neon (PRD v0.4) 라인 고수     |
| `frontend/**` (Vue 3 + Vite + Pinia, 60+ files)       | `upstream-divergence-trial-merge` v1.2에서 Chunks 2~4로 React/Next.js 포팅 완료. 동일 자산 중복            |
| `docker-compose.yml` (MySQL 8.4)                      | dev-monorepo는 **Neon PostgreSQL** + `pgvector` 사용 (PRD v0.4). MySQL은 ORM/migration/벡터 검색 모두 충돌 |
| `application.yml` (Spring profiles)                   | Spring 폐기와 함께 자동 거부                                                                               |
| `.idea/**` (IntelliJ IDE 설정)                        | dev-monorepo는 VS Code/JetBrains/Cursor 등 IDE 무관. 개인 환경 파일은 `.gitignore`에 추가                  |
| `.omx/**` (omx 런타임 로그)                           | 세션 로그 파일은 commit 대상 아님. `.gitignore` 대상                                                       |

### 4.2 거부 영향

- **데이터 인프라**: Neon Postgres + Prisma migration 라인을 그대로 진행
- **AI 매칭**: 이미 NestJS `apps/api/src/matching/`에 이식 완료. RAG 향후 도입 시 OpenAI client + pgvector로 재설계
- **벡터 검색**: 그쪽은 `root_factory_embeddings.vector_json`에 JSON 문자열 저장 + 애플리케이션 레벨 cosine. 우리는 `pgvector` 네이티브 사용 예정 (Phase 2.W6)
- **인증**: Better Auth (Phase 1.W2)로 그쪽 `Bearer mock-session-token` 대체

---

## 5. 채택하지 않은 자료 — 가치 분석 (혹시 모를 미래용)

| 자료                                            | 잠재 가치                                                               | 액션                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `backend/docs/WORK_LOG.md` (631줄)              | 백엔드 팀 작업 흐름 기록 — 협상 자료                                    | 보존 안 함 (필요 시 git에서 cherry-pick)                                                                     |
| `frontend/src/services/aiMatching.ts`           | 이미 `apps/api/src/matching/services/ai-matching.service.ts`로 이식됨   | 이미 채택됨 (Chunk 1)                                                                                        |
| `frontend/src/services/vectorSearch.ts`         | 이미 `apps/api/src/matching/services/vector-search.service.ts`로 이식됨 | 이미 채택됨 (Chunk 1)                                                                                        |
| `frontend/.env.example`                         | Vue 환경변수 예시 (`VITE_OPENAI_API_KEY` 등) — 보안 안티패턴            | 거부, 대신 우리는 `apps/api/.env.example`만 사용                                                             |
| `docker-compose.yml`을 Postgres 버전으로 재작성 | 로컬 dev DB 컨테이너로 가치 있음                                        | **Phase 1.W2 시작 시 별도 작성 고려** (그쪽 파일은 채택하지 않고, 우리만의 Postgres + pgvector compose 작성) |

---

## 6. #2 발주 요청 등록 FAIL — 본 평가와 별개 이슈

직전 핸드오프(`2026-06-02-remaining-pages-functional-spec-complete.md`)에서 보고된 `§14 시나리오 #2 발주 요청 등록 FAIL`은 본 브랜치 평가와 **무관한 우리 코드 자체 버그**로 분류됩니다.

**근거**:

- 우리 발주 요청 폼은 `POST ${NEXT_PUBLIC_API_URL}/matching/recommend`로 즉시 매칭 결과를 받는 1-step 모델
- 그쪽 백엔드는 우리 NestJS와 완전히 별개 서비스 (포트 8080, MySQL)
- 우리 dev-monorepo의 실패는 그쪽 코드와 무관 (Playwright submit 버튼 selector 또는 fetch 호출 실패 가능성)

**조사 계획**: 별도 Phase C에서 진행 (본 핸드오프 작성 직후 같은 세션 내).

---

## 7. 적용된 파일 변경

### 7.1 신규 파일

```
docs/specs/rootmatching-erd.md           (557 lines, 헤더 38 + 원본 519)
docs/specs/backend-api-contract.md       (174 lines, 헤더 47 + 원본 127)
docs/specs/backend-design-mapping.md     (995 lines, 헤더 43 + 원본 952)
docs/handoffs/2026-06-02-backend-api-branch-evaluation.md  (본 문서)
```

### 7.2 변경 없음

- `apps/web/**`, `apps/api/**`, `packages/shared/**` — 코드 변경 없음 (평가만 진행)
- Spring Boot/Vue/MySQL — 채택하지 않으므로 변경 없음

---

## 8. 향후 협상 의제 (팀과 정렬 필요)

`upstream-divergence-trial-merge` v1.2 §6에서 정의된 의제와 연결됩니다.

1. **PR #2 Spring Boot 셋업의 미래**: 폐기 / 별도 microservice / 메인 백엔드 중 위치 확정 필요. dev-monorepo는 NestJS 라인 유지 결정 재확인.
2. **백엔드 팀의 다음 작업 방향**: 본 평가 이후 그쪽이 RAG/JPA를 계속 발전시킬지, dev-monorepo 라인으로 합류할지 협상.
3. **ERD / API contract 공유**: 본 채택을 통해 양측이 동일 도메인 모델/엔드포인트 shape를 공유한다는 사실을 명확히 한다 (단, 구현 스택은 다름).
4. **Better Auth vs mock session token**: 인증 결정. dev-monorepo는 Better Auth로 진행 (PRD v0.4).
5. **MySQL vs PostgreSQL**: DB 결정. dev-monorepo는 Neon Postgres (PRD v0.4). 그쪽이 따로 Spring 백엔드를 운영한다면 그쪽 DB는 그쪽 결정.

---

## 9. 검증 명령

### 9.1 채택된 문서 검증

```bash
ls -la docs/specs/
wc -l docs/specs/*.md
head -45 docs/specs/rootmatching-erd.md
```

### 9.2 그쪽 브랜치 재확인

```bash
git fetch origin feature/backend-api
git log --oneline $(git merge-base dev-monorepo origin/feature/backend-api)..origin/feature/backend-api
git diff --name-status dev-monorepo origin/feature/backend-api | grep -E '^A.*\.md$'
```

### 9.3 거부한 자료가 실수로 들어오지 않았는지 확인

```bash
git status
git diff --name-only | grep -E '^(backend|frontend)/' || echo "OK: backend/, frontend/ 미수정"
git diff --name-only | grep -E '\.(idea|omx)' || echo "OK: .idea/, .omx/ 미수정"
```

---

## 10. 변경 이력

| 버전 | 날짜       | 변경                                                                                                           |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-06-02 | `feature/backend-api` 평가, ERD/API contract/design mapping 3종 docs/specs/로 채택, Spring/Vue/MySQL 거부 결정 |
