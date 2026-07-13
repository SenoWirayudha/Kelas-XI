import { useCallback, useEffect, useRef } from 'react'
import { useCollaboration } from './useCollaboration'
import { getWorldPointFromViewport } from '../utils/canvasPositionUtils'

const THROTTLE_MS = 200

export function useCursorBroadcast({ stageRef, cameraRef, isPanning, user }) {
  const { broadcast, currentUserId } = useCollaboration()
  const userRef = useRef(user)
  const lastSentRef = useRef(0)
  const rafRef = useRef(null)
  const lastPointerRef = useRef(null)

  userRef.current = user

  const sendCursorMove = useCallback((worldX, worldY) => {
    const u = userRef.current
    if (!u) return
    broadcast('cursor_move', {
      userId: u.id,
      x: worldX,
      y: worldY,
      username: u.username,
      displayName: u.displayName,
    })
  }, [broadcast])

  const sendCursorLeave = useCallback(() => {
    const u = userRef.current
    if (!u) return
    broadcast('cursor_leave', {
      userId: u.id,
    })
  }, [broadcast])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !currentUserId) return

    const handleMove = () => {
      if (isPanning) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      // Filter out broadcasts triggered by stage resize (sidebar toggle,
      // zoom animation) where getPointerPosition() returns a different
      // value even though the physical mouse didn't move. Only broadcast
      // when the stage-relative position actually changes > 1px.
      const prev = lastPointerRef.current
      if (prev && Math.abs(pointer.x - prev.x) <= 1 && Math.abs(pointer.y - prev.y) <= 1) return
      lastPointerRef.current = pointer

      const world = getWorldPointFromViewport(pointer, cameraRef.current)

      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const now = Date.now()
        if (now - lastSentRef.current >= THROTTLE_MS) {
          sendCursorMove(world.x, world.y)
          lastSentRef.current = now
        }
      })
    }

    const handleLeave = () => {
      cancelAnimationFrame(rafRef.current)
      sendCursorLeave()
    }

    stage.on('mousemove', handleMove)
    stage.on('mouseleave', handleLeave)

    return () => {
      stage.off('mousemove', handleMove)
      stage.off('mouseleave', handleLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [stageRef, cameraRef, isPanning, currentUserId, sendCursorMove, sendCursorLeave])
}
