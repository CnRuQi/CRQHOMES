<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" :class="['toast', `toast-${type}`]" role="status" aria-live="polite">
        <Icon :name="iconName" :size="18" class="toast-icon" />
        <span class="toast-message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, ref, onUnmounted } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // info, success, warning, error
  duration: { type: Number, default: 3000 },
  visible: { type: Boolean, default: false },
  // 每次 show() 递增：相同文案连续触发时，靠它区分「又一次触发」
  seq: { type: Number, default: 0 },
})

const emit = defineEmits(['update:visible'])

const timer = ref(null)

const iconName = computed(() => {
  const icons = {
    info: 'info',
    success: 'check',
    warning: 'alert',
    error: 'close',
  }
  return icons[props.type] || 'info'
})

watch(
  // 监听 message 覆盖「显示中换成另一句文案」，监听 seq 覆盖「显示中再次触发相同文案」
  [() => props.visible, () => props.message, () => props.seq],
  ([val]) => {
    if (timer.value) {
      clearTimeout(timer.value)
      timer.value = null
    }
    if (val && props.duration > 0) {
      timer.value = setTimeout(() => {
        emit('update:visible', false)
      }, props.duration)
    }
  }
)

onUnmounted(() => {
  if (timer.value) {
    clearTimeout(timer.value)
  }
})
</script>

<style scoped>
/* 提示条：不铺满高饱和底色，改用「纸面 + 一道墨色侧栏」，
   与站内其它纸面层级一致，也不至于在深色主题里刺眼。 */
.toast {
  position: fixed;
  top: calc(var(--space-5) + var(--safe-top));
  left: 50%;
  z-index: var(--z-toast);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: min(30rem, calc(100vw - var(--space-8)));
  padding: var(--space-3) var(--space-5) var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--toast-accent, var(--color-primary));
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  color: var(--text-primary);
  font-size: var(--fs-caption);
  line-height: var(--leading-snug);
  transform: translateX(-50%);
}

.toast-icon {
  flex: 0 0 auto;
  color: var(--toast-accent, var(--color-primary));
}

.toast-message {
  min-width: 0;
}

.toast-info {
  --toast-accent: var(--color-info);
}

.toast-success {
  --toast-accent: var(--color-success);
}

.toast-warning {
  --toast-accent: var(--color-warning);
}

.toast-error {
  --toast-accent: var(--color-danger);
}

.toast-enter-active {
  transition:
    opacity var(--dur-normal) var(--ease-out),
    transform var(--dur-normal) var(--ease-spring);
}

.toast-leave-active {
  transition:
    opacity var(--dur-fast) var(--ease-in),
    transform var(--dur-fast) var(--ease-in);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(calc(var(--space-3) * -1));
}

@media (max-width: 768px) {
  .toast {
    left: var(--space-4);
    right: var(--space-4);
    max-width: none;
    transform: none;
  }

  .toast-enter-from,
  .toast-leave-to {
    opacity: 0;
    transform: translateY(calc(var(--space-3) * -1));
  }
}
</style>
