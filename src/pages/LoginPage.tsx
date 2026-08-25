import { FormEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { APIError } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { ErrorNotice } from '../components/ErrorNotice'
import { safeDestinationForRole } from '../routing/internalPaths'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const nextSession = await login(username, password)
      navigate(safeDestinationForRole(searchParams.get('next'), nextSession.user.role), { replace: true })
    } catch (reason) {
      setError(reason instanceof APIError ? reason.message : '로그인 요청을 완료하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-intro" aria-labelledby="login-promise">
          <div className="login-brand"><span className="brand-mark" aria-hidden="true">S</span><strong>SyncBase</strong></div>
          <div className="login-promise">
            <h1 id="login-promise">조직 지식을<br />근거까지 연결합니다.</h1>
            <p>질문에서 신뢰할 수 있는 결과를 찾고, 정확한 Document·Version·원문 페이지에서 직접 검증하세요.</p>
          </div>
          <ul className="login-principles" aria-label="SyncBase 운영 원칙">
            <li><strong>ACTIVE Version</strong><span>현재 공개된 근거만 검색</span></li>
            <li><strong>원문 추적</strong><span>Document·Version·페이지로 검증</span></li>
            <li><strong>조직 내부 운영</strong><span>로컬 임베딩과 재현 가능한 구성</span></li>
          </ul>
        </section>
        <section className="login-card" aria-labelledby="login-title">
          <h2 id="login-title">SyncBase 로그인</h2>
          <p className="muted">하나의 계정으로 근거 검색과 권한에 따른 문서 운영 기능을 사용합니다.</p>
          {error && <ErrorNotice>{error}</ErrorNotice>}
          <form className="form-stack" onSubmit={(event) => void submit(event)}>
            <label>
              <span>사용자 ID</span>
              <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </label>
            <label>
              <span>비밀번호</span>
              <input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <button className="button primary" type="submit" disabled={submitting}>
              {submitting ? '로그인 중…' : '로그인'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
