import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'

async function loginAs(roleName: '문서 관리자' | 'AI 검색 사용자' | '운영자') {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getByRole('button', { name: new RegExp(roleName) }))
  await screen.findByRole('heading', { name: '문서', level: 1 })

  return user
}

describe('SyncBase frontend MVP', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/login')
  })

  it('선택한 역할로 로그인하고 문서 작업 공간으로 이동한다', async () => {
    await loginAs('문서 관리자')

    expect(screen.getByText('Merge42 데모 사용자')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '임직원 업무 가이드' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '새 문서 등록' })).toBeEnabled()
  })

  it('PDF가 아닌 파일을 등록하려 하면 인라인 오류를 보여준다', async () => {
    const user = await loginAs('문서 관리자')
    await user.click(screen.getByRole('button', { name: '새 문서 등록' }))

    await screen.findByRole('heading', { name: 'PDF 등록', level: 1 })
    const invalidFile = new File(['plain text'], 'release-notes.txt', { type: 'text/plain' })
    const uploadUser = userEvent.setup({ applyAccept: false })
    await uploadUser.upload(screen.getByLabelText('파일 선택'), invalidFile)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('등록할 수 없습니다.')
    expect(alert).toHaveTextContent('PDF 파일만 등록할 수 있습니다.')
    expect(screen.queryByText('release-notes.txt')).not.toBeInTheDocument()
  })

  it('확장자와 MIME만 PDF인 위장 파일도 등록하지 않는다', async () => {
    await loginAs('문서 관리자')
    await userEvent.click(screen.getByRole('button', { name: '새 문서 등록' }))

    const disguisedFile = new File(['plain text'], 'disguised.pdf', {
      type: 'application/pdf',
    })
    await userEvent.upload(screen.getByLabelText('파일 선택'), disguisedFile)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('파일 내용이 PDF 형식이 아닙니다.')
    expect(screen.queryByText('disguised.pdf')).not.toBeInTheDocument()
  })

  it('장애 화면 재생 중에는 문서 등록 쓰기를 잠근다', async () => {
    const user = await loginAs('문서 관리자')
    await user.click(screen.getByRole('button', { name: '장애 화면 재생' }))

    expect(await screen.findByText('장애 화면 상태를 재생 중입니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 문서 등록' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'PDF 등록' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: '복구 화면 재생' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '데모 초기화' })).toBeDisabled()
  })

  it('활성 원문에서 다음 페이지로 이동하고 근거 텍스트를 갱신한다', async () => {
    const user = await loginAs('AI 검색 사용자')
    await user.click(screen.getAllByRole('link', { name: '임직원 업무 가이드' })[0])
    await user.click(await screen.findByRole('link', { name: '활성 원문 보기' }))

    const pageInput = await screen.findByRole('spinbutton', { name: /현재 페이지/ })
    expect(pageInput).toHaveValue(1)

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))

    await waitFor(() => expect(pageInput).toHaveValue(2))
    expect(window.location.pathname).toBe('/sources/ver-handbook-3')
    expect(window.location.search).toBe('?page=2')

    const semanticPanel = screen.getByRole('heading', { name: '페이지 텍스트' }).closest('aside')
    expect(semanticPanel).not.toBeNull()
    expect(within(semanticPanel as HTMLElement).getByText(/세부 절차 2/)).toBeInTheDocument()

    act(() => {
      window.history.pushState({}, '', `${window.location.pathname}?page=1.5`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(await screen.findByRole('status')).toHaveTextContent(
      '요청한 페이지를 찾을 수 없어 1페이지를 표시합니다.',
    )
    expect(pageInput).toHaveValue(1)
    expect(within(semanticPanel as HTMLElement).getByText(/핵심 원칙과 적용 범위/)).toBeInTheDocument()
  })

  it('존재하지 않는 새 버전 대상은 문서 목록으로 안전하게 돌려보낸다', async () => {
    await loginAs('문서 관리자')

    act(() => {
      window.history.pushState({}, '', '/documents/new?documentId=missing-document')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(await screen.findByRole('heading', { name: '문서', level: 1 })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/documents')
  })
})
