import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import type {
  DemoOutcome,
  DocumentRecord,
  DocumentVersion,
  ProcessingStatus,
  Role,
  Session,
  SystemState,
  UploadInput,
} from '../domain'

const formatTime = () =>
  new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date())

const formatDateTime = () =>
  new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

const makeId = (prefix: string) => {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${suffix}`
}

const makePages = (title: string, pageCount = 6) =>
  Array.from({ length: pageCount }, (_, index) => ({
    page: index + 1,
    heading: `${title} · ${index + 1}페이지`,
    text:
      index === 0
        ? `${title}의 핵심 원칙과 적용 범위를 설명합니다. 이 텍스트는 PDF 렌더링과 독립된 접근성용 mock 원문입니다.`
        : `이 페이지는 ${title}의 세부 절차 ${index + 1}을 다룹니다. 활성 문서 버전과 페이지 근거가 일치하는지 확인할 수 있습니다.`,
  }))

function version(
  id: string,
  label: string,
  status: ProcessingStatus,
  title: string,
  progress = 100,
): DocumentVersion {
  return {
    id,
    label,
    status,
    createdAt: '08.10 18:20',
    progress,
    stage: status === 'ACTIVE' ? '검색 활성화 완료' : '처리 완료',
    pages: 6,
    sourcePages: makePages(title),
  }
}

function initialDocuments(): DocumentRecord[] {
  return [
    {
      id: 'doc-handbook',
      name: '임직원 업무 가이드',
      activeVersionId: 'ver-handbook-3',
      updatedAt: '08.10 20:42',
      versions: [
        version('ver-handbook-3', 'v3', 'ACTIVE', '임직원 업무 가이드'),
        version('ver-handbook-2', 'v2', 'COMPLETED_INACTIVE', '임직원 업무 가이드'),
      ],
    },
    {
      id: 'doc-security',
      name: '보안 대응 플레이북',
      activeVersionId: 'ver-security-1',
      updatedAt: '08.10 19:15',
      versions: [
        {
          ...version('ver-security-2', 'v2', 'FAILED_RETRYABLE', '보안 대응 플레이북', 74),
          stage: '임베딩 중 일시 오류',
          outcome: 'retryable',
        },
        version('ver-security-1', 'v1', 'ACTIVE', '보안 대응 플레이북'),
      ],
    },
    {
      id: 'doc-onboarding',
      name: '신규 입사자 온보딩',
      activeVersionId: 'ver-onboarding-1',
      updatedAt: '08.09 14:08',
      versions: [version('ver-onboarding-1', 'v1', 'ACTIVE', '신규 입사자 온보딩')],
    },
  ]
}

const nextStep: Partial<
  Record<ProcessingStatus, { status: ProcessingStatus; progress: number; stage: string }>
> = {
  PREFLIGHTING: { status: 'UPLOADING', progress: 18, stage: 'PDF 업로드 중' },
  UPLOADING: { status: 'VERIFYING', progress: 35, stage: '등록 승인 확인 중' },
  VERIFYING: { status: 'QUEUED', progress: 48, stage: '처리 작업 대기 중' },
  QUEUED: { status: 'PROCESSING', progress: 68, stage: '텍스트 추출·청킹 중' },
  RETRYING: { status: 'PROCESSING', progress: 78, stage: '안전한 단계부터 처리 재개' },
}

interface DemoContextValue {
  session: Session | null
  documents: DocumentRecord[]
  system: SystemState
  announcement: string
  writeLocked: boolean
  login: (role: Role) => void
  logout: () => void
  beginUpload: (input: UploadInput) => { documentId: string; versionId: string }
  retryVersion: (documentId: string, versionId: string) => void
  triggerFailover: () => void
  beginRecovery: () => void
  resetDemo: () => void
  getDocument: (documentId: string) => DocumentRecord | undefined
  findVersion: (versionId: string) =>
    | { document: DocumentRecord; version: DocumentVersion }
    | undefined
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments)
  const [system, setSystem] = useState<SystemState>({
    phase: 'healthy',
    lastChecked: formatTime(),
  })
  const [announcement, setAnnouncement] = useState('')
  const recoveryTimers = useRef<number[]>([])

  const writeLocked = system.phase === 'failover' || system.phase === 'recovering'

  useEffect(() => {
    if (writeLocked) return

    const interval = window.setInterval(() => {
      setDocuments((current) =>
        current.map((document) => {
          let changed = false
          let activatingId: string | undefined
          const versions = document.versions.map((item) => {
            const basicStep = nextStep[item.status]
            if (basicStep) {
              changed = true
              return { ...item, ...basicStep }
            }

            if (item.status !== 'PROCESSING') return item

            changed = true
            if (item.outcome === 'retryable') {
              return {
                ...item,
                status: 'FAILED_RETRYABLE' as const,
                progress: 76,
                stage: '일시 오류 · 수동 재시도 가능',
              }
            }
            if (item.outcome === 'final') {
              return {
                ...item,
                status: 'FAILED_FINAL' as const,
                progress: 76,
                stage: '입력 파일 오류 · 처리 중단',
              }
            }

            if (activatingId) {
              return {
                ...item,
                status: 'COMPLETED_INACTIVE' as const,
                progress: 100,
                stage: '처리 완료 · 비활성',
              }
            }

            activatingId = item.id
            return {
              ...item,
              status: 'ACTIVE' as const,
              progress: 100,
              stage: '검색 활성화 완료',
            }
          })

          if (!changed) return document

          return {
            ...document,
            activeVersionId: activatingId ?? document.activeVersionId,
            updatedAt: formatDateTime(),
            versions: activatingId
              ? versions.map((item) =>
                  item.id !== activatingId && item.status === 'ACTIVE'
                    ? { ...item, status: 'COMPLETED_INACTIVE' as const, stage: '처리 완료 · 비활성' }
                    : item,
                )
              : versions,
          }
        }),
      )

      setSystem((current) => ({ ...current, lastChecked: formatTime() }))
    }, 1100)

    return () => window.clearInterval(interval)
  }, [writeLocked])

  useEffect(
    () => () => recoveryTimers.current.forEach((timer) => window.clearTimeout(timer)),
    [],
  )

  const login = useCallback((role: Role) => {
    setSession({ name: 'Merge42 데모 사용자', role })
    setAnnouncement('SyncBase에 로그인했습니다.')
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    setAnnouncement('로그아웃했습니다.')
  }, [])

  const beginUpload = useCallback(
    ({ file, title, existingDocumentId, outcome }: UploadInput) => {
      if (writeLocked) throw new Error('복구 중에는 문서를 등록할 수 없습니다.')

      const documentId = existingDocumentId ?? makeId('doc')
      const versionId = makeId('ver')
      const requestKey = makeId('req')
      const fingerprint = `${file.name}:${file.size}:${file.lastModified}`
      const originalUrl =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(file)
          : undefined

      setDocuments((current) => {
        const existing = current.find((document) => document.id === existingDocumentId)
        const newLabel = existing ? `v${existing.versions.length + 1}` : 'v1'
        const newVersion: DocumentVersion = {
          id: versionId,
          label: newLabel,
          status: 'PREFLIGHTING',
          createdAt: formatDateTime(),
          progress: 5,
          stage: '파일 지원 조건 검사 중',
          pages: 6,
          sourcePages: makePages(title || file.name.replace(/\.pdf$/i, '')),
          requestKey,
          fingerprint,
          originalUrl,
          outcome,
        }

        if (existing) {
          return current.map((document) =>
            document.id === existing.id
              ? {
                  ...document,
                  updatedAt: formatDateTime(),
                  versions: [newVersion, ...document.versions],
                }
              : document,
          )
        }

        return [
          {
            id: documentId,
            name: title || file.name.replace(/\.pdf$/i, ''),
            updatedAt: formatDateTime(),
            versions: [newVersion],
          },
          ...current,
        ]
      })

      setAnnouncement('등록 요청을 한 번 승인했습니다. 비동기 처리를 시작합니다.')
      return { documentId, versionId }
    },
    [writeLocked],
  )

  const retryVersion = useCallback(
    (documentId: string, versionId: string) => {
      if (writeLocked) return
      setDocuments((current) =>
        current.map((document) =>
          document.id !== documentId
            ? document
            : {
                ...document,
                versions: document.versions.map((item) =>
                  item.id === versionId && item.status === 'FAILED_RETRYABLE'
                    ? {
                        ...item,
                        status: 'RETRYING',
                        stage: '안전한 단계부터 처리 재개',
                        outcome: 'happy',
                      }
                    : item,
                ),
              },
        ),
      )
      setAnnouncement('처리 재시도를 시작했습니다.')
    },
    [writeLocked],
  )

  const triggerFailover = useCallback(() => {
    recoveryTimers.current.forEach((timer) => window.clearTimeout(timer))
    recoveryTimers.current = []
    setSystem({
      phase: 'failover',
      lastChecked: formatTime(),
      correlationId: `SYNC-DEMO-${Date.now().toString().slice(-6)}`,
    })
    setAnnouncement('UI 장애 상태를 재생했습니다. 실제 OpenSQL은 조작하지 않습니다.')
  }, [])

  const beginRecovery = useCallback(() => {
    recoveryTimers.current.forEach((timer) => window.clearTimeout(timer))
    recoveryTimers.current = []
    setSystem((current) => ({ ...current, phase: 'recovering' }))
    setAnnouncement('연결 복구 화면을 재생하고 최신 상태를 확인합니다.')

    const recovered = window.setTimeout(() => {
      setSystem((current) => {
        if (current.phase !== 'recovering') return current
        return { ...current, phase: 'recovered', lastChecked: formatTime() }
      })
      setAnnouncement('최신 상태를 확인했습니다. mock 처리를 이어갑니다.')
    }, 900)
    const healthy = window.setTimeout(() => {
      setSystem((current) =>
        current.phase === 'recovered'
          ? { phase: 'healthy', lastChecked: formatTime() }
          : current,
      )
    }, 2200)
    recoveryTimers.current.push(recovered, healthy)
  }, [])

  const resetDemo = useCallback(() => {
    if (writeLocked) return
    recoveryTimers.current.forEach((timer) => window.clearTimeout(timer))
    recoveryTimers.current = []
    setDocuments(initialDocuments())
    setSystem({ phase: 'healthy', lastChecked: formatTime() })
    setAnnouncement('데모 데이터를 초기화했습니다.')
  }, [writeLocked])

  const getDocument = useCallback(
    (documentId: string) => documents.find((document) => document.id === documentId),
    [documents],
  )

  const findVersion = useCallback(
    (versionId: string) => {
      for (const document of documents) {
        const found = document.versions.find((item) => item.id === versionId)
        if (found) return { document, version: found }
      }
      return undefined
    },
    [documents],
  )

  const value = useMemo<DemoContextValue>(
    () => ({
      session,
      documents,
      system,
      announcement,
      writeLocked,
      login,
      logout,
      beginUpload,
      retryVersion,
      triggerFailover,
      beginRecovery,
      resetDemo,
      getDocument,
      findVersion,
    }),
    [
      session,
      documents,
      system,
      announcement,
      writeLocked,
      login,
      logout,
      beginUpload,
      retryVersion,
      triggerFailover,
      beginRecovery,
      resetDemo,
      getDocument,
      findVersion,
    ],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const value = useContext(DemoContext)
  if (!value) throw new Error('useDemo must be used inside DemoProvider')
  return value
}
