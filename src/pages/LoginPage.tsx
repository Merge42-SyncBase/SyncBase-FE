import { Navigate, useNavigate } from 'react-router-dom'
import { ROLE_LABELS, type Role } from '../domain'
import { useDemo } from '../demo/DemoProvider'

const roleDescriptions: Record<Role, string> = {
  DOCUMENT_ADMIN: 'PDF 등록, 처리 상태 확인, 실패 작업 재시도',
  AI_SEARCH_USER: '활성 문서와 MCP 근거 원문 확인',
  OPERATOR: '시스템 상태와 복구 화면 시뮬레이션 확인',
}

export function LoginPage() {
  const { session, login } = useDemo()
  const navigate = useNavigate()

  if (session) return <Navigate to="/documents" replace />

  const enter = (role: Role) => {
    login(role)
    navigate('/documents')
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-mark brand-mark-large" aria-hidden="true">S</span>
          <span>SyncBase</span>
        </div>
        <span className="eyebrow">Merge42 frontend MVP</span>
        <h1 id="login-title">데모 역할을 선택하세요</h1>
        <p className="lead">
          실제 인증이 아닌 mock 역할 선택입니다. 권한의 최종 판단은 향후 Go API가 담당합니다.
        </p>
        <div className="role-grid">
          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
            <button key={role} className="role-card" onClick={() => enter(role)}>
              <span className="role-icon" aria-hidden="true">
                {role === 'DOCUMENT_ADMIN' ? '문' : role === 'AI_SEARCH_USER' ? '검' : '운'}
              </span>
              <strong>{ROLE_LABELS[role]}</strong>
              <span>{roleDescriptions[role]}</span>
              <small>{role}</small>
            </button>
          ))}
        </div>
        <div className="login-note">
          이 앱은 UI 상태만 시뮬레이션하며 실제 OpenSQL·Worker·MCP와 연결되지 않습니다.
        </div>
      </section>
    </main>
  )
}
