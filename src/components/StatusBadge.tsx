import type { VersionStatus } from '../types'

const labels: Record<VersionStatus, string> = {
  QUEUED: '처리 대기',
  PROCESSING: '처리 중',
  ACTIVE: '검색 가능',
  FAILED: '확인 필요',
  SUPERSEDED: '이전 버전',
}

export function StatusBadge({ status }: { status: VersionStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{labels[status]}</span>
}
