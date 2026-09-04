import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import AppSidebar from '@/layouts/AppSidebar.vue'
import { UNCATEGORIZED_CATEGORY_ID } from '@/types/categories'

const EmptyView = defineComponent({
  setup() {
    return () => h('div')
  },
})

const ButtonStub = defineComponent({
  emits: ['click'],
  setup(_props, { attrs, emit, slots }) {
    return () => h('button', { ...attrs, onClick: () => emit('click') }, slots.default?.())
  },
})

const IconStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('i', slots.default?.())
  },
})

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'workbench', component: EmptyView },
      { path: '/categories', name: 'categories', component: EmptyView },
      { path: '/tags', name: 'tags', component: EmptyView },
      { path: '/trash', name: 'trash', component: EmptyView },
      { path: '/search', name: 'search', component: EmptyView },
      { path: '/settings', name: 'settings', component: EmptyView },
    ],
  })
}

describe('AppSidebar', () => {
  it('为所有管理页面和分类筛选提供路由入口', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()
    const wrapper = mount(AppSidebar, {
      props: {
        categories: [
          {
            id: 'work',
            name: '工作',
            level: 1,
            sortOrder: 0,
            path: '工作',
            noteCount: 2,
            children: [],
          },
        ],
      },
      global: {
        plugins: [router],
        stubs: {
          ElButton: ButtonStub,
          ElIcon: IconStub,
        },
      },
    })

    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))

    expect(hrefs).toContain(router.resolve({ name: 'workbench' }).href)
    expect(hrefs).toContain(router.resolve({ name: 'categories' }).href)
    expect(hrefs).toContain(router.resolve({ name: 'tags' }).href)
    expect(hrefs).toContain(router.resolve({ name: 'trash' }).href)
    expect(hrefs).toContain(router.resolve({ name: 'search' }).href)
    expect(hrefs).toContain(router.resolve({ name: 'settings' }).href)
    expect(hrefs).toContain(router.resolve({ name: 'workbench', query: { category: 'work' } }).href)
    expect(hrefs).toContain(
      router.resolve({
        name: 'workbench',
        query: { category: UNCATEGORIZED_CATEGORY_ID },
      }).href,
    )
    expect(wrapper.get('.sidebar-category-item').text()).toContain('未分类')
    expect(wrapper.get('.sidebar-settings-item').attributes('href')).toBe(
      router.resolve({ name: 'settings' }).href,
    )
    expect(wrapper.get('.app-sidebar').element.lastElementChild).toBe(
      wrapper.get('.sidebar-settings-item').element,
    )

    const settingsNavigation = new Promise<void>((resolve) => {
      const removeAfterEach = router.afterEach((to) => {
        if (to.name === 'settings') {
          removeAfterEach()
          resolve()
        }
      })
    })

    await wrapper.get('.sidebar-settings-item').trigger('click')
    await settingsNavigation

    expect(router.currentRoute.value.name).toBe('settings')
  })

  it('将新建笔记意图交给路由视图处理', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()
    const wrapper = mount(AppSidebar, {
      props: { categories: [] },
      global: {
        plugins: [router],
        stubs: {
          ElButton: ButtonStub,
          ElIcon: IconStub,
        },
      },
    })

    await wrapper.get('.sidebar-create-button').trigger('click')

    expect(wrapper.emitted('create')).toHaveLength(1)
  })

  it('可根据本地偏好隐藏分类统计，同时保留分类导航入口', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()
    const wrapper = mount(AppSidebar, {
      props: {
        categories: [
          {
            id: 'work',
            name: '工作',
            level: 1,
            sortOrder: 0,
            path: '工作',
            noteCount: 2,
            children: [],
          },
        ],
        showCategoryCounts: false,
      },
      global: { plugins: [router], stubs: { ElButton: ButtonStub, ElIcon: IconStub } },
    })

    expect(wrapper.text()).not.toContain('2')
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toContain(
      router.resolve({ name: 'workbench', query: { category: 'work' } }).href,
    )
  })

  it('分类数据刷新后立即显示最新笔记数量', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()
    const category = {
      id: 'work',
      name: '工作',
      level: 1,
      sortOrder: 0,
      path: '工作',
      noteCount: 2,
      children: [],
    }
    const wrapper = mount(AppSidebar, {
      props: { categories: [category], showCategoryCounts: true },
      global: { plugins: [router], stubs: { ElButton: ButtonStub, ElIcon: IconStub } },
    })

    await wrapper.setProps({ categories: [{ ...category, noteCount: 3 }] })

    expect(wrapper.get('.sidebar-category-item .sidebar-nav-count').text()).toBe('3')
  })

  it('进入未分类筛选时为未分类入口添加激活状态', async () => {
    const router = createTestRouter()
    await router.push({ name: 'workbench', query: { category: UNCATEGORIZED_CATEGORY_ID } })
    await router.isReady()
    const wrapper = mount(AppSidebar, {
      props: { categories: [] },
      global: { plugins: [router], stubs: { ElButton: ButtonStub, ElIcon: IconStub } },
    })

    expect(wrapper.get('.sidebar-category-item').classes()).toContain(
      'sidebar-category-item--active',
    )
  })
})
