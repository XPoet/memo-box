import { describe, expect, it, vi } from 'vitest'
import { useAutoSave } from '@/composables/useAutoSave'

describe('useAutoSave', () => {
  it('连续输入只在最后一次输入后保存一次，并支持立即 flush', async () => {
    vi.useFakeTimers()
    const save = vi.fn<() => Promise<void>>().mockResolvedValue()
    const autoSave = useAutoSave(save)

    autoSave.schedule()
    await vi.advanceTimersByTimeAsync(600)
    autoSave.schedule()
    await vi.advanceTimersByTimeAsync(999)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(save).toHaveBeenCalledTimes(1)

    autoSave.schedule()
    await autoSave.flush()
    expect(save).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
