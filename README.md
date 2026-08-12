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
- 검색은 WAS가 MCP `search_documents`를 호출한 결과만 표시합니다.
- 원문 화면은 PDF.js canvas와 text layer로 정확한 document/version/page를 렌더링합니다.
