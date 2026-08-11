import { describe, expect, it } from 'vitest'
import {
  BindPreflightHash,
  LoadUploadState,
  NewUploadState,
  SaveUploadState,
  type UploadStorage,
} from './state'

class MemoryStorage implements UploadStorage {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
  removeItem(key: string): void { this.values.delete(key) }
}

describe('upload recovery state', () => {
  it('rotates a preflight-only request key when the selected PDF changes', () => {
    const first = { requestKey: 'first', hash: 'pdf-a', submitted: false }
    expect(BindPreflightHash(first, 'pdf-b', { requestKey: 'second', submitted: false })).toEqual({
      requestKey: 'second', hash: 'pdf-b', submitted: false,
    })
  })

  it('allows a submitted key to be retried only with its bound PDF', () => {
    const submitted = { requestKey: 'first', hash: 'pdf-a', submitted: true }
    expect(BindPreflightHash(submitted, 'pdf-a', NewUploadState(() => 'unused'))).toEqual({
      requestKey: 'first', hash: 'pdf-a', submitted: false,
    })
    expect(() => BindPreflightHash(submitted, 'pdf-b', NewUploadState(() => 'second'))).toThrow(/같은 PDF/)
  })

  it('understands legacy key and hash field names while writing the canonical state', () => {
    const storage = new MemoryStorage()
    storage.setItem('upload', JSON.stringify({ key: 'legacy', sha256: 'hash-a', submitted: true }))
    expect(LoadUploadState(storage, 'upload', () => 'new')).toEqual({
      requestKey: 'legacy', hash: 'hash-a', submitted: true,
    })
    SaveUploadState(storage, 'upload', { requestKey: 'current', hash: 'hash-b', submitted: false })
    expect(storage.getItem('upload')).toBe('{"requestKey":"current","hash":"hash-b","submitted":false}')
  })

  it('fails closed when storage cannot retain the recovery key', () => {
    const storage: UploadStorage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    }
    expect(() => LoadUploadState(storage, 'upload', () => 'request-1')).toThrow(/등록을 차단/)
  })
})
