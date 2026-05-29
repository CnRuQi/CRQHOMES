import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAuthStore } from '@/stores/auth'

NProgress.configure({ showSpinner: false })

const routes = [
  // 前台路由（带布局）
  {
    path: '/',
    component: () => import('@/views/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'post/:slug',
        name: 'Post',
        component: () => import('@/views/Post.vue'),
        meta: { title: '文章详情' },
      },
      {
        path: 'category/:slug',
        name: 'Category',
        component: () => import('@/views/Home.vue'),
        meta: { title: '分类' },
      },
      {
        path: 'archives',
        name: 'Archives',
        component: () => import('@/views/Archives.vue'),
        meta: { title: '归档' },
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/Search.vue'),
        meta: { title: '搜索' },
      },
    ],
  },

  // 后台路由
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/Login.vue'),
    meta: { title: '登录', guest: true },
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '仪表盘' },
      },
      {
        path: 'posts',
        name: 'AdminPosts',
        component: () => import('@/views/admin/Posts.vue'),
        meta: { title: '文章管理' },
      },
      {
        path: 'posts/create',
        name: 'PostCreate',
        component: () => import('@/views/admin/Editor.vue'),
        meta: { title: '写文章' },
      },
      {
        path: 'posts/:id/edit',
        name: 'PostEdit',
        component: () => import('@/views/admin/Editor.vue'),
        meta: { title: '编辑文章' },
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/admin/Categories.vue'),
        meta: { title: '分类管理' },
      },
    ],
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - Blog` : 'Blog'

  const authStore = useAuthStore()

  // 需要认证的路由
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
      return
    }

    // 验证 token 是否有效
    if (!authStore.user) {
      try {
        await authStore.fetchUser()
      } catch (_error) {
        next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
        return
      }
    }
  }

  // 游客路由（已登录用户不能访问）
  if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
