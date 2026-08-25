import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { isDocumentAdmin, landingPathForRole } from '../auth/roles'
import { DocumentIcon, SearchIcon } from './Icons'

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
          <img className="brand-mark" src="/brand/syncbase-mark-inverse.svg" alt="" aria-hidden="true" />
          <span><strong>SyncBase</strong><small>{roleLabel}</small></span>
        </NavLink>
        <nav aria-label="주 메뉴">
          <NavLink to="/search"><SearchIcon className="nav-icon" />근거 검색</NavLink>
          {documentAdmin && <NavLink to="/documents"><DocumentIcon className="nav-icon" />문서 운영</NavLink>}
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
