import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const noteEditorPath = resolve(process.cwd(), 'src/features/editor/NoteEditor.vue')
const noteEditorSource = readFileSync(noteEditorPath, 'utf8')

describe('笔记编辑器布局', () => {
  it('限制标题输入框和内容网格的最小内联尺寸，避免超长标题撑出编辑器', () => {
    expect(noteEditorSource).toContain('grid-template-columns: minmax(0, 1fr)')
    expect(noteEditorSource).toContain(
      '.note-title-input {\n  inline-size: 100%;\n  min-inline-size: 0;',
    )
    expect(noteEditorSource).toContain(
      '.note-title-input :deep(.el-input__inner) {\n  min-inline-size: 0;',
    )
  })
})
