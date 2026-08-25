import type {
  APIErrorPayload,
  DocumentDetails,
  DocumentListResponse,
  DocumentNameMatches,
  DocumentSummary,
  Preflight,
  Registration,
  SearchResponse,
  SearchResult,
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

function invalidResponse(message: string): APIError {
  return new APIError(502, {
    error: {
      code: 'INVALID_RESPONSE',
      message,
      retryable: true,
    },
  })
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
}

function searchResultSourcePath(documentID: string, version: number, page: number): string {
  return `/sources/${encodeURIComponent(documentID)}/versions/${version}?page=${page}`
}

function normalizedSourcePath(value: unknown, expectedPath: string): string | null {
  if (typeof value !== 'string') return null
  try {
    const parsed = new URL(value, 'http://syncbase.invalid')
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.hash) return null
    return `${parsed.pathname}${parsed.search}` === expectedPath ? expectedPath : null
  } catch {
    return null
  }
}

function isSearchResult(payload: unknown): payload is SearchResult {
  if (typeof payload !== 'object' || payload === null) return false
  const value = payload as Record<string, unknown>
  const expectedSourcePath = typeof value.document_id === 'string' && isPositiveInteger(value.document_version) && isPositiveInteger(value.page_number)
    ? searchResultSourcePath(value.document_id, value.document_version, value.page_number)
    : ''
  return (
    isPositiveInteger(value.rank) &&
    typeof value.score === 'number' && Number.isFinite(value.score) && value.score >= 0 && value.score <= 1 &&
    typeof value.document_id === 'string' && value.document_id.length > 0 &&
    typeof value.document_name === 'string' && value.document_name.length > 0 &&
    typeof value.version_id === 'string' && value.version_id.length > 0 &&
    isPositiveInteger(value.document_version) &&
    isPositiveInteger(value.page_number) &&
    typeof value.snippet === 'string' &&
    normalizedSourcePath(value.source_url, expectedSourcePath) !== null
  )
}

function parseSearchResponse(payload: unknown): SearchResponse {
  if (typeof payload !== 'object' || payload === null) {
    throw invalidResponse('검색 응답 형식이 올바르지 않습니다.')
  }
  const value = payload as Record<string, unknown>
  const results = value.results
  if (
    typeof value.query !== 'string' ||
    !Array.isArray(results) ||
    results.some((result) => !isSearchResult(result))
  ) {
    throw invalidResponse('검색 응답 형식이 올바르지 않습니다.')
  }

  const normalizedResults = (results as SearchResult[]).map((result) => ({
    ...result,
    source_url: searchResultSourcePath(result.document_id, result.document_version, result.page_number),
  }))
  const hasGroundingStatus = Object.prototype.hasOwnProperty.call(value, 'grounding_status')
  const hasGroundingReason = Object.prototype.hasOwnProperty.call(value, 'grounding_reason')
  if (!hasGroundingStatus && !hasGroundingReason) {
    return {
      query: value.query,
      grounding_status: normalizedResults.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT_EVIDENCE',
      grounding_reason: normalizedResults.length > 0 ? null : 'NO_HITS_ABOVE_POLICY',
      results: normalizedResults,
    }
  }
  if (hasGroundingStatus !== hasGroundingReason) {
    throw invalidResponse('검색 근거 상태를 확인할 수 없습니다.')
  }

  const validStatus = value.grounding_status === 'SUPPORTED' || value.grounding_status === 'INSUFFICIENT_EVIDENCE'
  const validReason = value.grounding_reason === null || [
    'NO_HITS_ABOVE_POLICY',
    'ONLY_INACTIVE_VERSION_MATCHED',
    'SOURCE_UNAVAILABLE',
  ].includes(String(value.grounding_reason))
  const hasSupportedEvidence = value.grounding_status === 'SUPPORTED' && value.grounding_reason === null && normalizedResults.length > 0
  const hasInsufficientEvidence = value.grounding_status === 'INSUFFICIENT_EVIDENCE' && value.grounding_reason !== null && normalizedResults.length === 0
  if (
    !validStatus ||
    !validReason ||
    (!hasSupportedEvidence && !hasInsufficientEvidence)
  ) {
    throw invalidResponse('검색 응답 형식이 올바르지 않습니다.')
  }
  return {
    ...(payload as SearchResponse),
    results: normalizedResults,
  }
}

function parseSource(payload: unknown): Source {
  if (typeof payload !== 'object' || payload === null) {
    throw invalidResponse('원문 응답 형식이 올바르지 않습니다.')
  }
  const value = payload as Record<string, unknown>
  const expectedSourceURL = typeof value.documentId === 'string' && isPositiveInteger(value.version) && isPositiveInteger(value.page)
    ? `/sources/${encodeURIComponent(value.documentId)}/versions/${value.version}?page=${value.page}`
    : ''
  const expectedRawPDFURL = typeof value.documentId === 'string' && isPositiveInteger(value.version)
    ? `/api/v1/documents/${encodeURIComponent(value.documentId)}/versions/${value.version}/raw.pdf`
    : ''
  if (
    typeof value.documentId !== 'string' || value.documentId.length === 0 ||
    typeof value.documentName !== 'string' || value.documentName.length === 0 ||
    typeof value.versionId !== 'string' || value.versionId.length === 0 ||
    !isPositiveInteger(value.version) ||
    !isPositiveInteger(value.pageCount) ||
    !isPositiveInteger(value.page) || value.page > value.pageCount ||
    value.sourceUrl !== expectedSourceURL ||
    value.rawPdfUrl !== expectedRawPDFURL
  ) {
    throw invalidResponse('원문 응답 형식이 올바르지 않습니다.')
  }
  return payload as Source
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

  async source(documentID: string, version: number, page: number): Promise<Source> {
    const payload = await request<unknown>(
      `/api/v1/documents/${encodeURIComponent(documentID)}/versions/${version}/source?page=${page}`,
    )
    const source = parseSource(payload)
    if (source.documentId !== documentID || source.version !== version || source.page !== page) {
      throw invalidResponse('원문 응답이 요청한 Document·Version·페이지와 일치하지 않습니다.')
    }
    return source
  },

  rawPDFURL(documentID: string, version: number): string {
    return `/api/v1/documents/${encodeURIComponent(documentID)}/versions/${version}/raw.pdf`
  },
}
