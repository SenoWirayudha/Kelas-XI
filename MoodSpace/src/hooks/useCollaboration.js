import { useCallback, useContext, useRef } from 'react'
import { CollaborationContext } from '../context/CollaborationContext'

export function useCollaboration() {
  const ctx = useContext(CollaborationContext)
  if (!ctx) {
    throw new Error('useCollaboration must be used within <CollaborationProvider>')
  }

  const lastSendRef = useRef({})
  const rafRef = useRef({})

  // broadcast dengan throttle/debounce built-in untuk high-frequency events (cursor, selection, dll)
  const broadcast = useCallback((type, payload, { throttle } = {}) => {
    if (throttle) {
      // throttle: skip if last send was within the throttle window
      const now = Date.now()
      const last = lastSendRef.current[type] || 0
      if (now - last < throttle) {
        // debounce via rAF — only send the latest payload
        if (rafRef.current[type]) {
          cancelAnimationFrame(rafRef.current[type])
        }
        rafRef.current[type] = requestAnimationFrame(() => {
          lastSendRef.current[type] = Date.now()
          ctx.broadcast(type, payload)
        })
        return
      }
      lastSendRef.current[type] = now
    }

    ctx.broadcast(type, payload)
  }, [ctx])

  return {
    collaborators: ctx.collaborators,
    collaboratorCount: ctx.collaboratorCount,
    isConnected: ctx.isConnected,
    currentUserId: ctx.currentUserId,
    broadcast,
  }
}
