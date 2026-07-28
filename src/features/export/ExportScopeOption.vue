<script setup lang="ts">
import type { ExportScopeOption as ExportScopeOptionType } from '@/types/export'

defineProps<{
  option: ExportScopeOptionType
  selected: boolean
  disabled?: boolean
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
    :disabled="disabled"
    @click="emit('select', option.scope)"
  >
    <strong class="export-scope-option-title">{{ option.title }}</strong>
  </button>
</template>

<style scoped lang="scss">
.export-scope-option {
  position: relative;
  display: grid;
  gap: 4px;
  inline-size: 100%;
  padding: var(--space-16) var(--space-16) var(--space-16) 62px;
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

.export-scope-option::before,
.export-scope-option::after {
  position: absolute;
  inset-inline-start: var(--space-16);
  inset-block-start: 50%;
  border-radius: 50%;
  content: '';
  transform: translateY(-50%);
}

.export-scope-option::before {
  inline-size: 20px;
  block-size: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.export-scope-option--selected::before {
  border-color: var(--color-accent);
  background: var(--color-accent);
}

.export-scope-option--selected::after {
  inset-inline-start: 23px;
  inline-size: 6px;
  block-size: 6px;
  background: var(--color-surface);
}

.export-scope-option:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.export-scope-option-title {
  font-size: var(--font-size-sm);
}
</style>
