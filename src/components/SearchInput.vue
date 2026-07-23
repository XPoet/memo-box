<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  clear: []
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <el-input
    :model-value="modelValue"
    class="search-input"
    clearable
    placeholder="搜索标题、正文、分类或标签"
    aria-label="全局搜索关键词"
    @clear="emit('clear')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #prefix>
      <el-icon><Search /></el-icon>
    </template>
  </el-input>
</template>

<style scoped lang="scss">
.search-input :deep(.el-input__wrapper) {
  min-block-size: 48px;
  background: var(--color-canvas);
  box-shadow: 0 0 0 1px var(--color-accent) inset;
}

.search-input :deep(.el-input__prefix-inner) {
  color: var(--color-accent);
}
</style>
