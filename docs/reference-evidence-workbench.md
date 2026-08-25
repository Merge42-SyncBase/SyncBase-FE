# Evidence Workbench reference

Evidence Workbench는 인증된 사용자가 조직 지식을 검색하고, 검색 결과를 정확한 Document·Version·Original 페이지까지 추적하는 SyncBase 프론트엔드 경험입니다. 같은 앱 셸에서 문서 운영 관리자는 Document 등록과 Version 처리도 관리합니다.

이 문서는 현재 프론트엔드 구현의 route, 역할 분기, 브라우저 API 계약, 상태 표현을 설명합니다. 서버의 검색 알고리즘이나 Processing run 정책은 각 백엔드 저장소의 문서를 기준으로 확인해야 합니다.

## 역할과 권한 경계

| 세션의 `user.role` | 기본 진입 | 표시되는 주 메뉴 | 현재 지원 상태 |
|---|---|---|---|
| `DOCUMENT_ADMIN` | `/documents` | 근거 검색, 문서 운영 | 프론트엔드와 백엔드 모두 지원 |
| 그 밖의 런타임 값 | `/search` | 근거 검색 | 프론트엔드 셸만 준비됨 |

`src/auth/roles.ts`는 백엔드에 없는 일반 팀원 역할 이름을 만들어내지 않습니다. `DOCUMENT_ADMIN`만 관리자라고 판정하고, 그 밖의 값은 검색 중심 셸로 보냅니다. 프론트엔드는 Document 운영 메뉴를 숨기고 직접 운영 route도 `/search`로 돌려보내지만, 이는 탐색 경험을 위한 방어선이지 authorization 경계가 아닙니다. `/api/v1` endpoint의 최종 권한 검사는 Go WAS가 담당해야 합니다.

현재 `Session` 타입과 백엔드는 `DOCUMENT_ADMIN`만 지원합니다. 실제 일반 팀원 운영을 완료하려면 다음 백엔드 작업이 선행되어야 합니다.

- 일반 팀원 역할의 공식 명칭과 세션 응답 계약 확정
- 검색·source·raw PDF 읽기 권한과 Document 등록·Version 관리·재시도 권한의 endpoint별 RBAC
- 새 역할을 포함한 프론트엔드 `User.role` 타입 갱신
- 두 역할을 사용하는 브라우저 통합 테스트

## Route

모든 제품 route는 세션이 필요합니다. 세션이 없으면 `/login?next=<원래 경로>`로 이동하며, 로그인 후 안전한 same-origin 상대 경로만 복원합니다.

| Route | 화면 | 주요 동작 |
|---|---|---|
| `/login` | 공용 SyncBase 로그인 | HttpOnly 세션 생성, 역할별 기본 화면 이동 |
| `/search` | 근거 검색 작업대 | 질문 제출, 결과 비교, 선택한 Original 페이지 인라인 확인 |
| `/sources/:documentID/versions/:version?page=:page` | 원문 전용 화면 | 고정된 Document·Version 안에서 페이지 이동과 배율 조절 |
| `/documents` | 문서 운영 현황 | Document 목록·검색 가능 Version·처리/실패 수 확인, 이름 필터 |
| `/documents/new` | 새 Document 등록 | PDF preflight, 이름 확인, 등록 및 request key recovery |
| `/documents/:documentID` | Document 상세 | Version ledger, ACTIVE Version, 처리 단계, 오류와 재시도 확인 |
| `/documents/:documentID/versions/new` | 새 Version 등록 | 기존 Document에 새 PDF Version 등록 |

알 수 없는 route와 앱 루트 `/`는 현재 세션 역할의 기본 화면으로 이동합니다. 원문 전용 화면의 뒤로 가기 대상은 호출 화면이 전달한 안전한 내부 경로를 사용하고, 값이 없거나 안전하지 않으면 관리자는 Document 상세, 그 밖의 역할은 근거 검색으로 돌아갑니다.

## 브라우저 API 계약

모든 요청은 same-origin `/api/v1`을 사용하고 `credentials: "include"`로 세션 쿠키를 전송합니다. 상태 변경 요청은 로그인 요청을 제외하고 `X-CSRF-Token`을 사용합니다. 브라우저는 OpenSQL 자격 증명, MCP 토큰, 임베딩 모델을 직접 받지 않습니다.

| Method 및 경로 | 프론트엔드 동작 | 기본값·제약 |
|---|---|---|
| `POST /api/v1/session` | 로그인 | JSON `username`, `password` |
| `GET /api/v1/session` | 앱 시작 시 세션 복원 | `SESSION_EXPIRED`이면 로그인 상태 해제 |
| `DELETE /api/v1/session` | 로그아웃 | CSRF 필요 |
| `GET /api/v1/search?q=&limit=` | 근거 검색 | 기본 `limit=10`; 응답을 런타임 검증 |
| `GET /api/v1/documents/:id/versions/:version/source?page=` | 원문 메타데이터 | Version·페이지는 1 이상의 정수; 응답 페이지는 전체 페이지 이하 |
| `GET /api/v1/documents/:id/versions/:version/raw.pdf` | 인증된 Original PDF | PDF.js가 `withCredentials`로 요청 |
| `GET /api/v1/documents?limit=&offset=` | Document 목록 | 기본 `limit=100`, `offset=0` |
| `GET /api/v1/documents/name-matches?name=` | 정규화 이름 일치 안내 | 새 Document 등록만 사용; 실패해도 등록은 계속 가능 |
| `GET /api/v1/documents/:id` | Document와 Version 상세 | 상세 envelope를 런타임 검증 |
| `POST /api/v1/uploads/preflight` | PDF 사전 검사 | multipart `file`, CSRF 필요 |
| `POST /api/v1/documents` | 새 Document 등록 | multipart `file`, `documentName`, `requestKey`, CSRF 필요 |
| `POST /api/v1/documents/:id/versions` | 새 Version 등록 | multipart `file`, `requestKey`, CSRF 필요 |
| `GET /api/v1/uploads/recovery/:requestKey` | 유실된 등록 응답 복구 | request key는 path에서 URL encoding |
| `POST /api/v1/processing-runs/:runID/retry` | 허용된 수동 재시도 | JSON `requestKey`, CSRF 필요 |

오류 응답은 `error.code`, `error.message`, `error.retryable`을 가진 안정된 envelope를 사용합니다. 프록시가 JSON 오류를 만들기 전에 실패하면 프론트엔드는 HTTP 상태에 기반한 일반 오류로 변환합니다. 검색·source·Document 상세·이름 일치 응답이 계약을 위반하면 `502 INVALID_RESPONSE`로 다룹니다.

## 검색과 grounding

검색 응답은 다음 두 상태 중 하나입니다.

| `grounding_status` | `grounding_reason` | 화면 의미 |
|---|---|---|
| `SUPPORTED` | `null` | 반환된 결과를 순위와 의미 유사도 순으로 표시 |
| `INSUFFICIENT_EVIDENCE` | `NO_HITS_ABOVE_POLICY` | 정책 기준을 충족한 근거가 없음 |
| `INSUFFICIENT_EVIDENCE` | `ONLY_INACTIVE_VERSION_MATCHED` | 이전 Version에만 일치하고 ACTIVE Version에는 근거가 없음 |
| `INSUFFICIENT_EVIDENCE` | `SOURCE_UNAVAILABLE` | 내부 검색 source를 확인할 수 없음 |

각 검색 결과는 양의 정수 `rank`, 유한한 숫자 `score`, Document와 Version ID, Document 표시 이름, 양의 Version 번호와 페이지 번호, `snippet`, `source_url`을 포함해야 합니다. 기존 WAS/MCP 계약처럼 `source_url`이 절대 URL이어도 내부 `/sources/:documentID/versions/:version?page=:page` 구성요소가 근거 식별자와 일치하면 받아들이고 same-origin 상대 route로 정규화합니다. 프론트엔드는 snippet을 Original로 가장하지 않으며, 첫 결과를 자동 선택한 뒤 사용자가 다른 결과를 선택할 수 있게 합니다.

## 근거 추적과 PDF 렌더링

근거는 다음 연결을 보존합니다.

```text
SearchResult
  ├─ document_id + document_name
  ├─ version_id + document_version
  ├─ page_number
  └─ source_url
          ↓
Source metadata
  ├─ 같은 Document·Version·페이지 검증 정보
  ├─ pageCount
  └─ authenticated rawPdfUrl
          ↓
Original PDF page: canvas + selectable text layer
```

공유 PDF 렌더러는 PDF.js Worker를 사용하고, 컨테이너 너비와 기기 pixel ratio에 맞춰 canvas를 그립니다. 같은 viewport의 text layer를 함께 렌더링하므로 텍스트 선택과 보조 기술용 문서 구조를 유지합니다. 배율은 `75%`, `100%`, `125%`, `150%`이며, 원문 전용 화면의 페이지 이동은 `1..pageCount`로 제한됩니다.

브라우저 API 계층은 search 결과의 `source_url`이 같은 Document·Version·페이지 route인지 확인하고, source 응답도 요청한 세 식별자와 정확히 일치할 때만 렌더러로 넘깁니다. grounding 상태와 결과 존재 여부가 충돌하거나 source 식별자가 달라지면 `INVALID_RESPONSE`로 fail closed합니다.

source 메타데이터를 불러오지 못하면 원문 전용 화면 경로를 제공합니다. 메타데이터는 성공했지만 인라인 PDF 렌더링이 실패하면 정확한 `rawPdfUrl#page=<page>`와 원문 전용 화면을 모두 제공해 provenance를 잃지 않습니다.

## Document 운영 상태

문서 운영 현황은 5초마다 목록을 새로 읽고 다음 수치를 계산합니다.

- 전체 Document
- `activeVersion`이 있는 검색 가능 Document
- 최신 상태가 `QUEUED` 또는 `PROCESSING`인 처리 중 Document
- 최신 상태가 `FAILED`인 확인 필요 Document

Document 상세는 2.5초마다 갱신하며 Version별 `METADATA → PARSE → CHUNK → EMBED → STORE → ACTIVATE` 상태를 표시합니다. 현재 검색에 노출된 Version은 `active: true`와 별도 표시로 구분합니다. `manualRetryAllowed`가 참일 때만 처리 재시도 버튼을 표시하고 새 request key와 CSRF 토큰으로 재시도를 요청합니다.

등록 화면은 클라이언트에서 PDF 확장자/MIME과 100MB 한도를 먼저 확인하고, 서버 preflight 결과의 파일명·크기·페이지 수·SHA-256을 표시합니다. 서버가 최종 형식과 500페이지 한도를 판단합니다. Document 이름은 trim 후 1~200자이며, 같은 정규화 이름은 경고하지만 별도 Document 등록을 막지 않습니다.

request key는 route별 `localStorage`에 저장하고 서버가 계산한 SHA-256에 연결합니다. 제출 응답이 유실되면 `not_committed`, `pending`, `accepted`, `conflict`, `expired` recovery 상태를 확인합니다. 브라우저가 recovery 상태를 안정적으로 저장하지 못하면 등록을 차단합니다.

## 접근성과 반응형 계약

- 키보드 사용자는 첫 Tab에서 본문 건너뛰기 링크를 사용할 수 있습니다.
- 검색 결과 선택은 `aria-pressed`, 비동기 검색·PDF 렌더링은 live/status 또는 busy 상태를 제공합니다.
- PDF canvas는 장식 출력으로 숨기고, 같은 페이지의 text layer를 `role="document"` 영역 안에 둡니다.
- 980px 이하에서는 레일이 상단 셸로 바뀌며 로그아웃은 계속 표시됩니다.
- 560px 이하에서는 메뉴 아이콘을 줄이고 검색 → 결과 → 근거 순서의 한 열 흐름을 사용합니다.
- 모션 감소 설정에서는 비필수 animation과 transition을 제거합니다.

## Related

- [How to verify the Evidence Workbench](how-to-verify-evidence-workbench.md)
- [SyncBase product commitments](../PRODUCT.md)
- [Evidence Workbench surface brief](../.impeccable/surfaces/route-search.md)
- [Web Docker runtime specification](spec-web-docker-runtime.md)
