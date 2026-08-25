import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { isDocumentAdmin, landingPathForRole } from './roles'

export function RequireDocumentAdmin() {
  const { session } = useAuth()
  const role = session?.user.role ?? ''
  if (!isDocumentAdmin(role)) return <Navigate replace to={landingPathForRole(role)} />
  return <Outlet />
}
