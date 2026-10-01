<template>
  <main class="login-page">
    <div class="login-container" data-reveal="up">
      <div class="login-card glass-card">
        <div class="login-header">
          <p class="login-eyebrow">Admin</p>
          <h1 class="login-title">
            <Icon name="logo" :size="36" />
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
/* ============================================================
   登录：一张落在砚池里的纸。
   背景不是纯色，而是极淡的双晕——为的是不做「居中卡片」模板脸。
   ============================================================ */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--space-6);
  background:
    radial-gradient(
      120% 90% at 18% 0%,
      color-mix(in srgb, var(--color-primary) 9%, transparent),
      transparent 58%
    ),
    radial-gradient(
      90% 70% at 100% 100%,
      color-mix(in srgb, var(--rose-600) 6%, transparent),
      transparent 60%
    ),
    var(--bg-primary);
}

.login-container {
  width: 100%;
  max-width: 26rem;
}

.login-card {
  padding: var(--space-10) var(--space-8);
}

.login-header {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-hairline);
  text-align: center;
}

.login-eyebrow {
  margin-bottom: var(--space-3);
  color: var(--text-disabled);
  font-size: var(--fs-micro);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
}

.login-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
}

.login-subtitle {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--fs-caption);
  letter-spacing: var(--tracking-wide);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.error-message {
  padding: var(--space-3) var(--space-4);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 32%, transparent);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: var(--fs-caption);
  line-height: var(--leading-snug);
}

.offline-notice {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: color-mix(in srgb, var(--color-warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warning) 34%, transparent);
  border-radius: var(--radius-sm);
  color: var(--color-warning);
  font-size: var(--fs-caption);
  line-height: var(--leading-snug);
}

.login-btn {
  width: 100%;
  margin-top: var(--space-2);
}

.spinner-sm {
  display: inline-block;
  width: 20px;
  height: 20px;
  /* 用 currentColor 而不是白色：深色主题下 --on-primary 是深墨色，白环会跳出来 */
  border: 2px solid color-mix(in srgb, currentColor 32%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin var(--dur-spin) linear infinite;
}

.login-footer {
  margin-top: var(--space-8);
  text-align: center;
}

.back-link {
  color: var(--text-muted);
  font-size: var(--fs-caption);
  transition: color var(--dur-fast) var(--ease-standard);
}

.back-link:hover {
  color: var(--color-primary-dark);
}

@media (max-width: 768px) {
  .login-page {
    align-items: flex-start;
    padding: calc(var(--space-10) + var(--safe-top)) var(--space-4) var(--space-8);
  }

  .login-card {
    padding: var(--space-8) var(--space-6);
  }

  .login-title {
    font-size: var(--fs-xl);
  }

  .login-btn {
    min-height: 3rem;
  }
}
</style>
