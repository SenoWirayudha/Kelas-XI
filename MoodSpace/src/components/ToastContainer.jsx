import { useCallback, useEffect, useRef } from 'react'
import { useToast } from '../context/ToastContext'

function ToastItem({ toast, onDone }) {
  const elRef = useRef(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    // rAF: remove enter class to trigger slide-up transition
    const raf = requestAnimationFrame(() => {
      el.classList.remove('workspace-toast--enter')
    })

    const leaveTimer = setTimeout(() => {
      el.classList.add('workspace-toast--leave')
      setTimeout(() => onDone(toast.id), 200)
    }, toast.duration)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(leaveTimer)
    }
  }, [toast.id, toast.duration, onDone])

  const handleDismiss = useCallback(() => {
    const el = elRef.current
    if (!el) return
    if (el.classList.contains('workspace-toast--leave')) return
    el.classList.add('workspace-toast--leave')
    setTimeout(() => onDone(toast.id), 200)
  }, [toast.id, onDone])

  return (
    <div
      ref={elRef}
      className={`workspace-toast workspace-toast--${toast.type} workspace-toast--enter`}
      onClick={handleDismiss}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="workspace-toast-stack">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDone={removeToast} />
      ))}
    </div>
  )
}
