---
title: 'SyncBase Web Docker 실행 기반'
type: 'chore'
created: '2026-08-11'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'c995738404b8632ede5995e73c5cef49fa37d26d'
context:
  - 'project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Web MVP가 로컬 Node 환경에서만 실행되어 재현과 향후 Compose 통합이 어렵다. 프론트 역할은 서비스 자격과 섞지 않고 세 개로 유지해야 한다.

**Approach:** `projects/web`에 개발·테스트·운영용 멀티스테이지 이미지와 독립 Compose를 추가한다. 테스트는 로컬과 Docker 중 선택하며 `DOCUMENT_ADMIN`, `AI_SEARCH_USER`, `OPERATOR`만 노출한다.

## Boundaries & Constraints

**Always:** `projects/web`만 변경한다. `npm ci`를 사용한다. 운영 이미지는 정적 `dist/`와 SPA fallback만 제공한다. Docker 테스트는 Vitest run 모드로 종료되어야 한다. 기존 로컬 명령과 mock 경계를 유지한다.

**Ask First:** API 프록시·환경변수 계약, 루트 Compose, Web 밖 변경, 새 런타임 의존성이 필요할 때.

**Never:** 다른 프로젝트를 수정하거나 `MCP_CLIENT`를 사용자 역할로 노출하지 않는다. Docker 실행을 실제 Backend·MCP·OpenSQL 연동으로 설명하지 않는다.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| 로컬 테스트 | Node/npm | `npm run test:run` 전체 통과 | 실패 종료 코드 전달 |
| Docker 테스트 | test 프로필 | 같은 테스트를 한 번 실행 후 종료 | 빌드·테스트 실패 전달 |
| Docker 개발 | dev 프로필 | 5173에서 Vite 접근·소스 반영 | 0.0.0.0 바인딩 |
| Docker 운영 | web 서비스 | 8080에서 정적 앱 접근 | SPA 경로는 `index.html` fallback |

</frozen-after-approval>

## Code Map

- `projects/web/package.json` -- 로컬 및 Docker 실행·테스트 진입점
- `projects/web/Dockerfile` -- 개발·테스트·빌드·운영 이미지
- `projects/web/compose.yaml` -- web 및 선택형 dev/test 서비스
- `projects/web/nginx.conf` -- 정적 파일과 SPA fallback
- `projects/web/.dockerignore` -- 불필요한 빌드 컨텍스트 제외
- `projects/web/README.md` -- 실행법과 mock 경계
- `projects/web/src/domain.ts` -- 세 사용자 역할 타입

## Tasks & Acceptance

**Execution:**
- [x] `Dockerfile`, `.dockerignore`, `nginx.conf` -- 멀티스테이지 이미지와 SPA 정적 서버 구성
- [x] `compose.yaml` -- 기본 web과 선택형 dev/test 서비스 구성
- [x] `package.json`, `README.md` -- 로컬/Docker 명령과 세 역할·mock 범위 문서화
- [x] 역할 코드와 테스트 -- 세 역할만 노출되는지 회귀 확인

**Acceptance Criteria:**
- Docker 운영 서비스는 8080에서 `/`와 직접 SPA 경로를 제공한다.
- 로컬과 Docker 테스트는 같은 Vitest 전체 테스트를 한 번 실행해 통과한다.
- dev 프로필은 5173에서 Vite 앱을 제공한다.
- 로그인에는 세 사용자 역할만 있고 `MCP_CLIENT`는 없다.
- Web 이미지는 다른 프로젝트 없이 독립적으로 빌드된다.

## Spec Change Log

## Design Notes

개발·테스트는 Node 단계를 공유하고 운영 단계는 정적 산출물만 담는다. API 계약이 없으므로 다른 서비스 의존성은 추가하지 않는다.

## Verification

**Commands:**
- `npm run test:run && npm run build` -- 로컬 검증 통과
- `docker compose config` -- Compose 유효
- `docker compose --profile test run --build --rm web-test` -- Docker 테스트 통과
- `docker compose up -d --build web` 후 `/`, `/documents` 확인 -- 두 경로 응답 성공

## Suggested Review Order

**컨테이너 실행 경계**

- Node 개발·테스트와 Nginx 운영 산출물을 한 멀티스테이지 이미지로 분리합니다.
  [`Dockerfile:3`](../Dockerfile#L3)

- 기본 운영 서비스와 선택형 개발·테스트 프로필의 결합 지점입니다.
  [`compose.yaml:2`](../compose.yaml#L2)

- 개발 시작마다 lockfile 의존성을 동기화하고 localhost에만 공개합니다.
  [`compose.yaml:10`](../compose.yaml#L10)

- SPA fallback, 정적 404, 캐시·보안 헤더를 한곳에서 통제합니다.
  [`nginx.conf:1`](../nginx.conf#L1)

**개발자 실행 경험**

- 로컬·Docker 명령과 지원 Node 버전의 공식 진입점입니다.
  [`package.json:6`](../package.json#L6)

- 실행 방식, 포트, mock 경계, 종료·정리 절차를 설명합니다.
  [`README.md:7`](../README.md#L7)

**역할과 재현성 검증**

- 로그인 선택지가 정확히 세 사용자 역할인지 접근 가능한 버튼으로 검증합니다.
  [`App.test.tsx:21`](../src/app/App.test.tsx#L21)

- 로컬 민감 설정과 산출물이 이미지 컨텍스트에 들어가지 않게 합니다.
  [`.dockerignore:8`](../.dockerignore#L8)

- package의 Node 엔진 계약을 lockfile에도 동일하게 고정합니다.
  [`package-lock.json:10`](../package-lock.json#L10)
