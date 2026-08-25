import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

describe('responsive shell contract', () => {
  it('keeps the logout control visible in the compact shell breakpoint', () => {
    const compactStart = styles.indexOf('@media (max-width: 980px)')
    const compactEnd = styles.indexOf('@media (max-width: 720px)')
    const compactStyles = styles.slice(compactStart, compactEnd)

    expect(compactStyles).toContain('.sidebar-footer')
    expect(compactStyles).toMatch(/\.sidebar-footer\s*\{[\s\S]*?display:\s*flex;/)
    expect(compactStyles).not.toMatch(/\.sidebar-footer\s*\{\s*display:\s*none/)
  })

  it('keeps informational recovery, file identity, and PDF loading treatments semantically neutral', () => {
    const pendingNotice = styles.match(/\.notice\.pending\s*\{([\s\S]*?)\}/)?.[1] ?? ''
    const fileIcon = styles.match(/\.file-icon\s*\{([\s\S]*?)\}/)?.[1] ?? ''
    const pdfRenderStatus = styles.match(/\.pdf-render-status\s*\{([\s\S]*?)\}/)?.[1] ?? ''

    expect(pendingNotice).toContain('var(--amber-800)')
    expect(styles).not.toContain('.notice.info')
    expect(fileIcon).not.toMatch(/var\(--red-|#a8243d|#fff1f3/)
    expect(pdfRenderStatus).not.toContain('box-shadow')
  })
})
