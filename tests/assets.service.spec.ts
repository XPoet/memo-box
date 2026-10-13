import { invoke } from '@tauri-apps/api/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadNoteImage } from '@/services/assets'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
const createObjectURL = vi.fn((_blob: Blob | MediaSource) => 'blob:preview')

describe('本地图片读取 Service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL }))
  })

  it('通过受控命令读取二进制图片并创建正确类型的 Blob URL', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer
    vi.mocked(invoke).mockResolvedValue(bytes)
    expect(await loadNoteImage('note', 'assets/a.jpg')).toBe('blob:preview')
    expect(invoke).toHaveBeenCalledWith('read_note_image', {
      noteId: 'note',
      relativePath: 'assets/a.jpg',
    })
    const blob = createObjectURL.mock.calls[0]?.[0]
    expect(blob).toBeInstanceOf(Blob)
    if (blob instanceof Blob) {
      expect(blob.type).toBe('image/jpeg')
      expect(blob.size).toBe(3)
    }
  })

  it('保留图片读取错误码与提示', async () => {
    const failure = { code: 'ASSET_READ_FAILED', message: '图片无法读取，资源缺失或文件无效。' }
    vi.mocked(invoke).mockRejectedValue(failure)
    await expect(loadNoteImage('note', 'assets/missing.png')).rejects.toEqual(failure)
    expect(createObjectURL).not.toHaveBeenCalled()
  })
})
