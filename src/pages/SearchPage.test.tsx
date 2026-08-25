import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../api/client'
import type { SearchResult, Source } from '../types'
import { SearchPage } from './SearchPage'

vi.mock('../api/client', () => ({
  APIError: class APIError extends Error {},
  api: { search: vi.fn(), source: vi.fn() },
}))

vi.mock('../components/PdfPageCanvas', () => ({
  PdfPageCanvas: ({ source, onError }: { source: Source; onError: (message: string) => void }) => (
    <div>
      <span data-testid="pdf-page">{source.documentName} {source.page}페이지 PDF</span>
      <button type="button" onClick={() => onError('PDF 렌더링을 완료하지 못했습니다. 원본 PDF를 직접 열어 주세요.')}>PDF 렌더 오류 발생</button>
    </div>
  ),
}))

const firstResult: SearchResult = {
  rank: 1,
  score: 0.96,
  document_id: '11111111-1111-4111-8111-111111111111',
  document_name: '인사·복무 운영규정',
  version_id: 'aaaaaaaa-1111-4111-8111-111111111111',
  document_version: 3,
  page_number: 12,
  snippet: '직원의 연차유급휴가는 근속 기간에 따라 부여한다.',
  source_url: '/sources/11111111-1111-4111-8111-111111111111/versions/3?page=12',
}

const secondResult: SearchResult = {
  rank: 2,
  score: 0.88,
  document_id: '22222222-2222-4222-8222-222222222222',
  document_name: '경영지원 일반지침',
  version_id: 'bbbbbbbb-2222-4222-8222-222222222222',
  document_version: 2,
  page_number: 34,
  snippet: '연차휴가는 운영규정의 절차와 신청 서식을 따른다.',
  source_url: '/sources/22222222-2222-4222-8222-222222222222/versions/2?page=34',
}

function sourceFor(result: SearchResult, page = result.page_number): Source {
  return {
    documentId: result.document_id,
    documentName: result.document_name,
    versionId: result.version_id,
    version: result.document_version,
    pageCount: 58,
    page,
    sourceUrl: `${result.source_url.split('?')[0]}?page=${page}`,
    rawPdfUrl: `/api/v1/documents/${result.document_id}/versions/${result.document_version}/raw.pdf`,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Evidence Workbench search', () => {
  it('opens the strongest result as an authenticated inline PDF and keeps exact evidence aligned when selection changes', async () => {
    vi.mocked(api.search).mockResolvedValue({
      query: '연차 휴가',
      grounding_status: 'SUPPORTED',
      grounding_reason: null,
      results: [firstResult, secondResult],
    })
    vi.mocked(api.source).mockImplementation(async (documentID, _version, page) => (
      sourceFor(documentID === firstResult.document_id ? firstResult : secondResult, page)
    ))
    const user = userEvent.setup()

    render(<MemoryRouter><SearchPage /></MemoryRouter>)

    await user.type(screen.getByRole('textbox', { name: '조직 지식 검색어' }), '연차 휴가')
    await user.click(screen.getByRole('button', { name: '검색' }))

    expect(api.search).toHaveBeenCalledWith('연차 휴가')
    expect(await screen.findByText('검색 결과 2건')).toBeInTheDocument()

    const firstButton = screen.getByRole('button', { name: /인사·복무 운영규정/ })
    const secondButton = screen.getByRole('button', { name: /경영지원 일반지침/ })
    expect(firstButton).toHaveAttribute('aria-pressed', 'true')
    expect(secondButton).toHaveAttribute('aria-pressed', 'false')
    await waitFor(() => expect(api.source).toHaveBeenCalledWith(firstResult.document_id, 3, 12))

    const sourcePanel = screen.getByRole('complementary', { name: '근거 원문' })
    expect(await within(sourcePanel).findByText('인사·복무 운영규정 12페이지 PDF')).toBeInTheDocument()
    expect(within(sourcePanel).getByRole('link', { name: '원본 PDF 열기' })).toHaveAttribute(
      'href',
      `/api/v1/documents/${firstResult.document_id}/versions/3/raw.pdf#page=12`,
    )

    await user.click(secondButton)

    expect(firstButton).toHaveAttribute('aria-pressed', 'false')
    expect(secondButton).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(api.source).toHaveBeenCalledWith(secondResult.document_id, 2, 34))
    expect(await within(sourcePanel).findByText('경영지원 일반지침 34페이지 PDF')).toBeInTheDocument()
    expect(within(sourcePanel).getByRole('link', { name: /원문 전용 화면/ })).toHaveAttribute('href', secondResult.source_url)

    fireEvent.change(within(sourcePanel).getByRole('spinbutton', { name: /현재 페이지/ }), { target: { value: '999' } })
    await waitFor(() => expect(api.source).toHaveBeenCalledWith(secondResult.document_id, 2, 58))
    expect(await within(sourcePanel).findByText('경영지원 일반지침 58페이지 PDF')).toBeInTheDocument()
  })

  it.each([
    ['NO_HITS_ABOVE_POLICY', '기준을 충족하는 근거가 없습니다.'],
    ['ONLY_INACTIVE_VERSION_MATCHED', 'ACTIVE Version에서 근거를 찾지 못했습니다.'],
    ['SOURCE_UNAVAILABLE', '검색 근거를 확인할 수 없습니다.'],
  ] as const)('explains the %s grounding outcome without inventing evidence', async (groundingReason, expectedCopy) => {
    vi.mocked(api.search).mockResolvedValue({
      query: '확인할 질문',
      grounding_status: 'INSUFFICIENT_EVIDENCE',
      grounding_reason: groundingReason,
      results: [],
    })
    const user = userEvent.setup()

    render(<MemoryRouter><SearchPage /></MemoryRouter>)
    await user.type(screen.getByRole('textbox', { name: '조직 지식 검색어' }), '확인할 질문')
    await user.click(screen.getByRole('button', { name: '검색' }))

    expect(await screen.findByText(expectedCopy)).toBeInTheDocument()
    expect(api.source).not.toHaveBeenCalled()
    expect(screen.getByText('검색 결과 0건')).toBeInTheDocument()
  })

  it('keeps both exact-original recovery paths available when inline PDF rendering fails', async () => {
    vi.mocked(api.search).mockResolvedValue({
      query: '연차 휴가',
      grounding_status: 'SUPPORTED',
      grounding_reason: null,
      results: [firstResult],
    })
    vi.mocked(api.source).mockResolvedValue(sourceFor(firstResult))
    const user = userEvent.setup()

    render(<MemoryRouter><SearchPage /></MemoryRouter>)
    await user.type(screen.getByRole('textbox', { name: '조직 지식 검색어' }), '연차 휴가')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await screen.findByTestId('pdf-page')
    await user.click(screen.getByRole('button', { name: 'PDF 렌더 오류 발생' }))

    expect(screen.getByText('PDF 렌더링을 완료하지 못했습니다. 원본 PDF를 직접 열어 주세요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '원본 PDF 직접 열기' })).toHaveAttribute(
      'href',
      `/api/v1/documents/${firstResult.document_id}/versions/3/raw.pdf#page=12`,
    )
    expect(screen.getByRole('link', { name: '원문 전용 화면에서 다시 확인' })).toHaveAttribute('href', firstResult.source_url)
  })
})
