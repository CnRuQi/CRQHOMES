<template>
  <div class="empty-state" :class="{ 'glass-card': glass }">
    <span v-if="icon" class="empty-icon">
      <Icon :name="icon" :size="28" />
    </span>

    <p class="empty-text">{{ text }}</p>
    <p v-if="hint" class="empty-hint">{{ hint }}</p>

    <div v-if="$slots.default" class="empty-actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
import Icon from './Icon.vue'

defineProps({
  icon: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    required: true,
  },
  hint: {
    type: String,
    default: '',
  },
  glass: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
/* 空状态：一页留白，一枚淡墨印记。
   不用虚线框——那是通用模板的样子。 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-20) var(--space-6);
  text-align: center;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  margin-bottom: var(--space-6);
  background: var(--tint-primary-weak);
  border: 1px solid var(--border-hairline);
  border-radius: 50%;
  opacity: 0.85;
}

.empty-text {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
}

.empty-hint {
  max-width: 30ch;
  margin-top: var(--space-3);
  color: var(--text-muted);
  font-size: var(--fs-caption);
  line-height: var(--leading-relaxed);
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-8);
}

@media (max-width: 768px) {
  .empty-state {
    padding: var(--space-12) var(--space-4);
  }

  .empty-icon {
    width: 3rem;
    height: 3rem;
    margin-bottom: var(--space-5);
  }
}
</style>
