import { createRouter, createWebHashHistory } from 'vue-router'
import WorkbenchView from '@/views/WorkbenchView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import TagsView from '@/views/TagsView.vue'
import TrashView from '@/views/TrashView.vue'
import SearchView from '@/views/SearchView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'workbench',
      component: WorkbenchView,
    },
    { path: '/categories', name: 'categories', component: CategoriesView },
    { path: '/tags', name: 'tags', component: TagsView },
    { path: '/trash', name: 'trash', component: TrashView },
    { path: '/search', name: 'search', component: SearchView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

export default router
