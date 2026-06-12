/**
 * mathUtils.js
 * Pure math/geometry helpers — no React, no Konva imports.
 */

/** Clamp value between min and max. */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Check whether two axis-aligned rectangles intersect.
 * Both rects expected as { x, y, width, height }.
 */
export const rectsIntersect = (a, b) => (
  a.x < b.x + b.width  &&
  a.x + a.width  > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y
)

/**
 * Build a grid of [x1,y1,x2,y2] line-point arrays for the canvas overlay grid.
 * @param {{ width: number, height: number }} size
 * @param {number} verticalCount   number of vertical divider lines
 * @param {number} horizontalCount number of horizontal divider lines
 */
export const getDynamicGridLines = (size, verticalCount, horizontalCount) => {
  const lines = []
  const safeV = Math.max(0, Number(verticalCount) || 0)
  const safeH = Math.max(0, Number(horizontalCount) || 0)

  for (let i = 1; i <= safeV; i++) {
    const x = (size.width / (safeV + 1)) * i
    lines.push([x, 0, x, size.height])
  }
  for (let i = 1; i <= safeH; i++) {
    const y = (size.height / (safeH + 1)) * i
    lines.push([0, y, size.width, y])
  }
  return lines
}

/**
 * Pre-compute the static workspace background grid lines once.
 * @param {{ x, y, width, height }} virtualWorkspace
 * @param {number} gridSize pixel spacing between lines
 */
export const buildWorkspaceGridLines = (virtualWorkspace, gridSize = 120) => {
  const lines = []
  const startX = Math.ceil(virtualWorkspace.x / gridSize) * gridSize
  const endX   = virtualWorkspace.x + virtualWorkspace.width
  const startY = Math.ceil(virtualWorkspace.y / gridSize) * gridSize
  const endY   = virtualWorkspace.y + virtualWorkspace.height

  for (let x = startX; x <= endX; x += gridSize) {
    lines.push([x, virtualWorkspace.y, x, endY])
  }
  for (let y = startY; y <= endY; y += gridSize) {
    lines.push([virtualWorkspace.x, y, endX, y])
  }
  return lines
}