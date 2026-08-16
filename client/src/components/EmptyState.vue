<template>
  <div class="empty-state" :class="{ 'glass-card': glass }">
    <Icon v-if="icon" :name="icon" :size="48" class="empty-icon" />
    <p>{{ text }}</p>
    <p v-if="hint" class="empty-hint">{{ hint }}</p>
    <slot />
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
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.empty-icon {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-hint {
  font-size: 0.9rem;
  margin-top: var(--spacing-sm);
}
</style>
