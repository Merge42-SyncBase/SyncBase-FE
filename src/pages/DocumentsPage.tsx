import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { activeVersion, latestVersion } from '../domain'
import { useDemo } from '../demo/DemoProvider'
import { DemoControls } from '../components/DemoControls'
import { StatusBadge } from '../components/StatusBadge'

export function DocumentsPage() {
  const {
    documents,
    session,
    system,
    writeLocked,
    triggerFailover,
    beginRecovery,
    resetDemo,
  } = useDemo()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(
    () => documents.filter((document) => document.name.toLowerCase().includes(query.toLowerCase())),
    [documents, query],
  )
  const processingCount = documents.filter((document) => {
    const status = latestVersion(document).status
    return ['PREFLIGHTING', 'UPLOADING', 'VERIFYING', 'QUEUED', 'PROCESSING', 'RETRYING'].includes(status)
  }).length
  const failedCount = documents.filter((document) => latestVersion(document).status.startsWith('FAILED')).length

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Document workspace</span>
          <h1>문서</h1>
          <p>활성 버전과 최신 처리 상태를 한곳에서 확인합니다.</p>
        </div>
        {session?.role === 'DOCUMENT_ADMIN' && (
          <button
            className="button button-primary"
            disabled={writeLocked}
            onClick={() => navigate('/documents/new')}
            title={writeLocked ? '복구 중에는 등록할 수 없습니다.' : undefined}
          >
            새 문서 등록
          </button>
        )}
      </header>

      <section className="metric-grid" aria-label="문서 상태 요약">
        <article className="metric-card">
          <span>전체 문서</span>
          <strong>{documents.length}</strong>
          <small>단일 mock workspace</small>
        </article>
        <article className="metric-card">
          <span>처리 진행</span>
          <strong>{processingCount}</strong>
          <small>대기·처리·재시도 포함</small>
        </article>
        <article className="metric-card">
          <span>확인 필요</span>
          <strong>{failedCount}</strong>
          <small>실패 상태 문서</small>
        </article>
      </section>

      {(session?.role === 'DOCUMENT_ADMIN' || session?.role === 'OPERATOR') && (
        <DemoControls
          phase={system.phase}
          onFailover={triggerFailover}
          onRecover={beginRecovery}
          onReset={resetDemo}
        />
      )}

      <section className="content-panel" aria-labelledby="document-list-title">
        <div className="panel-header">
          <div>
            <h2 id="document-list-title">문서 목록</h2>
            <p>{filtered.length}개의 문서를 표시합니다.</p>
          </div>
          <label className="search-field">
            <span className="sr-only">문서명 검색</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="문서명 검색" />
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <strong>일치하는 문서가 없습니다.</strong>
            <p>검색어를 지우거나 새 문서를 등록하세요.</p>
            <button className="button button-secondary" onClick={() => setQuery('')}>검색 초기화</button>
          </div>
        ) : (
          <>
            <div className="table-wrap document-table-wrap">
              <table className="document-table">
                <thead>
                  <tr>
                    <th>문서명</th>
                    <th>활성 버전</th>
                    <th>최신 처리 상태</th>
                    <th>수정 시각</th>
                    <th><span className="sr-only">상세 보기</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((document) => {
                    const latest = latestVersion(document)
                    const active = activeVersion(document)
                    return (
                      <tr key={document.id}>
                        <td>
                          <Link className="document-name" to={`/documents/${document.id}`}>{document.name}</Link>
                          <small>{document.versions.length}개 버전</small>
                        </td>
                        <td>{active?.label ?? '없음'}</td>
                        <td><StatusBadge status={latest.status} /></td>
                        <td>{document.updatedAt}</td>
                        <td><Link className="text-link" to={`/documents/${document.id}`}>상세</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="document-card-list">
              {filtered.map((document) => {
                const latest = latestVersion(document)
                const active = activeVersion(document)
                return (
                  <Link className="document-mobile-card" key={document.id} to={`/documents/${document.id}`}>
                    <div><strong>{document.name}</strong><StatusBadge status={latest.status} /></div>
                    <dl>
                      <div><dt>활성 버전</dt><dd>{active?.label ?? '없음'}</dd></div>
                      <div><dt>수정</dt><dd>{document.updatedAt}</dd></div>
                    </dl>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
