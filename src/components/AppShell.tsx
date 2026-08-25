import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { isDocumentAdmin, landingPathForRole } from '../auth/roles'

export function AppShell() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const documentAdmin = isDocumentAdmin(session?.user.role ?? '')
  const roleLabel = documentAdmin ? '문서 운영 관리자' : '일반 팀원'
  const searchWorkspace = location.pathname === '/search'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <aside className="sidebar">
        <NavLink className="brand" to={landingPathForRole(session?.user.role ?? '')}>
          <span className="brand-mark" aria-hidden="true">S</span>
          <span><strong>SyncBase</strong><small>{roleLabel}</small></span>
        </NavLink>
        <nav aria-label="주 메뉴">
          <NavLink to="/search"><SearchIcon />근거 검색</NavLink>
          {documentAdmin && <NavLink to="/documents"><DocumentIcon />문서 운영</NavLink>}
        </nav>
        <div className="sidebar-footer">
          <span className="role-name">{roleLabel}</span>
          <span className="user-name">{session?.user.username}</span>
          <button className="button link-button" onClick={() => void handleLogout()}>로그아웃</button>
        </div>
      </aside>
      <section className={`workspace${searchWorkspace ? ' workspace-evidence' : ''}`}>
        <main id="main-content" tabIndex={-1}><Outlet /></main>
      </section>
    </div>
  )
}

function SearchIcon() {
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.25" /><path d="m16 16 4 4" /></svg>
}

function DocumentIcon() {
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.75h7l4 4v12.5h-11z" /><path d="M13.5 3.75v4h4M9.5 12h5M9.5 15.5h5" /></svg>
}
