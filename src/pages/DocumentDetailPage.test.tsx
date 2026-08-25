import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { api } from '../api/client'
import { DocumentDetailPage } from './DocumentDetailPage'

vi.mock('../api/client', () => ({
  APIError: class APIError extends Error {},
  api: { document: vi.fn(), retry: vi.fn() },
}))

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    session: {
      user: { username: 'admin', role: 'DOCUMENT_ADMIN' },
      csrfToken: 'csrf-test',
      expiresAt: '2026-08-25T01:00:00Z',
    },
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Document Version operations', () => {
  it('shows the failed stage diagnostics and submits a bounded manual retry', async () => {
    vi.mocked(api.document).mockResolvedValue({
      id: 'doc-1',
      name: '인사 규정',
      activeVersion: 1,
      versions: [{
        id: 'version-2',
        versionNumber: 2,
        status: 'FAILED',
        active: false,
        stage: 'EMBED',
        runId: 'run-2',
        activationOutcome: 'NOT_ATTEMPTED',
        errorCode: 'TRANSIENT_EXHAUSTED',
        correlationId: 'correlation-2',
        automaticAttempts: 3,
        manualRetryAllowed: true,
        pageCount: 18,
        createdAt: '2026-08-25T00:00:00Z',
        updatedAt: '2026-08-25T00:05:00Z',
      }, {
        id: 'version-1',
        versionNumber: 1,
        status: 'ACTIVE',
        active: true,
        stage: 'ACTIVATE',
        runId: 'run-1',
        activationOutcome: 'ACTIVATED',
        correlationId: 'correlation-1',
        automaticAttempts: 1,
        manualRetryAllowed: false,
        pageCount: 17,
        createdAt: '2026-08-24T00:00:00Z',
        updatedAt: '2026-08-24T00:05:00Z',
      }],
    })
    vi.mocked(api.retry).mockResolvedValue({ runId: 'run-2' })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/documents/doc-1']}>
        <Routes><Route path="/documents/:documentID" element={<DocumentDetailPage />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '인사 규정' })).toBeInTheDocument()
    expect(screen.getByText('자동 재시도를 모두 사용했습니다.')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'v2 처리 단계' })).toHaveTextContent('임베딩실패')
    expect(screen.getByText('현재 검색 Version')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '처리 재시도' }))

    await waitFor(() => expect(api.retry).toHaveBeenCalledWith('run-2', expect.any(String), 'csrf-test'))
    expect(api.document).toHaveBeenCalledTimes(2)
  })
})
