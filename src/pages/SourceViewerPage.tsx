import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getDocument, GlobalWorkerOptions, TextLayer } from 'pdfjs-dist'
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { APIError, api } from '../api/client'
import { ErrorNotice } from '../components/ErrorNotice'
import type { Source } from '../types'

GlobalWorkerOptions.workerSrc = workerURL

const zoomLevels = [75, 100, 125, 150]

export function SourceViewerPage() {
  const { documentID = '', version: rawVersion = '' } = useParams()
  const version = Number(rawVersion)
  const [params, setParams] = useSearchParams()
  const requestedPage = Number(params.get('page') ?? 1)
  const [source, setSource] = useState<Source | null>(null)
  const [zoom, setZoom] = useState(100)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const loadSource = useCallback(async () => {
    try { setSource(await api.source(documentID, version, page)); setError('') } catch (reason) { setError(reason instanceof APIError ? reason.message : '원문 정보를 불러오지 못했습니다.') }
  }, [documentID, page, version])

  useEffect(() => { void loadSource() }, [loadSource])

  useEffect(() => {
    if (!source || !canvasRef.current || !textLayerRef.current || !stageRef.current) return
    const currentSource = source
    let cancelled = false
    const canvas = canvasRef.current
    const textLayer = textLayerRef.current
    const stage = stageRef.current
    async function render() {
      const documentProxy = await getDocument({ url: currentSource.rawPdfUrl, withCredentials: true }).promise
      try {
        if (cancelled) return
        const documentPage = await documentProxy.getPage(currentSource.page)
        const natural = documentPage.getViewport({ scale: 1 })
        const available = Math.max(300, stage.clientWidth - 40)
        const scale = Math.min((available / natural.width) * (zoom / 100), 2)
        const viewport = documentPage.getViewport({ scale })
        const outputScale = Math.min(window.devicePixelRatio || 1, 2)
        const context = canvas.getContext('2d', { alpha: false })
        if (!context) throw new Error('PDF canvas를 만들지 못했습니다.')
        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`
        textLayer.replaceChildren()
        textLayer.style.width = `${Math.floor(viewport.width)}px`
        textLayer.style.height = `${Math.floor(viewport.height)}px`
        await documentPage.render({ canvas, canvasContext: context, viewport, transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0] }).promise
        if (cancelled) return
        const textContent = await documentPage.getTextContent()
        const layer = new TextLayer({ textContentSource: textContent, container: textLayer, viewport })
        await layer.render()
      } finally {
        await documentProxy.destroy()
      }
    }
    void render().catch(() => { if (!cancelled) setError('PDF 렌더링을 완료하지 못했습니다. 원본 PDF를 직접 열어 주세요.') })
    return () => { cancelled = true }
  }, [source, zoom])

  function movePage(next: number) {
    if (!source) return
    setParams({ page: String(Math.max(1, Math.min(next, source.pageCount))) })
  }

  if (!Number.isInteger(version) || version < 1) return <ErrorNotice>버전을 확인하세요.</ErrorNotice>
  if (error && !source) return <ErrorNotice>{error}</ErrorNotice>
  if (!source) return <div className="skeleton-list" aria-live="polite">정확한 원문 페이지를 불러오는 중입니다.</div>
  const index = zoomLevels.indexOf(zoom)

  return <div className="page-stack viewer-page"><header className="page-header split"><div><Link className="back-link" to={`/documents/${source.documentId}`}>← 문서 상세</Link><p className="eyebrow">Source evidence</p><h1>{source.documentName}</h1><p className="muted">v{source.version} · {source.page}/{source.pageCount}페이지</p></div><a className="button secondary" href={`${source.rawPdfUrl}#page=${source.page}`} target="_blank" rel="noreferrer">원본 PDF 열기</a></header>{error && <ErrorNotice>{error}</ErrorNotice>}<section className="viewer-shell"><div className="viewer-toolbar"><div className="toolbar-group"><button aria-label="이전 페이지" className="icon-button" disabled={source.page <= 1} onClick={() => movePage(source.page - 1)}>‹</button><label className="page-input"><span className="sr-only">현재 페이지</span><input type="number" min={1} max={source.pageCount} value={source.page} onChange={(event) => movePage(Number(event.target.value))} /><span>/ {source.pageCount}</span></label><button aria-label="다음 페이지" className="icon-button" disabled={source.page >= source.pageCount} onClick={() => movePage(source.page + 1)}>›</button></div><div className="toolbar-group"><button aria-label="축소" className="icon-button" disabled={index <= 0} onClick={() => setZoom(zoomLevels[index - 1])}>−</button><span>{zoom}%</span><button aria-label="확대" className="icon-button" disabled={index >= zoomLevels.length - 1} onClick={() => setZoom(zoomLevels[index + 1])}>＋</button><button className="button link-button" onClick={() => setZoom(100)}>100%</button></div></div><div className="viewer-content"><div className="pdf-stage" ref={stageRef}><div className="pdf-page"><canvas ref={canvasRef} aria-label={`${source.documentName} ${source.page}페이지`} /><div className="text-layer" ref={textLayerRef} /></div></div><aside className="source-panel"><p className="eyebrow">Citation</p><h2>검색 근거 위치</h2><p>검색 결과가 가리킨 정확한 문서 버전과 페이지입니다.</p><dl><div><dt>문서</dt><dd>{source.documentName}</dd></div><div><dt>버전</dt><dd>v{source.version}</dd></div><div><dt>페이지</dt><dd>{source.page}페이지</dd></div><div><dt>버전 ID</dt><dd><code>{source.versionId}</code></dd></div></dl></aside></div></section></div>
}
