<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import ExportScopeOption from './ExportScopeOption.vue'
import { useExportStore } from '@/stores/export'
import type { ExportScope, ExportScopeOption as ExportScopeOptionType } from '@/types/export'

const props = defineProps<{
  modelValue: boolean
  scopeOptions: ExportScopeOptionType[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const exportStore = useExportStore()
const selectedScope = shallowRef<ExportScope>()
const canClose = computed(() => exportStore.status !== 'exporting')
const progressPercent = computed(() => {
  const progress = exportStore.progress
  if (progress === undefined || progress.total === 0) {
    return 0
  }
  return Math.round((progress.processed / progress.total) * 100)
})

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      selectedScope.value = props.scopeOptions[0]?.scope
      exportStore.reset()
    }
  },
)

watch(
  () => props.scopeOptions,
  (options) => {
    if (props.modelValue && exportStore.status !== 'exporting') {
      selectedScope.value = options[0]?.scope
    }
  },
)

function selectScope(scope: ExportScope): void {
  selectedScope.value = scope
}

function close(): void {
  if (canClose.value) {
    emit('update:modelValue', false)
  }
}

function startExport(): void {
  const scope = selectedScope.value
  if (scope !== undefined) {
    void exportStore.start(scope)
  }
}

function retry(): void {
  startExport()
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="导出 Markdown"
    width="min(620px, calc(100vw - 32px))"
    :close-on-click-modal="canClose"
    :close-on-press-escape="canClose"
    :show-close="canClose"
    @update:model-value="close"
  >
    <section
      v-if="exportStore.status === 'idle' || exportStore.status === 'choosing'"
      class="export-config"
    >
      <p class="export-copy">选择导出范围后，再从系统目录选择器中指定存放位置。</p>
      <div class="export-scope-list">
        <ExportScopeOption
          v-for="option in scopeOptions"
          :key="`${option.scope.kind}:${option.scope.id}`"
          :option="option"
          :selected="
            selectedScope?.kind === option.scope.kind && selectedScope.id === option.scope.id
          "
          @select="selectScope"
        />
      </div>
    </section>

    <section
      v-else-if="exportStore.status === 'exporting'"
      class="export-progress"
      aria-live="polite"
    >
      <p class="export-progress-title">正在导出 Markdown 与图片资源</p>
      <div
        class="export-progress-track"
        role="progressbar"
        :aria-valuemin="0"
        :aria-valuemax="exportStore.progress?.total ?? 0"
        :aria-valuenow="exportStore.progress?.processed ?? 0"
      >
        <span class="export-progress-bar" :style="{ inlineSize: `${progressPercent}%` }"></span>
      </div>
      <p class="export-progress-copy">
        已处理 {{ exportStore.progress?.processed ?? 0 }}／{{ exportStore.progress?.total ?? 0 }} 篇
        <template v-if="exportStore.progress?.currentTitle"
          >：{{ exportStore.progress.currentTitle }}</template
        >
      </p>
    </section>

    <section
      v-else-if="exportStore.status === 'completed'"
      class="export-result"
      aria-live="polite"
    >
      <p class="export-result-title">
        {{ exportStore.result?.cancelled ? '导出已取消，已完成的内容已保留。' : '导出已完成。' }}
      </p>
      <p class="export-result-copy">
        {{ exportStore.result?.directoryLabel }}：成功
        {{ exportStore.result?.exportedCount ?? 0 }} 篇，失败
        {{ exportStore.result?.failedCount ?? 0 }} 篇。
      </p>
      <el-scrollbar
        v-if="exportStore.result?.issues.length"
        class="export-issues"
        max-height="180px"
      >
        <ul class="export-issues-list">
          <li
            v-for="issue in exportStore.result.issues"
            :key="`${issue.code}:${issue.noteId ?? issue.title}`"
          >
            <strong>{{ issue.title }}</strong
            >：{{ issue.message }}
          </li>
        </ul>
      </el-scrollbar>
      <p v-if="exportStore.error" class="export-error" role="alert">
        {{ exportStore.error.message }}
      </p>
    </section>

    <section v-else class="export-failure" role="alert">
      <p class="export-error">{{ exportStore.error?.message }}</p>
      <p class="export-copy">未完成的笔记不会影响此前已成功写入的文件。</p>
    </section>

    <template #footer>
      <el-button
        v-if="exportStore.status === 'exporting'"
        :loading="exportStore.isCancelling"
        @click="exportStore.cancel"
      >
        取消导出
      </el-button>
      <template v-else-if="exportStore.status === 'completed'">
        <el-button :loading="exportStore.isOpeningDirectory" @click="exportStore.openDirectory">
          打开文件夹
        </el-button>
        <el-button type="primary" @click="close">完成</el-button>
      </template>
      <template v-else-if="exportStore.status === 'failed'">
        <el-button @click="close">关闭</el-button>
        <el-button type="primary" @click="retry">重新选择并导出</el-button>
      </template>
      <template v-else>
        <el-button @click="close">取消</el-button>
        <el-button
          type="primary"
          :disabled="selectedScope === undefined"
          :loading="exportStore.status === 'choosing'"
          @click="startExport"
        >
          选择位置并导出
        </el-button>
      </template>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.export-config,
.export-progress,
.export-result,
.export-failure {
  display: grid;
  gap: var(--space-12);
}

.export-copy,
.export-progress-title,
.export-progress-copy,
.export-result-title,
.export-result-copy,
.export-error {
  margin: 0;
}

.export-copy,
.export-progress-copy,
.export-result-copy {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.export-scope-list {
  display: grid;
  gap: var(--space-8);
}

.export-progress-title,
.export-result-title {
  color: var(--color-text-primary);
  font-weight: 650;
}

.export-progress-track {
  block-size: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-divider);
}

.export-progress-bar {
  display: block;
  block-size: 100%;
  border-radius: inherit;
  background: var(--color-accent);
  transition: inline-size 160ms ease;
}

.export-issues {
  border: 1px solid color-mix(in srgb, #b8892d 36%, var(--color-border));
  border-radius: var(--radius-8);
  background: color-mix(in srgb, #b8892d 8%, var(--color-surface));
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.5;
}

.export-issues-list {
  display: grid;
  gap: var(--space-8);
  margin: 0;
  padding: var(--space-12) var(--space-16);
}

.export-error {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
</style>
