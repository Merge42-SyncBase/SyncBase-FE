# SyncBase Web

SyncBase의 제품 UI를 검증하기 위한 `React + TypeScript + Vite` 프론트엔드 MVP입니다. 로컬 Node 환경과 Docker 중 원하는 실행 방식을 선택할 수 있으며, 운영용 컨테이너는 빌드된 SPA 정적 파일만 제공합니다.

> 현재 버전은 화면과 사용자 흐름을 확인하는 **mock 데모**입니다. 인증, 문서 처리, OpenSQL 장애 전환, Worker, MCP 동작은 실제 서비스와 연결되지 않고 브라우저 메모리에서 시뮬레이션됩니다.

## 로컬에서 실행하기

Node.js 24.15 이상과 npm이 필요합니다.

```bash
npm ci
npm run dev
```

터미널에 표시되는 로컬 주소를 브라우저에서 열고, `/login`에서 데모 역할을 선택합니다. 현재 별도의 환경변수는 필요하지 않습니다.

테스트와 운영 빌드도 로컬에서 실행할 수 있습니다.

```bash
npm run test:run
npm run build
```

## Docker로 실행하기

운영 형태의 정적 Web은 기본 `web` 서비스로 실행합니다.

```bash
npm run docker:up
```

브라우저에서 <http://localhost:8080>을 엽니다. `/documents`처럼 SPA 경로로 직접 접근해도 Nginx가 `index.html`로 연결합니다. 포트를 바꾸려면 `SYNCBASE_WEB_PORT`를 지정합니다.

```bash
SYNCBASE_WEB_PORT=8081 npm run docker:up
```

소스 변경을 반영하는 Vite 개발 서버는 `dev` 프로필을 사용합니다.

```bash
npm run docker:dev
```

기본 주소는 <http://localhost:5173>이며 `SYNCBASE_WEB_DEV_PORT`로 호스트 포트를 바꿀 수 있습니다. 시작할 때 `npm ci`가 실행되어 lockfile과 개발용 볼륨의 의존성을 맞춥니다. 종료할 때는 실행 중인 터미널에서 `Ctrl+C`를 누른 뒤 `docker compose down`을 실행합니다. 개발용 의존성 볼륨까지 지우려면 `docker compose down --volumes`를 사용합니다.

Docker 안에서 전체 테스트를 한 번 실행하려면 다음 명령을 사용합니다.

```bash
npm run test:docker
```

이 Compose 파일은 Web 저장소만으로 독립 실행됩니다. 향후 팀 공용 Compose에는 `web` 서비스의 빌드 컨텍스트를 이 저장소 경로로 연결하면 되며, 현재는 Backend·Worker·MCP·OpenSQL 서비스 의존성을 선언하지 않습니다.

## 주요 명령

| 명령 | 설명 |
|---|---|
| `npm run dev` | 로컬 Vite 개발 서버 실행 |
| `npm run test:run` | 로컬에서 전체 테스트를 한 번 실행 |
| `npm run build` | 로컬에서 타입 검사 후 `dist/` 생성 |
| `npm run preview` | 로컬에서 빌드 결과 확인 |
| `npm run docker:build` | 운영용 Web 이미지 빌드 |
| `npm run docker:up` | 운영용 Web을 8080 포트에서 실행 |
| `npm run docker:dev` | Docker Vite 개발 서버를 5173 포트에서 실행 |
| `npm run test:docker` | Docker에서 전체 테스트를 한 번 실행 |

## MVP에서 확인할 수 있는 것

- `DOCUMENT_ADMIN`, `AI_SEARCH_USER`, `OPERATOR` 세 사용자 역할 선택
- 문서 목록, PDF 등록, 새 버전 등록과 처리 상태 변화
- 정상 처리, 재시도 가능 오류, 최종 실패 시나리오
- 장애 발생 중 쓰기 잠금과 복구 후 처리 재개
- 활성 문서 버전과 mock 원문 페이지 근거 UI 확인

기본 시연은 다음 순서로 진행하면 됩니다.

1. 문서 관리자로 로그인합니다.
2. 기존 문서에 새 버전을 등록한 뒤 바로 문서 목록으로 돌아갑니다.
3. 새 버전이 `ACTIVE`가 되기 전에 장애 화면을 재생하고, 등록과 처리가 잠긴 채 기존 활성 버전이 유지되는지 확인합니다.
4. 복구 화면을 재생해 처리가 다시 진행되고 `ACTIVE`가 되는지 확인합니다.
5. AI 검색 사용자로 다시 들어가 활성 버전의 mock 원문 페이지 UI를 확인합니다.

## 프로젝트 구조

```text
src/
├── app/          라우팅과 로그인 경계
├── components/   공통 UI와 장애·복구 컨트롤
├── demo/         메모리 기반 데이터와 상태 전환
├── pages/        문서 목록·등록·상세·원문 화면
├── test/         테스트 설정과 PDF fixture
└── domain.ts     역할·문서·처리 상태 타입
```

새로고침하면 데모 데이터가 초기 상태로 돌아갑니다. 실제 연동 단계에서는 `DemoProvider`를 Go API adapter로 교체하되, Web은 UI와 사용자 상호작용만 담당하고 인증·RBAC·문서 처리의 최종 판단은 Go API에 둡니다.
