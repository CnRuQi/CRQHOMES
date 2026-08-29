import { ref } from 'vue'

const toastState = ref({
  visible: false,
  message: '',
  type: 'info',
  duration: 3000,
  seq: 0,
})

// 单调递增的触发序号：相同文案连续触发时 visible 与 message 都不变，
// 只有它能让 Toast 的 watch 感知到「又一次触发」并重置计时
let seq = 0

export function useToast() {
  function show(message, type = 'info', duration = 3000) {
    toastState.value = {
      visible: true,
      message,
      type,
      duration,
      seq: ++seq,
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
    hide,
  }
}
