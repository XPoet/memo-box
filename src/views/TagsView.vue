<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createTag, deleteTag, mergeTag, renameTag } from '@/services/tags'
import { useTagsStore } from '@/stores/tags'
import type { TagSummary } from '@/types/tags'

const tagsStore = useTagsStore()
const router = useRouter()
const query = shallowRef('')
const newTagName = shallowRef('')
const isSubmitting = shallowRef(false)
const selectedTagIds = shallowRef<string[]>([])
const visibleTags = computed(() =>
  tagsStore.tags.filter((tag) =>
    tag.name.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase()),
  ),
)

async function addTag(): Promise<void> {
  if (newTagName.value.trim() === '') return
  isSubmitting.value = true
  try {
    await createTag(newTagName.value)
    newTagName.value = ''
    await tagsStore.load()
  } finally {
    isSubmitting.value = false
  }
}
async function rename(tag: TagSummary): Promise<void> {
  const { value } = await ElMessageBox.prompt('输入新的标签名称。', `重命名「${tag.name}」`, {
    inputValue: tag.name,
    confirmButtonText: '保存',
    cancelButtonText: '取消',
  })
  isSubmitting.value = true
  try {
    const result = await renameTag(tag.id, value)
    if (result.mergePreview) {
      await ElMessageBox.confirm(
        `目标标签已存在，将合并 ${result.mergePreview.affectedNoteCount} 条笔记的关联。是否继续？`,
        '确认合并标签',
        { confirmButtonText: '合并', cancelButtonText: '取消', type: 'warning' },
      )
      await mergeTag(result.mergePreview.sourceId, result.mergePreview.targetId)
    }
    await tagsStore.load()
  } finally {
    isSubmitting.value = false
  }
}
async function remove(tag: TagSummary): Promise<void> {
  await ElMessageBox.confirm(
    `删除标签「${tag.name}」只会解除关联，不会删除笔记。是否继续？`,
    '确认删除标签',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
  )
  isSubmitting.value = true
  try {
    await deleteTag(tag.id)
    ElMessage.success('标签已删除。')
    await tagsStore.load()
  } finally {
    isSubmitting.value = false
  }
}
function viewNotes(tag: TagSummary): void {
  void router.push({ name: 'workbench', query: { tags: tag.id } })
}
function viewSelectedNotes(): void {
  if (selectedTagIds.value.length > 0)
    void router.push({ name: 'workbench', query: { tags: selectedTagIds.value.join(',') } })
}
onMounted(() => {
  void tagsStore.load()
})
</script>

<template>
  <main class="management-view">
    <header class="management-header">
      <div>
        <p class="management-eyebrow">整理</p>
        <h1 class="management-title">标签管理</h1>
        <p class="management-copy">标签可重复用于多条笔记，筛选时默认同时满足全部标签。</p>
      </div>
    </header>
    <section class="tag-toolbar" aria-label="标签操作">
      <el-input
        v-model="newTagName"
        placeholder="新标签名称"
        aria-label="新标签名称"
        @keyup.enter="addTag"
      /><el-button type="primary" :loading="isSubmitting" @click="addTag">新建标签</el-button
      ><el-input
        v-model="query"
        class="tag-search"
        placeholder="搜索标签"
        aria-label="搜索标签"
      /><el-button :disabled="selectedTagIds.length === 0" @click="viewSelectedNotes"
        >筛选已选标签</el-button
      >
    </section>
    <p v-if="tagsStore.error" class="management-error" role="alert">
      {{ tagsStore.error.message }}
    </p>
    <el-empty
      v-else-if="!tagsStore.isLoading && visibleTags.length === 0"
      description="暂无匹配标签"
    />
    <el-checkbox-group v-else v-model="selectedTagIds" class="tag-list" aria-label="标签列表"
      ><article v-for="tag in visibleTags" :key="tag.id" class="tag-item">
        <div class="tag-main">
          <el-checkbox :value="tag.id" :aria-label="`选择标签 ${tag.name}`" />
          <div>
            <h2 class="tag-name">{{ tag.name }}</h2>
            <p class="tag-count">关联 {{ tag.noteCount }} 条笔记</p>
          </div>
        </div>
        <div>
          <el-button text @click="viewNotes(tag)">查看笔记</el-button
          ><el-button text :disabled="isSubmitting" @click="rename(tag)">重命名／合并</el-button
          ><el-button text type="danger" :disabled="isSubmitting" @click="remove(tag)"
            >删除</el-button
          >
        </div>
      </article></el-checkbox-group
    >
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
.tag-name,
.tag-count {
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
.tag-count {
  margin-block-start: var(--space-8);
  color: var(--color-text-secondary);
}
.management-error {
  margin-block: var(--space-16);
  color: var(--color-danger);
}
.tag-toolbar {
  display: flex;
  gap: var(--space-8);
  max-inline-size: 760px;
  margin-block-start: var(--space-24);
}
.tag-search {
  margin-inline-start: auto;
}
.tag-list {
  display: grid;
  gap: var(--space-8);
  margin-block-start: var(--space-20);
}
.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  padding: var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-10);
  background: var(--color-surface);
}
.tag-main {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}
.tag-name {
  color: var(--color-text-primary);
  font-size: 1rem;
}
.tag-count {
  font-size: var(--font-size-sm);
}
</style>
