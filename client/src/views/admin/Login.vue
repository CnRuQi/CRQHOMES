<template>
  <main class="login-page">
    <div class="login-container" data-aos="fade-up">
      <div class="login-card glass-card">
        <div class="login-header">
          <h1 class="login-title">
            <Icon name="logo" :size="40" />
            披花沐雪
          </h1>
          <p class="login-subtitle">管理后台登录</p>
        </div>

        <div v-if="offlineNotice" class="offline-notice">
          {{ offlineNotice }}
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-username" class="form-label">用户名</label>
            <input
              id="login-username"
              v-model="form.username"
              type="text"
              class="form-input glass-input"
              placeholder="请输入用户名"
              autocomplete="username"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="login-password" class="form-label">密码</label>
            <input
              id="login-password"
              v-model="form.password"
              type="password"
              class="form-input glass-input"
              placeholder="请输入密码"
              autocomplete="current-password"
              required
            />
          </div>

          <div v-if="error" class="error-message" role="alert">
            {{ error }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-lg login-btn"
            :disabled="loading"
            :aria-busy="loading"
          >
            <span v-if="loading" class="spinner-sm"></span>
            <span v-else>登 录</span>
          </button>
        </form>

        <div class="login-footer">
          <router-link to="/" class="back-link">← 返回首页</router-link>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Icon from '@/components/Icon.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: '',
})

const loading = ref(false)
const error = ref('')

// 由路由守卫带上：不是「请重新登录」，而是后端暂时连不上
const offlineNotice = computed(() =>
  route.query.reason === 'offline' ? '无法连接服务器，请稍后重试' : ''
)

async function handleLogin() {
  loading.value = true
  error.value = ''

  // 用户已开始尝试，离线提示不再有意义，顺手把标记从地址栏摘掉
  if (route.query.reason) {
    router.replace({ query: { redirect: route.query.redirect } })
  }

  try {
    await authStore.login(form.value.username, form.value.password)
    // redirect 仅允许站内路径（以 / 开头且非协议相对 //），防开放重定向
    const rawRedirect = route.query.redirect
    const redirect =
      typeof rawRedirect === 'string' &&
      rawRedirect.startsWith('/') &&
      !rawRedirect.startsWith('//')
        ? rawRedirect
        : '/admin'
    router.push(redirect)
  } catch (err) {
    error.value = err.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: var(--spacing-lg);
}

.login-card {
  padding: var(--spacing-2xl);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.login-subtitle {
  color: var(--text-muted);
  margin-top: var(--spacing-sm);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.error-message {
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(179, 143, 143, 0.1);
  border: 1px solid rgba(179, 143, 143, 0.2);
  border-radius: var(--border-radius-sm);
  color: var(--color-danger);
  font-size: 0.9rem;
}

.offline-notice {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: color-mix(in srgb, var(--color-warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warning) 34%, transparent);
  border-radius: var(--border-radius-sm);
  color: var(--color-warning);
  font-size: 0.9rem;
}

.login-btn {
  width: 100%;
  margin-top: var(--spacing-sm);
}

.spinner-sm {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.login-footer {
  text-align: center;
  margin-top: var(--spacing-xl);
}

.back-link {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.back-link:hover {
  color: var(--color-primary-light);
}

@media (max-width: 768px) {
  .login-page {
    padding: 0 var(--spacing-md);
    align-items: flex-start;
    padding-top: calc(var(--spacing-2xl) + env(safe-area-inset-top, 0px));
  }

  .login-container {
    padding: 0;
  }

  .login-card {
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .login-title {
    font-size: 1.6rem;
  }

  .login-btn {
    min-height: 48px;
  }
}
</style>
