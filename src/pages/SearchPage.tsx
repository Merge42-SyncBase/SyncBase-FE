import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { APIError, api } from '../api/client'
import { ErrorNotice } from '../components/ErrorNotice'
import type { SearchResult } from '../types'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    setSearching(true); setError('')
    try {
      const nextResults = (await api.search(value)).results
      setResults(nextResults)
      setSelected(nextResults[0] ?? null)
      setSearched(true)
    } catch (reason) {
      setError(reason instanceof APIError ? reason.message : '검색을 완료하지 못했습니다.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="evidence-workbench">
      <section className="evidence-discovery" aria-labelledby="evidence-search-title">
        <header className="evidence-search-header">
          <h1 id="evidence-search-title">근거 검색</h1>
          <form className="evidence-search-form" onSubmit={(event) => void search(event)}>
            <label>
              <span className="sr-only">조직 지식 검색어</span>
              <SearchIcon />
              <input autoFocus placeholder="예: 연차 휴가는 며칠인가?" value={query} onChange={(event) => setQuery(event.target.value)} />
              {query && <button className="query-clear" type="button" aria-label="검색어 지우기" onClick={() => setQuery('')}>×</button>}
            </label>
            <button className="button primary" disabled={searching}>{searching ? '검색 중…' : '검색'}</button>
          </form>
          <p>ACTIVE Version의 페이지 근거만 검색합니다.</p>
        </header>

        {error && <div className="evidence-error"><ErrorNotice>{error}</ErrorNotice></div>}

        <div className="evidence-result-summary" aria-live="polite">
          {searched ? <strong>검색 결과 {results.length}건</strong> : <strong>질문을 입력해 근거를 찾으세요.</strong>}
          <span>의미 유사도 순</span>
        </div>

        <div className="evidence-result-list" aria-label="검색 결과">
          {searching ? <div className="evidence-empty" aria-live="polite">ACTIVE Version에서 근거를 검색하고 있습니다.</div> : results.length > 0 ? results.map((result) => {
            const isSelected = selected?.version_id === result.version_id && selected.rank === result.rank
            return (
              <button
                className={`evidence-result${isSelected ? ' selected' : ''}`}
                type="button"
                aria-pressed={isSelected}
                key={`${result.version_id}:${result.rank}`}
                onClick={() => setSelected(result)}
              >
                <span className="evidence-rank">{result.rank}</span>
                <span className="evidence-result-copy">
                  <span className="evidence-result-title">
                    <strong>{result.document_name}</strong>
                    {isSelected && <span className="active-chip">ACTIVE</span>}
                  </span>
                  <span className="result-meta">v{result.document_version} · {result.page_number}페이지</span>
                  <span className="evidence-snippet">{result.snippet}</span>
                </span>
                <strong className="evidence-score" aria-label={`유사도 ${result.score.toFixed(2)}`}>{result.score.toFixed(2)}</strong>
              </button>
            )
          }) : searched ? <div className="evidence-empty"><strong>일치하는 근거가 없습니다.</strong><span>다른 표현이나 더 구체적인 질문으로 다시 검색해 보세요.</span></div> : <div className="evidence-empty"><strong>질문에서 시작합니다.</strong><span>결과를 선택하면 Document·Version·페이지 위치가 오른쪽에 이어집니다.</span></div>}
        </div>
      </section>

      <aside className="evidence-source" aria-labelledby="evidence-source-title">
        <header className="evidence-source-header">
          <h2 id="evidence-source-title">근거 원문</h2>
          {selected && <Link to={selected.source_url}>원문 페이지 열기 <ExternalIcon /></Link>}
        </header>
        {selected ? <SelectedEvidence result={selected} /> : <div className="source-empty"><DocumentIcon /><strong>검증할 결과를 선택하세요.</strong><span>정확한 Original은 검색 결과의 Document·Version·페이지 위치에서 열립니다.</span></div>}
      </aside>
    </div>
  )
}

function SelectedEvidence({ result }: { result: SearchResult }) {
  return (
    <div className="selected-evidence">
      <div className="selected-evidence-identity">
        <DocumentIcon />
        <div><strong>{result.document_name}</strong><span>Document 근거</span></div>
        <span className="active-chip">ACTIVE</span>
      </div>
      <dl className="selected-evidence-meta">
        <div><dt>Version</dt><dd>v{result.document_version}</dd></div>
        <div><dt>페이지</dt><dd>{result.page_number}페이지</dd></div>
        <div><dt>유사도</dt><dd>{result.score.toFixed(2)}</dd></div>
      </dl>
      <section className="source-bridge" aria-label="선택한 검색 근거">
        <span>검색 결과 snippet</span>
        <blockquote>{result.snippet}</blockquote>
        <p>snippet은 원문을 대신하지 않습니다. 아래 링크에서 정확한 PDF 페이지를 확인하세요.</p>
      </section>
      <div className="source-action">
        <Link className="button primary" to={result.source_url}>정확한 원문 페이지에서 검증</Link>
        <code title={result.version_id}>{result.version_id}</code>
      </div>
    </div>
  )
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.25" /><path d="m16 16 4 4" /></svg>
}

function DocumentIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.75h7l4 4v12.5h-11z" /><path d="M13.5 3.75v4h4M9.5 12h5M9.5 15.5h5" /></svg>
}

function ExternalIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
}
