import { useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import type { DemoOutcome } from '../domain'
import { useDemo } from '../demo/DemoProvider'

const MAX_SIZE = 100 * 1024 * 1024

function validateFile(file: File): string | null {
  const pdfByName = file.name.toLowerCase().endsWith('.pdf')
  const pdfByType = file.type === 'application/pdf' || file.type === ''
  if (!pdfByName || !pdfByType) return 'PDF 파일만 등록할 수 있습니다.'
  if (file.size > MAX_SIZE) return '파일 크기는 100MB 이하여야 합니다.'
  return null
}

function hasPdfHeader(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('파일을 읽지 못했습니다.'))
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        resolve(false)
        return
      }
      const header = String.fromCharCode(...new Uint8Array(reader.result))
      resolve(header.includes('%PDF-'))
    }
    reader.readAsArrayBuffer(file.slice(0, 1024))
  })
}

export function UploadPage() {
  const { session, documents, writeLocked, beginUpload } = useDemo()
  const [searchParams] = useSearchParams()
  const requestedDocumentId = searchParams.get('documentId')
  const existingDocumentId = requestedDocumentId || undefined
  const existingDocument = documents.find((document) => document.id === existingDocumentId)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState(existingDocument?.name ?? '')
  const [outcome, setOutcome] = useState<DemoOutcome>('happy')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const validationRequest = useRef(0)
  const navigate = useNavigate()

  const fingerprint = useMemo(
    () => (file ? `${file.name}:${file.size}:${file.lastModified}` : ''),
    [file],
  )

  if (session?.role !== 'DOCUMENT_ADMIN') return <Navigate to="/documents" replace />
  if (requestedDocumentId !== null && !existingDocument) {
    return <Navigate to="/documents" replace />
  }

  const showError = (message: string) => {
    setFile(null)
    setError(message)
    requestAnimationFrame(() => errorRef.current?.focus())
  }

  const acceptFile = async (nextFile?: File) => {
    if (!nextFile) return
    const requestId = ++validationRequest.current
    const problem = validateFile(nextFile)
    if (problem) {
      showError(problem)
      return
    }

    try {
      const validHeader = await hasPdfHeader(nextFile)
      if (requestId !== validationRequest.current) return
      if (!validHeader) {
        showError('파일 내용이 PDF 형식이 아닙니다.')
        return
      }
    } catch {
      if (requestId !== validationRequest.current) return
      showError('파일 내용을 확인하지 못했습니다. 다른 PDF를 선택하세요.')
      return
    }

    setFile(nextFile)
    if (!existingDocument && !title) setTitle(nextFile.name.replace(/\.pdf$/i, ''))
    setError('')
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    void acceptFile(event.dataTransfer.files[0])
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!file) {
      setError('등록할 PDF를 선택하세요.')
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    if (!title.trim()) {
      setError('문서명을 입력하세요.')
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    try {
      const result = beginUpload({ file, title: title.trim(), existingDocumentId, outcome })
      navigate(`/documents/${result.documentId}`)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '문서를 등록하지 못했습니다.')
      requestAnimationFrame(() => errorRef.current?.focus())
    }
  }

  return (
    <div className="page-stack narrow-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">{existingDocument ? 'New version' : 'New document'}</span>
          <h1>{existingDocument ? `${existingDocument.name} 새 버전` : 'PDF 등록'}</h1>
          <p>mock adapter가 등록 요청을 한 번 승인하고 비동기 처리 상태를 재생합니다.</p>
        </div>
      </header>

      {writeLocked && (
        <div className="inline-alert alert-warning" role="alert">
          복구 중에는 등록할 수 없습니다. 최신 상태 확인이 끝날 때까지 기다리세요.
        </div>
      )}

      {error && (
        <div className="error-summary" role="alert" tabIndex={-1} ref={errorRef}>
          <strong>등록할 수 없습니다.</strong>
          <span>{error}</span>
        </div>
      )}

      <form className="upload-layout" onSubmit={submit} noValidate>
        <section className="content-panel upload-main" aria-labelledby="file-title">
          <div className="panel-header compact">
            <div><h2 id="file-title">1. PDF 선택</h2><p>한 번에 PDF 한 개를 등록합니다.</p></div>
          </div>
          <div
            className={`dropzone ${dragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="dropzone-icon" aria-hidden="true">PDF</div>
            {file ? (
              <>
                <strong>{file.name}</strong>
                <span>{(file.size / 1024 / 1024).toFixed(2)}MB</span>
                <button className="button button-secondary" type="button" onClick={() => setFile(null)}>
                  파일 교체
                </button>
              </>
            ) : (
              <>
                <strong>PDF를 여기에 놓으세요</strong>
                <span>또는 키보드로 파일 선택 버튼을 사용하세요.</span>
                <label className="button button-secondary file-button">
                  파일 선택
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => void acceptFile(event.target.files?.[0])}
                    aria-describedby="file-help"
                  />
                </label>
              </>
            )}
          </div>
          <ul id="file-help" className="requirement-list">
            <li>PDF, 최대 100MB, 최대 500페이지</li>
            <li>텍스트가 없는 스캔 PDF, 암호화·손상 파일, OCR은 MVP 범위 밖</li>
            <li>브라우저는 형식·크기만 검사하며 최종 검증은 향후 Go API가 담당</li>
          </ul>
        </section>

        <aside className="content-panel upload-sidebar" aria-labelledby="metadata-title">
          <h2 id="metadata-title">2. 등록 정보</h2>
          <label className="field">
            <span>문서명</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} disabled={Boolean(existingDocument)} />
          </label>
          <label className="field">
            <span>mock 처리 결과</span>
            <select value={outcome} onChange={(event) => setOutcome(event.target.value as DemoOutcome)}>
              <option value="happy">정상 처리 → ACTIVE</option>
              <option value="retryable">일시 오류 → 재시도 가능</option>
              <option value="final">입력 오류 → 최종 실패</option>
            </select>
          </label>
          {file && (
            <div className="request-preview">
              <span>파일 지문 미리보기</span>
              <code>{fingerprint}</code>
              <small>실제 서버 멱등성을 증명하지 않는 mock 값입니다.</small>
            </div>
          )}
          <button className="button button-primary button-block" type="submit" disabled={writeLocked || !file}>
            {existingDocument ? '새 버전 등록' : '문서 등록'}
          </button>
          <button className="button button-ghost button-block" type="button" onClick={() => navigate(-1)}>
            취소
          </button>
        </aside>
      </form>
    </div>
  )
}
