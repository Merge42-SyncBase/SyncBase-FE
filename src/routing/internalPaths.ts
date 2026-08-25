import { isDocumentAdmin, landingPathForRole } from '../auth/roles'

export function safeInternalPath(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}

export function safeDestinationForRole(
  value: unknown,
  role: string,
  fallback: string = landingPathForRole(role),
): string {
  const destination = safeInternalPath(value, fallback)
  const pathname = destination.split(/[?#]/, 1)[0]
  if (!isDocumentAdmin(role) && (pathname === '/documents' || pathname.startsWith('/documents/'))) {
    return landingPathForRole(role)
  }
  return destination
}
