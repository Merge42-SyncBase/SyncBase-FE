import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { api } from '../api/client'
import { recoveryNoticeTone, UploadPage } from './UploadPage'

vi.mock('../api/client', () => ({
  APIError: class APIError extends Error {},
  api: {
    documentNameMatches: vi.fn(),
    preflight: vi.fn(),
    recovery: vi.fn(),
    registerDocument: vi.fn(),
    registerVersion: vi.fn(),
  },
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
  window.localStorage.clear()
  vi.clearAllMocks()
})

describe('new Document name guidance', () => {
  it('warns about normalized-name matches and links to adding a Version without blocking creation', async () => {
    vi.mocked(api.documentNameMatches).mockResolvedValue({
      normalizedName: '보안 정책',
      total: 2,
      documents: [{
        id: '11111111-1111-4111-8111-111111111111',
        name: '보안 정책',
        activeVersion: 2,
        latestVersion: 2,
        latestStatus: 'ACTIVE',
        updatedAt: '2026-08-25T00:00:00Z',
      }],
    })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/documents/new']}>
        <Routes>
          <Route path="/documents/new" element={<UploadPage />} />
          <Route path="/documents/:documentID" element={<div>문서 상세</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByRole('textbox', { name: '문서명' }), '  보안   정책  ')

    await waitFor(() => expect(api.documentNameMatches).toHaveBeenLastCalledWith('  보안   정책  '))
    expect(await screen.findByText('같은 이름의 문서가 2개 있습니다.')).toBeInTheDocument()
    expect(screen.getByText('새 문서로 별도 등록할 수 있습니다. 같은 문서의 개정본이라면 기존 문서에 새 버전을 등록하세요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ID 11111111/ })).toHaveAttribute(
      'href',
      '/documents/11111111-1111-4111-8111-111111111111/versions/new',
    )
  })

  it('keeps a failed name lookup visible and allows Document registration to continue', async () => {
    vi.mocked(api.preflight).mockResolvedValue({
      fileName: 'policy.pdf',
      byteSize: 8,
      pageCount: 1,
      sha256: 'sha256-policy',
      suggestedName: '보안 정책',
    })
    vi.mocked(api.documentNameMatches).mockRejectedValue(new Error('lookup unavailable'))
    vi.mocked(api.registerDocument).mockResolvedValue({
      documentId: '11111111-1111-4111-8111-111111111111',
      versionId: '22222222-2222-4222-8222-222222222222',
      version: 1,
      runId: '33333333-3333-4333-8333-333333333333',
      status: 'QUEUED',
      recovered: false,
      documentUrl: '/documents/11111111-1111-4111-8111-111111111111',
      sourceViewerUrl: '/sources/11111111-1111-4111-8111-111111111111/versions/1?page=1',
    })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/documents/new']}>
        <Routes>
          <Route path="/documents/new" element={<UploadPage />} />
          <Route path="/documents/:documentID" element={<div>문서 상세</div>} />
        </Routes>
      </MemoryRouter>,
    )

    const file = new File(['%PDF-1.7'], 'policy.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText('파일 선택'), file)

    expect(await screen.findByText('같은 이름의 기존 문서를 확인하지 못했습니다. 등록은 계속할 수 있습니다.')).toBeInTheDocument()
    const submit = screen.getByRole('button', { name: '문서 등록' })
    expect(submit).toBeEnabled()

    await user.click(submit)

    await waitFor(() => expect(api.registerDocument).toHaveBeenCalledWith(
      file,
      '보안 정책',
      expect.any(String),
      'csrf-test',
    ))
  })
})

describe('registration recovery notice semantics', () => {
  it.each([
    ['pending', 'pending'],
    ['accepted', 'success'],
    ['conflict', 'error'],
    ['expired', 'error'],
    ['not_committed', 'neutral'],
  ] as const)('maps %s to the %s visual state', (status, tone) => {
    expect(recoveryNoticeTone(status)).toBe(tone)
  })
})
