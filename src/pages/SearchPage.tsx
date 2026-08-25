import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { APIError, api } from '../api/client'
import { ErrorNotice } from '../components/ErrorNotice'
import type { GroundingReason, SearchResponse } from '../types'

const groundingMessages: Record<GroundingReason, string> = {
  NO_HITS_ABOVE_POLICY: '정책 기준을 충족하는 활성 근거가 없습니다.',
  ONLY_INACTIVE_VERSION_MATCHED: '검색 기준을 충족한 근거가 비활성 버전에만 있습니다.',
  SOURCE_UNAVAILABLE: '근거 저장소를 확인할 수 없습니다. 잠시 후 다시 시도하세요.',
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    setSearching(true)
    setError('')
    setResponse(null)
    try {
      setResponse(await api.search(value))
    } catch (reason) {
      setError(reason instanceof APIError ? reason.message : '검색을 완료하지 못했습니다.')
    } finally {
      setSearching(false)
    }
  }

  const insufficientReason = response?.grounding_status === 'INSUFFICIENT_EVIDENCE'
    ? response.grounding_reason
    : null

  return (
    <div className="page-stack narrow-page">
      <header className="page-header">
        <p className="eyebrow">Grounded retrieval</p>
        <h1>근거 검색</h1>
        <p className="muted">
          MCP <code>search_documents</code>가 ACTIVE 버전의 페이지 단위 chunk만 검색합니다.
        </p>
      </header>
      <section className="panel">
        <form className="search-form" onSubmit={(event) => void search(event)}>
          <label>
            <span className="sr-only">검색어</span>
            <input
              autoFocus
              placeholder="예: 연차 휴가는 며칠인가?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button className="button primary" disabled={searching}>
            {searching ? '검색 중…' : '검색'}
          </button>
        </form>
      </section>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {insufficientReason && (
        <section className="notice warning" role="status" aria-live="polite">
          <strong>충분한 근거를 제공할 수 없습니다.</strong>
          <p>{groundingMessages[insufficientReason]}</p>
          <p className="result-meta">
            <code>INSUFFICIENT_EVIDENCE</code> · <code>{insufficientReason}</code> · results: []
          </p>
        </section>
      )}
      {response?.grounding_status === 'SUPPORTED' && response.results.length > 0 && (
        <section className="page-stack" aria-live="polite">
          {response.results.map((result) => (
            <article className="panel search-result" key={`${result.version_id}:${result.rank}`}>
              <div className="result-rank">
                <strong>#{result.rank}</strong>
                <span>{Math.round(result.score * 100)}%</span>
              </div>
              <div>
                <Link to={result.source_url}><h2>{result.document_name}</h2></Link>
                <p className="result-meta">
                  v{result.document_version} · {result.page_number}페이지 · <code>{result.version_id}</code>
                </p>
                <p>{result.snippet}</p>
                <Link className="button secondary" to={result.source_url}>근거 원문 열기</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
