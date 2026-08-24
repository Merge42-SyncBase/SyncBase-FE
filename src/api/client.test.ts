import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('browser API client', () => {
  it('uses same-origin credentials and forwards CSRF on multipart registration', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      documentId: 'doc-1', versionId: 'version-1', version: 1, runId: 'run-1', status: 'QUEUED', recovered: false,
      documentUrl: '/documents/doc-1', sourceViewerUrl: '/sources/doc-1/versions/1?page=1',
    }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await api.registerDocument(new File(['%PDF-1.7'], 'policy.pdf', { type: 'application/pdf' }), '정책', 'request-1', 'csrf-1')

    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(path).toBe('/api/v1/documents')
    expect(init.credentials).toBe('include')
    expect(new Headers(init.headers).get('X-CSRF-Token')).toBe('csrf-1')
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('requestKey')).toBe('request-1')
    expect((init.body as FormData).get('documentName')).toBe('정책')
  })

  it('returns the stable API error envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'PROFILE_MISMATCH', message: '프로필이 다릅니다.', retryable: false },
    }), { status: 409, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.search('휴가')).rejects.toMatchObject({
      name: 'APIError', code: 'PROFILE_MISMATCH', status: 409, retryable: false,
    })
  })

  it('keeps PDF requests under the authenticated API boundary', () => {
    expect(api.rawPDFURL('doc/one', 3)).toBe('/api/v1/documents/doc%2Fone/versions/3/raw.pdf')
  })

  it('uses the recovery key as an encoded resource path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'pending' }), {
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await api.recovery('request/key')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/uploads/recovery/request%2Fkey', expect.any(Object))
  })

  it('rejects a collection envelope returned by the document detail endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      documents: [{ id: 'expense-policy', name: '법인카드·출장비 정산규정' }],
      limit: 100,
      offset: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.document('expense-policy')).rejects.toMatchObject({
      name: 'APIError',
      code: 'INVALID_RESPONSE',
      status: 502,
      retryable: true,
    })
  })

  it('requests normalized-name guidance without treating matches as conflicts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      normalizedName: '보안 정책',
      total: 2,
      documents: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.documentNameMatches(' 보안 정책 ')).resolves.toMatchObject({
      normalizedName: '보안 정책',
      total: 2,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/documents/name-matches?name=%20%EB%B3%B4%EC%95%88%20%EC%A0%95%EC%B1%85%20',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('rejects a malformed normalized-name guidance response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      normalizedName: '보안 정책',
      total: 'two',
      documents: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.documentNameMatches('보안 정책')).rejects.toMatchObject({
      name: 'APIError',
      code: 'INVALID_RESPONSE',
      status: 502,
      retryable: true,
    })
  })
})
