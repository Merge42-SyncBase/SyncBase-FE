import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DemoProvider, useDemo } from './DemoProvider'

const HANDBOOK_ID = 'doc-handbook'
const ORIGINAL_ACTIVE_VERSION_ID = 'ver-handbook-3'

function DemoHarness() {
  const {
    beginRecovery,
    beginUpload,
    getDocument,
    system,
    triggerFailover,
    writeLocked,
  } = useDemo()
  const handbook = getDocument(HANDBOOK_ID)
  const newest = handbook?.versions[0]

  if (!handbook || !newest) return null

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          beginUpload({
            file: new File(['mock pdf'], 'handbook-v4.pdf', {
              type: 'application/pdf',
              lastModified: 1_786_377_600_000,
            }),
            title: handbook.name,
            existingDocumentId: handbook.id,
            outcome: 'happy',
          })
        }
      >
        새 버전 시작
      </button>
      <button type="button" onClick={triggerFailover}>장애 전환</button>
      <button type="button" onClick={beginRecovery}>복구 시작</button>

      <output data-testid="phase">{system.phase}</output>
      <output data-testid="write-locked">{String(writeLocked)}</output>
      <output data-testid="active-version-id">{handbook.activeVersionId}</output>
      <output data-testid="newest-version-id">{newest.id}</output>
      <output data-testid="newest-version-status">{newest.status}</output>

      <ul>
        {handbook.versions.map((version) => (
          <li
            key={version.id}
            data-testid="version-state"
            data-version-id={version.id}
            data-status={version.status}
          >
            {version.id}: {version.status}
          </li>
        ))}
      </ul>
    </div>
  )
}

function renderHarness() {
  render(
    <DemoProvider>
      <DemoHarness />
    </DemoProvider>,
  )
}

function advanceTime(milliseconds: number) {
  act(() => {
    vi.advanceTimersByTime(milliseconds)
  })
}

function versionState(versionId: string) {
  return screen
    .getAllByTestId('version-state')
    .find((element) => element.getAttribute('data-version-id') === versionId)
}

describe('DemoProvider failover and recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-11T09:00:00+09:00'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('새 버전 처리 중 failover가 발생하면 처리를 멈추고 기존 ACTIVE를 유지한다', () => {
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: '새 버전 시작' }))
    advanceTime(4_400)
    expect(screen.getByTestId('newest-version-status')).toHaveTextContent('PROCESSING')

    fireEvent.click(screen.getByRole('button', { name: '장애 전환' }))
    expect(screen.getByTestId('phase')).toHaveTextContent('failover')
    expect(screen.getByTestId('write-locked')).toHaveTextContent('true')

    const pausedVersionId = screen.getByTestId('newest-version-id').textContent
    const pausedStatus = screen.getByTestId('newest-version-status').textContent
    advanceTime(20_000)

    expect(screen.getByTestId('newest-version-id')).toHaveTextContent(pausedVersionId ?? '')
    expect(screen.getByTestId('newest-version-status')).toHaveTextContent(pausedStatus ?? '')
    expect(screen.getByTestId('active-version-id')).toHaveTextContent(ORIGINAL_ACTIVE_VERSION_ID)
    expect(versionState(ORIGINAL_ACTIVE_VERSION_ID)).toHaveAttribute('data-status', 'ACTIVE')
  })

  it('recovery 후 처리를 재개해 새 버전만 ACTIVE로 만들고 기존 버전을 비활성화한다', () => {
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: '새 버전 시작' }))
    const newVersionId = screen.getByTestId('newest-version-id').textContent ?? ''
    advanceTime(4_400)
    fireEvent.click(screen.getByRole('button', { name: '장애 전환' }))
    advanceTime(5_000)

    fireEvent.click(screen.getByRole('button', { name: '복구 시작' }))
    expect(screen.getByTestId('phase')).toHaveTextContent('recovering')
    expect(screen.getByTestId('write-locked')).toHaveTextContent('true')

    advanceTime(900)
    expect(screen.getByTestId('phase')).toHaveTextContent('recovered')
    expect(screen.getByTestId('write-locked')).toHaveTextContent('false')

    advanceTime(1_100)
    expect(screen.getByTestId('active-version-id')).toHaveTextContent(newVersionId)
    expect(versionState(newVersionId)).toHaveAttribute('data-status', 'ACTIVE')
    expect(versionState(ORIGINAL_ACTIVE_VERSION_ID)).toHaveAttribute(
      'data-status',
      'COMPLETED_INACTIVE',
    )

    const activeVersions = screen
      .getAllByTestId('version-state')
      .filter((element) => element.getAttribute('data-status') === 'ACTIVE')
    expect(activeVersions).toHaveLength(1)

    advanceTime(5_000)
    expect(
      screen
        .getAllByTestId('version-state')
        .filter((element) => element.getAttribute('data-status') === 'ACTIVE'),
    ).toHaveLength(1)
  })

  it('복구 직후 새 장애가 발생하면 이전 healthy 타이머가 장애를 덮지 않는다', () => {
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: '장애 전환' }))
    fireEvent.click(screen.getByRole('button', { name: '복구 시작' }))
    advanceTime(900)
    expect(screen.getByTestId('phase')).toHaveTextContent('recovered')

    fireEvent.click(screen.getByRole('button', { name: '장애 전환' }))
    advanceTime(5_000)

    expect(screen.getByTestId('phase')).toHaveTextContent('failover')
    expect(screen.getByTestId('write-locked')).toHaveTextContent('true')
  })

  it('같은 문서의 동시 처리 완료에서는 가장 최신 버전만 활성화한다', () => {
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: '새 버전 시작' }))
    const olderUploadId = screen.getByTestId('newest-version-id').textContent ?? ''
    fireEvent.click(screen.getByRole('button', { name: '새 버전 시작' }))
    const newestUploadId = screen.getByTestId('newest-version-id').textContent ?? ''
    expect(newestUploadId).not.toBe(olderUploadId)

    advanceTime(5_500)

    expect(screen.getByTestId('active-version-id')).toHaveTextContent(newestUploadId)
    expect(versionState(newestUploadId)).toHaveAttribute('data-status', 'ACTIVE')
    expect(versionState(olderUploadId)).toHaveAttribute('data-status', 'COMPLETED_INACTIVE')
    expect(
      screen
        .getAllByTestId('version-state')
        .filter((element) => element.getAttribute('data-status') === 'ACTIVE'),
    ).toHaveLength(1)
  })
})
