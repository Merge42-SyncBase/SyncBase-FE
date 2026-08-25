import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../auth/AuthProvider'
import { landingPathForRole } from '../auth/roles'
import { AppShell } from '../components/AppShell'
import { DocumentDetailPage } from '../pages/DocumentDetailPage'
import { DocumentsPage } from '../pages/DocumentsPage'
import { LoginPage } from '../pages/LoginPage'
import { UploadPage } from '../pages/UploadPage'

const SearchPage = lazy(async () => import('../pages/SearchPage').then((module) => ({ default: module.SearchPage })))
const SourceViewerPage = lazy(async () => import('../pages/SourceViewerPage').then((module) => ({ default: module.SourceViewerPage })))

function RequireSession() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <main className="app-loading" aria-live="polite">세션을 확인하고 있습니다.</main>
  if (!session) return <Navigate replace to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} />
  return <Outlet />
}

function LoginRoute() {
  const { session, loading } = useAuth()
  if (loading) return <main className="app-loading" aria-live="polite">세션을 확인하고 있습니다.</main>
  if (session) return <Navigate replace to={landingPathForRole(session.user.role)} />
  return <LoginPage />
}

function RoleHome() {
  const { session } = useAuth()
  return <Navigate replace to={landingPathForRole(session?.user.role ?? '')} />
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<RequireSession />}>
            <Route element={<AppShell />}>
              <Route index element={<RoleHome />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/documents/new" element={<UploadPage />} />
              <Route path="/documents/:documentID" element={<DocumentDetailPage />} />
              <Route path="/documents/:documentID/versions/new" element={<UploadPage />} />
              <Route path="/search" element={<Suspense fallback={<main className="app-loading">근거 검색을 불러오는 중입니다.</main>}><SearchPage /></Suspense>} />
              <Route path="/sources/:documentID/versions/:version" element={<Suspense fallback={<main className="app-loading">원문 뷰어를 불러오는 중입니다.</main>}><SourceViewerPage /></Suspense>} />
              <Route path="*" element={<RoleHome />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
