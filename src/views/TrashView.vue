<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { emptyTrash, permanentlyDeleteNote, restoreNote } from '@/services/trash'
import { useTrashStore } from '@/stores/trash'

const trashStore = useTrashStore()
const isSubmitting = shallowRef(false)

function titleOf(title: string, preview: string): string {
  return title.trim() || preview || '无标题笔记'
}

async function restore(id: string): Promise<void> {
  isSubmitting.value = true
  try {
    const result = await restoreNote(id)
    ElMessage.success(
      result.restoredToUncategorized ? '原分类已不存在，笔记已恢复到未分类。' : '笔记已恢复。',
    )
    await trashStore.load()
  } finally {
    isSubmitting.value = false
  }
}

async function permanentlyDelete(id: string): Promise<void> {
  await ElMessageBox.confirm('永久删除后无法恢复，是否继续？', '确认永久删除', {
    confirmButtonText: '永久删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
  isSubmitting.value = true
  try {
    const result = await permanentlyDeleteNote(id)
    ElMessage.success(
      result.pendingFileCleanupCount > 0
        ? '笔记已永久删除，少量资源文件将在后续自动清理。'
        : '笔记已永久删除。',
    )
    await trashStore.load()
  } finally {
    isSubmitting.value = false
  }
}

async function clearTrash(): Promise<void> {
  await ElMessageBox.confirm(
    '将永久删除回收站内的全部笔记，且无法恢复。是否继续？',
    '确认清空回收站',
    { confirmButtonText: '清空回收站', cancelButtonText: '取消', type: 'warning' },
  )
  isSubmitting.value = true
  try {
    const result = await emptyTrash()
    ElMessage.success(
      result.pendingFileCleanupCount > 0
        ? '回收站已清空，少量资源文件将在后续自动清理。'
        : '回收站已清空。',
    )
    await trashStore.load()
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void trashStore.load()
})
</script>

<template>
  <main class="management-view">
    <header class="management-header">
      <div>
        <p class="management-eyebrow">整理</p>
        <h1 class="management-title">回收站</h1>
        <p class="management-copy">删除的笔记会一直保留在这里，直到你手动永久删除。</p>
      </div>
      <el-button
        type="danger"
        :disabled="trashStore.notes.length === 0 || isSubmitting"
        @click="clearTrash"
        >清空回收站</el-button
      >
    </header>
    <p v-if="trashStore.error" class="management-error" role="alert">
      {{ trashStore.error.message }}
    </p>
    <el-empty
      v-else-if="!trashStore.isLoading && trashStore.notes.length === 0"
      description="回收站为空"
    />
    <section v-else class="trash-list" aria-label="已删除笔记">
      <article v-for="note in trashStore.notes" :key="note.id" class="trash-item">
        <div>
          <h2 class="trash-title">{{ titleOf(note.title, note.contentPreview) }}</h2>
          <p class="trash-preview">{{ note.contentPreview || '没有正文内容' }}</p>
          <p class="trash-meta">
            删除于 {{ new Date(note.deletedAt).toLocaleString()
            }}{{ note.trashedFromCategoryPath ? ` · 原分类：${note.trashedFromCategoryPath}` : '' }}
          </p>
        </div>
        <div class="trash-actions">
          <el-button :loading="isSubmitting" @click="restore(note.id)">恢复</el-button>
          <el-button type="danger" plain :loading="isSubmitting" @click="permanentlyDelete(note.id)"
            >永久删除</el-button
          >
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped lang="scss">
.management-view {
  min-block-size: 100vh;
  padding: var(--space-32);
  background: var(--color-canvas);
}
.management-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-24);
  align-items: flex-start;
}
.management-eyebrow,
.management-title,
.management-copy,
.management-error,
.trash-title,
.trash-preview,
.trash-meta {
  margin: 0;
}
.management-eyebrow {
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.management-title {
  margin-block-start: var(--space-4);
  color: var(--color-text-primary);
}
.management-copy,
.trash-preview,
.trash-meta {
  margin-block-start: var(--space-8);
  color: var(--color-text-secondary);
}
.management-error {
  margin-block: var(--space-16);
  color: var(--color-danger);
}
.trash-list {
  display: grid;
  gap: var(--space-12);
  margin-block-start: var(--space-24);
}
.trash-item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-24);
  padding: var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-10);
  background: var(--color-surface);
}
.trash-title {
  color: var(--color-text-primary);
  font-size: 1rem;
}
.trash-meta {
  font-size: var(--font-size-sm);
}
.trash-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--space-8);
}
</style>
