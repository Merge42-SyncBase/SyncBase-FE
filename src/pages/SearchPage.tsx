import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { APIError, api } from '../api/client'
import { ErrorNotice } from '../components/ErrorNotice'
import type { SearchResult } from '../types'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    setSearching(true); setError('')
    try { setResults((await api.search(value)).results) } catch (reason) { setError(reason instanceof APIError ? reason.message : '검색을 완료하지 못했습니다.') } finally { setSearching(false) }
  }

  return <div className="page-stack narrow-page"><header className="page-header"><p className="eyebrow">Grounded retrieval</p><h1>근거 검색</h1><p className="muted">MCP <code>search_documents</code>가 ACTIVE 버전의 페이지 단위 chunk만 검색합니다.</p></header><section className="panel"><form className="search-form" onSubmit={(event) => void search(event)}><label><span className="sr-only">검색어</span><input autoFocus placeholder="예: 연차 휴가는 며칠인가?" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="button primary" disabled={searching}>{searching ? '검색 중…' : '검색'}</button></form></section>{error && <ErrorNotice>{error}</ErrorNotice>}{results.length > 0 && <section className="page-stack" aria-live="polite">{results.map((result) => <article className="panel search-result" key={`${result.version_id}:${result.rank}`}><div className="result-rank"><strong>#{result.rank}</strong><span>{Math.round(result.score * 100)}%</span></div><div><Link to={result.source_url}><h2>{result.document_name}</h2></Link><p className="result-meta">v{result.document_version} · {result.page_number}페이지 · <code>{result.version_id}</code></p><p>{result.snippet}</p><Link className="button secondary" to={result.source_url}>근거 원문 열기</Link></div></article>)}</section>}</div>
}
