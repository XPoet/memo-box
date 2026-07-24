import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const indexHtmlPath = resolve(process.cwd(), 'index.html')
const indexHtml = readFileSync(indexHtmlPath, 'utf8')

describe('静态启动占位页', () => {
  it('在 Vue 和本地工作区初始化前提供与设计主题一致的可见反馈', () => {
    expect(indexHtml).toContain('id="app-startup-splash"')
    expect(indexHtml).toContain('正在准备本地工作区…')
    expect(indexHtml).toContain('background: #f7f5ef')
    expect(indexHtml).toContain('startup-splash__spinner')
  })
})
