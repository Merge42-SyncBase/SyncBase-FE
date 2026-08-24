import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { APIError, api } from '../api/client'
import { ErrorNotice } from '../components/ErrorNotice'
import { StatusBadge } from '../components/StatusBadge'
import { shortDocumentID } from '../documents/identity'
import type { DocumentSummary } from '../types'

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const response = await api.documents()
        if (mounted) setDocuments(response.documents)
      } catch (reason) {
        if (mounted) setError(reason instanceof APIError ? reason.message : '문서 목록을 불러오지 못했습니다.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 5000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [])

  const visible = useMemo(() => {
    const normalized = filter.trim().toLocaleLowerCase()
    return normalized ? documents.filter((document) => document.name.toLocaleLowerCase().includes(normalized)) : documents
  }, [documents, filter])
  const searchable = documents.filter((document) => document.activeVersion !== null).length
  const processing = documents.filter((document) => document.latestStatus === 'QUEUED' || document.latestStatus === 'PROCESSING').length
  const attention = documents.filter((document) => document.latestStatus === 'FAILED').length

  return (
    <div className="page-stack">
      <header className="page-header split">
        <div><p className="eyebrow">Knowledge library</p><h1>문서</h1><p className="muted">등록된 PDF의 처리 상태와 검색 공개 버전을 확인합니다.</p></div>
        <Link className="button primary" to="/documents/new">PDF 등록</Link>
      </header>
      <section className="metrics" aria-label="문서 상태 요약">
        <Metric label="전체 문서" value={documents.length} />
        <Metric label="검색 가능" value={searchable} tone="good" />
        <Metric label="처리 중" value={processing} tone="pending" />
        <Metric label="확인 필요" value={attention} tone="danger" />
      </section>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <section className="panel">
        <div className="panel-header split"><div><h2>문서 라이브러리</h2><p>5초마다 실제 처리 상태를 갱신합니다.</p></div><label className="filter"><span className="sr-only">문서명 필터</span><input placeholder="문서명 검색" value={filter} onChange={(event) => setFilter(event.target.value)} /></label></div>
        {loading ? <div className="skeleton-list" aria-live="polite">문서를 불러오는 중입니다.</div> : visible.length === 0 ? (
          <div className="empty-state"><strong>표시할 문서가 없습니다.</strong><p>PDF를 등록하면 처리 현황이 이곳에 표시됩니다.</p></div>
        ) : <DocumentTable documents={visible} />}
      </section>
    </div>
  )
}

function Metric({ label, value, tone = '' }: { label: string; value: number; tone?: string }) {
  return <article className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong></article>
}

function DocumentTable({ documents }: { documents: DocumentSummary[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>문서</th><th>최신 버전</th><th>검색 공개</th><th>상태</th><th>갱신</th></tr></thead>
        <tbody>{documents.map((document) => <tr key={document.id}>
          <td><div className="document-name-cell"><Link className="document-link" to={`/documents/${document.id}`}>{document.name}</Link><span className="document-id-label" title={document.id}>ID {shortDocumentID(document.id)}</span></div></td>
          <td>v{document.latestVersion}</td>
          <td>{document.activeVersion === null ? '—' : `v${document.activeVersion}`}</td>
          <td><StatusBadge status={document.latestStatus} /></td>
          <td>{formatDate(document.updatedAt)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
