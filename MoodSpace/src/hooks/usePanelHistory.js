import { useEffect, useRef } from 'react'

export function usePanelHistory({ isActive, onBack }) {
  const activeRef = useRef(isActive)
  const onBackRef = useRef(onBack)
  const skipPopstateRef = useRef(false)
  onBackRef.current = onBack

  useEffect(() => {
    const wasActive = activeRef.current
    activeRef.current = isActive

    if (isActive && !wasActive) {
      window.history.pushState(null, '')
    }
    if (!isActive) return

    const handler = () => {
      if (skipPopstateRef.current) {
        skipPopstateRef.current = false
        return
      }
      if (activeRef.current) {
        activeRef.current = false
        if (onBackRef.current) onBackRef.current()
      }
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [isActive])

  const skipOnce = () => { skipPopstateRef.current = true }

  return { skipOnce }
}
