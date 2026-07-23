import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ExportScopeOption from '@/features/export/ExportScopeOption.vue'

describe('ExportScopeOption', () => {
  it('展示范围说明，并把选择意图上交给父组件', async () => {
    const option = {
      scope: { kind: 'categoryWithDescendants' as const, id: 'category-1' },
      title: '当前分类及全部子分类',
      description: '保留分类层级。',
    }
    const wrapper = mount(ExportScopeOption, { props: { option, selected: false } })

    expect(wrapper.text()).toContain('当前分类及全部子分类')
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('select')).toEqual([[option.scope]])
  })
})
