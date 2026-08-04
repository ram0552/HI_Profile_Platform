import { useEffect, useState } from 'react'

export default function Toast({ message, show }) {
  return (
    <div className={`toast${show ? ' show' : ''}`} aria-live="polite">
      <span className="toast-icon">✓</span>
      <span className="toast-message">{message}</span>
    </div>
  )
}

/** Hook: returns [message, show, triggerToast] */
export function useToast() {
  const [state, setState] = useState({ message: '', show: false })

  function triggerToast(message) {
    setState({ message, show: true })
    setTimeout(() => setState(s => ({ ...s, show: false })), 3500)
  }

  return [state.message, state.show, triggerToast]
}
