import Toast from './Toast.jsx'
import './Toast.css'

function ToastViewport({ toasts }) {
  const visibleToasts = toasts.slice(-4)

  return (
    <div
      className="toast-viewport"
      aria-live="polite"
      aria-atomic="false"
      aria-label="إشعارات"
    >
      {visibleToasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

export default ToastViewport
