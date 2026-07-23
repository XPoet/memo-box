import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import {
  cancelExport,
  chooseExportDirectory,
  exportNotes,
  openExportDirectory,
  toExportError,
} from '@/services/export'
import type {
  ExportError,
  ExportProgress,
  ExportResult,
  ExportScope,
  ExportStatus,
} from '@/types/export'

export const useExportStore = defineStore('export', () => {
  const status = shallowRef<ExportStatus>('idle')
  const progress = shallowRef<ExportProgress>()
  const result = shallowRef<ExportResult>()
  const error = shallowRef<ExportError>()
  const isCancelling = shallowRef(false)
  const isOpeningDirectory = shallowRef(false)
  let activeJobId: string | undefined

  async function start(scope: ExportScope): Promise<void> {
    reset()
    status.value = 'choosing'
    let targetDirectory: string | undefined
    try {
      targetDirectory = await chooseExportDirectory()
    } catch (failure: unknown) {
      status.value = 'failed'
      error.value = toExportError(failure)
      return
    }
    if (targetDirectory === undefined) {
      status.value = 'idle'
      return
    }
    const jobId = crypto.randomUUID()
    activeJobId = jobId
    status.value = 'exporting'
    try {
      result.value = await exportNotes({ jobId, scope, targetDirectory }, updateProgress)
      status.value = 'completed'
    } catch (failure: unknown) {
      status.value = 'failed'
      error.value = toExportError(failure)
    } finally {
      activeJobId = undefined
      isCancelling.value = false
    }
  }

  async function cancel(): Promise<void> {
    if (status.value !== 'exporting' || activeJobId === undefined || isCancelling.value) {
      return
    }
    isCancelling.value = true
    try {
      await cancelExport(activeJobId)
    } catch (failure: unknown) {
      error.value = toExportError(failure)
      isCancelling.value = false
    }
  }

  async function openDirectory(): Promise<void> {
    const jobId = result.value?.jobId
    if (jobId === undefined || isOpeningDirectory.value) {
      return
    }
    isOpeningDirectory.value = true
    try {
      await openExportDirectory(jobId)
    } catch (failure: unknown) {
      error.value = toExportError(failure)
    } finally {
      isOpeningDirectory.value = false
    }
  }

  function updateProgress(value: ExportProgress): void {
    if (status.value === 'exporting') {
      progress.value = value
    }
  }

  function reset(): void {
    progress.value = undefined
    result.value = undefined
    error.value = undefined
    isCancelling.value = false
    isOpeningDirectory.value = false
  }

  return {
    status,
    progress,
    result,
    error,
    isCancelling,
    isOpeningDirectory,
    start,
    cancel,
    openDirectory,
    reset,
  }
})
