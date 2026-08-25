---
version: 1
slug: "route-search"
primary_target: "route:/search"
related_targets: ["src/pages/SearchPage.tsx","src/components/AppShell.tsx","src/components/PdfPageCanvas.tsx","src/pages/SourceViewerPage.tsx"]
---

# 근거 검색 작업대

- 범위·모드: 인증 후 `/search` 전체 화면, Operate.
- 대상·작업: 일반 팀원은 질문하고 결과의 신뢰도를 판단한 뒤 정확한 Original 페이지로 검증한다. 운영 관리자는 같은 검색 흐름을 사용하되 문서 운영 메뉴도 본다.
- 핵심 행동·증거: 검색 제출, 결과 선택, 인라인 PDF 원문 확인, `source_url`로 Document·Version·페이지 원문 전용 화면 열기. ACTIVE Version, 순위, 유사도, snippet, Version, 페이지를 표시한다.
- 제약: 한국어 우선, 기존 `/api/v1/search`와 source route 보존, snippet을 원문처럼 가장하지 않기, 키보드·320px·reduced motion 지원.
- 선택 방향·기억점: Evidence Workbench. 190px 역할 레일 옆에서 검색·결과와 선택 근거를 동시에 보고, 모바일에서는 검색 → 결과 → 근거 순으로 읽는다.
- 구현 상태: 우측 패널의 인증된 PDF.js Original 렌더링, 원문 전용 화면, 관리자 Document 목록·Version ledger·실패 진단·수동 재시도, 역할별 기본 경로와 메뉴가 구현되었다.
- 미해결: 백엔드가 현재 `DOCUMENT_ADMIN`만 발급하므로 실제 일반 팀원 role, endpoint RBAC, 해당 role을 사용한 통합 검증은 backend dependency다. 프론트엔드는 이름을 추측하지 않고 `DOCUMENT_ADMIN`이 아닌 런타임 역할을 `/search`로 안내한다.
