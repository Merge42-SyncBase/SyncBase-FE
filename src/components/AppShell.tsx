import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ROLE_LABELS } from '../domain'
import { useDemo } from '../demo/DemoProvider'
import { SystemStatusBanner } from './SystemStatusBanner'

const pageNames: Record<string, string> = {
  '/documents': '문서',
  '/documents/new': 'PDF 등록',
}

export function AppShell() {
  const { session, logout, system, announcement, writeLocked } = useDemo()
  const location = useLocation()
  const navigate = useNavigate()

  if (!session) return <Outlet />

  const pageName =
    pageNames[location.pathname] ??
    (location.pathname.startsWith('/sources') ? '원문 확인' : '문서 상세')

  return (
    <div className="app-root">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <header className="app-header">
        <div className="header-inner">
          <button className="brand" onClick={() => navigate('/documents')} aria-label="SyncBase 문서 목록">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>
              <strong>SyncBase</strong>
              <small>Document Intelligence</small>
            </span>
          </button>
          <nav className="primary-nav" aria-label="주요 탐색">
            <NavLink to="/documents">문서</NavLink>
            {session.role === 'DOCUMENT_ADMIN' && (
              <NavLink
                to="/documents/new"
                aria-disabled={writeLocked}
                onClick={(event) => writeLocked && event.preventDefault()}
              >
                PDF 등록
              </NavLink>
            )}
          </nav>
          <div className="account-menu">
            <div>
              <strong>{ROLE_LABELS[session.role]}</strong>
              <small>{session.name}</small>
            </div>
            <button className="button button-ghost" onClick={() => { logout(); navigate('/login') }}>
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <div className="app-container app-body">
        <div className="breadcrumb" aria-label="현재 위치">
          SyncBase <span aria-hidden="true">/</span> <strong>{pageName}</strong>
        </div>
        <SystemStatusBanner system={system} />
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <footer className="app-footer">
        <div className="app-container">
          Mock frontend MVP · 실제 Backend, Worker, MCP, OpenSQL과 연결되지 않았습니다.
        </div>
      </footer>
    </div>
  )
}
