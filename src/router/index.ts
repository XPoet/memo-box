import { createRouter, createWebHashHistory } from 'vue-router'
import WorkbenchView from '@/views/WorkbenchView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import TagsView from '@/views/TagsView.vue'
import TrashView from '@/views/TrashView.vue'

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
  ],
})

export default router
