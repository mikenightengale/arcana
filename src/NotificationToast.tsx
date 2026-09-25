import { useEffect } from 'react'

export type ToastVariant = 'success' | 'warning' | 'error'

export interface ToastMessage {
  id: number
  variant: ToastVariant
  message: string
}

export function NotificationToast({ toast, onDismiss }: {
  toast: ToastMessage
  onDismiss: () => void
}) {
  useEffect(() => {
    const duration = toast.variant === 'error' ? 7000 : 4000
    const timeout = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(timeout)
  }, [toast.id, toast.variant, onDismiss])

  return (
    <div
      className={`notification-toast notification-toast-${toast.variant}`}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
    >
      <span>{toast.message}</span>
      <button className="dismiss" aria-label="Dismiss notification" onClick={onDismiss}>×</button>
    </div>
  )
}
