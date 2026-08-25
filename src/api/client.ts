import type {
  APIErrorPayload,
  DocumentDetails,
  DocumentListResponse,
  DocumentNameMatches,
  DocumentSummary,
  GroundingReason,
  Preflight,
  Registration,
  SearchResponse,
  Session,
  Source,
  UploadRecovery,
} from '../types'

export class APIError extends Error {
  readonly code: string
  readonly retryable: boolean
  readonly status: number

  constructor(status: number, payload?: APIErrorPayload) {
    super(payload?.error.message ?? '요청을 처리하지 못했습니다.')
    this.name = 'APIError'
    this.status = status
    this.code = payload?.error.code ?? 'INTERNAL'
    this.retryable = payload?.error.retryable ?? status >= 500
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...init.headers,
    },
  })
  if (!response.ok) {
    let payload: APIErrorPayload | undefined
    try {
      payload = (await response.json()) as APIErrorPayload
    } catch {
      // Proxies can fail before producing an API error envelope.
    }
    throw new APIError(response.status, payload)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function parseDocumentDetails(payload: unknown): DocumentDetails {
  if (
    typeof payload !== 'object' || payload === null ||
    typeof (payload as Record<string, unknown>).id !== 'string' ||
    typeof (payload as Record<string, unknown>).name !== 'string' ||
    !Array.isArray((payload as Record<string, unknown>).versions)
  ) {
    throw new APIError(502, {
      error: {
        code: 'INVALID_RESPONSE',
        message: '문서 상세 응답 형식이 올바르지 않습니다.',
        retryable: true,
      },
    })
  }
  return payload as DocumentDetails
}

const groundingReasons: readonly GroundingReason[] = [
  'NO_HITS_ABOVE_POLICY',
  'ONLY_INACTIVE_VERSION_MATCHED',
  'SOURCE_UNAVAILABLE',
]

function invalidResponse(message: string): APIError {
  return new APIError(502, {
    error: { code: 'INVALID_RESPONSE', message, retryable: true },
  })
}

function parseSearchResponse(payload: unknown): SearchResponse {
  if (typeof payload !== 'object' || payload === null) {
    throw invalidResponse('검색 응답 형식이 올바르지 않습니다.')
  }
  const value = payload as Record<string, unknown>
  if (typeof value.query !== 'string' || !Array.isArray(value.results)) {
    throw invalidResponse('검색 응답 형식이 올바르지 않습니다.')
  }
  const malformedHit = value.results.some((candidate) => {
    if (typeof candidate !== 'object' || candidate === null) return true
    const hit = candidate as Record<string, unknown>
    return !(
      typeof hit.rank === 'number' && Number.isInteger(hit.rank) && hit.rank >= 1 &&
      typeof hit.score === 'number' && Number.isFinite(hit.score) && hit.score >= 0 && hit.score <= 1 &&
      typeof hit.document_id === 'string' && typeof hit.document_name === 'string' &&
      typeof hit.version_id === 'string' &&
      typeof hit.document_version === 'number' && Number.isInteger(hit.document_version) && hit.document_version >= 1 &&
      typeof hit.page_number === 'number' && Number.isInteger(hit.page_number) && hit.page_number >= 1 &&
      typeof hit.snippet === 'string' && typeof hit.source_url === 'string'
    )
  })
  if (malformedHit) throw invalidResponse('검색 근거 응답 형식이 올바르지 않습니다.')

  const hasGroundingStatus = Object.prototype.hasOwnProperty.call(value, 'grounding_status')
  const hasGroundingReason = Object.prototype.hasOwnProperty.call(value, 'grounding_reason')
  if (!hasGroundingStatus && !hasGroundingReason) {
    return {
      query: value.query,
      grounding_status: value.results.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT_EVIDENCE',
      grounding_reason: value.results.length > 0 ? null : 'NO_HITS_ABOVE_POLICY',
      results: value.results,
    } as SearchResponse
  }
  if (hasGroundingStatus !== hasGroundingReason) {
    throw invalidResponse('검색 근거 상태를 확인할 수 없습니다.')
  }

  if (value.grounding_status === 'SUPPORTED') {
    if (value.grounding_reason !== null || value.results.length === 0) {
      throw invalidResponse('검색 근거 상태와 결과가 일치하지 않습니다.')
    }
  } else if (value.grounding_status === 'INSUFFICIENT_EVIDENCE') {
    if (
      typeof value.grounding_reason !== 'string' ||
      !groundingReasons.includes(value.grounding_reason as GroundingReason) ||
      value.results.length !== 0
    ) {
      throw invalidResponse('검색 근거 상태와 결과가 일치하지 않습니다.')
    }
  } else {
    throw invalidResponse('검색 근거 상태를 확인할 수 없습니다.')
  }
  return payload as SearchResponse
}

function parseDocumentNameMatches(payload: unknown): DocumentNameMatches {
  const value = payload as Record<string, unknown> | null
  if (
    typeof value !== 'object' || value === null ||
    typeof value.normalizedName !== 'string' ||
    typeof value.total !== 'number' || !Number.isInteger(value.total) || value.total < 0 ||
    !Array.isArray(value.documents) ||
    value.documents.length > value.total ||
    value.documents.some((document) => !isDocumentSummary(document))
  ) {
    throw new APIError(502, {
      error: {
        code: 'INVALID_RESPONSE',
        message: '같은 이름의 문서 확인 응답 형식이 올바르지 않습니다.',
        retryable: true,
      },
    })
  }
  return payload as DocumentNameMatches
}

function isDocumentSummary(payload: unknown): payload is DocumentSummary {
  if (typeof payload !== 'object' || payload === null) return false
  const value = payload as Record<string, unknown>
  const activeVersion = value.activeVersion
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (activeVersion === null || (
      typeof activeVersion === 'number' && Number.isInteger(activeVersion) && activeVersion >= 1
    )) &&
    typeof value.latestVersion === 'number' && Number.isInteger(value.latestVersion) && value.latestVersion >= 1 &&
    typeof value.latestStatus === 'string' &&
    ['QUEUED', 'PROCESSING', 'ACTIVE', 'FAILED', 'SUPERSEDED'].includes(value.latestStatus) &&
    typeof value.updatedAt === 'string'
  )
}

function csrfHeaders(csrfToken: string): HeadersInit {
  return { 'X-CSRF-Token': csrfToken }
}

export const api = {
  login(username: string, password: string): Promise<Session> {
    return request<Session>('/api/v1/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  },

  session(): Promise<Session> {
    return request<Session>('/api/v1/session')
  },

  logout(csrfToken: string): Promise<void> {
    return request<void>('/api/v1/session', {
      method: 'DELETE',
      headers: csrfHeaders(csrfToken),
    })
  },

  documents(limit = 100, offset = 0): Promise<DocumentListResponse> {
    return request<DocumentListResponse>(`/api/v1/documents?limit=${limit}&offset=${offset}`)
  },

  async documentNameMatches(name: string): Promise<DocumentNameMatches> {
    const payload = await request<unknown>(`/api/v1/documents/name-matches?name=${encodeURIComponent(name)}`)
    return parseDocumentNameMatches(payload)
  },

  async document(documentID: string): Promise<DocumentDetails> {
    const payload = await request<unknown>(`/api/v1/documents/${encodeURIComponent(documentID)}`)
    return parseDocumentDetails(payload)
  },

  preflight(file: File, csrfToken: string): Promise<Preflight> {
    const form = new FormData()
    form.set('file', file)
    return request<Preflight>('/api/v1/uploads/preflight', {
      method: 'POST',
      headers: csrfHeaders(csrfToken),
      body: form,
    })
  },

  registerDocument(file: File, documentName: string, requestKey: string, csrfToken: string): Promise<Registration> {
    const form = new FormData()
    form.set('file', file)
    form.set('documentName', documentName)
    form.set('requestKey', requestKey)
    return request<Registration>('/api/v1/documents', {
      method: 'POST',
      headers: csrfHeaders(csrfToken),
      body: form,
    })
  },

  registerVersion(documentID: string, file: File, requestKey: string, csrfToken: string): Promise<Registration> {
    const form = new FormData()
    form.set('file', file)
    form.set('requestKey', requestKey)
    return request<Registration>(`/api/v1/documents/${encodeURIComponent(documentID)}/versions`, {
      method: 'POST',
      headers: csrfHeaders(csrfToken),
      body: form,
    })
  },

  recovery(requestKey: string): Promise<UploadRecovery> {
    return request<UploadRecovery>(`/api/v1/uploads/recovery/${encodeURIComponent(requestKey)}`)
  },

  retry(runID: string, requestKey: string, csrfToken: string): Promise<{ runId: string }> {
    return request<{ runId: string }>(`/api/v1/processing-runs/${encodeURIComponent(runID)}/retry`, {
      method: 'POST',
      headers: { ...csrfHeaders(csrfToken), 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestKey }),
    })
  },

  async search(query: string, limit = 10): Promise<SearchResponse> {
    const payload = await request<unknown>(`/api/v1/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    return parseSearchResponse(payload)
  },

  source(documentID: string, version: number, page: number): Promise<Source> {
    return request<Source>(
      `/api/v1/documents/${encodeURIComponent(documentID)}/versions/${version}/source?page=${page}`,
    )
  },

  rawPDFURL(documentID: string, version: number): string {
    return `/api/v1/documents/${encodeURIComponent(documentID)}/versions/${version}/raw.pdf`
  },
}
