import { FormEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { APIError } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { ErrorNotice } from '../components/ErrorNotice'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const destination = safeDestination(searchParams.get('next'))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      navigate(destination, { replace: true })
    } catch (reason) {
      setError(reason instanceof APIError ? reason.message : '로그인 요청을 완료하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand"><span className="brand-mark" aria-hidden="true">S</span><strong>SyncBase</strong></div>
        <p className="eyebrow">Administrator access</p>
        <h1 id="login-title">문서 운영 콘솔</h1>
        <p className="muted">PDF를 등록하고, 실제 처리 상태와 검색 근거를 확인합니다.</p>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <form className="form-stack" onSubmit={(event) => void submit(event)}>
          <label>
            <span>관리자 ID</span>
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
    </main>
  )
}

function safeDestination(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/documents'
  return value
}
