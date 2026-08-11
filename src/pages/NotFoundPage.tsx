import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="empty-state content-panel">
      <strong>페이지를 찾을 수 없습니다.</strong>
      <p>주소를 확인하거나 문서 목록으로 돌아가세요.</p>
      <Link className="button button-secondary" to="/documents">문서 목록으로</Link>
    </div>
  )
}
