import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { DemoProvider, useDemo } from '../demo/DemoProvider'
import { AppShell } from '../components/AppShell'
import { LoginPage } from '../pages/LoginPage'
import { DocumentsPage } from '../pages/DocumentsPage'
import { UploadPage } from '../pages/UploadPage'
import { DocumentDetailPage } from '../pages/DocumentDetailPage'
import { SourceViewerPage } from '../pages/SourceViewerPage'
import { NotFoundPage } from '../pages/NotFoundPage'

function RequireSession() {
  const { session } = useDemo()
  return session ? <Outlet /> : <Navigate to="/login" replace />
}

export function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireSession />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/documents" replace />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/documents/new" element={<UploadPage />} />
              <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
              <Route path="/sources/:versionId" element={<SourceViewerPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  )
}
