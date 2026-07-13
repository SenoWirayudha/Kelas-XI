import { useContext } from 'react'
import { Rect } from 'react-konva'
import { CollaborationContext } from '../../context/CollaborationContext'
import { getCursorColor } from '../../utils/cursorColors'

/**
 * Computes the world-space axis-aligned bounding box of a rotated item.
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
 * Returns the combined bounding box for an array of item IDs.
 *
 * - Single item: preserves its rotation (exact match).
 * - Multiple items: axis-aligned union of all items' world-space corners
 *   (rotation = 0).  Items not found in the local items array are skipped.
 */
function getCombinedBounds(items, selectedIds) {
  const selected = selectedIds
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
 * LIMITATION v1 — Stale position during live manipulation:
 *
 * `selectedIds` is broadcast only ONCE at the moment of selection/deselection.
 * It is NOT re-broadcast while User A drags, resizes, or rotates the selected
 * item, because `selectedIds` itself does not change — only the item's
 * x/y/w/h/rotation do (those are not synced in real-time).
 *
 * Therefore the remote outline stays at the LAST KNOWN POSITION from the
 * workspace snapshot loaded on User B's side.  If User A moves the item,
 * User B still sees the outline at the old position until User A deselects
 * (broadcasts `selectedIds: []`) or selects a different item.
 *
 * This is the EXPECTED v1 behavior — NOT a bug.  Live item-state sync
 * (position/size/rotation) would require a separate real-time broadcast of
 * item patches, which is out of scope for this feature.
 *
 * OUTLINE BEHAVIOR (v1):
 * - Single item selected: outline matches the item's exact bounds + rotation.
 * - Multiple items / composite group: ONE combined axis-aligned bounding box
 *   that covers all selected items (no rotation).  Labels are rendered as DOM
 *   overlays in CollaborationSelectionLabels (same style as cursor badges).
 */
export function CollaborationSelectionIndicators({ items }) {
  const { collaboratorSelections, currentUserId } = useContext(CollaborationContext)

  const entries = Object.entries(collaboratorSelections).filter(
    ([userId]) => userId !== currentUserId
  )
  if (entries.length === 0) return null

  const rects = []

  entries.forEach(([userId, sel]) => {
    if (!sel.selectedIds || sel.selectedIds.length === 0) return

    const combined = getCombinedBounds(items, sel.selectedIds)
    if (!combined) return

    const { x, y, w, h, rotation } = combined
    const color = getCursorColor(userId)

    rects.push(
      <Rect
        key={`sel-halo-${userId}`}
        x={x - 1}
        y={y - 1}
        width={w + 2}
        height={h + 2}
        rotation={rotation}
        stroke="white"
        strokeWidth={5}
        listening={false}
        perfectDrawEnabled={false}
      />,
      <Rect
        key={`sel-outline-${userId}`}
        x={x}
        y={y}
        width={w}
        height={h}
        rotation={rotation}
        stroke={color.bg}
        strokeWidth={3}
        dash={[6, 5]}
        listening={false}
        perfectDrawEnabled={false}
      />
    )
  })

  return rects.length > 0 ? rects : null
}
