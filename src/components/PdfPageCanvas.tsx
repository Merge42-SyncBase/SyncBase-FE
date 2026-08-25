import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, TextLayer } from 'pdfjs-dist'
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { Source } from '../types'

GlobalWorkerOptions.workerSrc = workerURL

interface PdfPageCanvasProps {
  source: Source
  zoom: number
  onError: (message: string) => void
}

export function PdfPageCanvas({ source, zoom, onError }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(0)
  const [rendering, setRendering] = useState(true)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => setStageWidth(Math.floor(stage.getBoundingClientRect().width))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!stageWidth || !canvasRef.current || !textLayerRef.current) return
    const canvas = canvasRef.current
    const textLayerElement = textLayerRef.current
    const loadingTask = getDocument({ url: source.rawPdfUrl, withCredentials: true })
    let cancelled = false
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null
    let textLayer: TextLayer | null = null

    setRendering(true)
    onError('')

    async function render() {
      const documentProxy = await loadingTask.promise
      if (cancelled) return
      const documentPage = await documentProxy.getPage(source.page)
      const natural = documentPage.getViewport({ scale: 1 })
      const available = Math.max(280, stageWidth - 40)
      const scale = Math.min((available / natural.width) * (zoom / 100), 2.5)
      const viewport = documentPage.getViewport({ scale })
      const outputScale = Math.min(window.devicePixelRatio || 1, 2)
      const context = canvas.getContext('2d', { alpha: false })
      if (!context) throw new Error('PDF canvas를 만들지 못했습니다.')

      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`
      textLayerElement.replaceChildren()
      textLayerElement.style.width = `${Math.floor(viewport.width)}px`
      textLayerElement.style.height = `${Math.floor(viewport.height)}px`

      renderTask = documentPage.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
      })
      await renderTask.promise
      if (cancelled) return

      const textContent = await documentPage.getTextContent()
      textLayer = new TextLayer({ textContentSource: textContent, container: textLayerElement, viewport })
      await textLayer.render()
      if (!cancelled) setRendering(false)
    }

    void render().catch((reason: unknown) => {
      if (cancelled || (reason instanceof Error && reason.name === 'RenderingCancelledException')) return
      setRendering(false)
      onError('PDF 렌더링을 완료하지 못했습니다. 원본 PDF를 직접 열어 주세요.')
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
      textLayer?.cancel()
      void loadingTask.destroy()
    }
  }, [onError, source.page, source.rawPdfUrl, stageWidth, zoom])

  return (
    <div className="pdf-stage" ref={stageRef} tabIndex={0} aria-label="PDF 원문 페이지">
      {rendering && <span className="pdf-render-status" role="status">원문 페이지를 렌더링하는 중입니다.</span>}
      <div className="pdf-page" role="document" aria-label={`${source.documentName} ${source.page}페이지 원문`} aria-busy={rendering}>
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="text-layer" ref={textLayerRef} />
      </div>
    </div>
  )
}
