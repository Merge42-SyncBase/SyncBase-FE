import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useDemo } from '../demo/DemoProvider'

const zoomLevels = [75, 100, 125, 150]

export function SourceViewerPage() {
  const { versionId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { findVersion } = useDemo()
  const result = findVersion(versionId)
  const [zoom, setZoom] = useState(100)

  const requested = Number(searchParams.get('page') ?? 1)
  const normalizedPage = Number.isFinite(requested) ? Math.trunc(requested) : 1
  const safePage = result
    ? Math.min(Math.max(normalizedPage, 1), result.version.pages)
    : 1
  const pageWasAdjusted = !Number.isInteger(requested) || requested !== safePage
  const pageContent = useMemo(
    () => result?.version.sourcePages.find((page) => page.page === safePage),
    [result, safePage],
  )

  if (!result) {
    return (
      <div className="empty-state content-panel">
        <strong>원문을 확인할 수 없습니다.</strong>
        <p>근거 링크가 만료됐거나 현재 역할에 허용되지 않았습니다.</p>
        <Link className="button button-secondary" to="/documents">문서 목록으로</Link>
      </div>
    )
  }

  const movePage = (page: number) => setSearchParams({ page: String(Math.min(Math.max(page, 1), result.version.pages)) })
  const zoomIndex = zoomLevels.indexOf(zoom)

  return (
    <div className="page-stack viewer-page">
      <header className="page-header viewer-header">
        <div>
          <span className="eyebrow">Source evidence</span>
          <h1>{result.document.name}</h1>
          <p>{result.version.label} · {safePage}/{result.version.pages}페이지</p>
        </div>
        <Link className="button button-secondary" to={`/documents/${result.document.id}`}>문서 상세</Link>
      </header>

      {pageWasAdjusted && (
        <div className="inline-alert alert-info" role="status">
          요청한 페이지를 찾을 수 없어 {safePage}페이지를 표시합니다.
        </div>
      )}

      <section className="viewer-shell" aria-label="PDF 원문 뷰어">
        <div className="viewer-toolbar">
          <div className="toolbar-group" aria-label="페이지 이동">
            <button className="icon-button" onClick={() => movePage(safePage - 1)} disabled={safePage <= 1} aria-label="이전 페이지">‹</button>
            <label className="page-field">
              <span className="sr-only">현재 페이지</span>
              <input
                type="number"
                min={1}
                max={result.version.pages}
                step={1}
                value={safePage}
                onChange={(event) => movePage(Number(event.target.value))}
              />
              <span>/ {result.version.pages}</span>
            </label>
            <button className="icon-button" onClick={() => movePage(safePage + 1)} disabled={safePage >= result.version.pages} aria-label="다음 페이지">›</button>
          </div>
          <div className="toolbar-group" aria-label="배율 조정">
            <button className="icon-button" aria-label="축소" disabled={zoomIndex <= 0} onClick={() => setZoom(zoomLevels[Math.max(0, zoomIndex - 1)])}>−</button>
            <span className="zoom-label">{zoom}%</span>
            <button className="icon-button" aria-label="확대" disabled={zoomIndex >= zoomLevels.length - 1} onClick={() => setZoom(zoomLevels[Math.min(zoomLevels.length - 1, zoomIndex + 1)])}>＋</button>
            <button className="button button-ghost" onClick={() => setZoom(100)}>100%</button>
          </div>
          {result.version.originalUrl && (
            <a className="button button-secondary" href={result.version.originalUrl} target="_blank" rel="noreferrer">원본 PDF 열기</a>
          )}
        </div>

        <div className="viewer-content">
          <div className="pdf-stage">
            <article className="pdf-paper" style={{ width: `${Math.min(100, zoom)}%`, transform: `scale(${zoom / 100})` }} aria-hidden="true">
              <div className="pdf-page-number">{safePage}</div>
              <div className="pdf-logo">SYNCBASE SOURCE</div>
              <h2>{pageContent?.heading}</h2>
              <p>{pageContent?.text}</p>
              <p>이 영역은 실제 PDF canvas가 아닌 MVP용 시각적 mock입니다.</p>
              <div className="pdf-rule" />
              <small>{result.document.name} · {result.version.label}</small>
            </article>
          </div>
          <aside className="semantic-panel" aria-labelledby="semantic-title">
            <span className="eyebrow">Accessible fallback</span>
            <h2 id="semantic-title">페이지 텍스트</h2>
            <strong>{pageContent?.heading}</strong>
            <p>{pageContent?.text}</p>
            <dl>
              <div><dt>문서</dt><dd>{result.document.name}</dd></div>
              <div><dt>버전</dt><dd>{result.version.label}</dd></div>
              <div><dt>페이지</dt><dd>{safePage}</dd></div>
            </dl>
            <div className="inline-alert alert-info">PDF 표현이 실패해도 이 semantic text는 유지됩니다.</div>
          </aside>
        </div>
      </section>
    </div>
  )
}
