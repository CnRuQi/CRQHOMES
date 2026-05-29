<template>
  <div class="not-found">
    <div class="container">
      <div class="content" data-aos="fade-up">
        <h1 class="error-code">404</h1>
        <p class="error-message">迷路了？这里什么都没有</p>
        <div class="actions">
          <router-link to="/" class="btn btn-primary"> 返回首页 </router-link>
          <router-link to="/archives" class="btn btn-secondary"> 浏览归档 </router-link>
          <router-link to="/search" class="btn btn-secondary"> 搜索文章 </router-link>
        </div>
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
  background: linear-gradient(135deg, var(--color-primary), var(--text-disabled));
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

.actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}
</style>
