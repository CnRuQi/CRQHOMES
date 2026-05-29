<template>
  <div class="login-page">
    <div class="login-container" data-aos="fade-up">
      <div class="login-card glass-card">
        <div class="login-header">
          <h1 class="login-title">
            <Icon name="logo" :size="40" />
            披花沐雪
          </h1>
          <p class="login-subtitle">管理后台登录</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input
              v-model="form.username"
              type="text"
              class="form-input glass-input"
              placeholder="请输入用户名"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label class="form-label">密码</label>
            <input
              v-model="form.password"
              type="password"
              class="form-input glass-input"
              placeholder="请输入密码"
              required
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg login-btn" :disabled="loading">
            <span v-if="loading" class="spinner-sm"></span>
            <span v-else>登 录</span>
          </button>
        </form>

        <div class="login-footer">
          <router-link to="/" class="back-link">← 返回首页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await authStore.login(form.value.username, form.value.password)
    const redirect = route.query.redirect || '/admin'
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
  color: #9a7272;
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
</style>
