import { describe, expect, it } from 'vitest'
import { isDocumentAdmin, landingPathForRole } from './roles'

describe('role-aware landing behavior', () => {
  it('keeps the current administrator contract on the operations workspace', () => {
    expect(isDocumentAdmin('DOCUMENT_ADMIN')).toBe(true)
    expect(landingPathForRole('DOCUMENT_ADMIN')).toBe('/documents')
  })

  it('routes any future non-admin role to evidence search without naming an unsupported backend role', () => {
    expect(isDocumentAdmin('future-role-from-session')).toBe(false)
    expect(landingPathForRole('future-role-from-session')).toBe('/search')
  })
})
