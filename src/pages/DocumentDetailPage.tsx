import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { APIError, api } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { ErrorNotice } from '../components/ErrorNotice'
import { StatusBadge } from '../components/StatusBadge'
import type { DocumentDetails, DocumentVersion, ProcessingStage } from '../types'

const stages: ProcessingStage[] = ['METADATA', 'PARSE', 'CHUNK', 'EMBED', 'STORE', 'ACTIVATE']
const stageLabels: Record<ProcessingStage, string> = {
  METADATA: '확인', PARSE: '텍스트 추출', CHUNK: '문단 분리', EMBED: '임베딩', STORE: '저장', ACTIVATE: '검색 반영',
}

export function DocumentDetailPage() {
  const { documentID = '' } = useParams()
  const { session } = useAuth()
  const [document, setDocument] = useState<DocumentDetails | null>(null)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setDocument(await api.document(documentID))
      setError('')
    } catch (reason) {
      setError(reason instanceof APIError ? reason.message : '문서 상세를 불러오지 못했습니다.')
    }
  }, [documentID])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 2500)
    return () => window.clearInterval(timer)
  }, [load])

  async function retry(version: DocumentVersion) {
    if (!session) return
    setRetrying(version.runId)
    try {
      await api.retry(version.runId, crypto.randomUUID(), session.csrfToken)
      await load()
    } catch (reason) {
      setError(reason instanceof APIError ? reason.message : '재시도 요청을 완료하지 못했습니다.')
    } finally {
      setRetrying(null)
    }
  }

  if (error && !document) return <ErrorNotice>{error}</ErrorNotice>
  if (!document) return <div className="skeleton-list" aria-live="polite">문서 상세를 불러오는 중입니다.</div>
  const active = document.versions.find((version) => version.active)

  return (
    <div className="page-stack">
      <header className="page-header split"><div><Link className="back-link" to="/documents">← 문서 목록</Link><p className="eyebrow">Document detail</p><h1>{document.name}</h1><p className="muted">최신 버전이 활성화되기 전까지 이전 ACTIVE 버전만 검색됩니다.</p></div><Link className="button primary" to={`/documents/${document.id}/versions/new`}>새 버전 등록</Link></header>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {active && <div className="notice success">현재 검색에 노출된 버전은 <strong>v{active.versionNumber}</strong>입니다. <Link to={`/sources/${document.id}/versions/${active.versionNumber}?page=1`}>원문 열기</Link></div>}
      <section className="page-stack">{document.versions.map((version) => <article className="panel version-card" key={version.id}>
        <div className="panel-header split"><div><div className="version-title"><h2>v{version.versionNumber}</h2><StatusBadge status={version.status} />{version.active && <span className="active-chip">현재 검색 버전</span>}</div><p>{formatDate(version.updatedAt)} · {version.pageCount ? `${version.pageCount}페이지` : '페이지 확인 중'}</p></div><div className="version-actions">{version.pageCount > 0 && <Link className="button secondary" to={`/sources/${document.id}/versions/${version.versionNumber}?page=1`}>원문 확인</Link>}{version.manualRetryAllowed && <button className="button secondary" disabled={retrying === version.runId} onClick={() => void retry(version)}>{retrying === version.runId ? '재시도 요청 중…' : '처리 재시도'}</button>}</div></div>
        <Pipeline version={version} />
        {version.errorCode && <div className="notice error">{errorLabel(version.errorCode)} <code>{version.errorCode}</code></div>}
        <dl className="metadata"><div><dt>처리 작업</dt><dd><code>{version.runId}</code></dd></div><div><dt>상관 ID</dt><dd><code>{version.correlationId}</code></dd></div><div><dt>자동 시도</dt><dd>{version.automaticAttempts} / 3{version.queuePosition ? ` · 대기 ${version.queuePosition}번` : ''}</dd></div></dl>
      </article>)}</section>
    </div>
  )
}

function Pipeline({ version }: { version: DocumentVersion }) {
  const current = stages.indexOf(version.stage)
  return <ol className="pipeline">{stages.map((stage, index) => {
    const state = version.status === 'FAILED' && index === current ? 'failed' : index < current || ['ACTIVE', 'SUPERSEDED'].includes(version.status) ? 'complete' : index === current && version.status === 'PROCESSING' ? 'current' : 'pending'
    return <li className={state} key={stage}><span aria-hidden="true">{state === 'complete' ? '✓' : state === 'failed' ? '!' : index + 1}</span><strong>{stageLabels[stage]}</strong></li>
  })}</ol>
}

function errorLabel(code: string): string {
  return ({ INVALID_INPUT: 'PDF 형식이나 텍스트 내용을 확인하세요.', PROFILE_MISMATCH: '임베딩 프로필이 일치하지 않습니다.', TRANSIENT_EXHAUSTED: '자동 재시도를 모두 사용했습니다.' } as Record<string, string>)[code] ?? '처리 중 오류가 발생했습니다.'
}

function formatDate(value: string): string { return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
