<script setup lang="ts">
import { storeToRefs } from 'pinia'
import AppBootstrap from './app/AppBootstrap.vue'
import { useAppStore } from './stores/app'
import { useSettingsStore } from './stores/settings'

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const { status } = storeToRefs(appStore)
const { isLoading: isSettingsLoading } = storeToRefs(settingsStore)
</script>

<template>
  <AppBootstrap v-if="status !== 'ready' || isSettingsLoading" />
  <RouterView v-else />
</template>
