import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../api/client'
import { DocumentsPage } from './DocumentsPage'

vi.mock('../api/client', () => ({
  APIError: class APIError extends Error {},
  api: { documents: vi.fn() },
}))

afterEach(() => cleanup())

describe('document list identity', () => {
  it('keeps matching display names distinguishable by their UUID-derived labels and links', async () => {
    vi.mocked(api.documents).mockResolvedValue({
      documents: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: '보안 정책',
          activeVersion: 1,
          latestVersion: 1,
          latestStatus: 'ACTIVE',
          updatedAt: '2026-08-25T00:00:00Z',
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: '보안 정책',
          activeVersion: null,
          latestVersion: 1,
          latestStatus: 'PROCESSING',
          updatedAt: '2026-08-25T00:01:00Z',
        },
      ],
      limit: 100,
      offset: 0,
    })

    render(<MemoryRouter><DocumentsPage /></MemoryRouter>)

    const links = await screen.findAllByRole('link', { name: '보안 정책' })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/documents/11111111-1111-4111-8111-111111111111')
    expect(links[1]).toHaveAttribute('href', '/documents/22222222-2222-4222-8222-222222222222')
    expect(screen.getByText('ID 11111111')).toHaveAttribute('title', '11111111-1111-4111-8111-111111111111')
    expect(screen.getByText('ID 22222222')).toHaveAttribute('title', '22222222-2222-4222-8222-222222222222')
  })
})
