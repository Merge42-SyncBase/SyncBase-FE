import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../api/client'
import { SearchPage } from './SearchPage'

vi.mock('../api/client', () => ({
  APIError: class APIError extends Error {},
  api: { search: vi.fn() },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Evidence Workbench search', () => {
  it('selects the strongest result first and keeps exact source links aligned with the selected evidence', async () => {
    vi.mocked(api.search).mockResolvedValue({
      query: '연차 휴가',
      results: [
        {
          rank: 1,
          score: 0.96,
          document_id: '11111111-1111-4111-8111-111111111111',
          document_name: '인사·복무 운영규정',
          version_id: 'aaaaaaaa-1111-4111-8111-111111111111',
          document_version: 3,
          page_number: 12,
          snippet: '직원의 연차유급휴가는 근속 기간에 따라 부여한다.',
          source_url: '/sources/11111111-1111-4111-8111-111111111111/versions/3?page=12',
        },
        {
          rank: 2,
          score: 0.88,
          document_id: '22222222-2222-4222-8222-222222222222',
          document_name: '경영지원 일반지침',
          version_id: 'bbbbbbbb-2222-4222-8222-222222222222',
          document_version: 2,
          page_number: 34,
          snippet: '연차휴가는 운영규정의 절차와 신청 서식을 따른다.',
          source_url: '/sources/22222222-2222-4222-8222-222222222222/versions/2?page=34',
        },
      ],
    })
    const user = userEvent.setup()

    render(<MemoryRouter><SearchPage /></MemoryRouter>)

    await user.type(screen.getByRole('textbox', { name: '조직 지식 검색어' }), '연차 휴가')
    await user.click(screen.getByRole('button', { name: '검색' }))

    expect(api.search).toHaveBeenCalledWith('연차 휴가')
    expect(await screen.findByText('검색 결과 2건')).toBeInTheDocument()

    const firstResult = screen.getByRole('button', { name: /인사·복무 운영규정/ })
    const secondResult = screen.getByRole('button', { name: /경영지원 일반지침/ })
    expect(firstResult).toHaveAttribute('aria-pressed', 'true')
    expect(secondResult).toHaveAttribute('aria-pressed', 'false')

    const sourcePanel = screen.getByRole('complementary', { name: '근거 원문' })
    expect(within(sourcePanel).getByRole('link', { name: /정확한 원문 페이지에서 검증/ })).toHaveAttribute(
      'href',
      '/sources/11111111-1111-4111-8111-111111111111/versions/3?page=12',
    )
    expect(within(sourcePanel).getByText('12페이지')).toBeInTheDocument()
    expect(within(sourcePanel).getByText(/snippet은 원문을 대신하지 않습니다/)).toBeInTheDocument()

    await user.click(secondResult)

    expect(firstResult).toHaveAttribute('aria-pressed', 'false')
    expect(secondResult).toHaveAttribute('aria-pressed', 'true')
    expect(within(sourcePanel).getByRole('link', { name: /원문 페이지 열기/ })).toHaveAttribute(
      'href',
      '/sources/22222222-2222-4222-8222-222222222222/versions/2?page=34',
    )
    expect(within(sourcePanel).getByText('34페이지')).toBeInTheDocument()
  })
})
