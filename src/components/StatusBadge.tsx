import { STATUS_META, type ProcessingStatus } from '../domain'

export function StatusBadge({ status }: { status: ProcessingStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className={`status-badge status-${meta.tone}`}>
      <span className="status-dot" aria-hidden="true" />
      {meta.label}
    </span>
  )
}
