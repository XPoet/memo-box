<script setup lang="ts">
import {
  Clock,
  Delete,
  Document,
  Folder,
  Plus,
  PriceTag,
  Search,
  Setting,
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { CategoryNode } from '@/types/categories'

const props = defineProps<{
  categories: CategoryNode[]
  tagCount?: number
  trashCount?: number
  showCategoryCounts?: boolean
}>()

const emit = defineEmits<{
  create: []
}>()

const route = useRoute()
const activeRouteName = computed(() => route.name)
const visibleCategories = computed(() => flattenCategories(props.categories))
const isRecentView = computed(
  () => activeRouteName.value === 'workbench' && route.query.sort === 'updated',
)

function isActive(
  name: 'workbench' | 'categories' | 'tags' | 'trash' | 'search' | 'settings',
): boolean {
  return activeRouteName.value === name
}

function categoryIndent(category: CategoryNode): { paddingInlineStart: string } {
  return { paddingInlineStart: `${8 + (category.level - 1) * 14}px` }
}

function flattenCategories(categories: CategoryNode[]): CategoryNode[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)])
}
</script>

<template>
  <div class="app-sidebar">
    <div class="sidebar-brand-group">
      <RouterLink class="sidebar-brand" to="/" aria-label="返回全部笔记">
        <span class="sidebar-brand-mark" aria-hidden="true">M</span>
        <span>
          <strong class="sidebar-brand-name">MemoBox</strong>
          <small class="sidebar-brand-copy">本地 Markdown 笔记</small>
        </span>
      </RouterLink>
      <el-button class="sidebar-create-button" type="primary" @click="emit('create')">
        <el-icon><Plus /></el-icon>
        新建笔记
      </el-button>
    </div>

    <nav class="sidebar-nav" aria-label="主导航">
      <RouterLink
        class="sidebar-nav-item"
        :class="{ 'sidebar-nav-item--active': isActive('workbench') && !isRecentView }"
        to="/"
      >
        <el-icon><Document /></el-icon>
        <span>全部笔记</span>
      </RouterLink>
      <RouterLink
        class="sidebar-nav-item"
        :class="{ 'sidebar-nav-item--active': isRecentView }"
        :to="{ name: 'workbench', query: { sort: 'updated' } }"
      >
        <el-icon><Clock /></el-icon>
        <span>最近编辑</span>
      </RouterLink>
      <RouterLink
        class="sidebar-nav-item"
        :class="{ 'sidebar-nav-item--active': isActive('search') }"
        to="/search"
      >
        <el-icon><Search /></el-icon>
        <span>全局搜索</span>
      </RouterLink>
      <RouterLink
        class="sidebar-nav-item"
        :class="{ 'sidebar-nav-item--active': isActive('tags') }"
        to="/tags"
      >
        <el-icon><PriceTag /></el-icon>
        <span>标签</span>
        <small v-if="tagCount !== undefined" class="sidebar-nav-count">{{ tagCount }}</small>
      </RouterLink>
      <RouterLink
        class="sidebar-nav-item"
        :class="{ 'sidebar-nav-item--active': isActive('trash') }"
        to="/trash"
      >
        <el-icon><Delete /></el-icon>
        <span>回收站</span>
        <small v-if="trashCount !== undefined" class="sidebar-nav-count">{{ trashCount }}</small>
      </RouterLink>
    </nav>

    <section class="sidebar-categories" aria-label="分类导航">
      <div class="sidebar-categories-heading">
        <span>分类</span>
        <RouterLink
          class="sidebar-categories-manage"
          :class="{ 'sidebar-categories-manage--active': isActive('categories') }"
          to="/categories"
          aria-label="管理分类"
        >
          <el-icon><Setting /></el-icon>
        </RouterLink>
      </div>
      <div v-if="visibleCategories.length > 0" class="sidebar-category-tree">
        <RouterLink
          v-for="category in visibleCategories"
          :key="category.id"
          class="sidebar-category-item"
          :style="categoryIndent(category)"
          :to="{ name: 'workbench', query: { category: category.id } }"
        >
          <el-icon><Folder /></el-icon>
          <span class="sidebar-category-name">{{ category.name }}</span>
          <small v-if="showCategoryCounts !== false" class="sidebar-nav-count">{{
            category.noteCount
          }}</small>
        </RouterLink>
      </div>
      <p v-else class="sidebar-category-empty">暂无分类</p>
    </section>

    <RouterLink
      class="sidebar-nav-item sidebar-settings-item"
      :class="{ 'sidebar-nav-item--active': isActive('settings') }"
      to="/settings"
    >
      <el-icon><Setting /></el-icon>
      <span>设置</span>
    </RouterLink>
  </div>
</template>

<style scoped lang="scss">
.app-sidebar {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 18px;
  block-size: 100%;
  min-block-size: 0;
  padding: 18px 14px;
  overflow: hidden;
  background: var(--color-sidebar);
}

.sidebar-brand-group {
  display: grid;
  gap: 14px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.sidebar-brand-mark {
  display: grid;
  inline-size: 30px;
  block-size: 30px;
  place-items: center;
  border-radius: var(--radius-8);
  background: var(--color-accent);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 750;
}

.sidebar-brand-name,
.sidebar-brand-copy {
  display: block;
}

.sidebar-brand-name {
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  line-height: 1.2;
}

.sidebar-brand-copy {
  margin-block-start: 3px;
  color: var(--color-text-muted);
  font-size: 0.625rem;
  line-height: 1.2;
}

.sidebar-create-button {
  inline-size: 100%;
  block-size: 36px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.sidebar-nav,
.sidebar-category-tree {
  display: grid;
  gap: 4px;
}

.sidebar-nav-item,
.sidebar-category-item {
  display: flex;
  align-items: center;
  min-inline-size: 0;
  min-block-size: 36px;
  gap: 10px;
  padding: 0 10px;
  border-radius: var(--radius-8);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  text-decoration: none;
}

.sidebar-nav-item .el-icon,
.sidebar-category-item .el-icon {
  flex: 0 0 auto;
  font-size: 1rem;
}

.sidebar-nav-item--active {
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: 650;
}

.sidebar-nav-item:hover,
.sidebar-category-item:hover {
  background: color-mix(in srgb, var(--color-surface) 76%, transparent);
}

.sidebar-settings-item {
  align-self: end;
}

.sidebar-nav-count {
  margin-inline-start: auto;
  color: var(--color-text-muted);
  font-family: 'Geist Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 0.625rem;
  font-weight: 400;
}

.sidebar-categories {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-block-size: 0;
  gap: 6px;
}

.sidebar-categories-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-block-size: 30px;
  padding-inline: 8px;
  border-radius: var(--radius-8);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.75rem;
  font-weight: 650;
}

.sidebar-categories-manage {
  display: grid;
  place-items: center;
  color: var(--color-text-secondary);
}

.sidebar-categories-manage .el-icon {
  font-size: 0.875rem;
}

.sidebar-categories-manage--active {
  color: var(--color-accent-active);
}

.sidebar-category-tree {
  align-content: start;
  overflow: auto;
}

.sidebar-category-item {
  min-block-size: 30px;
  gap: 8px;
  font-size: 0.75rem;
}

.sidebar-category-item .el-icon {
  color: var(--color-accent);
  font-size: 0.875rem;
}

.sidebar-category-name {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-category-empty {
  margin: 0;
  padding: 6px 8px;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

@media (max-width: 1100px) {
  .app-sidebar {
    padding-inline: var(--space-8);
  }

  .sidebar-brand {
    justify-content: center;
  }

  .sidebar-brand > span:last-child,
  .sidebar-create-button > :not(.el-icon),
  .sidebar-nav-item > span,
  .sidebar-nav-count,
  .sidebar-categories-heading > span,
  .sidebar-category-name,
  .sidebar-category-empty {
    display: none;
  }

  .sidebar-create-button {
    padding-inline: 0;
  }

  .sidebar-nav-item,
  .sidebar-category-item {
    justify-content: center;
    padding-inline: 0;
  }

  .sidebar-category-item {
    padding-inline-start: 0 !important;
  }

  .sidebar-categories-heading {
    justify-content: center;
  }
}
</style>
