export type VersionStatus = 'QUEUED' | 'PROCESSING' | 'ACTIVE' | 'FAILED' | 'SUPERSEDED'

export type ProcessingStage = 'METADATA' | 'PARSE' | 'CHUNK' | 'EMBED' | 'STORE' | 'ACTIVATE'

export interface User {
  username: string
  role: 'DOCUMENT_ADMIN'
}

export interface Session {
  user: User
  csrfToken: string
  expiresAt: string
}

export interface DocumentSummary {
  id: string
  name: string
  activeVersion: number | null
  latestVersion: number
  latestStatus: VersionStatus
  updatedAt: string
}

export interface DocumentListResponse {
  documents: DocumentSummary[]
  limit: number
  offset: number
}

export interface DocumentNameMatches {
  normalizedName: string
  total: number
  documents: DocumentSummary[]
}

export interface DocumentVersion {
  id: string
  versionNumber: number
  status: VersionStatus
  active: boolean
  stage: ProcessingStage
  runId: string
  activationOutcome: 'ACTIVATED' | 'SKIPPED_SUPERSEDED' | 'NOT_ATTEMPTED' | string
  errorCode?: string
  correlationId: string
  automaticAttempts: number
  nextAutomaticRetryAt?: string
  manualRetryAllowed: boolean
  queuePosition?: number
  pageCount: number
  createdAt: string
  updatedAt: string
}

export interface DocumentDetails {
  id: string
  name: string
  activeVersion: number | null
  versions: DocumentVersion[]
  updatedAt?: string
}

export interface Preflight {
  fileName: string
  byteSize: number
  pageCount: number
  sha256: string
  suggestedName: string
}

export interface Registration {
  documentId: string
  versionId: string
  version: number
  runId: string
  status: VersionStatus
  recovered: boolean
  documentUrl: string
  sourceViewerUrl: string
}

export type UploadRecoveryStatus = 'not_committed' | 'pending' | 'accepted' | 'conflict' | 'expired'

export interface UploadRecovery {
  status: UploadRecoveryStatus
  registration?: Registration
}

export interface SearchResult {
  rank: number
  score: number
  document_id: string
  document_name: string
  version_id: string
  document_version: number
  page_number: number
  snippet: string
  source_url: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
}

export interface Source {
  documentId: string
  documentName: string
  versionId: string
  version: number
  pageCount: number
  page: number
  sourceUrl: string
  rawPdfUrl: string
}

export interface APIErrorPayload {
  error: {
    code: string
    message: string
    retryable: boolean
  }
}
