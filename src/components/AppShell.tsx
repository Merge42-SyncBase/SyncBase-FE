import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function AppShell() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <aside className="sidebar">
        <NavLink className="brand" to="/documents">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span><strong>SyncBase</strong><small>근거 기반 지식 운영</small></span>
        </NavLink>
        <nav aria-label="주 메뉴">
          <NavLink to="/documents">문서</NavLink>
          <NavLink to="/search">근거 검색</NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="user-name">{session?.user.username}</span>
          <button className="button link-button" onClick={() => void handleLogout()}>로그아웃</button>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar"><span>PostgreSQL · Go RAG</span><strong>운영 콘솔</strong></header>
        <main id="main-content"><Outlet /></main>
      </section>
    </div>
  )
}
