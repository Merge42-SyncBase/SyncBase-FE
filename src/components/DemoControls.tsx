import type { SystemPhase } from '../domain'

interface DemoControlsProps {
  phase: SystemPhase
  onFailover: () => void
  onRecover: () => void
  onReset: () => void
}

export function DemoControls({ phase, onFailover, onRecover, onReset }: DemoControlsProps) {
  const canFail = phase === 'healthy' || phase === 'recovered'
  const canRecover = phase === 'failover'
  const canReset = phase === 'healthy' || phase === 'recovered'

  return (
    <section className="demo-panel" aria-labelledby="demo-title">
      <div>
        <span className="eyebrow">개발·시연 전용</span>
        <h2 id="demo-title">UI 시뮬레이션</h2>
        <p>
          화면의 장애·복구 UX만 재생합니다. 실제 OpenSQL을 조작하거나 고가용성을 증명하지 않습니다.
        </p>
      </div>
      <div className="demo-actions">
        <button className="button button-danger-outline" onClick={onFailover} disabled={!canFail}>
          장애 화면 재생
        </button>
        <button className="button button-primary" onClick={onRecover} disabled={!canRecover}>
          복구 화면 재생
        </button>
        <button className="button button-secondary" onClick={onReset} disabled={!canReset}>
          데모 초기화
        </button>
      </div>
    </section>
  )
}
