/**
 * frameUtils.js
 * Pure helpers for frame slot layout, image fit/crop calculations,
 * and the canvas 2D clip functions.
 */
import { getFrameById } from '../data/frameLibrary'

// ─── Grid frame detection ─────────────────────────────────────────────────────

export const isGridFrame = (frameType) =>
  ['grid-2', 'grid-3', 'grid-collage', 'grid-asymmetric'].includes(frameType)

// ─── Default frame size from frameData ───────────────────────────────────────

export const getFrameDefaultSize = (frameData) => {
  if (!frameData) return { width: 200, height: 250 }
  if (frameData.defaultProps.width && frameData.defaultProps.height)
    return { width: frameData.defaultProps.width, height: frameData.defaultProps.height }
  if (frameData.defaultProps.radius)
    return { width: frameData.defaultProps.radius * 2, height: frameData.defaultProps.radius * 2 }
  return { width: 200, height: 250 }
}

// ─── Single slot resolution ───────────────────────────────────────────────────

export const getResolvedFrameSlot = (item) => {
  const frameData  = getFrameById(item.frameId)
  const sourceSlot = frameData?.frameSlot || item.frameSlot
  if (!sourceSlot) return { x: 0, y: 0, width: item.w, height: item.h, shape: 'rect', cornerRadius: item.cornerRadius || 0 }

  const baseSize   = getFrameDefaultSize(frameData)
  const scaleX     = item.w / baseSize.width
  const scaleY     = item.h / baseSize.height
  const radiusScale = Math.min(scaleX, scaleY)

  return {
    x:            sourceSlot.x * scaleX,
    y:            sourceSlot.y * scaleY,
    width:        sourceSlot.width  * scaleX,
    height:       sourceSlot.height * scaleY,
    shape:        sourceSlot.shape || 'rect',
    cornerRadius: (sourceSlot.cornerRadius || 0) * radiusScale,
    radius:       sourceSlot.radius     ? sourceSlot.radius     * radiusScale : undefined,
    archRadius:   sourceSlot.archRadius ? sourceSlot.archRadius * radiusScale : undefined,
  }
}

// ─── Multi-slot resolution (grid frames) ─────────────────────────────────────

export const getResolvedFrameSlots = (item) => {
  if (!isGridFrame(item.frameType)) return [{ ...getResolvedFrameSlot(item), slotIndex: 0 }]

  const GAP      = 8
  const gapScale = Math.min(item.w / 300, item.h / 300)
  const gap      = Math.max(4, GAP * gapScale)

  if (item.frameType === 'grid-2') {
    const cellW = (item.w - gap * 3) / 2
    const cellH = item.h - gap * 2
    return [
      { x: gap,             y: gap, width: cellW, height: cellH, shape: 'rect', cornerRadius: 4, slotIndex: 0 },
      { x: gap * 2 + cellW, y: gap, width: cellW, height: cellH, shape: 'rect', cornerRadius: 4, slotIndex: 1 },
    ]
  }
  if (item.frameType === 'grid-3') {
    const cellW = (item.w - gap * 4) / 3
    const cellH = item.h - gap * 2
    return [
      { x: gap,                  y: gap, width: cellW, height: cellH, shape: 'rect', cornerRadius: 4, slotIndex: 0 },
      { x: gap * 2 + cellW,      y: gap, width: cellW, height: cellH, shape: 'rect', cornerRadius: 4, slotIndex: 1 },
      { x: gap * 3 + cellW * 2,  y: gap, width: cellW, height: cellH, shape: 'rect', cornerRadius: 4, slotIndex: 2 },
    ]
  }
  if (item.frameType === 'grid-collage') {
    const cellW = (item.w - gap * 3) / 2
    const cellH = (item.h - gap * 3) / 2
    return [
      { x: gap,             y: gap,             width: cellW, height: cellH, shape: 'rect', cornerRadius: 4, slotIndex: 0 },
      { x: gap * 2 + cellW, y: gap,             width: cellW, height: cellH, shape: 'rect', cornerRadius: 4, slotIndex: 1 },
      { x: gap,             y: gap * 2 + cellH, width: cellW, height: cellH, shape: 'rect', cornerRadius: 4, slotIndex: 2 },
      { x: gap * 2 + cellW, y: gap * 2 + cellH, width: cellW, height: cellH, shape: 'rect', cornerRadius: 4, slotIndex: 3 },
    ]
  }
  if (item.frameType === 'grid-asymmetric') {
    const leftW   = item.w * 0.58 - gap * 1.5
    const rightW  = item.w - leftW - gap * 3
    const topH    = (item.h - gap * 3) * 0.56
    const bottomH = item.h - gap * 3 - topH
    return [
      { x: gap,             y: gap,             width: leftW,  height: item.h - gap * 2, shape: 'rect', cornerRadius: 4, slotIndex: 0 },
      { x: gap * 2 + leftW, y: gap,             width: rightW, height: topH,             shape: 'rect', cornerRadius: 4, slotIndex: 1 },
      { x: gap * 2 + leftW, y: gap * 2 + topH,  width: rightW, height: bottomH,          shape: 'rect', cornerRadius: 4, slotIndex: 2 },
    ]
  }
  return [{ ...getResolvedFrameSlot(item), slotIndex: 0 }]
}

// ─── Image fit / crop calculations ───────────────────────────────────────────

export const calculateCoverFit = ({ imageWidth, imageHeight, slot, fit = 'cover', crop = { x: 0, y: 0 }, zoom = 1 }) => {
  if (!imageWidth || !imageHeight || !slot) return null
  const baseScale    = fit === 'contain'
    ? Math.min(slot.width / imageWidth, slot.height / imageHeight)
    : Math.max(slot.width / imageWidth, slot.height / imageHeight)
  const scale        = baseScale * (zoom || 1)
  const renderedWidth  = imageWidth  * scale
  const renderedHeight = imageHeight * scale
  return {
    x:      slot.x + (slot.width  - renderedWidth)  / 2 + (crop?.x || 0),
    y:      slot.y + (slot.height - renderedHeight) / 2 + (crop?.y || 0),
    width:  renderedWidth,
    height: renderedHeight,
    scale,
  }
}

export const getFrameImageBaseScale = ({ imageWidth, imageHeight, slot, fit = 'cover' }) => {
  if (!imageWidth || !imageHeight || !slot?.width || !slot?.height) return 1
  return fit === 'contain'
    ? Math.min(slot.width / imageWidth, slot.height / imageHeight)
    : Math.max(slot.width / imageWidth, slot.height / imageHeight)
}

export const getFrameImageCropBounds = ({ imageWidth, imageHeight, slot, fit = 'cover', zoom = 1 }) => {
  if (!imageWidth || !imageHeight || !slot) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  const baseScale      = getFrameImageBaseScale({ imageWidth, imageHeight, slot, fit })
  const scale          = baseScale * (zoom || 1)
  const renderedWidth  = imageWidth  * scale
  const renderedHeight = imageHeight * scale
  const maxOffsetX     = Math.max(0, (renderedWidth  - slot.width)  / 2)
  const maxOffsetY     = Math.max(0, (renderedHeight - slot.height) / 2)
  return { minX: -maxOffsetX, maxX: maxOffsetX, minY: -maxOffsetY, maxY: maxOffsetY }
}

export const clampFrameImagePosition = ({ imageWidth, imageHeight, slot, fit = 'cover', zoom = 1, position }) => {
  const bounds = getFrameImageCropBounds({ imageWidth, imageHeight, slot, fit, zoom })
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, position?.x || 0)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, position?.y || 0)),
  }
}

export const getMinFrameImageZoom = ({ imageWidth, imageHeight, slot, fit = 'cover' }) => {
  const baseScale = getFrameImageBaseScale({ imageWidth, imageHeight, slot, fit })
  if (!baseScale) return 1
  return Math.max(slot.width / (imageWidth * baseScale), slot.height / (imageHeight * baseScale))
}

// ─── Canvas 2D clip helpers ───────────────────────────────────────────────────

const roundedRectPath = (ctx, x, y, width, height, radius = 0) => {
  const r = Math.min(radius, width / 2, height / 2)
  if (r <= 0) { ctx.rect(x, y, width, height); return }
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
}

export const applyFrameSlotClip = (frameSlot) => {
  if (!frameSlot) return undefined
  return (ctx) => {
    const { x, y, width, height } = frameSlot
    ctx.beginPath()
    if (frameSlot.shape === 'circle') {
      ctx.arc(x + width / 2, y + height / 2, frameSlot.radius || Math.min(width, height) / 2, 0, Math.PI * 2)
    } else if (frameSlot.shape === 'arch') {
      const archRadius = frameSlot.archRadius || width / 2
      ctx.moveTo(x, y + archRadius)
      ctx.arc(x + width / 2, y + archRadius, archRadius, Math.PI, 0)
      ctx.lineTo(x + width, y + height)
      ctx.lineTo(x, y + height)
      ctx.closePath()
    } else if (frameSlot.shape === 'blob') {
      const cx = x + width / 2; const cy = y + height / 2
      const rx = width / 2;     const ry = height / 2
      ctx.moveTo(cx + rx * 0.05, cy - ry * 0.95)
      ctx.bezierCurveTo(cx + rx * 1.08, cy - ry * 0.88, cx + rx * 1.05, cy + ry * 0.35, cx + rx * 0.35, cy + ry * 0.9)
      ctx.bezierCurveTo(cx - rx * 0.15, cy + ry * 1.12, cx - rx * 1.18, cy + ry * 0.6,  cx - rx * 0.98, cy - ry * 0.05)
      ctx.bezierCurveTo(cx - rx * 0.82, cy - ry * 0.68, cx - rx * 0.35, cy - ry * 1.08, cx + rx * 0.05, cy - ry * 0.95)
      ctx.closePath()
    } else if (frameSlot.shape === 'wave') {
      const amp = height * 0.1
      ctx.moveTo(x, y + amp * 1.5)
      ctx.bezierCurveTo(x + width * 0.2, y - amp * 0.5,  x + width * 0.4, y + amp * 2.5, x + width * 0.6, y + amp * 0.8)
      ctx.bezierCurveTo(x + width * 0.8, y - amp,        x + width * 0.9, y + amp,        x + width,       y + amp * 0.5)
      ctx.lineTo(x + width, y + height - amp * 0.5)
      ctx.bezierCurveTo(x + width * 0.8, y + height + amp,   x + width * 0.6, y + height - amp * 2,   x + width * 0.4, y + height - amp * 0.5)
      ctx.bezierCurveTo(x + width * 0.2, y + height + amp,   x,               y + height - amp * 1.5, x,               y + height - amp * 1.5)
      ctx.closePath()
    } else if (frameSlot.shape === 'liquid') {
      const cx = x + width / 2; const cy = y + height / 2
      const rx = width / 2;     const ry = height / 2
      ctx.moveTo(cx - rx * 0.05, cy - ry * 0.98)
      ctx.bezierCurveTo(cx + rx * 0.65, cy - ry * 1.05, cx + rx * 1.1,  cy - ry * 0.25, cx + rx * 0.92, cy + ry * 0.4)
      ctx.bezierCurveTo(cx + rx * 0.78, cy + ry * 0.88, cx + rx * 0.25, cy + ry * 1.1,  cx - rx * 0.1,  cy + ry * 0.98)
      ctx.bezierCurveTo(cx - rx * 0.72, cy + ry * 0.9,  cx - rx * 1.12, cy + ry * 0.38, cx - rx * 0.98, cy - ry * 0.18)
      ctx.bezierCurveTo(cx - rx * 0.88, cy - ry * 0.72, cx - rx * 0.48, cy - ry * 1.02, cx - rx * 0.05, cy - ry * 0.98)
      ctx.closePath()
    } else {
      roundedRectPath(ctx, x, y, width, height, frameSlot.cornerRadius || 0)
    }
    ctx.closePath()
  }
}