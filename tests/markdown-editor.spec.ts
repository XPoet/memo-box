import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import MarkdownEditor from '@/features/editor/MarkdownEditor.vue'

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  readImage: vi.fn(),
}))

function createPlainTextPasteEvent(text: string): ClipboardEvent {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (format: string) => (format === 'text/plain' ? text : ''),
      items: [],
    },
  })
  return event
}

describe('MarkdownEditor', () => {
  it('仅处理一次纯文本粘贴，避免与 CodeMirror 内置粘贴重复插入', async () => {
    const wrapper = mount(MarkdownEditor, {
      props: {
        modelValue: '',
        saveImage: vi.fn(),
      },
    })
    const pasteEvent = createPlainTextPasteEvent('粘贴文本')

    wrapper.find('.cm-content').element.dispatchEvent(pasteEvent)
    await nextTick()

    expect(pasteEvent.defaultPrevented).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['粘贴文本']])
    wrapper.unmount()
  })

  it('在编辑区空白位置点击后，按回车会插入换行', async () => {
    const wrapper = mount(MarkdownEditor, {
      attachTo: document.body,
      props: {
        modelValue: '已有内容',
        saveImage: vi.fn(),
      },
    })

    await wrapper.find('.cm-scroller').trigger('mousedown', { button: 0 })
    await wrapper.find('.cm-content').trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([['已有内容\n']])
    wrapper.unmount()
  })
})
