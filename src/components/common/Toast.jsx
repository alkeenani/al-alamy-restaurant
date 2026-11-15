import { AlertIcon, CheckIcon, InfoIcon } from './Icons.jsx'
import './Toast.css'

const toastIcons = {
  success: CheckIcon,
  error: AlertIcon,
  info: InfoIcon,
}

function Toast({ toast }) {
  const Icon = toastIcons[toast.type] ?? InfoIcon

  return (
    <div className={`toast toast--${toast.type}`}>
      <span className="toast__icon">
        <Icon />
      </span>
      <p className="toast__message">{toast.message}</p>
    </div>
  )
}

export default Toast
