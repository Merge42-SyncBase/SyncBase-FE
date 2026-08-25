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
})
