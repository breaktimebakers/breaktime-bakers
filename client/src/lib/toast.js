// Tiny imperative toast store - no provider/hook needed at the call site,
// so it can be fired from anywhere a message needs surfacing: a mutation's
// onError, a plain event listener, outside React entirely. <Toaster />
// (mounted once at the app root) is the only thing that actually
// subscribes and renders.

let toasts = []
let listeners = []
let nextId = 0

const DEFAULT_DURATIONS = { success: 3200, error: 5200, info: 3200 }

const emit = () => listeners.forEach((listener) => listener(toasts))

export const subscribeToasts = (listener) => {
  listeners.push(listener)
  listener(toasts)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

const dismiss = (id) => {
  const target = toasts.find((t) => t.id === id)
  if (!target || target.closing) return

  toasts = toasts.map((t) => (t.id === id ? { ...t, closing: true } : t))
  emit()

  // Matches the toast-out animation duration - removed from the list only
  // once it's finished sliding out, not before.
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 320)
}

const push = (type, message, { description, duration } = {}) => {
  const id = ++nextId
  const resolvedDuration = duration ?? DEFAULT_DURATIONS[type] ?? 3200

  toasts = [...toasts, { id, type, message, description, duration: resolvedDuration, closing: false }]
  emit()

  if (resolvedDuration !== Infinity) {
    setTimeout(() => dismiss(id), resolvedDuration)
  }

  return id
}

export const toast = {
  success: (message, options) => push('success', message, options),
  error: (message, options) => push('error', message, options),
  info: (message, options) => push('info', message, options),
  dismiss,
}
