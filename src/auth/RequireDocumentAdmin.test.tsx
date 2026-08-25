import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireDocumentAdmin } from './RequireDocumentAdmin'

const authState = vi.hoisted(() => ({ role: 'DOCUMENT_ADMIN' }))

vi.mock('./AuthProvider', () => ({
  useAuth: () => ({ session: { user: { username: 'user', role: authState.role } } }),
}))

afterEach(() => {
  cleanup()
  authState.role = 'DOCUMENT_ADMIN'
})

describe('Document operations route guard', () => {
  it('keeps DOCUMENT_ADMIN on the requested operations route', () => {
    render(
      <MemoryRouter initialEntries={['/documents/doc-1']}>
        <Routes>
          <Route element={<RequireDocumentAdmin />}><Route path="/documents/:documentID" element={<div>문서 상세</div>} /></Route>
          <Route path="/search" element={<div>근거 검색</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('문서 상세')).toBeInTheDocument()
  })

  it('redirects any future non-admin role to evidence search', () => {
    authState.role = 'future-member'
    render(
      <MemoryRouter initialEntries={['/documents/doc-1']}>
        <Routes>
          <Route element={<RequireDocumentAdmin />}><Route path="/documents/:documentID" element={<div>문서 상세</div>} /></Route>
          <Route path="/search" element={<div>근거 검색</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('근거 검색')).toBeInTheDocument()
    expect(screen.queryByText('문서 상세')).not.toBeInTheDocument()
  })
})
