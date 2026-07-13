import { useContext, useEffect, useRef } from 'react'
import { CollaborationContext } from '../../context/CollaborationContext'
import { getCursorColor } from '../../utils/cursorColors'

/**
 * Helper: world-space axis-aligned corners of a rotated item.
 */
function getItemCorners(item) {
  const rad = (item.rotation || 0) * Math.PI / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const w = item.w || 0
  const h = item.h || 0
  return [
    { x: item.x, y: item.y },
    { x: item.x + w * cos, y: item.y + w * sin },
    { x: item.x + w * cos - h * sin, y: item.y + w * sin + h * cos },
    { x: item.x - h * sin, y: item.y + h * cos },
  ]
}

/**
 * Computes the world-space axis-aligned bounding box corners of a
 * composite group by applying the operator's compositeGroup* transform
 * to every member.
 */
function getCompositeGroupCorners(items, groupId) {
  const operator = items.find((item) =>
    item.groupId === groupId && (item.compositeMode === 'mask' || item.compositeMode === 'exclude'))
  if (!operator) return []

  const cgx = operator.compositeGroupX ?? 0
  const cgy = operator.compositeGroupY ?? 0
  const cgsx = operator.compositeGroupScaleX ?? 1
  const cgsy = operator.compositeGroupScaleY ?? 1
  const cgr = operator.compositeGroupRotation ?? 0
  const rad = cgr * Math.PI / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  const members = items.filter((item) => item.groupId === groupId && !item.compositeMode)
  return members.flatMap((member) => {
    const mx = (member.x || 0) * cgsx
    const my = (member.y || 0) * cgsy
    const w = (member.w || 0) * cgsx
    const h = (member.h || 0) * cgsy
    const rx = cgx + mx * cos - my * sin
    const ry = cgy + mx * sin + my * cos
    return [
      { x: rx, y: ry },
      { x: rx + w * cos, y: ry + w * sin },
      { x: rx + w * cos - h * sin, y: ry + w * sin + h * cos },
      { x: rx - h * sin, y: ry + h * cos },
    ]
  })
}

/**
 * Returns the VISUAL top-left corner (in world space) of the combined
 * bounding box covering all selected items.
 *
 * Always computes from actual world-space corners of each item (accounting
 * for rotation), then picks the smallest X and smallest Y.  Composite
 * operators are expanded to their full member bounds.
 *
 * Items not found in the local array are skipped.
 */
function getCombinedBounds(items, selectedIds) {
  const selected = selectedIds
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean)

  if (selected.length === 0) return null

  const allCorners = selected.flatMap((item) => {
    if (item.compositeMode === 'mask' || item.compositeMode === 'exclude') {
      return getCompositeGroupCorners(items, item.groupId)
    }
    return getItemCorners(item)
  })
  const xs = allCorners.map((c) => c.x)
  const ys = allCorners.map((c) => c.y)
  return { x: Math.min(...xs), y: Math.min(...ys) }
}

const LABEL_OFFSET = 28 // screen pixels above the bounding box

/**
 * Renders selection labels as DOM overlays, styled identically to cursor
 * badges (reuses `.workspace-remote-cursor-label` CSS class).
 *
 * Each remote user with an active selection gets ONE label positioned at
 * the top-left of their combined bounding box.
 */
export function CollaborationSelectionLabels({ cameraRef, items }) {
  const { collaboratorSelections, currentUserId } = useContext(CollaborationContext)
  const containerRef = useRef(null)
  const labelElsRef = useRef({})  // userId → { el, lastX, lastY }
  const rafRef = useRef(null)
  const selectionsRef = useRef(collaboratorSelections)
  const itemsRef = useRef(items)

  // Keep refs in sync with latest props/state
  useEffect(() => { selectionsRef.current = collaboratorSelections }, [collaboratorSelections])
  useEffect(() => { itemsRef.current = items }, [items])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const loop = () => {
      const camera = cameraRef.current
      const selections = selectionsRef.current
      const currentItems = itemsRef.current
      const activeIds = new Set()

      Object.entries(selections).forEach(([userId, sel]) => {
        if (userId === currentUserId) return
        if (!sel.selectedIds || sel.selectedIds.length === 0) return

        const pos = getCombinedBounds(currentItems, sel.selectedIds)
        if (!pos) return

        const screenX = pos.x * camera.scale + camera.x
        const screenY = pos.y * camera.scale + camera.y
        const labelY = screenY - LABEL_OFFSET
        activeIds.add(userId)

        let entry = labelElsRef.current[userId]
        if (!entry) {
          const color = getCursorColor(userId)
          const el = document.createElement('span')
          el.className = 'workspace-remote-cursor-label'
          el.style.background = color.bg
          el.style.color = color.text
          el.style.position = 'absolute'
          el.style.top = '0'
          el.style.left = '0'
          el.style.pointerEvents = 'none'
          el.style.whiteSpace = 'nowrap'
          el.style.transform = `translate(${screenX}px, ${labelY}px)`
          container.appendChild(el)
          labelElsRef.current[userId] = { el, lastX: screenX, lastY: labelY }
        } else {
          const displayText = sel.displayName || sel.username || '?'
          if (entry.el.textContent !== displayText) {
            entry.el.textContent = displayText
          }

          if (entry.lastX !== screenX || entry.lastY !== labelY) {
            entry.el.style.transform = `translate(${screenX}px, ${labelY}px)`
            entry.lastX = screenX
            entry.lastY = labelY
          }
        }
      })

      // Remove labels for users who no longer have selections
      Object.keys(labelElsRef.current).forEach((userId) => {
        if (!activeIds.has(userId)) {
          const entry = labelElsRef.current[userId]
          if (entry.el.parentNode) entry.el.parentNode.removeChild(entry.el)
          delete labelElsRef.current[userId]
        }
      })

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      Object.values(labelElsRef.current).forEach((entry) => {
        if (entry.el.parentNode) entry.el.parentNode.removeChild(entry.el)
      })
      labelElsRef.current = {}
    }
  }, [cameraRef, currentUserId])

  return (
    <div
      ref={containerRef}
      className="workspace-remote-cursors-layer"
    />
  )
}
