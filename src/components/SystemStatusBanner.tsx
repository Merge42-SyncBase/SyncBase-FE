import type { SystemState } from '../domain'

const content = {
  healthy: {
    label: '정상',
    title: '서비스 연결 정상',
    description: '문서 조회와 등록을 사용할 수 있습니다.',
  },
  failover: {
    label: '마지막 확인 데이터',
    title: '장애 화면 상태를 재생 중입니다',
    description: '마지막 데이터를 유지하고 등록·재시도를 잠갔습니다.',
  },
  recovering: {
    label: '복구 확인 중',
    title: '연결 복구 화면을 재생 중입니다',
    description: '최신 상태를 확인한 뒤 mock 작업을 이어갑니다.',
  },
  recovered: {
    label: '복구됨',
    title: '최신 상태를 확인했습니다',
    description: '잠긴 행동을 다시 사용할 수 있고 mock 처리가 이어집니다.',
  },
} as const

export function SystemStatusBanner({ system }: { system: SystemState }) {
  const message = content[system.phase]
  return (
    <section className={`system-banner system-${system.phase}`} aria-labelledby="system-title">
      <div className="system-icon" aria-hidden="true">
        {system.phase === 'healthy' || system.phase === 'recovered' ? '✓' : '!'}
      </div>
      <div className="system-copy">
        <div className="system-kicker">{message.label}</div>
        <strong id="system-title">{message.title}</strong>
        <p>{message.description}</p>
      </div>
      <dl className="system-meta">
        <div>
          <dt>마지막 확인</dt>
          <dd>{system.lastChecked}</dd>
        </div>
        {system.correlationId && (
          <div>
            <dt>Correlation ID</dt>
            <dd>
              <code>{system.correlationId}</code>
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
