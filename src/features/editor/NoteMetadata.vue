<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { CategoryNode } from '@/types/categories'
import type { TagSummary } from '@/types/tags'

const props = defineProps<{
  categories: CategoryNode[]
  categoryId?: string
  tags: TagSummary[]
  selectedTagIds: string[]
}>()

const emit = defineEmits<{
  updateCategory: [categoryId: string | undefined]
  updateTags: [tagIds: string[]]
  createTag: [name: string]
}>()

const newTagName = shallowRef('')
const categoryOptions = computed(() => flattenCategories(props.categories))

function createTag(): void {
  const name = newTagName.value.trim()
  if (name === '') return
  emit('createTag', name)
  newTagName.value = ''
}

function flattenCategories(categories: CategoryNode[]): CategoryNode[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)])
}
</script>

<template>
  <section class="note-metadata" aria-label="笔记整理信息">
    <el-select
      class="metadata-select"
      clearable
      :model-value="categoryId"
      placeholder="未分类"
      aria-label="所属分类"
      @update:model-value="emit('updateCategory', $event || undefined)"
    >
      <el-option
        v-for="category in categoryOptions"
        :key="category.id"
        :label="category.path"
        :value="category.id"
      />
    </el-select>
    <el-select
      class="metadata-select"
      multiple
      collapse-tags
      :model-value="selectedTagIds"
      placeholder="添加标签"
      aria-label="笔记标签"
      @update:model-value="emit('updateTags', $event)"
    >
      <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
    </el-select>
    <el-input
      v-model="newTagName"
      class="new-tag-input"
      placeholder="新建标签"
      aria-label="新建标签"
      @keyup.enter="createTag"
    />
    <el-button text type="primary" @click="createTag">添加</el-button>
  </section>
</template>

<style scoped lang="scss">
.note-metadata {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-16) 0 var(--space-12);
}

.metadata-select {
  inline-size: min(220px, 32%);
}
.new-tag-input {
  inline-size: 120px;
}
</style>
