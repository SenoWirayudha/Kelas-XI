/**
 * canvasPositionUtils.js
 * Helpers for clamping item positions and sizes within canvas bounds.
 * Depends on canvasBounds being passed in (avoids module-level mutable state).
 */
import { clamp } from './mathUtils'

/**
 * Return the raw position without clamping — items can freely go off-canvas.
 * @param {number} w  item width (unused, kept for API compat)
 * @param {number} h  item height (unused, kept for API compat)
 * @param {{ x, y }} position  raw position
 * @param {{ x, y, width, height }} canvasBounds  (unused, kept for API compat)
 */
export const getClampedCanvasPosition = (w, h, position, canvasBounds) => ({ ...position })

/**
 * Normalize requestedWidth x requestedHeight without capping to canvasBounds,
 * with a minimum of 40px on each axis. Objects may exceed the canvas.
 */
export const getCanvasContainedSize = (requestedWidth, requestedHeight) => ({
  w: Math.max(40, requestedWidth),
  h: Math.max(40, requestedHeight),
})

/**
 * Return the world-space point that corresponds to a viewport pixel.
 * @param {{ x, y }} viewportPoint
 * @param {{ x, y, scale }} camera
 */
export const getWorldPointFromViewport = (viewportPoint, camera) => ({
  x: (viewportPoint.x - camera.x) / camera.scale,
  y: (viewportPoint.y - camera.y) / camera.scale,
})

/**
 * Return the bounding box that tightly wraps an array of canvas items.
 * Returns null when the array is empty.
 */
export const getItemsBounds = (items) => {
  if (!items.length) return null

  const left   = Math.min(...items.map((i) => i.x || 0))
  const top    = Math.min(...items.map((i) => i.y || 0))
  const right  = Math.max(...items.map((i) => (i.x || 0) + (i.w || 1)))
  const bottom = Math.max(...items.map((i) => (i.y || 0) + (i.h || 1)))

  return {
    x: left, y: top,
    width:  right  - left,
    height: bottom - top,
    left, top, right, bottom,
    centerX: left + (right  - left) / 2,
    centerY: top  + (bottom - top)  / 2,
  }
}
