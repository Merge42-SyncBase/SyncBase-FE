export function isDocumentAdmin(role: string): boolean {
  return role === 'DOCUMENT_ADMIN'
}

export function landingPathForRole(role: string): '/documents' | '/search' {
  return isDocumentAdmin(role) ? '/documents' : '/search'
}
