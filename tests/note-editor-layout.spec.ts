import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const noteEditorPath = resolve(process.cwd(), 'src/features/editor/NoteEditor.vue')
const noteEditorSource = readFileSync(noteEditorPath, 'utf8')
const markdownEditorPath = resolve(process.cwd(), 'src/features/editor/MarkdownEditor.vue')
const markdownEditorSource = readFileSync(markdownEditorPath, 'utf8')

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

  it('按设计稿保留 56px 工具栏和 34px 文档状态栏', () => {
    expect(noteEditorSource).toContain('grid-template-rows: 56px minmax(0, 1fr) 34px')
    expect(noteEditorSource).toContain(':save-status="saveStatus"')
    expect(noteEditorSource).toContain(':save-error="saveError"')
  })

  it('将分类和标签收纳到删除按钮后的更多操作中', () => {
    expect(noteEditorSource).toContain(':icon="MoreFilled"')
    expect(noteEditorSource).toContain(
      '<el-popover placement="bottom-end" :width="360" trigger="click">',
    )
    expect(noteEditorSource).toContain(':category-id="note.categoryId"')
  })

  it('仅由 CodeMirror 内部滚动节点承载长内容滚动', () => {
    expect(markdownEditorSource).toContain(
      '.markdown-editor {\n  min-inline-size: 0;\n  min-block-size: 0;\n  block-size: 100%;\n  overflow: hidden;',
    )
    expect(markdownEditorSource).toContain(
      '.markdown-editor :deep(.cm-editor) {\n  min-inline-size: 0;\n  min-block-size: 0;\n  block-size: 100%;',
    )
    expect(markdownEditorSource).toContain('overflow-x: hidden;\n  overflow-y: auto;')
  })

  it('隐藏滚动条轨道底色并使用 Element Plus 风格的半透明滑块', () => {
    expect(markdownEditorSource).toContain(
      '.markdown-editor :deep(.cm-scroller::-webkit-scrollbar-track) {\n  background: transparent;',
    )
    expect(markdownEditorSource).toContain('background: rgb(144 147 153 / 30%);')
    expect(markdownEditorSource).toContain('background: rgb(144 147 153 / 50%);')
  })
})
