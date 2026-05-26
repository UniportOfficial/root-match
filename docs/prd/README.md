# Rootmatching PRD — 버전 관리

이 디렉토리는 Rootmatching 제품의 단일 진실원(Single Source of Truth) PRD를 관리합니다.

## 파일 구조

```
docs/prd/
├── README.md                   # 본 문서 (버전 관리 정책)
├── rootmatching-prd.md         # 현재 활성 PRD (최신 버전만 유지)
└── archive/                    # 메이저 변경 스냅샷 (선택)
    └── v0.2-vue3-snapshot.md   # Phase 0 Vue 프로토타입 PRD (필요 시)
```

## 버전 관리 정책

### 단일 파일 + 내부 changelog (기본)

- **`rootmatching-prd.md`만이 활성 PRD**입니다.
- 모든 변경 사항은 파일 끝의 **"변경 이력"** 섹션에 누적합니다.
- 메타 헤더의 `버전` 필드와 `상태` 필드를 동시에 업데이트합니다.
- 메이저 변경(스택 전환, 비즈니스 모델 변경) 시 `archive/v<old>-<reason>.md`로 스냅샷 보존.

### Semver 규칙

| 변경 종류 | 버전 증가 |
|---|---|
| 오타 · 표현 정리 · 작은 보강 | patch 없이 동일 버전에 추가 |
| 새 섹션 · 기능 요구사항 추가 · 우선순위 조정 | minor (`v0.2` → `v0.3`) |
| **스택 전환 · 비즈니스 모델 변경 · 전면 재구성** | minor 또는 major (`v0.x` → `v1.0`) + archive 스냅샷 권장 |

### 변경 이력 형식

```markdown
| 버전 | 날짜 | 변경 사항 |
|---|---|---|
| vX.Y | YYYY-MM-DD | 핵심 한 줄. 변경 영역(§N) 명시. 검증 결과(있다면) 포함. |
```

## 현재 상태

| 항목 | 값 |
|---|---|
| 활성 버전 | **v0.3** (2026-05-26) |
| 활성 파일 | `rootmatching-prd.md` |
| 이전 위치 | `.sisyphus/prd/` (v0.1 / v0.2 — 2026-05-26에 이전 후 폐기) |
| 다음 마일스톤 | Phase 1.Week 1~4 완료 후 v0.4 발행 예정 |

## 작성 / 수정 가이드

1. **변경 전**: 본 README의 정책 확인 + 변경 영역 식별
2. **변경 중**: 가능하면 한 PR에 한 가지 주제만 (검토 부담 ↓)
3. **변경 후**:
   - 메타 헤더 `버전`/`상태` 업데이트
   - 끝의 "변경 이력" 표에 entry 추가
   - 영향받는 다른 섹션(예: §13 로드맵, §16 Gap) 일관성 유지
4. **메이저 변경**: `archive/`에 스냅샷 (e.g., `archive/v0.2-vue3-snapshot.md`)

## 참고 문서

- `docs/design-system.md` — Rootmatching 디자인 시스템 (Toss-style)
- `dev-vue3-prototype` 브랜치 — Phase 0 Vue 프로토타입 (코드 레퍼런스만)
- 외부 참고: rootmatching-deck v1.7 (캡스톤 발표 덱)
