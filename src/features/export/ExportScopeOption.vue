<script setup lang="ts">
import type { ExportScopeOption as ExportScopeOptionType } from '@/types/export'

defineProps<{
  option: ExportScopeOptionType
  selected: boolean
}>()

const emit = defineEmits<{
  select: [scope: ExportScopeOptionType['scope']]
}>()
</script>

<template>
  <button
    class="export-scope-option"
    :class="{ 'export-scope-option--selected': selected }"
    type="button"
    :aria-pressed="selected"
    @click="emit('select', option.scope)"
  >
    <strong class="export-scope-option-title">{{ option.title }}</strong>
    <span class="export-scope-option-description">{{ option.description }}</span>
  </button>
</template>

<style scoped lang="scss">
.export-scope-option {
  display: grid;
  gap: 4px;
  inline-size: 100%;
  padding: var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: start;
}

.export-scope-option:hover,
.export-scope-option--selected {
  border-color: color-mix(in srgb, var(--color-accent) 58%, var(--color-border));
}

.export-scope-option--selected {
  background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface));
}

.export-scope-option-title {
  font-size: var(--font-size-sm);
}

.export-scope-option-description {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
