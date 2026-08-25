import type { Source } from '../types'

const zoomLevels = [75, 100, 125, 150]

interface PdfViewerToolbarProps {
  source: Source
  zoom: number
  onMovePage: (page: number) => void
  onZoom: (zoom: number) => void
}

export function PdfViewerToolbar({ source, zoom, onMovePage, onZoom }: PdfViewerToolbarProps) {
  const index = zoomLevels.indexOf(zoom)
  return (
    <div className="viewer-toolbar">
      <div className="toolbar-group">
        <button aria-label="이전 페이지" className="icon-button" disabled={source.page <= 1} onClick={() => onMovePage(source.page - 1)}>‹</button>
        <label className="page-input">
          <span className="sr-only">현재 페이지</span>
          <input type="number" min={1} max={source.pageCount} value={source.page} onChange={(event) => onMovePage(Number(event.target.value))} />
          <span>/ {source.pageCount}</span>
        </label>
        <button aria-label="다음 페이지" className="icon-button" disabled={source.page >= source.pageCount} onClick={() => onMovePage(source.page + 1)}>›</button>
      </div>
      <div className="toolbar-group">
        <button aria-label="축소" className="icon-button" disabled={index <= 0} onClick={() => onZoom(zoomLevels[index - 1])}>−</button>
        <button className="zoom-value" aria-label={`현재 배율 ${zoom}%, 100%로 재설정`} onClick={() => onZoom(100)}>{zoom}%</button>
        <button aria-label="확대" className="icon-button" disabled={index >= zoomLevels.length - 1} onClick={() => onZoom(zoomLevels[index + 1])}>＋</button>
      </div>
    </div>
  )
}
