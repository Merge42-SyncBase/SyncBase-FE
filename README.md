# SyncBase Frontend

React 기반 운영 콘솔입니다. 브라우저 메모리 mock을 사용하지 않으며, same-origin
`/api/v1`을 통해 Go WAS에만 연결합니다. PostgreSQL 접근 권한, MCP 토큰, 임베딩 모델은
브라우저에 전달되지 않습니다.

## Local development

Go API를 먼저 `127.0.0.1:8080`에서 실행한 뒤 다음을 실행합니다.

```sh
npm ci
npm run dev
```

Vite 개발 서버는 `/api`를 Go API로 proxy합니다. 다른 주소를 쓰려면
`VITE_API_ORIGIN=http://host:port npm run dev`로 실행합니다.

## Production container

Nginx는 정적 SPA와 `/api/` reverse proxy를 제공하고 업로드 제한을 100MB로 맞춥니다.
컨테이너 네트워크에서 Go API 서비스 이름은 `api`여야 합니다.

```sh
docker build -t syncbase/web:local .
```

## Functional boundaries

- 로그인은 Go WAS가 발급하는 HttpOnly 세션 쿠키와 CSRF 토큰을 사용합니다.
- PDF 등록은 서버 preflight, SHA-256, request key 기반 recovery를 거칩니다.
- 문서 상세는 실제 Worker 상태를 polling합니다.
- 문서명은 중복을 허용하되 등록 전에 같은 정규화 이름을 안내하며, 목록은 UUID의 짧은 표기를 함께 보여 구분합니다.
- 검색은 WAS가 MCP `search_documents`를 호출한 결과와 명시적인 grounding 상태만 표시합니다.
- 원문 화면은 인증된 PDF.js canvas와 text layer로 정확한 Document·Version·페이지를 렌더링합니다.
- 현재 백엔드가 발급하는 사용자 역할은 `DOCUMENT_ADMIN`뿐입니다. 프론트엔드는 그 외 런타임 역할을 근거 검색으로 안내할 준비가 되어 있지만, 일반 팀원 역할·endpoint RBAC는 별도 백엔드 의존성입니다.

## Documentation

- [Evidence Workbench reference](docs/reference-evidence-workbench.md) — 역할별 셸, route, 검색·원문·Document 운영 계약
- [How to verify the Evidence Workbench](docs/how-to-verify-evidence-workbench.md) — 자동 검사와 두 핵심 사용자 여정의 재현 절차
- [Design system](DESIGN.md) — SyncBase 시각 토큰, 레이아웃, 구성요소 규칙
- [Evidence Workbench surface brief](.impeccable/surfaces/route-search.md) — 승인된 `/search` 제품·화면 결정
