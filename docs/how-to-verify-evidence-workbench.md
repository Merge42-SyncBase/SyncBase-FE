# How to verify the Evidence Workbench

이 가이드는 Evidence Workbench의 production build, 자동 회귀 검사, 일반 팀원 관점의 근거 검증 여정, 문서 운영 관리자 여정을 재현합니다.

## Prerequisites

- Node.js 22 이상과 npm 10 이상
- `127.0.0.1:8080`에서 실행 중인 SyncBase Go WAS
- WAS가 발급한 `DOCUMENT_ADMIN` 계정
- 텍스트가 포함된 PDF Original 한 개
- 320px 또는 390px viewport를 확인할 수 있는 최신 브라우저

현재 백엔드는 일반 팀원 역할을 발급하지 않습니다. 따라서 검색 여정은 관리자 세션으로 기능을 검증할 수 있지만, 실제 일반 팀원 메뉴·RBAC 통합 검증은 백엔드 역할 계약이 추가된 뒤 수행해야 합니다.

## Steps

1. 의존성을 lockfile 그대로 설치합니다.

   ```sh
   npm ci
   ```

2. production build와 전체 Vitest 회귀 검사를 실행합니다.

   ```sh
   npm run check
   ```

   TypeScript와 Vite build가 성공하고 모든 test file이 통과해야 합니다. 검색 응답 검증, grounding 상태, 정확한 source 연결, PDF 렌더 오류 복구, 역할별 기본 경로, Document 실패 진단·재시도, 등록 recovery, compact 셸 로그아웃 계약이 포함됩니다.

3. WAS와 연결된 개발 서버를 시작합니다.

   ```sh
   npm run dev
   ```

   WAS가 다른 주소에 있다면 명시적으로 지정합니다.

   ```sh
   VITE_API_ORIGIN=http://127.0.0.1:8081 npm run dev
   ```

4. 문서 운영 관리자 여정을 확인합니다.

   1. `/login`에서 관리자 계정으로 로그인합니다.
   2. 기본 화면이 `/documents`인지 확인합니다.
   3. `PDF 등록`을 선택하고 텍스트 PDF를 업로드합니다.
   4. preflight에 파일명, 크기, 페이지 수, SHA-256이 표시되는지 확인합니다.
   5. 새 Document라면 이름을 확인합니다. 같은 정규화 이름이 있으면 기존 Document의 새 Version 경로가 안내되지만 새 Document 등록도 계속 가능해야 합니다.
   6. 등록 후 Document 상세에서 `METADATA → PARSE → CHUNK → EMBED → STORE → ACTIVATE` 진행을 확인합니다.
   7. 새 Version이 `ACTIVE`가 되기 전에는 기존 ACTIVE Version이 현재 검색 Version으로 유지되는지 확인합니다.
   8. 실패 fixture가 있다면 오류 코드, 실패 단계, 처리 작업 ID, 상관 ID, 자동 시도 수가 보이는지 확인합니다. `manualRetryAllowed`일 때만 `처리 재시도`가 나타나야 합니다.

5. 근거 검색과 Original 검증 여정을 확인합니다.

   1. 주 메뉴에서 `근거 검색`을 열고 ACTIVE Version에 답이 있는 한국어 질문을 제출합니다.
   2. 결과마다 순위, Document 이름, Version, 페이지, snippet, 의미 유사도가 표시되는지 확인합니다.
   3. 첫 결과가 선택되고 우측 근거 영역의 Document·Version·페이지가 선택 결과와 일치하는지 확인합니다.
   4. 인라인 PDF가 검색 결과의 정확한 페이지를 열고 text layer의 텍스트를 선택할 수 있는지 확인합니다.
   5. 이전/다음 페이지와 `75%`, `100%`, `125%`, `150%` 배율을 확인합니다.
   6. `원문 전용 화면`을 열고 URL의 Document ID, Version, `?page=`가 유지되는지 확인합니다.
   7. `원본 PDF 열기`가 인증된 `/api/v1/documents/:id/versions/:version/raw.pdf#page=<page>` 경로를 여는지 확인합니다.

6. 근거가 부족한 상태를 확인합니다.

   테스트 fixture나 개발 API를 사용해 다음 응답을 각각 반환하고, 프론트엔드가 결과를 만들어내지 않고 이유를 설명하는지 확인합니다.

   - `NO_HITS_ABOVE_POLICY`: 정책 기준을 충족하는 근거가 없음
   - `ONLY_INACTIVE_VERSION_MATCHED`: 이전 Version에만 일치함
   - `SOURCE_UNAVAILABLE`: 검색 source를 확인할 수 없음

7. 키보드와 반응형 셸을 확인합니다.

   1. 페이지를 새로 열고 Tab을 눌러 `본문으로 건너뛰기`가 첫 포커스 대상인지 확인합니다.
   2. Enter를 눌러 `#main-content`로 포커스가 이동하는지 확인합니다.
   3. 검색, 결과 선택, 페이지 이동, 배율, 원문 링크, 로그아웃을 키보드만으로 사용합니다.
   4. viewport를 390px와 320px로 줄입니다. 문서 전체에 가로 스크롤이 생기지 않고, 상단 셸의 `로그아웃`이 계속 보여야 합니다.
   5. 모바일에서 검색 → 결과 → 근거 원문 순서로 읽히고 PDF의 넓은 내용만 자체 영역 안에서 스크롤되는지 확인합니다.
   6. OS의 모션 감소 설정을 켜고 비필수 animation이 제거되는지 확인합니다.

## Verification

다음 결과를 모두 남기면 이 변경의 재현 가능한 검증 자료로 사용할 수 있습니다.

- `npm run check`의 종료 코드 0과 통과한 test file/test 개수
- `/search` desktop 및 390px 전체 화면 캡처
- 선택한 결과의 `document_id`, `version_id`, `page_number`와 source API 응답의 일치 기록
- 실제 PDF canvas 크기와 text layer node가 1개 이상이라는 브라우저 검사 결과
- 320px/390px에서 `document.documentElement.scrollWidth === clientWidth`인 결과
- 관리자 등록 → ACTIVE 전환 또는 실패 → 허용된 재시도 흐름 기록

## Troubleshooting

### 로그인 후 다시 로그인 화면으로 돌아갑니다

WAS의 `/api/v1/session` 응답, HttpOnly 쿠키, Vite proxy 대상 주소를 확인합니다. 세션 만료는 `SESSION_EXPIRED`로 처리됩니다.

### 검색 결과가 0건입니다

화면의 grounding 이유를 먼저 확인합니다. `ONLY_INACTIVE_VERSION_MATCHED`라면 Document 상세에서 현재 ACTIVE Version을 확인하고, `SOURCE_UNAVAILABLE`이라면 WAS와 내부 검색 서비스 연결을 확인합니다.

### 메타데이터는 보이지만 PDF가 렌더링되지 않습니다

화면의 `원본 PDF 직접 열기`로 같은 `#page=`를 확인하고, `원문 전용 화면에서 다시 확인`도 시도합니다. raw PDF 요청이 세션 쿠키를 받는지, CSP가 PDF.js Worker를 허용하는지, 응답이 실제 PDF인지 확인합니다.

### 등록 응답이 끊긴 뒤 계속 확인 중입니다

같은 브라우저와 같은 PDF를 유지합니다. 화면의 복구 코드는 route별 localStorage에 저장됩니다. `accepted`이면 Document 상세로 이동하고, `expired`이면 새 request key가 발급됩니다. 브라우저 저장소가 차단되면 안전한 recovery를 보장할 수 없어 등록 자체를 차단합니다.

### 모바일에서 로그아웃을 찾을 수 없습니다

최신 stylesheet가 로드됐는지 확인하고 cache를 비웁니다. 980px 이하에서도 role·username만 숨겨지고 로그아웃 버튼은 표시되어야 합니다.

## Related

- [Evidence Workbench reference](reference-evidence-workbench.md)
- [SyncBase frontend README](../README.md)
- [Evidence Workbench surface brief](../.impeccable/surfaces/route-search.md)
