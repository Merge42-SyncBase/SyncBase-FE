# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- 조직의 문서·지식 운영 관리자: PDF Document를 등록하고 Version과 처리 상태를 관리하며, 검색 가능한 조직 지식의 최신성과 정합성을 운영한다.
- 조직의 일반 팀원: 업무에 필요한 조직 지식과 문서를 검색하고, 검색 결과에서 정확한 Document·Version·원문 페이지 근거를 확인한다.

## Product Purpose

SyncBase는 조직의 PDF 문서를 등록하는 순간부터 Parse, Chunk, Embed, Store, Activate까지 이어지는 처리 흐름을 자동화하고, 정형 메타데이터와 벡터를 OpenSQL 안에서 함께 관리하는 오픈소스 지식 플랫폼이다.

사용자는 의미 기반 검색으로 필요한 지식을 찾고, 각 결과가 나온 정확한 Document·Version·페이지의 Original을 확인할 수 있어야 한다. 성공은 KOSSA 2026 오픈소스 개발자대회의 요구사항을 재현 가능한 증거로 충족하는 것뿐 아니라, 대회 이후 실제 조직이 지속적으로 운영할 수 있는 플랫폼이 되는 것을 포함한다.

## Positioning

SyncBase는 문서 관리, 로컬 임베딩, 버전 활성화, 벡터 검색, MCP 검색 API, 원문 근거 확인을 하나의 정합성 있는 파이프라인으로 연결한다. 별도의 외부 벡터 검색 서비스나 외부 AI API에 의존하지 않고, OpenSQL의 관계형 데이터 관리와 pgvector 검색을 같은 데이터베이스 계층 안에서 결합한다.

Document의 새 Version이 ACTIVE가 되기 전에는 기존 ACTIVE Version이 계속 검색되며, 전환 후에는 이전 Version의 벡터가 검색 결과로 다시 노출되지 않는다. 검색 결과는 정확한 Document·Version·페이지까지 추적할 수 있다.

## Operating Context

- 운영 관리자는 인증된 한국어 웹 운영 콘솔에서 Document를 등록하고, 새 Version을 추가하며, 처리 상태와 실패를 확인하고, 허용된 경우 수동 재시도를 수행한다.
- 일반 팀원은 조직 지식에 관한 질의를 입력하고, 근거 검색 결과의 snippet과 유사도 정보를 검토한 뒤 정확한 원문 페이지로 이동한다.
- Document 처리 파이프라인은 `METADATA → PARSE → CHUNK → EMBED → STORE → ACTIVATE` 순서로 동작한다.
- 브라우저는 same-origin `/api/v1` Go API만 사용하며 OpenSQL 자격 증명, MCP 토큰, 임베딩 모델을 직접 받지 않는다.
- MCP의 `search_documents` 도구는 인증된 Streamable HTTP transport로 검색 기능을 제공한다.
- 대회 제출과 이후 운영 모두 공개 소스, 테스트, SBOM, 모델 명세, 실행 증거로 재현 가능해야 한다.

## Capabilities and Constraints

- React 19와 Vite 기반 웹 프론트엔드, Go 기반 API·Worker·MCP·임베딩 구성요소, OpenSQL/PostgreSQL 17.8 및 pgvector를 사용한다.
- 입력 단위는 PDF 형식의 `Document`이며, 하나의 Document는 여러 `Version`을 가질 수 있다. 한 시점에 검색되는 ACTIVE Version은 하나뿐이다.
- Original은 SHA-256 기반 content-addressed 경로에 저장한다.
- PDFium 1.19.6 WASM으로 Parse하고, Apache-2.0의 `multilingual-e5-small`을 ONNX Runtime 1.26.0에서 로컬 실행해 384차원 임베딩을 만든다. 외부 AI API를 호출하지 않는다.
- 임베딩 처리에는 모델·토크나이저·ONNX Runtime·최소 유사도 값으로 구성된 불변 Processing profile을 사용하며 런타임에서 지문을 검증한다.
- 검색은 OpenSQL 내부의 pgvector 코사인 유사도를 사용하고, 단일 토큰 질의에는 exact-token 재정렬을 적용하되 일치 결과가 없으면 semantic 결과로 돌아간다.
- Processing run은 fenced token으로 오래된 Worker의 쓰기를 차단한다. 일시적 실패는 정해진 횟수와 backoff 정책에 따라 자동 재시도하고, 소진 후 허용되는 경우에만 수동 재시도를 제공한다.
- 웹 인증은 HttpOnly 세션 쿠키와 CSRF 토큰을 사용한다. MCP는 bearer 인증과 Host·Origin 허용 목록을 사용한다. 데이터베이스 접근은 web, worker, mcp 역할로 분리한다.
- 1차 검증 환경은 단일 노드 OpenSQL이다. 실제 multi-node OpenSQL failover 검증은 2차 범위이며, 완료 전에는 고가용성 실증을 주장하지 않는다.
- 제품과 인터페이스의 기본 언어는 한국어다.
- `Document`, `Version`, `Original`, `Parse`, `Embed`, `Store`, `Search`, `OpenSQL`, `Processing run`, `Fenced token`, `Processing profile`, `1차`, `2차`, `SBOM`, `SyncBase`는 `../CONTEXT.md`에 정의된 공식 용어와 금지된 대체어를 따른다.

## Brand Commitments

- 제품명은 `SyncBase`다.
- 한국어 우선 운영 경험을 제공한다.
- 제품 주장은 기술적으로 검증된 사실과 추적 가능한 근거를 중심으로 표현한다.
- OpenSQL/pgvector 내부 검색, 외부 AI API 없는 로컬 E5-small ONNX, Document·Version·원문 페이지까지 이어지는 근거 추적을 핵심 약속으로 유지한다.
- 기존 공식 용어를 일관되게 사용한다.
- 공개 OSS와 재현 가능한 검증 자료를 유지한다.

## Evidence on Hand

- 제품·용어 기준: `../CONTEXT.md`
- 1차 제출 보고서: `../documents/2026-OSS-1차 보고서 (제출본).md`
- 과제 해설: `../documents/2026-OSS 개발자대회 티맥스티베로 과제설명.md`
- AI 모델 명세: `../documents/2026-OSS-AI-model-spec.md`
- 검색 결정과 실측: `../documents/2026-OSS-hybrid-search-decision.md`
- OpenSQL 고가용성 범위 결정: `../documents/adr/0001-round1-opensql-ha-scope.md`
- 보안·버전 동기화·재시도 검증 자료: `../documents/work-logs/` 및 관련 정책 문서
- CycloneDX 1.6 SBOM: `../syncbase-infra/evidence/syncbase.cdx.json`
- 실제 구현과 테스트: 현재 저장소 `./`, sibling 저장소 `../syncbase-was/`, `../syncbase-mcp/`, `../syncbase-embedding/`, `../syncbase-infra/`
- 실제 고객 사례, 고객 로고, 외부 추천사, 운영 규모 벤치마크는 현재 근거로 확인되지 않았으므로 향후 인터페이스나 문서에서 만들어내지 않는다.

## Product Principles

1. 모든 검색 결과는 사용자가 검증할 수 있는 정확한 Original 근거로 이어져야 한다.
2. Document의 정형 상태와 벡터 검색 상태는 Version 활성화 경계를 기준으로 항상 일치해야 한다.
3. 조직의 민감한 지식 처리는 외부 AI API에 의존하지 않고 로컬 모델과 조직이 통제하는 OpenSQL 안에서 이루어져야 한다.
4. 운영 관리자의 통제력과 일반 팀원의 빠른 지식 접근을 하나의 일관된 제품 경험으로 제공해야 한다.
5. 대회 시연부터 실제 조직 운영까지 모든 핵심 주장은 공개 코드와 재현 가능한 증거로 뒷받침되어야 한다.
