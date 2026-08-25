---
version: 1
slug: "route-search"
primary_target: "route:/search"
related_targets: ["src/pages/SearchPage.tsx","src/components/AppShell.tsx"]
---

# 근거 검색 작업대

- 범위·모드: 인증 후 `/search` 전체 화면, Operate.
- 대상·작업: 일반 팀원은 질문하고 결과의 신뢰도를 판단한 뒤 정확한 Original 페이지로 검증한다. 운영 관리자는 같은 검색 흐름을 사용하되 문서 운영 메뉴도 본다.
- 핵심 행동·증거: 검색 제출, 결과 선택, `source_url`로 Document·Version·페이지 원문 열기. ACTIVE Version, 순위, 유사도, snippet, Version, 페이지를 표시한다.
- 제약: 한국어 우선, 기존 `/api/v1/search`와 source route 보존, snippet을 원문처럼 가장하지 않기, 키보드·320px·reduced motion 지원.
- 선택 방향·기억점: Evidence Workbench. 190px 역할 레일 옆에서 검색·결과와 선택 근거를 동시에 보고, 모바일에서는 검색 → 결과 → 근거 순으로 읽는다.
- 미해결: 일반 팀원 role/RBAC 및 로그인 후 기본 경로는 backend dependency다. 우측 패널의 인라인 PDF Original 렌더링과 관리자 운영 큐 결합은 다음 구현 단계다.
