import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EditorStatusBar from '@/features/editor/EditorStatusBar.vue'

describe('EditorStatusBar', () => {
  it('显示正文的字数、字符数和行数', () => {
    const wrapper = mount(EditorStatusBar, {
      props: { content: '墨盒 MemoBox\n第二行' },
    })

    expect(wrapper.text()).toContain('字数 6')
    expect(wrapper.text()).toContain('字符 12')
    expect(wrapper.text()).toContain('行 2')
    expect(wrapper.text()).toContain('Markdown')
  })

  it('空内容仍显示一行', () => {
    const wrapper = mount(EditorStatusBar, { props: { content: '' } })

    expect(wrapper.text()).toContain('字数 0')
    expect(wrapper.text()).toContain('字符 0')
    expect(wrapper.text()).toContain('行 1')
  })
})
