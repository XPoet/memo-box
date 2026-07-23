import { onBeforeUnmount, shallowRef } from 'vue'

export interface AutoSaveController {
  schedule: () => void
  flush: () => Promise<void>
  cancel: () => void
  pending: Readonly<{ value: boolean }>
}

export function useAutoSave(save: () => Promise<void>, delay = 1_000): AutoSaveController {
  const pending = shallowRef(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function cancel(): void {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    pending.value = false
  }

  async function flush(): Promise<void> {
    cancel()
    await save()
  }

  function schedule(): void {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
    pending.value = true
    timer = setTimeout(() => {
      timer = undefined
      pending.value = false
      void save()
    }, delay)
  }

  onBeforeUnmount(cancel)

  return { schedule, flush, cancel, pending }
}
