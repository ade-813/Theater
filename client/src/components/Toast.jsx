import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark, faXmark } from '@fortawesome/free-solid-svg-icons'

function Toast({ toast, onDismiss }) {
  const icon = toast.type === 'success' ? faCircleCheck : faCircleXmark
  return (
    <div className={`app-toast app-toast-${toast.type}`} role="alert" aria-live="polite">
      <FontAwesomeIcon icon={icon} />
      <span className="app-toast-text">{toast.text}</span>
      <button className="app-toast-dismiss" onClick={onDismiss} aria-label="Dismiss">
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  )
}

export default Toast
