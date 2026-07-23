import { beforeEach, describe, expect, it, vi } from 'vitest'

const { invoke } = vi.hoisted(() => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke }))

import { bootstrapApp, toBootstrapError } from '@/services/bootstrap'

describe('bootstrapApp', () => {
  beforeEach(() => {
    invoke.mockReset()
  })

  it('返回原生初始化快照', async () => {
    invoke.mockResolvedValue({
      status: 'ready',
      dataDirectory: '/safe/application-support/MemoBox',
      schemaVersion: 1,
    })

    await expect(bootstrapApp()).resolves.toEqual({
      status: 'ready',
      dataDirectory: '/safe/application-support/MemoBox',
      schemaVersion: 1,
    })
    expect(invoke).toHaveBeenCalledWith('bootstrap_app')
  })

  it('保留受支持的原生错误码', async () => {
    invoke.mockRejectedValue({
      code: 'DATABASE_LOCKED',
      message: '本地数据库正被占用，请稍后重试。',
    })

    await expect(bootstrapApp()).rejects.toEqual({
      code: 'DATABASE_LOCKED',
      message: '本地数据库正被占用，请稍后重试。',
    })
  })

  it('屏蔽未知错误中的内部信息', () => {
    expect(toBootstrapError(new Error('SELECT * FROM notes'))).toEqual({
      code: 'BOOTSTRAP_FAILED',
      message: '本地数据初始化失败，请检查应用数据目录后重试。',
    })
  })
})
