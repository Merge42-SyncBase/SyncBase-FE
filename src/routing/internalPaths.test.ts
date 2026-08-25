import { describe, expect, it } from 'vitest'
import { safeDestinationForRole, safeInternalPath } from './internalPaths'

describe('safe internal navigation', () => {
  it('rejects external and protocol-relative destinations', () => {
    expect(safeInternalPath('https://example.test/documents', '/search')).toBe('/search')
    expect(safeInternalPath('//example.test/documents', '/search')).toBe('/search')
    expect(safeInternalPath('/documents\\redirect', '/search')).toBe('/search')
  })

  it('keeps administrators on internal Document routes', () => {
    expect(safeDestinationForRole('/documents/doc-1?tab=versions', 'DOCUMENT_ADMIN')).toBe('/documents/doc-1?tab=versions')
  })

  it('keeps future non-admin roles out of every Document operations route', () => {
    expect(safeDestinationForRole('/documents', 'future-member')).toBe('/search')
    expect(safeDestinationForRole('/documents/doc-1/versions/new', 'future-member')).toBe('/search')
    expect(safeDestinationForRole('/search', 'future-member')).toBe('/search')
  })
})
