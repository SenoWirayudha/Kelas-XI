import { useContext } from 'react'
import { Group, Rect, Text } from 'react-konva'
import { CollaborationContext } from '../../context/CollaborationContext'
import { getCursorColor } from '../../utils/cursorColors'

/**
 * World-space corners of a rotated item (axis-aligned for bounding box).
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
 * Combined axis-aligned bounding box for multiple items.
 * Single item preserves rotation; multiple items → rotation = 0.
 */
function getCombinedBounds(items, ids) {
  const selected = ids
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean)
  if (selected.length === 0) return null

  if (selected.length === 1) {
    const item = selected[0]
    return { x: item.x, y: item.y, w: item.w || 0, h: item.h || 0, rotation: item.rotation || 0 }
  }

  const allCorners = selected.flatMap(getItemCorners)
  const xs = allCorners.map((c) => c.x)
  const ys = allCorners.map((c) => c.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, rotation: 0 }
}

/**
 * Groups locked items into composite groups (same groupId/parentGroupId)
 * and standalone items.
 */
function groupLocked(lockedItems, items) {
  const standalone = []
  const groups = new Map()

  Object.entries(lockedItems).forEach(([itemId, lockInfo]) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const key = item.parentGroupId || item.groupId
    if (key) {
      if (!groups.has(key)) groups.set(key, { ids: [], items: [], lockInfo })
      const g = groups.get(key)
      g.ids.push(itemId)
      g.items.push(item)
    } else {
      standalone.push({ id: itemId, item, lockInfo })
    }
  })

  return { standalone, groups }
}

const BADGE_OFFSET = 28

/**
 * Renders semi-transparent overlays + lock badges for items locked by
 * other collaborators.  Composite group members are shown as ONE combined
 * overlay (not per-member).
 *
 * Renders inside the camera Group — positions are in world space.
 */
export function CollaborationLockOverlays({ items, cameraRef }) {
  const { lockedItems, currentUserId } = useContext(CollaborationContext)
  if (!lockedItems) return null
  const camera = cameraRef?.current
  const invScale = camera ? 1 / camera.scale : 1

  const entries = Object.entries(lockedItems).filter(
    ([_, info]) => info.userId !== currentUserId
  )
  if (entries.length === 0) return null

  const lockedMap = Object.fromEntries(entries)
  const { standalone, groups } = groupLocked(lockedMap, items)

  const elements = []

  // Standalone items
  standalone.forEach(({ item, lockInfo }) => {
    const w = item.w || 0
    const h = item.h || 0
    const color = getCursorColor(lockInfo.userId)

    elements.push(
      <Group key={`lock-${item.id}`}>
        <Rect
          x={item.x}
          y={item.y}
          width={w}
          height={h}
          rotation={item.rotation || 0}
          fill="rgba(0,0,0,0.06)"
          listening={false}
          perfectDrawEnabled={false}
        />
        <Rect
          x={item.x + w - 4}
          y={item.y}
          width={4}
          height={4}
          fill={color.bg}
          listening={false}
          perfectDrawEnabled={false}
        />
      </Group>
    )
  })

  // Composite groups — one combined overlay per group
  groups.forEach((g, groupId) => {
    const combined = getCombinedBounds(g.items, g.ids)
    if (!combined) return

    const { x, y, w, h } = combined
    const color = getCursorColor(g.lockInfo.userId)

    elements.push(
      <Group key={`lock-group-${groupId}`}>
        <Rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="rgba(0,0,0,0.06)"
          listening={false}
          perfectDrawEnabled={false}
        />
      </Group>
    )
  })

  return elements.length > 0 ? elements : null
}
