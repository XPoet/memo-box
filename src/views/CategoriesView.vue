<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createCategory,
  deleteCategory,
  getCategoryDeleteImpact,
  moveCategory,
  renameCategory,
} from '@/services/categories'
import { useCategoriesStore } from '@/stores/categories'
import type { CategoryNode } from '@/types/categories'

const categoriesStore = useCategoriesStore()
const router = useRouter()
const selectedCategory = shallowRef<CategoryNode>()
const isSubmitting = shallowRef(false)

async function addCategory(parent?: CategoryNode): Promise<void> {
  if (parent?.level === 5) return
  const { value } = await ElMessageBox.prompt(
    '输入分类名称。',
    parent ? `在「${parent.name}」下新建分类` : '新建根分类',
    { confirmButtonText: '创建', cancelButtonText: '取消' },
  )
  isSubmitting.value = true
  try {
    await createCategory(value, parent?.id)
    await categoriesStore.load()
  } finally {
    isSubmitting.value = false
  }
}

async function rename(category: CategoryNode): Promise<void> {
  const { value } = await ElMessageBox.prompt('输入新的分类名称。', `重命名「${category.name}」`, {
    inputValue: category.name,
    confirmButtonText: '保存',
    cancelButtonText: '取消',
  })
  isSubmitting.value = true
  try {
    await renameCategory(category.id, value)
    await categoriesStore.load()
  } finally {
    isSubmitting.value = false
  }
}

async function remove(category: CategoryNode): Promise<void> {
  const impact = await getCategoryDeleteImpact(category.id)
  const action = await ElMessageBox.confirm(
    `直属笔记 ${impact.directNoteCount} 条，子分类 ${impact.childCategoryCount} 个，分支内笔记共 ${impact.branchNoteCount} 条。选择“仅删除当前分类”会提升直属内容；选择“删除整个分支”会将分支笔记移入回收站。`,
    `删除「${category.name}」`,
    {
      confirmButtonText: '仅删除当前分类',
      cancelButtonText: '取消',
      distinguishCancelAndClose: true,
      type: 'warning',
    },
  )
    .then(() => 'current' as const)
    .catch(() => undefined)
  if (action === undefined) return
  const mode = await ElMessageBox.confirm(
    '是否改为删除整个分类分支？选择“继续”会移入回收站；选择“取消”将仅删除当前分类。',
    '删除方式',
    {
      confirmButtonText: '删除整个分支',
      cancelButtonText: '仅删除当前分类',
      distinguishCancelAndClose: true,
      type: 'warning',
    },
  )
    .then(() => 'branch' as const)
    .catch(() => 'current' as const)
  isSubmitting.value = true
  try {
    await deleteCategory(category.id, mode)
    selectedCategory.value = undefined
    await categoriesStore.load()
  } finally {
    isSubmitting.value = false
  }
}

async function handleDrop(
  draggingNode: { data: CategoryNode },
  dropNode: { data: CategoryNode },
  dropType: 'before' | 'after' | 'inner',
): Promise<void> {
  const parentId = dropType === 'inner' ? dropNode.data.id : dropNode.data.parentId
  if (draggingNode.data.id === parentId) return
  const orderedIds = categoryChildren(parentId)
    .filter((category) => category.id !== draggingNode.data.id)
    .map((category) => category.id)
  const targetIndex =
    dropType === 'inner' ? orderedIds.length : orderedIds.indexOf(dropNode.data.id)
  orderedIds.splice(dropType === 'after' ? targetIndex + 1 : targetIndex, 0, draggingNode.data.id)
  isSubmitting.value = true
  try {
    await moveCategory(draggingNode.data.id, parentId, orderedIds)
    await categoriesStore.load()
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '分类移动失败。')
    await categoriesStore.load()
  } finally {
    isSubmitting.value = false
  }
}

function categoryChildren(parentId?: string): CategoryNode[] {
  if (parentId === undefined) return categoriesStore.categories
  return (
    flattenCategories(categoriesStore.categories).find((category) => category.id === parentId)
      ?.children ?? []
  )
}

function flattenCategories(categories: CategoryNode[]): CategoryNode[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)])
}

function viewNotes(category: CategoryNode): void {
  void router.push({ name: 'workbench', query: { category: category.id } })
}

onMounted(() => {
  void categoriesStore.load()
})
</script>

<template>
  <main class="management-view">
    <header class="management-header">
      <div>
        <p class="management-eyebrow">整理</p>
        <h1 class="management-title">分类管理</h1>
        <p class="management-copy">最多五级，可拖拽移动到其他分类下；同级分类名称不可重复。</p>
      </div>
      <el-button type="primary" :loading="isSubmitting" @click="addCategory()"
        >新建根分类</el-button
      >
    </header>
    <p v-if="categoriesStore.error" class="management-error" role="alert">
      {{ categoriesStore.error.message }}
    </p>
    <el-empty
      v-else-if="!categoriesStore.isLoading && categoriesStore.categories.length === 0"
      description="还没有分类"
      ><el-button type="primary" @click="addCategory()">新建根分类</el-button></el-empty
    >
    <section v-else class="category-panel" aria-label="分类树">
      <el-tree
        :data="categoriesStore.categories"
        node-key="id"
        draggable
        default-expand-all
        :expand-on-click-node="false"
        :allow-drop="(_dragging, _drop, type) => type !== 'inner' || _drop.data.level < 5"
        @node-click="selectedCategory = $event"
        @node-drop="handleDrop"
        ><template #default="{ data }"
          ><div class="category-node">
            <span class="category-node-name"
              >{{ data.name }} <small>({{ data.noteCount }})</small></span
            ><span class="category-node-actions"
              ><el-button text size="small" @click.stop="viewNotes(data)">查看笔记</el-button
              ><el-button
                text
                size="small"
                :disabled="isSubmitting || data.level >= 5"
                @click.stop="addCategory(data)"
                >子分类</el-button
              ><el-button text size="small" :disabled="isSubmitting" @click.stop="rename(data)"
                >重命名</el-button
              ><el-button
                text
                type="danger"
                size="small"
                :disabled="isSubmitting"
                @click.stop="remove(data)"
                >删除</el-button
              ></span
            >
          </div></template
        ></el-tree
      >
    </section>
    <p v-if="selectedCategory" class="selected-path">当前选择：{{ selectedCategory.path }}</p>
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
.selected-path {
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
.selected-path {
  margin-block-start: var(--space-8);
  color: var(--color-text-secondary);
}
.management-error {
  margin-block: var(--space-16);
  color: var(--color-danger);
}
.category-panel {
  max-inline-size: 760px;
  margin-block-start: var(--space-24);
  padding: var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-10);
  background: var(--color-surface);
}
.category-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  inline-size: 100%;
  gap: var(--space-16);
}
.category-node-name {
  color: var(--color-text-primary);
}
.category-node-name small {
  color: var(--color-text-secondary);
}
.category-node-actions {
  display: flex;
}
.selected-path {
  font-size: var(--font-size-sm);
}
</style>
