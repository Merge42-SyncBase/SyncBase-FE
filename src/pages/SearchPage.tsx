import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APIError, api } from '../api/client'
import { ErrorNotice } from '../components/ErrorNotice'
import { PdfPageCanvas } from '../components/PdfPageCanvas'
import { PdfViewerToolbar } from '../components/PdfViewerToolbar'
import type { GroundingReason, SearchResponse, SearchResult, Source } from '../types'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const results = response?.results ?? []

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    setSearching(true)
    setError('')
    setResponse(null)
    setSelected(null)
    try {
      const nextResponse = await api.search(value)
      setResponse(nextResponse)
      setSelected(nextResponse.results[0] ?? null)
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
            <button className="button primary" disabled={searching || !query.trim()}>{searching ? '검색 중…' : '검색'}</button>
          </form>
          <p>ACTIVE Version의 페이지 근거만 검색합니다.</p>
        </header>

        {error && <div className="evidence-error"><ErrorNotice>{error}</ErrorNotice></div>}

        <div className="evidence-result-summary" aria-live="polite">
          {response ? <strong>검색 결과 {results.length}건</strong> : <strong>{searching ? '근거를 확인하고 있습니다.' : '질문을 입력해 근거를 찾으세요.'}</strong>}
          <span>의미 유사도 순</span>
        </div>

        <div className="evidence-result-list" aria-label="검색 결과" aria-busy={searching}>
          {searching ? (
            <div className="evidence-empty" role="status">ACTIVE Version에서 근거를 검색하고 있습니다.</div>
          ) : results.length > 0 ? results.map((result) => {
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
          }) : response ? (
            <GroundingEmpty reason={response.grounding_reason} />
          ) : (
            <div className="evidence-empty"><strong>질문에서 시작합니다.</strong><span>결과를 선택하면 Document·Version·페이지 원문이 오른쪽에 이어집니다.</span></div>
          )}
        </div>
      </section>

      <aside className="evidence-source" aria-labelledby="evidence-source-title">
        <header className="evidence-source-header">
          <h2 id="evidence-source-title">근거 원문</h2>
          {selected && <Link to={selected.source_url} state={{ returnTo: '/search' }}>원문 전용 화면 <ExternalIcon /></Link>}
        </header>
        {selected ? <SelectedEvidence result={selected} /> : <div className="source-empty"><DocumentIcon /><strong>검증할 결과를 선택하세요.</strong><span>정확한 Original은 검색 결과의 Document·Version·페이지 위치에서 열립니다.</span></div>}
      </aside>
    </div>
  )
}

function GroundingEmpty({ reason }: { reason: GroundingReason | null }) {
  const copy = {
    NO_HITS_ABOVE_POLICY: ['기준을 충족하는 근거가 없습니다.', '다른 표현이나 더 구체적인 질문으로 다시 검색해 보세요.'],
    ONLY_INACTIVE_VERSION_MATCHED: ['ACTIVE Version에서 근거를 찾지 못했습니다.', '이전 Version의 일치 내용은 검색 근거로 사용하지 않습니다. 문서 운영 관리자에게 ACTIVE Version을 확인해 달라고 요청하세요.'],
    SOURCE_UNAVAILABLE: ['검색 근거를 확인할 수 없습니다.', '내부 검색 서비스 연결을 확인한 뒤 잠시 후 다시 시도해 주세요.'],
  }[reason ?? 'NO_HITS_ABOVE_POLICY']
  return <div className="evidence-empty grounding-empty" role="status"><strong>{copy[0]}</strong><span>{copy[1]}</span></div>
}

function SelectedEvidence({ result }: { result: SearchResult }) {
  const [page, setPage] = useState(result.page_number)
  const [source, setSource] = useState<Source | null>(null)
  const [loading, setLoading] = useState(true)
  const [sourceError, setSourceError] = useState('')
  const [renderError, setRenderError] = useState('')
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    setPage(result.page_number)
    setZoom(100)
  }, [result.document_id, result.document_version, result.page_number])

  useEffect(() => {
    let current = true
    setLoading(true)
    setSource(null)
    setSourceError('')
    setRenderError('')
    void api.source(result.document_id, result.document_version, page).then((nextSource) => {
      if (current) setSource(nextSource)
    }).catch((reason: unknown) => {
      if (current) setSourceError(reason instanceof APIError ? reason.message : '원문 정보를 불러오지 못했습니다.')
    }).finally(() => {
      if (current) setLoading(false)
    })
    return () => { current = false }
  }, [page, result.document_id, result.document_version])

  const handleRenderError = useCallback((message: string) => setRenderError(message), [])

  return (
    <div className="selected-evidence">
      <div className="selected-evidence-identity">
        <DocumentIcon />
        <div><strong>{result.document_name}</strong><span>Document 근거</span></div>
        <span className="active-chip">ACTIVE</span>
      </div>
      <dl className="selected-evidence-meta">
        <div><dt>Version</dt><dd>v{result.document_version}</dd></div>
        <div><dt>근거 페이지</dt><dd>{result.page_number}페이지</dd></div>
        <div><dt>유사도</dt><dd>{result.score.toFixed(2)}</dd></div>
      </dl>
      {loading ? (
        <div className="inline-source-state" role="status">정확한 원문 페이지를 불러오는 중입니다.</div>
      ) : source && renderError ? (
        <div className="inline-source-state error-state">
          <ErrorNotice>{renderError}</ErrorNotice>
          <div className="source-recovery-actions">
            <a className="button primary" href={`${source.rawPdfUrl}#page=${source.page}`} target="_blank" rel="noreferrer">원본 PDF 직접 열기</a>
            <Link className="button secondary" to={result.source_url} state={{ returnTo: '/search' }}>원문 전용 화면에서 다시 확인</Link>
          </div>
        </div>
      ) : source ? (
        <div className="inline-viewer" aria-label="선택한 검색 결과의 원문">
          <PdfViewerToolbar source={source} zoom={zoom} onMovePage={setPage} onZoom={setZoom} />
          <PdfPageCanvas source={source} zoom={zoom} onError={handleRenderError} />
        </div>
      ) : (
        <div className="inline-source-state error-state">
          <ErrorNotice>{sourceError || '원문 정보를 불러오지 못했습니다.'}</ErrorNotice>
          <Link className="button secondary" to={result.source_url} state={{ returnTo: '/search' }}>원문 전용 화면에서 다시 확인</Link>
        </div>
      )}
      {!sourceError && !renderError && (
        <div className="source-action">
          {source ? <a className="button primary" href={`${source.rawPdfUrl}#page=${source.page}`} target="_blank" rel="noreferrer">원본 PDF 열기</a> : <Link className="button primary" to={result.source_url} state={{ returnTo: '/search' }}>원문 전용 화면 열기</Link>}
          <span>Document · Version · 페이지로 추적된 근거</span>
        </div>
      )}
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
