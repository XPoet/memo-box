import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App.vue'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'

describe('应用壳', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('设置页加载时保持已就绪路由，不回退到启动遮罩', async () => {
    const pinia = createPinia()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          component: { template: '<div data-test="router-view" />' },
        },
      ],
    })
    setActivePinia(pinia)
    const appStore = useAppStore()
    const settingsStore = useSettingsStore()
    appStore.status = 'ready'
    settingsStore.isLoading = true
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
        stubs: {
          AppBootstrap: '<div data-test="app-bootstrap" />',
        },
      },
    })

    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="app-bootstrap"]').exists()).toBe(false)
  })
})
