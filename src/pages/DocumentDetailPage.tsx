import { Link, useParams } from 'react-router-dom'
import { activeVersion, latestVersion, STATUS_META } from '../domain'
import { useDemo } from '../demo/DemoProvider'
import { StatusBadge } from '../components/StatusBadge'

const processingOrder = ['PREFLIGHTING', 'UPLOADING', 'VERIFYING', 'QUEUED', 'PROCESSING', 'ACTIVE']

export function DocumentDetailPage() {
  const { documentId = '' } = useParams()
  const { getDocument, session, writeLocked, retryVersion } = useDemo()
  const document = getDocument(documentId)

  if (!document) {
    return (
      <div className="empty-state content-panel">
        <strong>문서를 확인할 수 없습니다.</strong>
        <p>문서가 없거나 현재 역할에 허용되지 않았습니다.</p>
        <Link className="button button-secondary" to="/documents">문서 목록으로</Link>
      </div>
    )
  }

  const latest = latestVersion(document)
  const active = activeVersion(document)
  const currentIndex =
    latest.status === 'RETRYING'
      ? processingOrder.indexOf('PROCESSING')
      : Math.max(0, processingOrder.indexOf(latest.status))

  return (
    <div className="page-stack">
      <header className="page-header detail-header">
        <div>
          <span className="eyebrow">Document detail</span>
          <h1>{document.name}</h1>
          <p>활성 버전과 모든 처리 이력을 확인합니다.</p>
        </div>
        <div className="header-actions">
          {active && <Link className="button button-secondary" to={`/sources/${active.id}?page=1`}>활성 원문 보기</Link>}
          {session?.role === 'DOCUMENT_ADMIN' && (
            <Link
              className={`button button-primary ${writeLocked ? 'is-disabled' : ''}`}
              aria-disabled={writeLocked}
              onClick={(event) => writeLocked && event.preventDefault()}
              to={`/documents/new?documentId=${document.id}`}
            >
              새 버전 등록
            </Link>
          )}
        </div>
      </header>

      <section className="detail-summary-grid">
        <article className="content-panel summary-card">
          <span>현재 활성 버전</span>
          <strong>{active?.label ?? '없음'}</strong>
          <small>{active ? 'MCP 검색 가능' : '처리 완료 후 검색 가능'}</small>
        </article>
        <article className="content-panel summary-card">
          <span>최신 처리 상태</span>
          <StatusBadge status={latest.status} />
          <small>{latest.stage}</small>
        </article>
        <article className="content-panel summary-card">
          <span>마지막 수정</span>
          <strong className="summary-date">{document.updatedAt}</strong>
          <small>{document.versions.length}개 버전</small>
        </article>
      </section>

      {!['ACTIVE', 'COMPLETED_INACTIVE', 'FAILED_RETRYABLE', 'FAILED_FINAL'].includes(latest.status) && (
        <section className="content-panel" aria-labelledby="progress-title">
          <div className="panel-header compact">
            <div><h2 id="progress-title">처리 진행</h2><p>{latest.stage}</p></div>
            <strong>{latest.progress}%</strong>
          </div>
          <div className="progress-bar" aria-label={`처리 진행률 ${latest.progress}%`}>
            <span style={{ width: `${latest.progress}%` }} />
          </div>
          <ol className="stepper">
            {processingOrder.map((status, index) => (
              <li key={status} className={index < currentIndex ? 'done' : index === currentIndex ? 'current' : ''}>
                <span aria-hidden="true">{index < currentIndex ? '✓' : index + 1}</span>
                {STATUS_META[status as keyof typeof STATUS_META].label}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="content-panel" aria-labelledby="versions-title">
        <div className="panel-header">
          <div><h2 id="versions-title">버전 이력</h2><p>처리 중인 새 버전에도 기존 활성 버전은 유지됩니다.</p></div>
        </div>
        <div className="version-list">
          {document.versions.map((version) => (
            <article className="version-row" key={version.id}>
              <div className="version-main">
                <strong>{version.label}</strong>
                <StatusBadge status={version.status} />
                {document.activeVersionId === version.id && <span className="active-label">현재 검색 버전</span>}
              </div>
              <dl className="version-meta">
                <div><dt>등록</dt><dd>{version.createdAt}</dd></div>
                <div><dt>페이지</dt><dd>{version.pages}</dd></div>
                <div><dt>단계</dt><dd>{version.stage}</dd></div>
              </dl>
              {version.requestKey && (
                <details className="request-details">
                  <summary>등록 복구 정보</summary>
                  <code>request: {version.requestKey}</code>
                  <code>fingerprint: {version.fingerprint}</code>
                </details>
              )}
              <div className="version-actions">
                <Link className="button button-secondary" to={`/sources/${version.id}?page=1`}>원문 확인</Link>
                {version.status === 'FAILED_RETRYABLE' && session?.role === 'DOCUMENT_ADMIN' && (
                  <button
                    className="button button-primary"
                    disabled={writeLocked}
                    onClick={() => retryVersion(document.id, version.id)}
                  >
                    처리 재시도
                  </button>
                )}
                {version.status === 'FAILED_FINAL' && <span className="danger-copy">수정한 PDF를 새 버전으로 등록하세요.</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
