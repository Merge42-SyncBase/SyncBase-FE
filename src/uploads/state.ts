export interface UploadState {
  requestKey: string
  hash?: string
  submitted: boolean
}

export interface UploadStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

type StoredUploadState = {
  requestKey?: unknown
  key?: unknown
  hash?: unknown
  sha256?: unknown
  submitted?: unknown
}

// NewUploadState creates a key before preflight so an accepted request can be
// recovered across navigation or a browser restart.
export function NewUploadState(newKey: () => string): UploadState {
  return { requestKey: newKey(), submitted: false }
}

// LoadUploadState returns a verified durable recovery state. Callers must not
// allow registration when this operation fails, because idempotent recovery
// would no longer be possible.
export function LoadUploadState(storage: UploadStorage, storageKey: string, newKey: () => string): UploadState {
  const parsed = parseUploadState(storage.getItem(storageKey))
  if (parsed) return parsed

  const state = NewUploadState(newKey)
  SaveUploadState(storage, storageKey, state)
  return state
}

// SaveUploadState verifies the write because browser privacy settings can make
// localStorage appear writable while silently discarding the value.
export function SaveUploadState(storage: UploadStorage, storageKey: string, state: UploadState): void {
  const serialized = JSON.stringify(state)
  storage.setItem(storageKey, serialized)
  if (storage.getItem(storageKey) !== serialized) {
    throw new Error("요청 키를 안전하게 저장할 수 없어 등록을 차단했습니다. 브라우저 저장소를 허용해 주세요.")
  }
}

// BindPreflightHash binds a request key to the server-computed PDF hash. A
// different preflight-only file gets a fresh key; a submitted key can only be
// retried with exactly the same PDF.
export function BindPreflightHash(current: UploadState, hash: string, replacement: UploadState): UploadState {
  if (current.hash === hash) {
    return { ...current, submitted: false }
  }
  if (current.submitted) {
    throw new Error("이 복구 코드는 다른 PDF에 이미 사용되었습니다. 같은 PDF만 다시 제출할 수 있습니다.")
  }
  if (!current.hash) {
    return { ...current, hash, submitted: false }
  }
  return { ...replacement, hash, submitted: false }
}

export function ClearUploadState(storage: UploadStorage, storageKey: string): void {
  storage.removeItem(storageKey)
}

function parseUploadState(serialized: string | null): UploadState | null {
  if (!serialized) return null
  try {
    const value = JSON.parse(serialized) as StoredUploadState
    const requestKey = typeof value.requestKey === "string"
      ? value.requestKey
      : typeof value.key === "string" ? value.key : ""
    if (!requestKey) return null
    const hash = typeof value.hash === "string"
      ? value.hash
      : typeof value.sha256 === "string" ? value.sha256 : undefined
    return { requestKey, hash, submitted: value.submitted === true }
  } catch {
    return null
  }
}
