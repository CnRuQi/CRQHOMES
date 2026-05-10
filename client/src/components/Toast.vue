<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" :class="['toast', `toast-${type}`]">
        <Icon :name="iconName" :size="18" />
        <span>{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // info, success, warning, error
  duration: { type: Number, default: 3000 },
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible'])

const iconName = computed(() => {
  const icons = {
    info: 'info',
    success: 'check',
    warning: 'alert',
    error: 'close'
  }
  return icons[props.type] || 'info'
})

watch(() => props.visible, (val) => {
  if (val && props.duration > 0) {
    setTimeout(() => {
      emit('update:visible', false)
    }, props.duration)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-info {
  background: var(--color-info);
  color: white;
}

.toast-success {
  background: var(--color-success);
  color: white;
}

.toast-warning {
  background: var(--color-warning);
  color: white;
}

.toast-error {
  background: var(--color-danger);
  color: white;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
