import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { APIError, api } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { isDocumentAdmin } from '../auth/roles'
import { ErrorNotice } from '../components/ErrorNotice'
import { PdfPageCanvas } from '../components/PdfPageCanvas'
import { PdfViewerToolbar } from '../components/PdfViewerToolbar'
import { safeDestinationForRole } from '../routing/internalPaths'
import type { Source } from '../types'

export function SourceViewerPage() {
  const { documentID = '', version: rawVersion = '' } = useParams()
  const { session } = useAuth()
  const location = useLocation()
  const version = Number(rawVersion)
  const [params, setParams] = useSearchParams()
  const requestedPage = Number(params.get('page') ?? 1)
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const [source, setSource] = useState<Source | null>(null)
  const [zoom, setZoom] = useState(100)
  const [error, setError] = useState('')
  const fallbackReturnTo = isDocumentAdmin(session?.user.role ?? '') ? `/documents/${documentID}` : '/search'
  const returnTo = safeDestinationForRole(
    typeof location.state === 'object' && location.state !== null ? (location.state as Record<string, unknown>).returnTo : null,
    session?.user.role ?? '',
    fallbackReturnTo,
  )
  const returnLabel = returnTo.startsWith('/documents/') ? '문서 상세' : '근거 검색'

  useEffect(() => {
    if (!Number.isInteger(version) || version < 1) return
    let current = true
    setSource(null)
    setError('')
    void api.source(documentID, version, page).then((nextSource) => {
      if (current) setSource(nextSource)
    }).catch((reason: unknown) => {
      if (current) setError(reason instanceof APIError ? reason.message : '원문 정보를 불러오지 못했습니다.')
    })
    return () => { current = false }
  }, [documentID, page, version])

  const handleRenderError = useCallback((message: string) => setError(message), [])

  function movePage(next: number) {
    if (!source || !Number.isFinite(next)) return
    setParams({ page: String(Math.max(1, Math.min(Math.trunc(next), source.pageCount))) })
  }

  if (!Number.isInteger(version) || version < 1) return <ErrorNotice>버전을 확인하세요.</ErrorNotice>
  if (error && !source) return <ErrorNotice>{error}</ErrorNotice>
  if (!source) return <div className="skeleton-list" aria-live="polite">정확한 원문 페이지를 불러오는 중입니다.</div>

  return (
    <div className="page-stack viewer-page">
      <header className="page-header split">
        <div>
          <Link className="back-link" to={returnTo}>← {returnLabel}</Link>
          <h1>{source.documentName}</h1>
          <p className="muted">검색 근거의 Document·Version·페이지를 그대로 확인합니다.</p>
        </div>
        <a className="button secondary" href={`${source.rawPdfUrl}#page=${source.page}`} target="_blank" rel="noreferrer">원본 PDF 열기</a>
      </header>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <section className="viewer-shell" aria-label="근거 원문 뷰어">
        <PdfViewerToolbar source={source} zoom={zoom} onMovePage={movePage} onZoom={setZoom} />
        <div className="viewer-content">
          <PdfPageCanvas source={source} zoom={zoom} onError={handleRenderError} />
          <aside className="source-panel">
            <h2>검색 근거 위치</h2>
            <p>검색 결과가 가리킨 정확한 문서 버전과 페이지입니다.</p>
            <dl>
              <div><dt>Document</dt><dd>{source.documentName}</dd></div>
              <div><dt>Version</dt><dd>v{source.version}</dd></div>
              <div><dt>페이지</dt><dd>{source.page}페이지 / {source.pageCount}페이지</dd></div>
              <div><dt>Version ID</dt><dd><code>{source.versionId}</code></dd></div>
            </dl>
          </aside>
        </div>
      </section>
    </div>
  )
}
