export type Role = 'DOCUMENT_ADMIN' | 'AI_SEARCH_USER' | 'OPERATOR'

export type ProcessingStatus =
  | 'PREFLIGHTING'
  | 'UPLOADING'
  | 'VERIFYING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'RETRYING'
  | 'ACTIVE'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FINAL'
  | 'COMPLETED_INACTIVE'

export type SystemPhase = 'healthy' | 'failover' | 'recovering' | 'recovered'
export type DemoOutcome = 'happy' | 'retryable' | 'final'

export interface Session {
  name: string
  role: Role
}

export interface SourcePage {
  page: number
  heading: string
  text: string
}

export interface DocumentVersion {
  id: string
  label: string
  status: ProcessingStatus
  createdAt: string
  progress: number
  stage: string
  pages: number
  sourcePages: SourcePage[]
  requestKey?: string
  fingerprint?: string
  originalUrl?: string
  outcome?: DemoOutcome
}

export interface DocumentRecord {
  id: string
  name: string
  activeVersionId?: string
  updatedAt: string
  versions: DocumentVersion[]
}

export interface SystemState {
  phase: SystemPhase
  lastChecked: string
  correlationId?: string
}

export interface UploadInput {
  file: File
  title: string
  existingDocumentId?: string
  outcome: DemoOutcome
}

export const ROLE_LABELS: Record<Role, string> = {
  DOCUMENT_ADMIN: '문서 관리자',
  AI_SEARCH_USER: 'AI 검색 사용자',
  OPERATOR: '운영자',
}

export const STATUS_META: Record<
  ProcessingStatus,
  { label: string; tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }
> = {
  PREFLIGHTING: { label: '파일 검사 중', tone: 'info' },
  UPLOADING: { label: '업로드 중', tone: 'info' },
  VERIFYING: { label: '승인 확인 중', tone: 'info' },
  QUEUED: { label: '처리 대기', tone: 'neutral' },
  PROCESSING: { label: '문서 처리 중', tone: 'info' },
  RETRYING: { label: '자동 재시도 중', tone: 'warning' },
  ACTIVE: { label: '검색 가능', tone: 'success' },
  FAILED_RETRYABLE: { label: '재시도 가능', tone: 'warning' },
  FAILED_FINAL: { label: '최종 실패', tone: 'danger' },
  COMPLETED_INACTIVE: { label: '처리 완료 · 비활성', tone: 'neutral' },
}

export function latestVersion(document: DocumentRecord): DocumentVersion {
  return document.versions[0]
}

export function activeVersion(document: DocumentRecord): DocumentVersion | undefined {
  return document.versions.find((version) => version.id === document.activeVersionId)
}
