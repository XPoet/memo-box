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
  it('由 CodeMirror 原生处理纯文本粘贴并同步模型值', async () => {
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

  it('由 CodeMirror 原生粘贴多行连字符文本并同步模型值', async () => {
    const content =
      '9xxxx-2xxxx\naxxxx-cxxxx\n0xxxx-2xxxx\nbxxxx-acccc\n5xxxx-ccccc\ndcccc-5cccc\n8cccc-1cccc\n8cccc-aaaaa\n6cccc-aaaaa\n3cccc-0aaaa\nccccc-daaaa\nbcccc-6aaaa\ndaaaa-bcccc\nfcccc-1bbbb\neaaaa-8aaaa\ndaaaa-4aaaa'
    const wrapper = mount(MarkdownEditor, {
      props: {
        modelValue: '',
        saveImage: vi.fn(),
      },
    })

    wrapper.find('.cm-content').element.dispatchEvent(createPlainTextPasteEvent(content))
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([[content]])
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
