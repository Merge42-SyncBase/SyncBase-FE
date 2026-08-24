import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { APIError, api } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { ErrorNotice } from '../components/ErrorNotice'
import { shortDocumentID } from '../documents/identity'
import type { DocumentNameMatches, Preflight, UploadRecovery } from '../types'
import {
  BindPreflightHash,
  ClearUploadState,
  LoadUploadState,
  NewUploadState,
  SaveUploadState,
  type UploadState,
  type UploadStorage,
} from '../uploads/state'

const maxSize = 100 * 1024 * 1024

interface InitialUploadState {
  error: string
  state: UploadState
  storage: UploadStorage | null
}

export function UploadPage() {
  const { documentID } = useParams()
  const isVersion = Boolean(documentID)
  const { session } = useAuth()
  const hasSession = session !== null
  const navigate = useNavigate()
  const storageKey = isVersion
    ? `syncbase.upload./documents/${documentID}/versions/new`
    : 'syncbase.upload./documents/new'
  const [initial] = useState<InitialUploadState>(() => initializeUploadState(storageKey))
  const state = useRef<UploadState>(initial.state)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [preflight, setPreflight] = useState<Preflight | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [recovery, setRecovery] = useState<UploadRecovery | null>(null)
  const [recoveryActive, setRecoveryActive] = useState(initial.state.submitted)
  const [nameMatches, setNameMatches] = useState<DocumentNameMatches | null>(null)
  const [checkingName, setCheckingName] = useState(false)
  const [nameMatchError, setNameMatchError] = useState('')

  useEffect(() => {
    if (!recoveryActive || !initial.storage) return
    let active = true
    let timer: number | undefined
    async function recover() {
      try {
        const next = await api.recovery(state.current.requestKey)
        if (!active) return
        setRecovery(next)
        if (next.status === 'accepted' && next.registration) {
          ClearUploadState(initial.storage!, storageKey)
          setRecoveryActive(false)
          navigate(next.registration.documentUrl, { replace: true })
          return
        }
        if (next.status === 'pending') {
          timer = window.setTimeout(() => void recover(), 2000)
          return
        }
        setRecoveryActive(false)
        if (next.status === 'expired') {
          const replacement = NewUploadState(newRequestKey)
          SaveUploadState(initial.storage!, storageKey, replacement)
          state.current = replacement
          setFile(null)
          setPreflight(null)
        }
      } catch {
        if (active) timer = window.setTimeout(() => void recover(), 2000)
      }
    }
    void recover()
    return () => { active = false; if (timer !== undefined) window.clearTimeout(timer) }
  }, [initial.storage, navigate, recoveryActive, storageKey])

  useEffect(() => {
    setNameMatches(null)
    setNameMatchError('')
    setCheckingName(false)
    if (isVersion || !hasSession || !validDocumentName(name)) return

    let active = true
    const timer = window.setTimeout(() => {
      setCheckingName(true)
      void api.documentNameMatches(name).then((matches) => {
        if (active) setNameMatches(matches)
      }).catch(() => {
        if (active) setNameMatchError('같은 이름의 기존 문서를 확인하지 못했습니다. 등록은 계속할 수 있습니다.')
      }).finally(() => {
        if (active) setCheckingName(false)
      })
    }, 350)
    return () => { active = false; window.clearTimeout(timer) }
  }, [hasSession, isVersion, name])

  const fingerprint = useMemo(() => file ? `${file.name}:${file.size}:${file.lastModified}` : '', [file])

  async function choose(nextFile?: File) {
    setError('')
    setPreflight(null)
    if (!nextFile) return
    if (!initial.storage) {
      setError(initial.error)
      return
    }
    const clientError = validateFile(nextFile)
    if (clientError) { setFile(null); setError(clientError); return }
    if (!session) return
    setBusy(true)
    try {
      const next = await api.preflight(nextFile, session.csrfToken)
      const nextState = BindPreflightHash(state.current, next.sha256, NewUploadState(newRequestKey))
      SaveUploadState(initial.storage, storageKey, nextState)
      state.current = nextState
      setRecovery(null)
      setRecoveryActive(false)
      setFile(nextFile)
      setPreflight(next)
      if (!isVersion && !name.trim()) setName(next.suggestedName)
    } catch (reason) {
      setFile(null)
      setError(reason instanceof APIError || reason instanceof Error ? reason.message : 'PDF 사전 검사를 완료하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!initial.storage) { setError(initial.error); return }
    if (!file || !preflight || !session) { setError('PDF 사전 검사를 먼저 완료하세요.'); return }
    if (!isVersion && !validDocumentName(name)) { setError('문서명은 공백을 제외하고 1~200자여야 합니다.'); return }
    state.current = { ...state.current, submitted: true }
    try {
      SaveUploadState(initial.storage, storageKey, state.current)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '요청 키를 저장하지 못했습니다.')
      return
    }
    setBusy(true)
    setRecovery({ status: 'pending' })
    setRecoveryActive(true)
    try {
      const registration = isVersion
        ? await api.registerVersion(documentID!, file, state.current.requestKey, session.csrfToken)
        : await api.registerDocument(file, name.trim(), state.current.requestKey, session.csrfToken)
      ClearUploadState(initial.storage, storageKey)
      setRecoveryActive(false)
      navigate(registration.documentUrl)
    } catch (reason) {
      setError(reason instanceof APIError || reason instanceof Error ? `${reason.message} 복구 상태를 계속 확인합니다.` : '등록 응답을 확인하지 못했습니다. 복구 상태를 계속 확인합니다.')
    } finally {
      setBusy(false)
    }
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) { void choose(event.target.files?.[0]) }
  function onDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); void choose(event.dataTransfer.files[0]) }

  return <div className="page-stack narrow-page">
    <header className="page-header"><Link className="back-link" to={isVersion ? `/documents/${documentID}` : '/documents'}>← 취소</Link><p className="eyebrow">{isVersion ? 'New version' : 'New document'}</p><h1>{isVersion ? '새 PDF 버전 등록' : 'PDF 등록'}</h1><p className="muted">서버가 PDF·페이지·텍스트·SHA-256을 확인한 뒤 처리 대기열에 등록합니다.</p></header>
    {initial.error && <ErrorNotice>{initial.error}</ErrorNotice>}
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {recovery && <div className="notice info" role="status">{recoveryMessage(recovery)} <code>{state.current.requestKey}</code>{recovery.status === 'not_committed' && ' 같은 PDF를 다시 선택한 뒤 재제출할 수 있습니다.'}</div>}
    <form className="upload-layout" onSubmit={(event) => void submit(event)} noValidate>
      <section className="panel">
        <div className="panel-header"><h2>1. PDF 선택</h2><p>텍스트 PDF만 지원하며 OCR은 P0 범위에 포함하지 않습니다.</p></div>
        <div className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'chosen' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
          {file ? <><strong>{file.name}</strong><span>{formatBytes(file.size)}</span><button className="button secondary" type="button" onClick={() => { setFile(null); setPreflight(null) }}>파일 교체</button></> : <><span className="file-icon" aria-hidden="true">PDF</span><strong>PDF를 여기에 놓으세요</strong><span>또는 파일 선택 버튼을 사용하세요.</span><label className="button secondary">파일 선택<input type="file" accept="application/pdf,.pdf" onChange={onFileInput} /></label></>}
        </div>
        <ul className="requirements"><li>PDF, 최대 100MB, 최대 500페이지</li><li>파일 검사와 SHA-256은 서버가 최종 판단합니다.</li><li>등록 후 응답이 유실되어도 복구 코드로 승인 결과를 확인합니다.</li></ul>
        {preflight && <dl className="preflight"><div><dt>파일</dt><dd>{preflight.fileName}</dd></div><div><dt>크기</dt><dd>{formatBytes(preflight.byteSize)}</dd></div><div><dt>페이지</dt><dd>{preflight.pageCount}페이지</dd></div><div><dt>SHA-256</dt><dd><code>{preflight.sha256}</code></dd></div></dl>}
      </section>
      <aside className="panel upload-sidebar">
        <h2>2. 등록 정보</h2>
        {!isVersion && <label><span>문서명</span><input value={name} maxLength={200} onChange={(event) => setName(event.target.value)} required /></label>}
        {!isVersion && <NameGuidance checking={checkingName} error={nameMatchError} matches={nameMatches} />}
        <div className="request-key"><span>복구 코드</span><code>{state.current.requestKey}</code>{fingerprint && <small>브라우저 지문: {fingerprint}</small>}</div>
        <button className="button primary full" type="submit" disabled={busy || !preflight || !initial.storage || (!isVersion && !validDocumentName(name)) || recovery?.status === 'conflict' || recovery?.status === 'pending'}>{busy || recovery?.status === 'pending' ? '서버와 상태를 확인 중…' : isVersion ? '새 버전 등록' : '문서 등록'}</button>
      </aside>
    </form>
  </div>
}

function NameGuidance({
  checking,
  error,
  matches,
}: {
  checking: boolean
  error: string
  matches: DocumentNameMatches | null
}) {
  if (checking) return <p className="field-status" role="status">같은 이름의 문서를 확인하고 있습니다.</p>
  if (error) return <p className="field-status warning" role="status">{error}</p>
  if (!matches || matches.total === 0) return null
  return (
    <div className="name-guidance" role="status">
      <strong>같은 이름의 문서가 {matches.total}개 있습니다.</strong>
      <p>새 문서로 별도 등록할 수 있습니다. 같은 문서의 개정본이라면 기존 문서에 새 버전을 등록하세요.</p>
      <ul>{matches.documents.map((document) => <li key={document.id}>
        <Link to={`/documents/${document.id}/versions/new`} title={document.id}>
          ID {shortDocumentID(document.id)} · 최신 v{document.latestVersion}에 새 버전 등록
        </Link>
      </li>)}</ul>
      {matches.total > matches.documents.length && <small>그 밖에 {matches.total - matches.documents.length}개의 같은 이름 문서가 있습니다.</small>}
    </div>
  )
}

function validateFile(file: File): string | null {
  if (!file.name.toLocaleLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) return 'PDF 파일만 등록할 수 있습니다.'
  if (file.size < 5 || file.size > maxSize) return '파일 크기는 100MB 이하여야 합니다.'
  return null
}

function initializeUploadState(key: string): InitialUploadState {
  try {
    const storage = window.localStorage
    return { state: LoadUploadState(storage, key, newRequestKey), storage, error: '' }
  } catch (reason) {
    return {
      state: { requestKey: 'storage-unavailable', submitted: false },
      storage: null,
      error: reason instanceof Error ? reason.message : '브라우저 저장소를 사용할 수 없어 등록을 차단했습니다.',
    }
  }
}

function newRequestKey(): string { return crypto.randomUUID() }
function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(2)} MB`
}
function recoveryMessage(recovery: UploadRecovery): string { return ({ pending: '등록 승인 결과를 확인하고 있습니다.', accepted: '등록이 승인되었습니다.', conflict: '복구 코드가 다른 요청과 충돌합니다.', expired: '복구 코드가 만료되었습니다.', not_committed: '아직 승인된 등록이 없습니다.' } as Record<string, string>)[recovery.status] }
function validDocumentName(value: string): boolean { const length = Array.from(value.trim()).length; return length >= 1 && length <= 200 }
