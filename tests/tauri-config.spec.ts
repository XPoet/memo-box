import { describe, expect, it } from 'vitest'
import tauriConfig from '../src-tauri/tauri.conf.json'

describe('Tauri 窗口配置', () => {
  it('关闭原生拖放处理，为 Element Plus 分类树保留 HTML5 拖拽事件', () => {
    expect(tauriConfig.app.windows[0]?.dragDropEnabled).toBe(false)
  })
})
