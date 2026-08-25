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

  it('rejects an insufficient-evidence response that leaks a search hit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      query: '검증 질문',
      grounding_status: 'INSUFFICIENT_EVIDENCE',
      grounding_reason: 'NO_HITS_ABOVE_POLICY',
      results: [{ rank: 1, snippet: '이 근거는 노출되면 안 됩니다.' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.search('검증 질문')).rejects.toMatchObject({
      name: 'APIError', code: 'INVALID_RESPONSE', status: 502, retryable: true,
    })
  })

  it('normalizes a valid legacy search response during a rolling deployment', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      query: '검증 질문',
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
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.search('검증 질문')).resolves.toMatchObject({
      grounding_status: 'SUPPORTED',
      grounding_reason: null,
      results: [{ document_version: 2, page_number: 3 }],
    })
  })

  it('preserves every hit field in the current supported contract', async () => {
    const response = {
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
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))

    await expect(api.search('검증 질문')).resolves.toEqual(response)
  })

  it('normalizes a legacy empty search response without inventing evidence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      query: '없는 질문',
      results: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.search('없는 질문')).resolves.toEqual({
      query: '없는 질문',
      grounding_status: 'INSUFFICIENT_EVIDENCE',
      grounding_reason: 'NO_HITS_ABOVE_POLICY',
      results: [],
    })
  })

  it('rejects a partially upgraded grounding response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      query: '검증 질문',
      grounding_status: 'SUPPORTED',
      results: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.search('검증 질문')).rejects.toMatchObject({
      name: 'APIError', code: 'INVALID_RESPONSE', status: 502, retryable: true,
    })
  })

  it.each([
    'NO_HITS_ABOVE_POLICY',
    'ONLY_INACTIVE_VERSION_MATCHED',
    'SOURCE_UNAVAILABLE',
  ] as const)('accepts the current empty-evidence contract for %s', async (reason) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      query: '검증 질문',
      grounding_status: 'INSUFFICIENT_EVIDENCE',
      grounding_reason: reason,
      results: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.search('검증 질문')).resolves.toEqual({
      query: '검증 질문',
      grounding_status: 'INSUFFICIENT_EVIDENCE',
      grounding_reason: reason,
      results: [],
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
      total: 1,
      documents: [{
        id: '11111111-1111-4111-8111-111111111111',
        name: '보안 정책',
        activeVersion: null,
        latestStatus: 'ACTIVE',
        updatedAt: '2026-08-25T00:00:00Z',
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.documentNameMatches('보안 정책')).rejects.toMatchObject({
      name: 'APIError',
      code: 'INVALID_RESPONSE',
      status: 502,
      retryable: true,
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      normalizedName: '보안 정책',
      total: 0,
      documents: [{
        id: '11111111-1111-4111-8111-111111111111',
        name: '보안 정책',
        activeVersion: 1,
        latestVersion: 1,
        latestStatus: 'ACTIVE',
        updatedAt: '2026-08-25T00:00:00Z',
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.documentNameMatches('보안 정책')).rejects.toMatchObject({
      name: 'APIError',
      code: 'INVALID_RESPONSE',
    })
  })
})
