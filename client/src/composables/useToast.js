import { ref } from 'vue'

const toastState = ref({
  visible: false,
  message: '',
  type: 'info',
  duration: 3000
})

export function useToast() {
  function show(message, type = 'info', duration = 3000) {
    toastState.value = {
      visible: true,
      message,
      type,
      duration
    }
  }

  function info(message, duration) {
    show(message, 'info', duration)
  }

  function success(message, duration) {
    show(message, 'success', duration)
  }

  function warning(message, duration) {
    show(message, 'warning', duration)
  }

  function error(message, duration) {
    show(message, 'error', duration)
  }

  function hide() {
    toastState.value.visible = false
  }

  return {
    toastState,
    show,
    info,
    success,
    warning,
    error,
    hide
  }
}
