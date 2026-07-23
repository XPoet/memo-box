import { onBeforeUnmount } from 'vue'

const SEARCH_DEBOUNCE_MS = 250

export function useSearchQuery(onSearch: (query: string) => Promise<void>): {
  schedule: (query: string) => void
  cancel: () => void
} {
  let timer: ReturnType<typeof setTimeout> | undefined

  function cancel(): void {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  function schedule(query: string): void {
    cancel()
    const normalized = query.trim()
    if (normalized === '') {
      return
    }
    timer = setTimeout(() => {
      timer = undefined
      void onSearch(normalized)
    }, SEARCH_DEBOUNCE_MS)
  }

  onBeforeUnmount(cancel)

  return { schedule, cancel }
}
