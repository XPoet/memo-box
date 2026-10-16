import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoteListItem from '@/features/notes/NoteListItem.vue'

describe('NoteListItem', () => {
  it('分别展示带图标的完整创建时间和更新时间，使用本地时间且午夜不显示为 24 点', () => {
    const createdAt = new Date(2026, 9, 16, 0, 1, 2).toISOString()
    const updatedAt = new Date(2026, 9, 17, 23, 59, 58).toISOString()
    const wrapper = mount(NoteListItem, {
      props: {
        note: {
          id: 'dated-note',
          title: '时间展示',
          contentPreview: '摘要',
          tagNames: [],
          isPinned: false,
          createdAt,
          updatedAt,
        },
        selected: false,
      },
      global: { stubs: { ElIcon: { template: '<i><slot /></i>' } } },
    })

    const rows = wrapper.findAll('.note-list-item-time')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toBe('创建2026/10/16 00:01:02')
    expect(rows[1].text()).toBe('更新2026/10/17 23:59:58')
    expect(rows[0].get('time').attributes('datetime')).toBe(createdAt)
    expect(rows[1].get('time').attributes('datetime')).toBe(updatedAt)
    expect(rows.every((row) => row.find('svg').exists())).toBe(true)
  })

  it('仅为置顶笔记显示右上角置顶图标', () => {
    const global = {
      stubs: {
        ElIcon: { template: '<i><slot /></i>' },
      },
    }
    const pinnedWrapper = mount(NoteListItem, {
      props: {
        note: {
          id: 'pinned-note',
          title: '置顶笔记',
          contentPreview: '摘要',
          tagNames: ['工作', '重要'],
          isPinned: true,
          createdAt: '2026-07-27T00:00:00Z',
          updatedAt: '2026-07-27T00:00:00Z',
        },
        selected: false,
      },
      global,
    })
    const regularWrapper = mount(NoteListItem, {
      props: {
        note: {
          id: 'regular-note',
          title: '普通笔记',
          contentPreview: '摘要',
          tagNames: [],
          isPinned: false,
          createdAt: '2026-07-27T00:00:00Z',
          updatedAt: '2026-07-27T00:00:00Z',
        },
        selected: false,
      },
      global,
    })

    expect(pinnedWrapper.find('.note-list-item-pin').exists()).toBe(true)
    expect(regularWrapper.find('.note-list-item-pin').exists()).toBe(false)
    expect(pinnedWrapper.find('.note-list-item-tags').text()).toBe('#工作 #重要')
    expect(regularWrapper.find('.note-list-item-tags').text()).toBe('')
  })
})
