import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import type { Source } from '../types'
import { SourceViewerPage } from './SourceViewerPage'

vi.mock('../api/client', () => ({
  APIError: class APIError extends Error {},
  api: { source: vi.fn() },
}))

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ session: { user: { username: 'admin', role: 'DOCUMENT_ADMIN' } } }),
}))

vi.mock('../components/PdfPageCanvas', () => ({
  PdfPageCanvas: ({ source, zoom }: { source: Source; zoom: number }) => (
    <div data-testid="pdf-page">{source.documentName} {source.page}페이지 {zoom}%</div>
  ),
}))

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="현재 경로">{location.pathname}{location.search}</output>
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('source viewer', () => {
  it('keeps page navigation inside the exact Document and Version source contract', async () => {
    vi.mocked(api.source).mockImplementation(async (documentID, version, page) => ({
      documentId: documentID,
      documentName: '인사 규정',
      versionId: 'version-3',
      version,
      pageCount: 12,
      page,
      sourceUrl: `/sources/${documentID}/versions/${version}?page=${page}`,
      rawPdfUrl: `/api/v1/documents/${documentID}/versions/${version}/raw.pdf`,
    }))
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/sources/doc-1/versions/3?page=7']}>
        <Routes>
          <Route path="/sources/:documentID/versions/:version" element={<><SourceViewerPage /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('인사 규정 7페이지 100%')).toBeInTheDocument()
    expect(api.source).toHaveBeenCalledWith('doc-1', 3, 7)
    expect(screen.getByRole('link', { name: '원본 PDF 열기' })).toHaveAttribute(
      'href',
      '/api/v1/documents/doc-1/versions/3/raw.pdf#page=7',
    )

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))

    await waitFor(() => expect(api.source).toHaveBeenCalledWith('doc-1', 3, 8))
    expect(await screen.findByText('인사 규정 8페이지 100%')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '현재 경로' })).toHaveTextContent('/sources/doc-1/versions/3?page=8')

    await user.click(screen.getByRole('button', { name: '확대' }))
    expect(screen.getByText('인사 규정 8페이지 125%')).toBeInTheDocument()
  })
})
