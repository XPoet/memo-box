<script setup lang="ts">
import { CircleCheckFilled, InfoFilled, WarningFilled } from '@element-plus/icons-vue'
import { computed } from 'vue'
import type { ExportError, ExportProgress, ExportResult, ExportStatus } from '@/types/export'

const props = defineProps<{
  status: ExportStatus
  progress?: ExportProgress
  result?: ExportResult
  error?: ExportError
  isOpeningDirectory: boolean
}>()

const emit = defineEmits<{
  chooseDirectory: []
  openDirectory: []
}>()

const progressPercent = computed(() => {
  const progress = props.progress
  if (progress === undefined || progress.total === 0) {
    return 0
  }
  return Math.round((progress.processed / progress.total) * 100)
})

const progressDetail = computed(() => {
  const progress = props.progress
  if (progress === undefined) {
    return '正在准备导出任务。'
  }
  const currentTitle = progress.currentTitle ? ` · ${progress.currentTitle}` : ''
  return `已处理 ${progress.processed} / ${progress.total} 篇笔记${currentTitle}`
})

const completionTitle = computed(() => (props.result?.cancelled ? '导出已取消' : '导出完成'))

const completionCopy = computed(() => {
  const result = props.result
  if (result === undefined) {
    return ''
  }
  const issueCopy = result.issues.length > 0 ? `，另有 ${result.issues.length} 项需要留意` : ''
  return `已导出 ${result.exportedCount} 篇笔记，失败 ${result.failedCount} 篇${issueCopy}。`
})
</script>

<template>
  <section class="export-status-panel" aria-live="polite">
    <template v-if="status === 'exporting'">
      <article class="export-status-card export-status-card--progress">
        <header class="export-status-card-header">
          <strong>正在导出…</strong>
          <span>{{ progressPercent }}%</span>
        </header>
        <div
          class="export-progress-track"
          role="progressbar"
          :aria-valuemin="0"
          :aria-valuemax="progress?.total ?? 0"
          :aria-valuenow="progress?.processed ?? 0"
        >
          <span class="export-progress-value" :style="{ inlineSize: `${progressPercent}%` }"></span>
        </div>
        <p>{{ progressDetail }}</p>
      </article>
    </template>

    <template v-else-if="status === 'completed'">
      <article class="export-status-card export-status-card--success">
        <header class="export-status-result-header">
          <el-icon><CircleCheckFilled /></el-icon>
          <strong>{{ completionTitle }}</strong>
        </header>
        <p>{{ completionCopy }}</p>
        <button
          class="export-status-action export-status-action--success"
          type="button"
          :disabled="isOpeningDirectory"
          @click="emit('openDirectory')"
        >
          {{ isOpeningDirectory ? '正在打开…' : '打开导出目录 →' }}
        </button>
      </article>
    </template>

    <template v-else-if="status === 'failed'">
      <article class="export-status-card export-status-card--failure">
        <header class="export-status-result-header">
          <el-icon><WarningFilled /></el-icon>
          <strong>导出失败</strong>
        </header>
        <p>{{ error?.message ?? '导出未完成，请选择其他目录后重试。' }}</p>
        <button
          class="export-status-action export-status-action--failure"
          type="button"
          @click="emit('chooseDirectory')"
        >
          重新选择目录
        </button>
      </article>
    </template>

    <template v-else>
      <article class="export-status-card export-status-card--ready">
        <header class="export-status-result-header">
          <el-icon><InfoFilled /></el-icon>
          <strong>等待开始导出</strong>
        </header>
        <p>确认导出范围与目录后开始。导出不会修改原始笔记。</p>
      </article>
    </template>
  </section>
</template>

<style scoped lang="scss">
.export-status-panel {
  display: grid;
  align-content: start;
  gap: var(--space-16);
  min-inline-size: 0;
}

.export-status-card {
  display: grid;
  gap: 10px;
  padding: var(--space-16);
  border: 1px solid transparent;
  border-radius: var(--radius-10);
}

.export-status-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.6875rem;
  line-height: 1.55;
}

.export-status-card--ready,
.export-status-card--progress {
  background: var(--color-sidebar);
}

.export-status-card--success {
  border-color: color-mix(in srgb, var(--color-success) 35%, var(--color-border));
  background: color-mix(in srgb, var(--color-success) 12%, var(--color-surface));
}

.export-status-card--failure {
  border-color: color-mix(in srgb, var(--color-danger) 35%, var(--color-border));
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-surface));
}

.export-status-card-header,
.export-status-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.export-status-card-header > span {
  color: var(--color-accent-active);
  font-size: 0.6875rem;
  font-weight: 650;
}

.export-status-result-header {
  justify-content: flex-start;
}

.export-status-card--ready .el-icon {
  color: #5b7a95;
}

.export-status-card--success .el-icon,
.export-status-action--success {
  color: var(--color-success);
}

.export-status-card--failure .el-icon,
.export-status-action--failure {
  color: var(--color-danger);
}

.export-progress-track {
  block-size: 7px;
  overflow: hidden;
  border-radius: var(--radius-8);
  background: var(--color-border);
}

.export-progress-value {
  display: block;
  block-size: 100%;
  border-radius: inherit;
  background: var(--color-accent);
  transition: inline-size 160ms ease;
}

.export-status-action {
  justify-self: start;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.6875rem;
  font-weight: 650;
}

.export-status-action:disabled {
  cursor: wait;
  opacity: 0.7;
}
</style>
