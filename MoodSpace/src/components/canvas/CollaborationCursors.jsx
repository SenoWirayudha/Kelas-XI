import { useContext, useEffect, useRef } from 'react'
import { CollaborationContext } from '../../context/CollaborationContext'
import { getCursorColor } from '../../utils/cursorColors'

const LERP_FACTOR = 0.2
const CURSOR_TIMEOUT = 3000

export function CollaborationCursors({ cameraRef }) {
  const { cursorPositionsRef, currentUserId } = useContext(CollaborationContext)
  const containerRef = useRef(null)
  const cursorElsRef = useRef({})
  const renderedPosRef = useRef({})
  const rafRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current

    const loop = () => {
      const positions = cursorPositionsRef.current
      const camera = cameraRef.current
      const now = Date.now()

      // Remove stale cursors (auto-hide: no update for 3s)
      Object.keys(positions).forEach((uid) => {
        if (now - positions[uid].lastSeen > CURSOR_TIMEOUT) {
          delete positions[uid]
          const el = cursorElsRef.current[uid]
          if (el && el.parentNode) el.parentNode.removeChild(el)
          delete cursorElsRef.current[uid]
          delete renderedPosRef.current[uid]
        }
      })

      // Update each cursor
      Object.keys(positions).forEach((uid) => {
        const target = positions[uid]

        if (!renderedPosRef.current[uid]) {
          renderedPosRef.current[uid] = { x: target.x, y: target.y }
        }

        const rendered = renderedPosRef.current[uid]
        rendered.x += (target.x - rendered.x) * LERP_FACTOR
        rendered.y += (target.y - rendered.y) * LERP_FACTOR

        // World → screen
        const screenX = rendered.x * camera.scale + camera.x
        const screenY = rendered.y * camera.scale + camera.y

        // Get or create DOM element for this cursor
        let el = cursorElsRef.current[uid]
        if (!el) {
          const color = getCursorColor(uid)
          el = document.createElement('div')
          el.className = 'workspace-remote-cursor'

          const arrow = document.createElement('span')
          arrow.className = 'workspace-remote-cursor-arrow'
          arrow.textContent = '➤'
          arrow.style.color = color.bg
          el.appendChild(arrow)

          const label = document.createElement('span')
          label.className = 'workspace-remote-cursor-label'
          label.textContent = target.displayName || target.username || '?'
          label.style.background = color.bg
          label.style.color = color.text
          el.appendChild(label)

          container.appendChild(el)
          cursorElsRef.current[uid] = el
        }

        el.style.transform = `translate(${screenX}px, ${screenY}px)`
      })

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      cursorElsRef.current = {}
      renderedPosRef.current = {}
    }
  }, [cameraRef, cursorPositionsRef])

  return <div ref={containerRef} className="workspace-remote-cursors-layer" />
}
