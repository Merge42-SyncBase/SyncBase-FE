import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../api/client'
import type { GroundingReason, SearchResponse } from '../types'
import { SearchPage } from './SearchPage'

vi.mock('../api/client', () => ({
  APIError: class APIError extends Error {},
  api: { search: vi.fn() },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

async function submitSearch(response: SearchResponse) {
  vi.mocked(api.search).mockResolvedValue(response)
  const user = userEvent.setup()
  render(<MemoryRouter><SearchPage /></MemoryRouter>)
  await user.type(screen.getByRole('textbox', { name: '검색어' }), '검증 질문')
  await user.click(screen.getByRole('button', { name: '검색' }))
}

describe('search grounding safety state', () => {
  it('renders supported evidence with every existing source field intact', async () => {
    await submitSearch({
      query: '검증 질문',
      grounding_status: 'SUPPORTED',
      grounding_reason: null,
      results: [{
        rank: 1,
        score: 0.91,
        document_id: '11111111-1111-4111-8111-111111111111',
        document_name: '보안 정책',
        version_id: '22222222-2222-4222-8222-222222222222',
        document_version: 2,
        page_number: 3,
        snippet: '활성 버전의 검증 가능한 근거',
        source_url: '/sources/11111111-1111-4111-8111-111111111111/versions/2?page=3',
      }],
    })

    expect(await screen.findByRole('heading', { name: '보안 정책' })).toBeInTheDocument()
    expect(screen.getByText('활성 버전의 검증 가능한 근거')).toBeInTheDocument()
    expect(screen.queryByText('충분한 근거를 제공할 수 없습니다.')).not.toBeInTheDocument()
  })

  it.each([
    ['NO_HITS_ABOVE_POLICY', '정책 기준을 충족하는 활성 근거가 없습니다.'],
    ['ONLY_INACTIVE_VERSION_MATCHED', '검색 기준을 충족한 근거가 비활성 버전에만 있습니다.'],
    ['SOURCE_UNAVAILABLE', '근거 저장소를 확인할 수 없습니다. 잠시 후 다시 시도하세요.'],
  ] satisfies Array<[GroundingReason, string]>)('renders %s as explicit empty evidence', async (reason, message) => {
    await submitSearch({
      query: '검증 질문',
      grounding_status: 'INSUFFICIENT_EVIDENCE',
      grounding_reason: reason,
      results: [],
    })

    expect(await screen.findByText('충분한 근거를 제공할 수 없습니다.')).toBeInTheDocument()
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(screen.getByText('INSUFFICIENT_EVIDENCE')).toBeInTheDocument()
    expect(screen.getByText(reason)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '근거 원문 열기' })).not.toBeInTheDocument()
  })
})
