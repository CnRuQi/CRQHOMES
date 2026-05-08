<template>
  <div class="not-found">
    <div class="container">
      <div class="content" data-aos="fade-up">
        <h1 class="error-code">404</h1>
        <p class="error-message">页面不存在</p>
        <router-link to="/" class="btn btn-primary btn-lg">
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  text-align: center;
}

.error-code {
  font-size: 8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #96A48B, #D4B0B5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: var(--spacing-md);
}

.error-message {
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}
</style>
