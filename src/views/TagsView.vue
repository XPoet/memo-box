<script setup lang="ts">
import { Delete, EditPen, Plus, Search, View } from '@element-plus/icons-vue'
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ManagementLayout from '@/layouts/ManagementLayout.vue'
import { createTag, deleteTag, mergeTag, renameTag } from '@/services/tags'
import { useCategoriesStore } from '@/stores/categories'
import { useTagsStore } from '@/stores/tags'
import type { TagSummary } from '@/types/tags'

const categoriesStore = useCategoriesStore()
const tagsStore = useTagsStore()
const router = useRouter()
const query = shallowRef('')
const isSubmitting = shallowRef(false)
const selectedTagIds = shallowRef<string[]>([])
const visibleTags = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase()
  if (keyword === '') {
    return tagsStore.tags
  }
  return tagsStore.tags.filter((tag) => tag.name.toLocaleLowerCase().includes(keyword))
})
const tagStats = computed(() => [
  { label: '标签总数', value: tagsStore.tags.length },
  { label: '已关联标签', value: tagsStore.tags.filter((tag) => tag.noteCount > 0).length },
  { label: '未关联标签', value: tagsStore.tags.filter((tag) => tag.noteCount === 0).length },
])

async function promptAddTag(): Promise<void> {
  let value: string
  try {
    ;({ value } = await ElMessageBox.prompt('输入标签名称。', '新建标签', {
      confirmButtonText: '创建',
      cancelButtonText: '取消',
    }))
  } catch {
    return
  }
  isSubmitting.value = true
  try {
    await createTag(value)
    await tagsStore.load()
  } finally {
    isSubmitting.value = false
  }
}

async function rename(tag: TagSummary): Promise<void> {
  let value: string
  try {
    ;({ value } = await ElMessageBox.prompt('输入新的标签名称。', `重命名「${tag.name}」`, {
      inputValue: tag.name,
      confirmButtonText: '保存',
      cancelButtonText: '取消',
    }))
  } catch {
    return
  }
  isSubmitting.value = true
  try {
    const result = await renameTag(tag.id, value)
    if (result.mergePreview) {
      const shouldMerge = await ElMessageBox.confirm(
        `目标标签已存在，将合并 ${result.mergePreview.affectedNoteCount} 条笔记的关联。是否继续？`,
        '确认合并标签',
        { confirmButtonText: '合并', cancelButtonText: '取消', type: 'warning' },
      )
        .then(() => true)
        .catch(() => false)
      if (!shouldMerge) {
        return
      }
      await mergeTag(result.mergePreview.sourceId, result.mergePreview.targetId)
    }
    await tagsStore.load()
  } finally {
    isSubmitting.value = false
  }
}

async function remove(tag: TagSummary): Promise<void> {
  const shouldRemove = await ElMessageBox.confirm(
    `删除标签「${tag.name}」只会解除关联，不会删除笔记。是否继续？`,
    '确认删除标签',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
  )
    .then(() => true)
    .catch(() => false)
  if (!shouldRemove) {
    return
  }
  isSubmitting.value = true
  try {
    await deleteTag(tag.id)
    ElMessage.success('标签已删除。')
    selectedTagIds.value = selectedTagIds.value.filter((id) => id !== tag.id)
    await tagsStore.load()
  } finally {
    isSubmitting.value = false
  }
}

function viewNotes(tag: TagSummary): void {
  void router.push({ name: 'workbench', query: { tags: tag.id } })
}

function viewSelectedNotes(): void {
  if (selectedTagIds.value.length > 0) {
    void router.push({ name: 'workbench', query: { tags: selectedTagIds.value.join(',') } })
  }
}

function createNoteFromSidebar(): void {
  void router.push({ name: 'workbench', query: { create: '1' } })
}

onMounted(() => {
  void Promise.all([tagsStore.load(), categoriesStore.load()])
})
</script>

<template>
  <ManagementLayout
    title="标签管理"
    description="标签可重复用于多条笔记；多标签筛选默认同时满足全部标签。"
    :categories="categoriesStore.categories"
    :tag-count="tagsStore.tags.length"
    @create="createNoteFromSidebar"
  >
    <template #action>
      <el-button type="primary" :loading="isSubmitting" @click="promptAddTag">
        <el-icon><Plus /></el-icon>
        新建标签
      </el-button>
    </template>

    <p v-if="tagsStore.error" class="management-error" role="alert">
      {{ tagsStore.error.message }}
    </p>
    <template v-else>
      <section class="tag-stats" aria-label="标签统计">
        <article v-for="stat in tagStats" :key="stat.label" class="tag-stat-card">
          <p>{{ stat.label }}</p>
          <strong>{{ stat.value }}</strong>
        </article>
      </section>

      <section class="tag-toolbar" aria-label="标签工具">
        <el-input v-model="query" class="tag-search" placeholder="搜索标签" aria-label="搜索标签">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button :disabled="selectedTagIds.length === 0" @click="viewSelectedNotes">
          查看已选笔记
        </el-button>
      </section>

      <el-empty
        v-if="!tagsStore.isLoading && visibleTags.length === 0"
        class="tag-empty"
        :description="query.trim() === '' ? '还没有标签' : '暂无匹配标签'"
      />
      <el-checkbox-group
        v-else
        v-model="selectedTagIds"
        class="tag-table-wrap"
        aria-label="标签列表"
      >
        <el-table :data="visibleTags" class="tag-table">
          <el-table-column label="选择" width="72">
            <template #default="{ row }">
              <el-checkbox :value="row.id" :aria-label="`选择标签 ${row.name}`" />
            </template>
          </el-table-column>
          <el-table-column label="标签" min-width="220">
            <template #default="{ row }">
              <span class="tag-name"><i aria-hidden="true"></i>{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="关联笔记" min-width="150">
            <template #default="{ row }">
              <span class="tag-note-count">{{ row.noteCount }} 篇笔记</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="260" align="right">
            <template #default="{ row }">
              <div class="tag-row-actions">
                <el-button text size="small" @click="viewNotes(row)">
                  <el-icon><View /></el-icon>
                  查看
                </el-button>
                <el-button text size="small" :disabled="isSubmitting" @click="rename(row)">
                  <el-icon><EditPen /></el-icon>
                  重命名
                </el-button>
                <el-button
                  text
                  type="danger"
                  size="small"
                  :disabled="isSubmitting"
                  @click="remove(row)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-checkbox-group>
    </template>
  </ManagementLayout>
</template>

<style scoped lang="scss">
.management-error,
.tag-stat-card p {
  margin: 0;
}

.management-error {
  color: var(--color-danger);
}

.tag-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-12);
}

.tag-stat-card {
  min-block-size: 84px;
  padding: var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-10);
  background: var(--color-surface);
}

.tag-stat-card p {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.tag-stat-card strong {
  display: block;
  margin-block-start: var(--space-8);
  color: var(--color-text-primary);
  font-family: 'Geist Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 1.5rem;
  font-weight: 500;
}

.tag-toolbar {
  display: flex;
  gap: var(--space-12);
  margin-block: var(--space-16);
}

.tag-search {
  max-inline-size: 380px;
}

.tag-search :deep(.el-input__wrapper) {
  min-block-size: 38px;
  background: var(--color-surface);
  box-shadow: 0 0 0 1px var(--color-border) inset;
}

.tag-empty,
.tag-table-wrap {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-10);
  background: var(--color-surface);
}

.tag-empty {
  min-block-size: 320px;
}

.tag-table-wrap {
  display: block;
  overflow: auto;
}

.tag-table {
  --el-table-border-color: var(--color-divider);
  --el-table-header-bg-color: var(--color-surface);
  --el-table-row-hover-bg-color: var(--color-canvas);
  --el-table-bg-color: var(--color-surface);
  --el-table-tr-bg-color: var(--color-surface);
  --el-fill-color-lighter: var(--color-canvas);
  color: var(--color-text-primary);
}

.tag-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.tag-table :deep(.el-table__header-wrapper th.el-table__cell) {
  block-size: 42px;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  font-weight: 600;
}

.tag-table :deep(.el-table__body-wrapper td.el-table__cell) {
  block-size: 56px;
  color: var(--color-text-primary);
  font-size: 0.8125rem;
}

.tag-name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  color: var(--color-text-primary);
  font-weight: 600;
}

.tag-name i {
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  background: var(--color-accent);
}

.tag-note-count {
  color: var(--color-text-secondary);
}

.tag-row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .tag-stats {
    grid-template-columns: 1fr;
  }

  .tag-row-actions .el-button span {
    display: none;
  }
}
</style>
