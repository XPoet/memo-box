import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppBootstrap from '@/app/AppBootstrap.vue'
import { useAppStore } from '@/stores/app'

vi.mock('@/services/bootstrap', () => ({
  bootstrapApp: vi.fn(),
  toBootstrapError: (error: unknown) => error,
}))

vi.mock('@/services/window', () => ({
  showMainWindow: vi.fn(),
}))

describe('AppBootstrap', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始化失败时展示安全诊断和重试入口', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const appStore = useAppStore()
    appStore.status = 'failed'
    appStore.error = {
      code: 'DATA_DIRECTORY_NOT_WRITABLE',
      message: '应用数据目录不可写，请检查磁盘空间和目录权限后重试。',
    }

    const wrapper = mount(AppBootstrap, {
      global: {
        plugins: [pinia],
        stubs: {
          'el-button': {
            template: '<button><slot /></button>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('无法初始化本地数据')
    expect(wrapper.text()).toContain('应用数据目录不可写')
    expect(wrapper.find('button').text()).toBe('重试')
  })
})
