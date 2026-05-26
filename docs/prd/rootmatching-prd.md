# Rootmatching PRD (Product Requirements Document)

> 뿌리산업 B2B 수주 매칭 플랫폼

| 항목       | 내용                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 프로젝트명 | **Rootmatching** (rootmatching)                                                                                                                                     |
| 도메인     | 한국 뿌리산업(6대 공정) 발주처 ↔ 공장 매칭 플랫폼                                                                                                                   |
| 작성 기준  | 2026-05-26                                                                                                                                                          |
| 버전       | **PRD v0.3**                                                                                                                                                        |
| 작성자     | Rootmatching 팀 (동국대 2026-1 기술창업캡스톤디자인 1)                                                                                                              |
| 팀 구성    | 팀장 **이용우** · 팀원 **박세준 · 서동건 · 장준서**                                                                                                                 |
| 상태       | v0.3 — **스택 전환 결정** (Vue 3 프로토타입 → Next.js + NestJS 모노레포). Phase 0 archived, Phase 1 셋업 대기.                                                      |
| 참고 자료  | rootmatching-deck v1.7 (본문 24장 + Appendix 10장), 12장 캡스톤 발표 덱, IR PDF 24장, `docs/design-system.md`, Phase 0 Vue 프로토타입 (`dev-vue3-prototype` 브랜치) |
| 문서 위치  | `docs/prd/rootmatching-prd.md` (v0.2부터 이전: `.sisyphus/prd/`)                                                                                                    |

---

## Executive Summary

**Rootmatching**은 한국 뿌리산업(주조·금형·소성가공·열처리·표면처리·용접) 65,101개 영세 공장과 외주가 필요한 발주처를 연결하는 **수직형 B2B 거래 플랫폼**이다.

기존 일반 B2B SaaS가 풀지 못한 **고령(60대 이상 31.4%) 디지털 약자 문제**를, 운영 인력이 거래 한복판에 함께 들어가는 **Hybrid Operation 모델**과 **법적 효력 기반 안심 거래(전자계약 + 에스크로 + 분쟁 중재)**로 해결한다.

핵심 차별점은 "AI 매칭"이 아니라 **AI는 6개월이면 따라잡히지만, 3년 걸려야 만들어지는 ① 법적 책임 구조 · ② 6대 공정 특화 도메인 지식 · ③ 집적지 파트너십**이라는 3축 Moat다.

3년차 목표는 활성 공장 700개 / GMV 1,400억 / 4-stream 매출(거래수수료 5% + 결제보호 1% + 멤버십 39만/월 + 법무 패키지)로 **연매출 약 105억**이다.

> **Why Now**: 분쟁이 +42% YoY(2,846→4,041건)로 폭발 중이고, 영세 81.5% + 60대 31.4%의 인구학적 구조 때문에 일반 SaaS는 절대 못 들어오는 시장 — 정책 정합성(중기부 MSS · 소진공 SEMAS · 산자부 MOTIE)도 확보된 진입 적기.

> **v0.3 핵심 변경**: 비즈니스 가설은 v0.1/v0.2와 동일. 기술 스택을 **Next.js 15 (App Router) + NestJS 11 + Prisma + PostgreSQL** 모노레포로 전면 전환. Vue 3 프로토타입은 `dev-vue3-prototype` 브랜치에 보존되어 UI 패턴·비즈니스 흐름 검증용 레퍼런스로만 사용한다.

---

## 1. 배경 및 비전

### 1.1 비전

> **"뿌리산업의 거래를 표준화하고, 디지털 약자도 안심하고 일하게 한다."**

### 1.2 배경

- 뿌리산업은 한국 제조업의 **기초 뿌리** (자동차·조선·전자·기계 산업의 부품 공급 기반)
- 사업체 **65,101개** / 종사자 **744K명** / 매출 **261조 5,412억**
- 그러나 **영세 81.5%** (종사자 9인 이하), 종사자 1~9인 비율 **66.8%**
- 종사자 평균 연령 고령화 — **60대 이상 31.4%**, 청년(20대) 단절 **2.7%**
- AS-IS 거래는 전화·메일·카톡 기반 수기 흐름. 평균 거래 리드타임 **14일+**
- 거래 분쟁이 5년 새 **+42% YoY** (한국공정거래조정원, 2024)

### 1.3 시장 환경

- 산자부 MOTIE: 뿌리산업진흥과 5개년 계획 (2024~2028)
- 중기부 MSS: 상생결제·납품대금 보호
- 소진공 SEMAS: 영세 사업장 디지털 전환 지원
- 전자문서 및 전자거래 기본법 §4·§4의2·§5 → 전자계약의 법적 효력 보장

### 1.4 메시지 체인 (확정된 내러티브)

```
① 뿌리산업은 DX가 시급하다
  ↓
② 그런데 DX가 안 된다
  ↓
③ 안 되는 이유 = 60대 이상 31.4% 디지털 약자
  ↓
④ 일반 B2B SaaS는 못 들어간다
  ↓
⑤ 우리는 운영이 함께 들어가는 모델로 진입
  ↓
⑥ 한 번 풀면 후발 진입자는 같은 비용을 다시 → Moat
```

---

## 2. 문제 정의 (Problem Statement)

### 2.1 공급 측 (영세 공장)

| Pain                  | 설명                                      |
| --------------------- | ----------------------------------------- |
| 신규 영업 부재        | 입소문·지인 의존, 신규 발주처 확보 어려움 |
| 영업·견적 작성 부담   | 전화·메일 반복, 견적서 매번 수작업        |
| 결제 사고 위험        | 납품 후 미수금, 분쟁 시 의지처 없음       |
| 디지털 도구 진입 장벽 | 60대 31.4% — 기존 B2B SaaS UX는 사용 불가 |
| 청년 인력 단절        | 종사자 평균 연령 상승, 디지털 가속화 불가 |

### 2.2 수요 측 (발주처)

| Pain                    | 설명                                         |
| ----------------------- | -------------------------------------------- |
| 검증된 업체 탐색 어려움 | 실제 실력(품질·납기) 사전 판단 불가          |
| 견적 비교 비효율        | 전화·메일로 여러 업체 견적 받고 비교 → 14일+ |
| 분쟁 시 무방비          | 영세 공장 상대 법적 대응 부담                |
| 신뢰도 불확실           | 영세 공장의 재무 상태·실적 검증 수단 부재    |
| 결제·검수 일관성 부족   | 매번 다른 양식·약관                          |

### 2.3 구조적 위기

- 영세 81.5%의 시장에 일반 SaaS는 **CAC(고객획득비용) > LTV**가 되어 진입 실패
- AI/온라인 매칭 도구의 한계: "도구를 던지면 알아서 쓴다"는 가정이 60대 사용자에게 성립 안 함
- 거래 단절 → 청년 진입 차단 → 산업 자체가 사라질 위기

---

## 3. 타겟 사용자 (Personas)

### 3.1 Primary Persona — 공장주 (공급 측)

| 속성          | 값                                                                 |
| ------------- | ------------------------------------------------------------------ |
| 이름          | 김 사장 (60대 후반, 가상)                                          |
| 직책          | 표면처리 공장 대표 (종사자 5명)                                    |
| 디지털 친숙도 | **낮음** — 카톡·전화 중심, 컴퓨터로는 견적서 한글파일 작성 정도    |
| 거래 단가     | 건당 3,000만 ~ 8,000만 원                                          |
| 핵심 니즈     | "전화 한 통으로 일이 들어왔으면 좋겠다", "사고만 안 났으면 좋겠다" |
| 결정 트리거   | 입소문 + 운영자가 직접 들어와 가르쳐줌                             |

### 3.2 Primary Persona — 구매 담당자 (수요 측)

| 속성          | 값                                                      |
| ------------- | ------------------------------------------------------- |
| 이름          | 박 과장 (30대, 가상)                                    |
| 직책          | 자동차 부품 1차 협력사 구매 담당                        |
| 디지털 친숙도 | 높음 — Excel, 사내 ERP 사용                             |
| 거래 단가     | 건당 5,000만 원 (평균)                                  |
| 핵심 니즈     | "검증된 공장을 빠르게 비교하고, 안전하게 계약하고 싶다" |
| 결정 트리거   | 짧은 리드타임(3일 이내) + 분쟁 안전망                   |

### 3.3 Secondary — 운영자 (Rootmatching 내부)

| 속성        | 값                                                                                  |
| ----------- | ----------------------------------------------------------------------------------- |
| 역할        | Human-in-the-Loop 운영 담당                                                         |
| 책임        | 신규 공장 온보딩, 견적 정제, 분쟁 중재 1차 응대                                     |
| 디지털 도구 | 내부 Admin UI (Next.js 보호 라우트 또는 별도 sub-app), 계약·결제·분쟁 워크플로 도구 |

---

## 4. 핵심 가치 제안 (Value Proposition Canvas)

### 4.1 Customer Profile (발주처 기준)

**Jobs (9)**

1. 필요한 부품/공정 정의
2. 기존·신규 업체 탐색
3. 여러 업체 견적 요청
4. 가격·품질·납기 비교
5. 내부 승인·의사결정
6. 계약 진행
7. 납품·품질 검수
8. 분쟁·재협상 대응
9. 반복 거래·재탐색

**Pains (5)**

- 전화/메일 반복 (시간 낭비)
- 실제 실력 판단 어려움 (포트폴리오·실적 부재)
- 분쟁 시 의지처 없음 (영세 공장 법적 책임 추궁 어려움)
- 영세 공장 신뢰도 불확실 (재무·인증 정보 부족)
- 결제 사고 (선급금·미수금)

**Gains (5)**

- 검증된 업체
- 한눈에 비교
- 거래 간소화
- 효율성 증가 (14일 → 3일)
- 안심 결제

### 4.2 Value Map

**Products & Services (6)**

1. 뿌리산업 매칭 플랫폼
2. 포트폴리오·실적 시스템
3. 견적·입찰 시스템
4. 가격·품질·납기 비교
5. 평판·리뷰 시스템
6. 거래 이력·재수주 지원

**Pain Relievers**

- 공정별 특화 매칭 (6대 공정 알고리즘) → "한 번 등록하면 발주가 들어온다"
- 표준 견적 폼 + 운영자 정제 → "전화/메일 반복 0"
- 법적 효력 전자계약 + 에스크로 → "결제 사고 0"
- 분쟁 중재(Human-in-the-Loop) → "의지처가 있다"

**Gain Creators**

- 신뢰 점수·납기 준수율·재거래율 시각화
- AI 추천 사유 명시 (블랙박스 아님)
- 거래 이력 누적 → 재발주 자동화
- "컴퓨터 어려워도 괜찮다" — 운영자 + 큰 입력 UI

### 4.3 핵심 가치 제안 한 줄

> **"AI 매칭만으로는 안 풀린다. 운영이 함께 들어가는 뿌리산업 거래 표준 — 14일 → 3일, 분쟁 -40%."**

---

## 5. 솔루션 개요

### 5.1 AS-IS 거래 두 갈래

```
[일반 수주·납품 프로세스]                     [입찰 과정]
  16단계 + 분기 2                              8단계 + 분기 1
  ─ 신규 영업                                   ─ 입찰 공고
  ─ 고객 조사                                   ─ 사업자 제출
  ─ 견적서·제안서 작성                          ─ 평가 조건
  ─ 단가 결정                                   ─ 낙찰 후 협상
  ─ 납품·정산                                   ─ ...
  (메일·전화·카톡 + 한글파일 기반)            (수기 기반)

평균 리드타임: 14일+
분쟁률: 5~10%
```

### 5.2 TO-BE 11단계 표준 워크플로

```
Step 1.  발주 의뢰서 작성 (Large Form UX)
Step 2.  공정·물량·납기 자동 분류
Step 3.  공정별 특화 매칭 (6대 공정 알고리즘)
Step 4.  추천 공장 Top-N 제시 + 추천 사유
Step 5.  복수 공장 견적 요청 (표준 폼)
Step 6.  운영자 견적 정제 (Human-in-the-Loop)
Step 7.  발주처 비교·선택
Step 8.  전자계약 체결 (전자문서법 §4·§4의2·§5)
Step 9.  에스크로 결제 (결제보호 수수료 1%)
Step 10. 납품·검수 (사진/문서 업로드)
Step 11. 정산·평판 적립 (재거래·재수주 트리거)

이상 시 → 분쟁 중재 모듈 (4단계, Human-in-the-Loop)
```

### 5.3 정량 성과 목표

| 지표                 |   AS-IS |        TO-BE |     개선 |
| -------------------- | ------: | -----------: | -------: |
| 파트너 탐색 리드타임 |    14일 |          3일 | **-78%** |
| 분쟁 발생률          |   5~10% |         2~5% | **-40%** |
| 견적 비교 시간       | 수 시간 |      분 단위 |        - |
| 결제 사고            |    빈번 | 0 (에스크로) |    -100% |

---

## 6. MVP 범위와 우선순위

### 6.1 MVP 정의 (Phase 6 베타 목표)

> **목표: 1개 집적지(인천 남동 or 안산 시화) 50개 공장 + 5개 발주처로 11단계 워크플로 end-to-end 검증**

### 6.2 P0 (MVP 필수)

| 영역 | 기능                                    | 신규 스택 적용                                    |
| ---- | --------------------------------------- | ------------------------------------------------- |
| 인증 | 로그인 / 회원가입 / JWT 세션            | NestJS auth module + Next-Auth v5 (또는 자체 JWT) |
| 인증 | role 분리 (client / factory / operator) | Prisma User.role enum + Next.js middleware        |
| 인증 | 보호 라우트                             | Next.js `middleware.ts` + NestJS Guards           |
| 발주 | 견적 요청서 작성 + 파일 첨부            | Next.js Server Action + Vercel Blob upload        |
| 발주 | 발주처 요청 → 공장 수신함 데이터 흐름   | Prisma Request + Quote 모델, FK 명시              |
| 매칭 | 6대 공정 특화 매칭                      | NestJS matching module, 6대 공정 enum (shared)    |
| 매칭 | 추천 사유 표시                          | 매칭 점수 산식 명시 (transparent)                 |
| 견적 | 공장 측 견적 제출 + 운영자 정제         | NestJS Quote module + Admin Next.js sub-route     |
| 비교 | 복수 견적 비교 화면                     | Next.js Server Component + TanStack Query         |
| 계약 | 전자계약 + 전자서명                     | 모두싸인/이폼사인 webhook 연동                    |
| 결제 | 에스크로 결제                           | 토스페이먼츠 escrow API 연동                      |
| 거래 | 진행 상태 · 검수 승인                   | NestJS Transaction state machine                  |
| 거래 | 납품 파일 · 검사 결과서 업로드          | Vercel Blob + S3 (도면)                           |
| 분쟁 | 분쟁 중재 신청 · 진행 (4단계)           | NestJS Dispute module + Admin 워크플로            |
| 평판 | 리뷰 · 평점 작성                        | Prisma Review 모델                                |
| 평판 | 신뢰 점수 · 납기 준수율 · 재거래율      | NestJS reputation 계산 cron + cache               |
| 운영 | 운영자 Admin Dashboard                  | Next.js `app/(admin)/*` 보호 segment              |

### 6.3 P1 (MVP 직후)

- 메시지 · 알림 시스템 (카카오 알림톡 + 이메일)
- 거래 이력 / 재수주 자동 트리거
- 포트폴리오 업로드 · 검증
- 멤버십 정기결제 (토스페이먼츠 빌링)
- 법무 패키지 (사건별 결제)
- `.env.example` + Vercel/Railway 환경변수 분리

### 6.4 P2 (확장)

- 모바일 PWA
- 자동화된 분쟁 중재 보조 (Human은 그대로 유지, RAG 도움말)
- 데이터 분석 대시보드 (발주처용)
- 정부 사업 매칭 (소진공·중기부 사업 자동 알림)
- Public OpenAPI (대형 발주처 ERP 연동)

### 6.5 명시적 Out-of-Scope (MVP에서 안 함)

- 결제 외화 · 해외 거래
- 다국어 (한국어 단일)
- 카카오/구글/네이버 OAuth 일단 보류 (이메일 + 카톡 알림톡)
- 자동 AI 분쟁 판결 (반드시 Human-in-the-Loop)
- SSR 캐싱 외 별도 CDN 최적화 (Vercel 기본값 활용)

---

## 7. 기능 요구사항 (Functional Requirements)

> 도메인 요구사항이라 스택 변경과 무관. v0.2와 동일.

### FR-1. 인증 및 권한

| ID      | 요구사항                                              | Priority |
| ------- | ----------------------------------------------------- | -------- |
| FR-1.1  | 이메일 + 비밀번호 로그인 (NestJS JWT)                 | P0       |
| FR-1.2  | 회원가입 (역할 선택: client / factory / operator)     | P0       |
| FR-1.3  | 비밀번호 8자 이상 + bcrypt 해싱 + 비밀번호 확인       | P0       |
| FR-1.4  | 이메일 중복 검증 (Prisma unique constraint)           | P0       |
| FR-1.5  | 세션 유지 (httpOnly refresh cookie + access JWT 15분) | P0       |
| FR-1.6  | 로그아웃 (refresh token revoke)                       | P0       |
| FR-1.7  | 라우터 가드: Next.js `middleware.ts` + NestJS Guards  | P0       |
| FR-1.8  | 역할별 라우트 분리                                    | P0       |
| FR-1.9  | 약관 동의 (전자상거래법 + 개인정보처리방침)           | P0       |
| FR-1.10 | 카카오톡 알림톡 가입 안내                             | P1       |

### FR-2. 발주 (Client Request)

| ID     | 요구사항                                                | Priority |
| ------ | ------------------------------------------------------- | -------- |
| FR-2.1 | 견적 요청서 작성 (공정 · 물량 · 납기 · 예산 · 요구사항) | P0       |
| FR-2.2 | 파일 첨부 (도면 · 시방서, 최대 50MB, MIME 검증)         | P0       |
| FR-2.3 | 요청 상태: `draft → submitted` Prisma enum              | P0       |
| FR-2.4 | 요청 자동으로 공장 측 수신함 노출 (FK 보장)             | P0       |
| FR-2.5 | 요청 수정 · 취소 (submitted 이전 only)                  | P1       |
| FR-2.6 | 요청 템플릿 저장 · 재사용                               | P2       |

### FR-3. 매칭

| ID     | 요구사항                                           | Priority |
| ------ | -------------------------------------------------- | -------- |
| FR-3.1 | 공정별 매칭 알고리즘 (6대 공정 분류)               | P0       |
| FR-3.2 | 추천 공장 Top-N(기본 5개) 표시                     | P0       |
| FR-3.3 | 추천 사유 명시 (신뢰점수·납기준수율·재거래율·거리) | P0       |
| FR-3.4 | 공장 상세 (포트폴리오·실적·리뷰)                   | P0       |
| FR-3.5 | 다중 공장 선택 → 일괄 견적 요청                    | P0       |
| FR-3.6 | 필터: 지역·공정·인증·규모                          | P1       |

### FR-4. 견적 (Quote)

| ID     | 요구사항                                                  | Priority |
| ------ | --------------------------------------------------------- | -------- |
| FR-4.1 | 공장 측: 받은 견적 요청 목록                              | P0       |
| FR-4.2 | 공장 측: 견적 작성 (금액·납기·조건)                       | P0       |
| FR-4.3 | 공장 측: 견적 제출 → 발주처에 전달                        | P0       |
| FR-4.4 | 운영자: 견적 정제 워크플로                                | P0       |
| FR-4.5 | 발주처: 복수 견적 비교 화면                               | P0       |
| FR-4.6 | 견적 상태: `new → reviewing → quoted → accepted/rejected` | P0       |
| FR-4.7 | 견적 유효 기간 자동 만료 (NestJS Cron)                    | P1       |

### FR-5. 계약 (Contract)

| ID     | 요구사항                                                            | Priority |
| ------ | ------------------------------------------------------------------- | -------- |
| FR-5.1 | 전자계약 작성                                                       | P0       |
| FR-5.2 | 전자서명 (모두싸인 / 이폼사인 webhook)                              | P0       |
| FR-5.3 | 계약서 PDF 다운로드 (S3 presigned URL)                              | P0       |
| FR-5.4 | 계약 상태: `drafting → signed → in_progress → completed / disputed` | P0       |
| FR-5.5 | 표준 약관 템플릿 (DB 관리)                                          | P0       |
| FR-5.6 | 변경계약서                                                          | P1       |

### FR-6. 결제 (Escrow)

| ID     | 요구사항                                              | Priority |
| ------ | ----------------------------------------------------- | -------- |
| FR-6.1 | 에스크로 결제 (토스페이먼츠 escrow API)               | P0       |
| FR-6.2 | 결제 상태: `pending → escrowed → released / refunded` | P0       |
| FR-6.3 | 결제 webhook 처리 + 멱등성 (idempotency key)          | P0       |
| FR-6.4 | 영수증 · 세금계산서 발행                              | P0       |
| FR-6.5 | 부분 결제 / 분할 결제                                 | P1       |
| FR-6.6 | 결제 실패 · 재시도 처리                               | P0       |

### FR-7. 거래 (Transaction)

| ID     | 요구사항                              | Priority |
| ------ | ------------------------------------- | -------- |
| FR-7.1 | 거래 진행률 실제 계산 (단계별 가중치) | P0       |
| FR-7.2 | 납품 파일 · 검사 결과서 업로드        | P0       |
| FR-7.3 | 검수 승인 → 에스크로 해제             | P0       |
| FR-7.4 | 검수 반려 → 재납품 / 분쟁 트리거      | P0       |
| FR-7.5 | 거래 완료 → 평판 적립                 | P0       |
| FR-7.6 | 단계별 알림 (이메일 + 카카오 알림톡)  | P0       |

### FR-8. 분쟁 중재 (Dispute Mediation)

| ID     | 요구사항                                              | Priority |
| ------ | ----------------------------------------------------- | -------- |
| FR-8.1 | 분쟁 신청 (사유 · 증빙)                               | P0       |
| FR-8.2 | 4단계 프로세스 (접수 → 운영자 1차 → 양측 의견 → 결론) | P0       |
| FR-8.3 | 운영자(Human) 중재 워크플로                           | P0       |
| FR-8.4 | 결과 적용 (환불 · 일부 지급 · 재납품)                 | P0       |
| FR-8.5 | 법무 패키지 신청 (외부 법무 연계)                     | P1       |
| FR-8.6 | 분쟁 이력 평판 반영                                   | P0       |

### FR-9. 평판 (Reputation)

| ID     | 요구사항                                               | Priority |
| ------ | ------------------------------------------------------ | -------- |
| FR-9.1 | 거래 완료 후 양방향 리뷰 (별점 + 텍스트)               | P0       |
| FR-9.2 | 신뢰 점수 계산 (NestJS Cron 매일 batch)                | P0       |
| FR-9.3 | **단위 통일**: trustScore = `0~100` 정수 (도메인 약속) | P0       |
| FR-9.4 | 공장 프로필 페이지 평판 표시                           | P0       |
| FR-9.5 | 발주처 평판 (정시 결제 · 합리적 요구)                  | P1       |

### FR-10. 운영자 Admin (Human-in-the-Loop)

| ID      | 요구사항                            | Priority |
| ------- | ----------------------------------- | -------- |
| FR-10.1 | 신규 공장 온보딩 (서류 검증 · 인증) | P0       |
| FR-10.2 | 견적 정제 큐                        | P0       |
| FR-10.3 | 분쟁 중재 큐                        | P0       |
| FR-10.4 | 거래 모니터링 대시보드              | P0       |
| FR-10.5 | CS 도구 (메시지 회신 · 알림 발송)   | P1       |
| FR-10.6 | 평판 · 리뷰 부정 사례 검토          | P1       |

### FR-11. 알림 · 메시지

| ID      | 요구사항                                                  | Priority |
| ------- | --------------------------------------------------------- | -------- |
| FR-11.1 | 인앱 알림 (NestJS WebSocket + Next.js Server-Sent Events) | P0       |
| FR-11.2 | 이메일 알림 (Sendgrid 또는 Resend)                        | P0       |
| FR-11.3 | 카카오 알림톡 (NHN Toast 또는 Bizmsg)                     | P1       |
| FR-11.4 | 발주처 ↔ 공장 메시지 (선택적)                             | P1       |

### FR-12. 마이페이지

| ID      | 요구사항                            | Priority |
| ------- | ----------------------------------- | -------- |
| FR-12.1 | 프로필 편집                         | P0       |
| FR-12.2 | 회사 정보 (사업자등록증 · 인증)     | P0       |
| FR-12.3 | 거래 이력 · 분석                    | P1       |
| FR-12.4 | 설정 (알림 · 결제수단 · 세금계산서) | P0       |

---

## 8. 비기능 요구사항 (Non-Functional Requirements)

### NFR-1. 성능

| ID      | 요구사항                                               |
| ------- | ------------------------------------------------------ |
| NFR-1.1 | Next.js 초기 로드 LCP < 2.5초 (Server Components 활용) |
| NFR-1.2 | NestJS 매칭 API 응답 p95 < 500ms                       |
| NFR-1.3 | 동시 사용자 1,000명 처리 (MVP 기준)                    |
| NFR-1.4 | 매칭 결과는 캐시 (Redis 또는 Vercel KV)                |

### NFR-2. 보안

| ID       | 요구사항                                                           |
| -------- | ------------------------------------------------------------------ |
| NFR-2.1  | **자격증명 코드 노출 금지** (환경변수 + Vercel/Railway Secrets)    |
| NFR-2.2  | Next.js middleware 보호 라우트 + NestJS `@UseGuards(JwtAuthGuard)` |
| NFR-2.3  | JWT: access 15분 / refresh 7일 (httpOnly + SameSite=Strict cookie) |
| NFR-2.4  | bcrypt cost 12 (또는 argon2id)                                     |
| NFR-2.5  | HTTPS 강제 (Vercel 자동)                                           |
| NFR-2.6  | OWASP Top 10 대응 (XSS · CSRF · SQLi 방어)                         |
| NFR-2.7  | 결제 정보 PG 측 처리 (PCI-DSS 회피)                                |
| NFR-2.8  | 개인정보처리방침 + 정보보호 동의 절차                              |
| NFR-2.9  | NestJS `@nestjs/throttler` rate limit (로그인/회원가입 분당 5회)   |
| NFR-2.10 | Helmet + CORS allowlist                                            |

### NFR-3. 사용성 (60대 31.4% 디지털 약자 고려)

| ID      | 요구사항                                                                        |
| ------- | ------------------------------------------------------------------------------- |
| NFR-3.1 | **Large Form UX**: input height 56px, font 18px+ (디자인 시스템 토큰)           |
| NFR-3.2 | 라벨 항상 표시 (placeholder만 사용 금지)                                        |
| NFR-3.3 | CTA는 명확한 한국어 — "확인/다음" 금지, "견적 제출하고 계약으로 이동" 같은 직설 |
| NFR-3.4 | 색상 대비 WCAG AA 이상                                                          |
| NFR-3.5 | 모바일 반응형 (Tailwind sm/md/lg breakpoint)                                    |
| NFR-3.6 | 로딩 · 실패 상태 명시 (Suspense + Error Boundary + 명시적 메시지)               |
| NFR-3.7 | 운영자 콜백 버튼 (어디서든 "전화로 도움 받기")                                  |

### NFR-4. 신뢰성

| ID      | 요구사항                                                        |
| ------- | --------------------------------------------------------------- |
| NFR-4.1 | 결제 trans 멱등성 (idempotency-key 헤더 + DB unique constraint) |
| NFR-4.2 | 거래 상태 머신 (NestJS의 `class-validator` 또는 `xstate`)       |
| NFR-4.3 | Prisma 트랜잭션으로 다단계 작업 묶기                            |
| NFR-4.4 | 백업 (Neon 자동 일간 + point-in-time recovery)                  |
| NFR-4.5 | 가용성 99.5% (MVP) → 99.9% (운영)                               |
| NFR-4.6 | NestJS health check (`@nestjs/terminus`) + Vercel uptime        |

### NFR-5. 코드 품질

| ID      | 요구사항                                                              |
| ------- | --------------------------------------------------------------------- |
| NFR-5.1 | TypeScript 5.7+ strict + `noUncheckedIndexedAccess` 단계적 도입       |
| NFR-5.2 | `as any`, `@ts-ignore`, `@ts-expect-error` 금지                       |
| NFR-5.3 | ESLint 9 flat config (React + Node 양쪽 모두)                         |
| NFR-5.4 | Prettier 3 (전체 공통)                                                |
| NFR-5.5 | 폼 검증: React Hook Form 7 + zod (web) / nestjs-zod (api)             |
| NFR-5.6 | `console.log` 잔존 금지 — Pino logger (NestJS) + Next.js `next/error` |
| NFR-5.7 | 단위 통일: 금액 = 원(₩) 정수, `만원` 표시는 포맷팅 layer만            |
| NFR-5.8 | Conventional Commits + Husky pre-commit (lint-staged)                 |
| NFR-5.9 | shared zod schema → web/api 양쪽 import 단일 진실원                   |

### NFR-6. 테스트

| ID      | 요구사항                                                                       |
| ------- | ------------------------------------------------------------------------------ |
| NFR-6.1 | apps/web: Vitest (unit) + Playwright (e2e)                                     |
| NFR-6.2 | apps/api: Vitest (unit) + Supertest (e2e, NestJS Testing Module)               |
| NFR-6.3 | 결제·계약·분쟁 모듈은 단위 테스트 커버리지 80% 이상 강제                       |
| NFR-6.4 | E2E 스모크: 회원가입 → 로그인 → 발주 → 매칭 → 견적 → 계약 → 결제 → 거래 → 리뷰 |
| NFR-6.5 | GitHub Actions: lint + typecheck + test + build matrix                         |

### NFR-7. 법적 준수

| ID      | 요구사항                                                           |
| ------- | ------------------------------------------------------------------ |
| NFR-7.1 | 전자문서 및 전자거래 기본법 §4·§4의2·§5 준수 (외부 e-Signing 사용) |
| NFR-7.2 | 전자상거래법                                                       |
| NFR-7.3 | 개인정보보호법 (수집 · 이용 · 보관)                                |
| NFR-7.4 | 부가가치세법 (세금계산서)                                          |
| NFR-7.5 | 상생결제 / 납품대금 보호                                           |

### NFR-8. 운영성

| ID      | 요구사항                                              |
| ------- | ----------------------------------------------------- |
| NFR-8.1 | Sentry (web + api 별도 프로젝트)                      |
| NFR-8.2 | NestJS Pino logger (JSON 구조) → Railway/Datadog      |
| NFR-8.3 | Prisma migration 자동 (`prisma migrate deploy` in CI) |
| NFR-8.4 | Feature flag (Vercel Edge Config 또는 PostHog) — 선택 |

---

## 9. 기술 아키텍처 (v0.3 — Next.js + NestJS)

### 9.1 모노레포 구조 (pnpm workspaces)

```
rootmatching/
├── apps/
│   ├── web/                    # Next.js 15 (App Router, React 19)
│   │   ├── app/
│   │   │   ├── (public)/       # 랜딩, 로그인, 회원가입
│   │   │   ├── (dashboard)/    # 인증 후 영역
│   │   │   ├── (admin)/        # 운영자 전용
│   │   │   ├── layout.tsx
│   │   │   └── middleware.ts   # 인증 가드
│   │   ├── components/         # 도메인 컴포넌트
│   │   ├── lib/                # API client, utils
│   │   └── public/
│   └── api/                    # NestJS 11
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── companies/
│       │   ├── requests/
│       │   ├── quotes/
│       │   ├── contracts/
│       │   ├── payments/
│       │   ├── transactions/
│       │   ├── disputes/
│       │   ├── reviews/
│       │   ├── notifications/
│       │   ├── prisma/         # PrismaService 모듈
│       │   ├── common/         # Guards, Interceptors, Decorators
│       │   └── main.ts
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
├── packages/
│   ├── shared/                 # zod schemas, TS types, 상수
│   │   ├── src/
│   │   │   ├── schemas/        # 도메인 zod schema (FE/BE 공유)
│   │   │   ├── types/
│   │   │   └── constants/      # 6대 공정 enum 등
│   │   └── package.json
│   └── ui/                     # shadcn/ui 기반 공통 컴포넌트 (선택)
├── docs/                       # PRD, design system
├── package.json                # 워크스페이스 루트
├── pnpm-workspace.yaml
├── eslint.config.js
├── .prettierrc.json
└── tsconfig.base.json
```

### 9.2 Frontend (apps/web)

| 항목         | 선택                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| Framework    | Next.js 15 (App Router)                                                              |
| React        | 19                                                                                   |
| TypeScript   | 5.7+ strict                                                                          |
| Styling      | Tailwind CSS 3.4 (또는 4.x — 결정 필요) — `docs/design-system.md` 토큰 그대로 활용   |
| Component    | shadcn/ui (radix-ui 기반) — `Button`, `Badge`, `Dialog`, `Form`, `ProcessStepper` 등 |
| Server State | TanStack Query 5 (캐싱) — 또는 Server Components 위주로 단순화                       |
| Client State | Zustand (필요 시) — 가능한 한 Server Components / URL state 활용                     |
| Form         | React Hook Form 7 + `@hookform/resolvers/zod`                                        |
| Auth         | Next-Auth v5 (Auth.js) 또는 백엔드 JWT + middleware                                  |
| Icon         | lucide-react                                                                         |
| 배포         | **Vercel**                                                                           |

### 9.3 Backend (apps/api)

| 항목         | 선택                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| Framework    | NestJS 11                                                                   |
| TypeScript   | 5.7+ strict                                                                 |
| ORM          | Prisma 6                                                                    |
| Database     | PostgreSQL 16 (Neon serverless)                                             |
| Auth         | `@nestjs/passport` + `passport-jwt` + `bcrypt`                              |
| Validation   | `nestjs-zod` (FE/BE schema 공유) 또는 class-validator + class-transformer   |
| API Docs     | `@nestjs/swagger` (OpenAPI 자동 생성)                                       |
| Logger       | `nestjs-pino`                                                               |
| Rate Limit   | `@nestjs/throttler`                                                         |
| Cron         | `@nestjs/schedule` (평판 batch, 견적 만료)                                  |
| Health Check | `@nestjs/terminus`                                                          |
| 배포         | **Railway** 또는 **Fly.io** (PoC), production은 Vercel Functions/AWS도 후보 |

### 9.4 Shared (packages/shared)

```ts
// packages/shared/src/schemas/user.ts
import { z } from 'zod'

export const UserRoleSchema = z.enum(['client', 'factory', 'operator'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const LoginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})
export type LoginInput = z.infer<typeof LoginSchema>

// FE: React Hook Form에서 사용
// BE: nestjs-zod로 DTO 변환
```

### 9.5 External Services

| 서비스                             | 용도                         | 비고                           |
| ---------------------------------- | ---------------------------- | ------------------------------ |
| 토스페이먼츠                       | 에스크로 결제 + 빌링         | 서버사이드 결제 / webhook 처리 |
| 모두싸인 / 이폼사인                | 전자계약 + 전자서명          | webhook으로 서명 완료 수신     |
| 카카오 알림톡 (Bizmsg / NHN Toast) | 정형 알림 (단계별 거래 진행) | P1                             |
| Sendgrid / Resend                  | 이메일 알림                  | 트랜잭션 메일                  |
| Vercel Blob                        | 작은 첨부 (사진, 검사결과서) | 무료 50GB                      |
| AWS S3                             | 도면 · 계약서 PDF            | presigned URL                  |
| Sentry                             | 에러 모니터링                | web + api 별도 프로젝트        |
| Neon                               | PostgreSQL serverless        | Vercel 통합                    |

### 9.6 데이터 모델 핵심 (Prisma)

```prisma
enum UserRole { CLIENT FACTORY OPERATOR }

model User {
  id            String     @id @default(cuid())
  email         String     @unique
  passwordHash  String
  name          String
  role          UserRole
  phone         String
  company       Company?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Company {
  id            String     @id @default(cuid())
  ownerId       String     @unique
  owner         User       @relation(fields: [ownerId], references: [id])
  name          String
  industry      String
  region        String
  size          String
  // ... 공장 추가 필드 (인증, 포트폴리오)
}

enum RequestStatus { DRAFT SUBMITTED MATCHED QUOTED ACCEPTED REJECTED }

model Request {
  id            String         @id @default(cuid())
  clientId      String
  client        User           @relation(fields: [clientId], references: [id])
  processCategory String       // 6대 공정 enum (shared)
  quantity      Int
  dueDate       DateTime
  budget        Int            // 원(₩) 정수
  status        RequestStatus  @default(DRAFT)
  files         RequestFile[]
  quotes        Quote[]
  createdAt     DateTime       @default(now())
}

// Quote, Contract, Payment, Transaction, Dispute, Review 동일 패턴
```

### 9.7 환경변수 (`.env.example` 양쪽 모두)

```bash
# apps/web/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-32-bytes>
SENTRY_DSN=

# apps/api/.env.example
DATABASE_URL="postgresql://user:pass@host/db"
JWT_ACCESS_SECRET=<random-32-bytes>
JWT_REFRESH_SECRET=<random-32-bytes>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
TOSS_SECRET_KEY=
MOOSIN_API_KEY=
SENDGRID_API_KEY=
SENTRY_DSN=
```

---

## 10. 비즈니스 모델 (3년차 105억)

### 10.1 4-Stream 매출 모델

| 수익원                      |                  산식 |               연매출 |
| --------------------------- | --------------------: | -------------------: |
| 거래 수수료 (5%)            |      1,400억 GMV × 5% |          **70억 원** |
| 결제보호 수수료 (1%)        |          1,400억 × 1% |          **14억 원** |
| 공장 멤버십 (39만/월)       | 700 × 50% × 39만 × 12 |       **16.38억 원** |
| 법무·중재 패키지 (300만/건) |         150건 × 300만 |         **4.5억 원** |
| **합계**                    |                       | **약 104.9억 원/년** |

### 10.2 핵심 가정 (3년차)

- 활성 공장: 700개 (전체 65,101개의 **1.1%**)
- 평균 거래액: 5,000만 원/건
- 공장당 연간 거래: 4건
- 공장당 연간 GMV: 2억 원
- 전체 GMV: **1,400억 원** (전체 매출 261조 원의 0.054%)
- 멤버십 전환율: 50%

### 10.3 단위 경제성 (Unit Economics)

| 지표                     |                     값 |
| ------------------------ | ---------------------: |
| 평균 거래액              |             5,000만 원 |
| 매칭 수수료 (건당)       |                 ₩100만 |
| 구독료 (월)              |             ₩15만 평균 |
| 공장당 평균 LTV (24개월) |             ≈ ₩2,400만 |
| 목표 CAC                 | < ₩400만 (LTV/CAC ≥ 6) |

### 10.4 벤치마크 근거

- **CAPA**: 거래 수수료 최대 5%, 멤버십 21만/39만/57만
- **캐스팅엔**: B2B 소싱 평균 중개 수수료 10%
- **은행 B2B 에스크로**: 0.1~0.5%

---

## 11. 시장 분석 (TAM / SAM / SOM)

| 구분    |           값 | 산출 근거                                   |
| ------- | -----------: | ------------------------------------------- |
| **TAM** | **130조 원** | 뿌리산업 전체 매출 261조의 외주 거래율 ~50% |
| **SAM** |  **64조 원** | 수도권 비중 ~25%                            |
| **SOM** | **800억 원** | 1,000개 활성 공장 × 공장당 GMV 8,000만      |

**Disclaimer**: 외주 거래율 50%, 수도권 25%, 침투율 2% — 보수적 가정. 실측 보정 필요.

---

## 12. 경쟁 분석 및 Moat

### 12.1 대안 비교 (4-cell)

| 항목        | 네이버 카페 | 일반 B2B 매칭 | 정부 시스템 | **Rootmatching** |
| ----------- | ----------- | ------------- | ----------- | ---------------- |
| 발주처 검증 | ❌          | 🟡            | 🟡          | ✅               |
| 공장 검증   | ❌          | 🟡            | 🟡          | ✅               |
| 표준 계약   | ❌          | 🟡            | ❌          | ✅               |
| 결제 보호   | ❌          | ❌            | ❌          | ✅               |
| 분쟁 중재   | ❌          | ❌            | 🟡          | ✅               |
| 60대 사용성 | ❌          | ❌            | ❌          | ✅               |
| 공정 특화   | ❌          | ❌            | ❌          | ✅               |

### 12.2 Moat 3축

> **"AI는 6개월이면 따라온다. 이 셋은 3년이 걸린다."**

1. **법적 책임 구조** (Legal Stack) — 전자계약 + 에스크로 + 분쟁 중재 + 약관 + 판례
2. **Vertical SaaS** (6대 공정 도메인) — 공정별 견적·납기·검수 룰
3. **집적지 파트너십** (Network) — 수도권 1,000개 공장 직접 온보딩
4. **(+) Data Moat** — 거래 이력 누적

---

## 13. 로드맵 및 마일스톤 (v0.3 — 재구성)

### Phase 0 — Vue 3 프로토타입 (ARCHIVED 2026-05-26)

> **결과**: 비즈니스 가설 검증 완료, UI 흐름 완성, P0 인증 갭 해결
> **위치**: `dev-vue3-prototype` 브랜치 (main 미반영)
> **활용**: docs/design-system.md (Toss-style 토큰) 새 스택에 그대로 이식

산출물:

- 21개 라우트 UI + 5개 Pinia store + 디자인 시스템
- ESLint + Prettier + vee-validate + zod + pinia-plugin-persistedstate 적용 완료
- Phase A.Week 1+2 작업 종료 (vue-tsc 0, ESLint 0, build 482ms, dev HTTP 200)

새 스택으로 옮길 자산:

- ✅ docs/design-system.md (토큰 그대로)
- ✅ docs/prd/rootmatching-prd.md (현재 문서)
- ✅ rootmatching-deck v1.7 (외부 명세 통과)
- ✅ zod schema 패턴 (vee-validate에서 사용한 logic을 packages/shared로)
- 🟡 21개 라우트 UI 흐름 → Next.js App Router로 재설계 시 참조
- ❌ Vue 컴포넌트 코드 (직접 이식 불가, 패턴만 참조)

### Phase 1 — Next.js + NestJS 모노레포 기반 (NEW)

**Week 1: 모노레포 + 도구 인프라**

- pnpm workspaces 셋업 (`apps/web`, `apps/api`, `packages/shared`)
- 루트 `eslint.config.js` (React 19 + Node 양쪽), `.prettierrc.json`, `tsconfig.base.json`
- Husky + lint-staged (pre-commit lint + format)
- GitHub Actions: lint + typecheck (PR 차단)
- Vercel project 연동 (web preview)

**Week 2: 백엔드 기반 (apps/api)**

- NestJS 11 init + Prisma 6 + Neon PostgreSQL 연결
- User / Company / Auth 도메인 모듈
- JWT (access 15분 + refresh 7일 httpOnly cookie)
- bcrypt cost 12 + zod validation pipe (nestjs-zod)
- `@nestjs/swagger` OpenAPI 자동 문서 (`/api/docs`)
- Supertest E2E: `POST /auth/register` → `POST /auth/login` → `GET /me`
- Railway 데모 배포

**Week 3: 프론트 기반 (apps/web)**

- Next.js 15 init (App Router, React 19)
- Tailwind 3.4 + `docs/design-system.md` 토큰 이식
- shadcn/ui init (Button, Input, Card, Form, Dialog, Badge)
- React Hook Form + `@hookform/resolvers/zod` + shared schema
- Landing, Login, Signup, Dashboard 라우트
- `middleware.ts` 인증 가드 (`/dashboard`, `/admin` 보호)
- API client (`fetch` wrapper + cookie 자동 전송)
- Playwright 스모크: 회원가입 → 로그인 → 대시보드 도달

**Week 4: 통합 + 배포**

- packages/shared 공통 zod schema (User, Company, Request 등)
- Vercel preview 자동 배포 (web)
- Railway preview 자동 배포 (api)
- CI 통합: lint + typecheck + test + build matrix
- 보안 점검: helmet, CORS allowlist, rate limit
- 첫 E2E 통합 테스트 통과

### Phase 2 — 발주 + 매칭 MVP

- Request 도메인 (api) + 발주 폼 (web Server Action)
- 6대 공정 분류 enum/zod (shared)
- 매칭 알고리즘 v1 (점수 기반: 신뢰도 + 납기준수율 + 거리 + 가격대)
- Factory directory + detail page
- Vercel Blob 파일 업로드 (도면, 시방서)

### Phase 3 — 견적 + 계약

- Quote 도메인
- 운영자 정제 큐 (apps/web의 `app/(admin)/quotes` 보호 segment)
- Contract 도메인 + 모두싸인/이폼사인 webhook 연동
- 계약서 PDF 생성 + S3 presigned URL

### Phase 4 — 결제 + 거래

- 토스페이먼츠 에스크로 API (서버사이드)
- Payment webhook + idempotency
- Transaction state machine (xstate 또는 NestJS Guards)
- 검수 승인 → 에스크로 해제 흐름
- 평판/리뷰 적립

### Phase 5 — 분쟁 중재 + 운영 도구

- Dispute 4단계 워크플로
- 운영자 Admin UI 강화 (모니터링 대시보드, CS 도구)
- 카카오 알림톡 (Bizmsg) + 이메일 알림

### Phase 6 — 베타 (집적지 50공장)

- 인천 남동 또는 안산 시화 집적지 50공장 + 5발주처 온보딩
- 11단계 워크플로 end-to-end 검증
- 분쟁/정산 실측 데이터 수집
- 성능/보안 부하 테스트

---

## 14. 측정 지표 (KPIs)

### 14.1 North Star Metric

> **월간 완결 거래 수** (Closed Transactions per Month)

### 14.2 단계별 KPI

#### Acquisition

- 신규 공장 등록 / 월 (목표: MVP 50, 3년차 누적 1,000)
- 신규 발주처 등록 / 월
- 운영자 콜드콜 → 등록 전환율

#### Activation

- 등록 후 첫 견적 요청까지 평균 시간
- 등록 후 첫 견적 제출까지 평균 시간
- 첫 거래 완료 비율

#### Engagement

- **파트너 탐색 리드타임** (목표: 14일 → 3일, -78%)
- 견적 요청당 응답 견적 수
- 활성 공장당 월간 거래 건수 (목표: 0.33건, 연 4건)

#### Revenue

- 월간 GMV
- 월간 매출 (4-stream 합)
- 활성 공장 평균 ARR
- 멤버십 전환율 (목표: 50%)

#### Retention

- 6개월 재거래율
- 멤버십 갱신율
- NPS (발주처 / 공장 각각)

#### Quality

- **분쟁 발생률** (목표: 5~10% → 2~5%, -40%)
- 분쟁 평균 해결 시간
- 검수 반려율
- 결제 사고 건수 (목표: 0)

#### Trust

- 평균 신뢰 점수
- 평판 부정 사례 (월간)

### 14.3 기술 KPI (신규)

- Sentry error rate < 0.5%
- Vercel LCP p75 < 2.5초
- API p95 < 500ms
- CI 평균 통과 시간 < 5분

---

## 15. 리스크 및 가정 (Risks & Assumptions)

### 15.1 사업 리스크

| 리스크                         | 영향              | 대응                           |
| ------------------------------ | ----------------- | ------------------------------ |
| 활성 공장 700개 도달 실패      | 105억 BM 미달     | 집적지 1~2개 집중 → 깊이 우선  |
| 멤버십 전환율 50% 미달         | 16.38억 매출 손실 | 거래 수수료 가중               |
| 일반 SaaS 진입 (네이버/카카오) | 시장 잠식         | 운영자 + 법적 책임 구조로 차별 |
| 정부 시스템 유사 사업          | 정책 정합성 약화  | 협업 모델 (위탁/연계) 검토     |

### 15.2 기술 리스크 (v0.3 갱신)

| 리스크                            | 영향                  | 대응                                     |
| --------------------------------- | --------------------- | ---------------------------------------- |
| Next.js 15 + React 19 안정성      | 신규 버그 가능        | 1~2 minor release 후 production deploy   |
| Prisma → Neon serverless 연결 풀  | Cold start            | Prisma Accelerate 또는 Prisma Data Proxy |
| 전자계약 자체 구현 법적 효력 의문 | 분쟁 시 약점          | MVP는 모두싸인/이폼사인 연계             |
| 토스페이먼츠 에스크로 비용        | 1% 결제보호 마진 압박 | 거래량 확보 후 협상                      |
| 분쟁 중재 자동화 한계             | 운영자 부담 폭증      | 100% Human-in-the-Loop, 비자동화 명시    |
| 60대 사용자 UX 검증 부족          | 도입 실패             | Phase 6 베타 5명+ 60대 공장주 실측       |
| 모노레포 빌드/배포 복잡도         | DevOps 부담           | Turborepo 도입 검토 (Phase 1.Week 4)     |

### 15.3 핵심 가정

- ✅ 검증된 가정:
  - 분쟁 +42% YoY (한국공정거래조정원, 2024)
  - 영세 81.5%, 60대 31.4% (국가뿌리산업진흥센터, 2023)
  - 발표 덱 v1.7 메시지 체인 외부 명세 통과

- ⚠️ 미검증 가정:
  - 외주 거래율 50%, 수도권 25%, 침투율 2%
  - 멤버십 전환율 50%
  - 평균 거래액 5,000만 원, 공장당 연 4건

→ Phase 6 베타에서 실측 보정 필수

### 15.4 명시적 비가정 (Anti-Assumption)

- ❌ "AI가 매칭만 잘하면 시장이 알아서 온다"
- ❌ "거래 표준화는 정부가 할 일"
- ❌ "에스크로는 은행이 더 잘한다"

---

## 16. Phase 0 → Phase 1 전환 분석 (v0.3 — 신규)

### 16.1 Phase 0에서 검증된 사항 (그대로 가져감)

| 영역                 | 검증 결과                               | 새 스택 활용                                    |
| -------------------- | --------------------------------------- | ----------------------------------------------- |
| 비즈니스 메시지 체인 | rootmatching-deck v1.7 외부 명세 통과   | 그대로 적용                                     |
| 디자인 시스템        | docs/design-system.md (Toss-style 토큰) | Tailwind 토큰으로 1:1 이식                      |
| 11단계 워크플로      | UI 흐름 프로토타입 완성                 | Next.js App Router 라우트 구조로 재설계         |
| 6대 공정 분류        | 도메인 enum 명시                        | shared/constants/processes.ts                   |
| 폼 검증 패턴         | vee-validate + zod                      | React Hook Form + zod (동일 schema 재사용 가능) |
| 인증 흐름            | mock 단계 P0 갭 해결                    | NestJS JWT + Next.js middleware로 production화  |
| 라우터 가드          | meta.public + beforeEach                | Next.js `middleware.ts` matcher                 |
| Persistence          | pinia-plugin-persistedstate             | httpOnly cookie + DB session                    |

### 16.2 Phase 0의 미해결 갭 (Phase 1+에서 해결)

| #   | 갭                             | Phase 1+ 해결 방안                                            |
| --- | ------------------------------ | ------------------------------------------------------------- |
| 1   | API 레이어 0줄                 | apps/api 전체가 그 자체                                       |
| 2   | 발주처 요청 ↔ 공장 수신함 단절 | Prisma FK (Request.id ← Quote.requestId)                      |
| 3   | progressRate=100 기본값 버그   | Transaction state machine + 단계 가중치                       |
| 4   | trustScore 단위 충돌           | shared `TrustScore = z.number().min(0).max(100)`              |
| 5   | 금액 단위 불일치               | shared 모든 금액 = 원(₩) 정수, 포맷팅 layer 분리              |
| 6   | 운영자 Admin 부재              | `apps/web/app/(admin)/*` 보호 segment                         |
| 7   | 전자계약 실제 구현 부재        | 모두싸인 webhook 연동 (Phase 3)                               |
| 8   | PG 연동 부재                   | 토스페이먼츠 escrow (Phase 4)                                 |
| 9   | User.role 불일치               | shared `UserRole = z.enum(['client', 'factory', 'operator'])` |
| 10  | 테스트 인프라 0개              | Vitest + Playwright + Supertest (Phase 1)                     |

### 16.3 새로 발생한 Phase 1 갭 (현재 0줄에서 시작)

> 코드베이스가 비어 있으므로 Phase 1 Week 1~4 작업이 사실상 모든 신규 구현이다. 별도 Gap 목록 불필요.

---

## 17. References / 부록

### 17.1 자료 출처

#### 정부 통계 (G)

- 국가뿌리산업진흥센터 (2023) — 뿌리산업 실태조사
- 한국공정거래조정원 (2024) — 분쟁조정 현황 보고서
- 산업통상자원부 — 뿌리산업진흥과 5개년 계획

#### 언론 (M)

- 캐스팅엔, CAPA 벤치마크
- 토스페이먼츠 · KCP · 네이버페이 B2B 결제 동향

#### 학술 (A)

- Strategyzer — Value Proposition Canvas
- KIET 산업연구원 — 뿌리산업 디지털 전환 연구

#### 법적 근거

- 전자문서 및 전자거래 기본법 §4 · §4의2 · §5

### 17.2 정책 정합성

- **중기부 MSS** — 상생결제 / 납품대금 보호
- **소진공 SEMAS** — 영세 사업장 디지털 전환
- **산자부 MOTIE** — 뿌리산업진흥과 5개년 계획

### 17.3 핸드오프 / 참고 문서

| 파일                                                     | 역할                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| `HANDOFF (rootmatching-deck v1.7)`                       | 본문 24장 + Appendix 10장, 외부 명세 통과 — **PRD 핵심 근거**   |
| `session-handoff-2026-04-28-rootmatching-deck-expansion` | 8장 → 12장 캡스톤 발표 덱 확장                                  |
| `session-handoff-2026-04-28-rootmatching-md`             | IR PDF 24장 → MD 19/24장 변환 (5장 누락)                        |
| `docs/design-system.md`                                  | RootMatching 디자인 시스템 (Toss-style) — Phase 1에 그대로 이식 |
| `docs/prd/rootmatching-prd.md`                           | 본 문서 — PRD 단일 진실원                                       |
| `dev-vue3-prototype` 브랜치                              | Phase 0 Vue 3 프로토타입 (UI 패턴 레퍼런스)                     |

### 17.4 결정된 사항 / 남은 결정

#### 결정됨 (v0.3)

| 항목                | 결정                                                                     |
| ------------------- | ------------------------------------------------------------------------ |
| 기술 스택 (프론트)  | **Next.js 15 (App Router, React 19)**                                    |
| 기술 스택 (백엔드)  | **NestJS 11 + Prisma 6 + PostgreSQL**                                    |
| 저장소 구조         | **pnpm workspaces 모노레포** (`apps/web`, `apps/api`, `packages/shared`) |
| Vue 코드 처리       | `dev-vue3-prototype` 브랜치 보존, main 미반영                            |
| 디자인 시스템       | `docs/design-system.md` 토큰 Tailwind로 이식                             |
| 폼 라이브러리 (web) | React Hook Form + zod                                                    |
| User.role           | `client \| factory \| operator` (Prisma enum + shared zod)               |
| 금액 단위           | 원(₩) 정수 (DB), 포맷팅 layer만 만원 표시                                |
| trustScore 단위     | 0~100 정수                                                               |
| 인증 방식           | NestJS JWT (access 15분 + refresh 7일 httpOnly)                          |
| 데이터베이스        | Neon (PostgreSQL serverless)                                             |
| 배포                | Vercel (web) + Railway/Fly (api)                                         |
| 전자계약            | 외부 연계 (모두싸인 또는 이폼사인)                                       |
| PG                  | 토스페이먼츠                                                             |

#### 남은 결정

| 항목                 | 옵션                                     | 결정 시점       |
| -------------------- | ---------------------------------------- | --------------- |
| Tailwind 버전        | 3.4 (안정) vs 4.x (최신)                 | Phase 1.Week 3  |
| Turborepo 도입       | pnpm workspaces 단독 vs +Turborepo       | Phase 1.Week 4  |
| Auth 라이브러리      | Next-Auth v5 vs 자체 JWT 클라이언트      | Phase 1.Week 3  |
| Server State         | TanStack Query vs Server Components 위주 | Phase 1.Week 3  |
| BM 단위 시뮬레이션   | 100개 vs 700개 vs 1,000개 단위 통일 여부 | Phase 6 베타 후 |
| 카카오 알림톡 공급자 | NHN Toast vs Bizmsg                      | Phase 5         |

---

## 변경 이력

| 버전     | 날짜           | 변경 사항                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v0.1     | 2026-05-26     | 초안 작성 — 3개 핸드오프 문서 + 디자인 시스템 + 현재 코드베이스 통합                                                                                                                                                                                                                                                                                                                                                                 |
| v0.2     | 2026-05-26     | **Phase A.Week 1+2 실행 완료** (Vue 3 기반). 환경 정리(pnpm 단일화 / next-env 제거 / ESLint+Prettier 도입) + 인증 안정화(mock credential 제거 / Pinia persistence / Vue Router 가드 / vee-validate+zod). 모든 검증 통과 (vue-tsc 0, ESLint 0, Prettier 0, vite build 482ms, dev HTTP 200). User.role 충돌 §17.4 등록.                                                                                                                |
| **v0.3** | **2026-05-26** | **스택 전환 결정**. Vue 3 + Pinia + Vite → **Next.js 15 + NestJS 11 + Prisma + PostgreSQL** (pnpm workspaces 모노레포). Phase 0 Vue 프로토타입은 `dev-vue3-prototype` 브랜치로 보존. PRD 위치 `.sisyphus/prd/` → `docs/prd/` 이동. §9 기술 아키텍처 전면 재작성, §13 로드맵 재구성 (Phase 0 archived + Phase 1~6 신규), §16 Phase 전환 분석 신설, §17.4 결정/미결정 사항 정리. 비즈니스 부분(§1~§5, §10~§12, §14~§15)은 v0.2와 동일. |
