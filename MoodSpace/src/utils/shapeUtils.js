/**
 * shapeUtils.js
 * Pure functions for shape path generation, text layout, and resize logic.
 */
import { clamp } from './mathUtils'

// ─── Arrow shape SVG path ────────────────────────────────────────────────────

export const getArrowShapePath = ({ w, h, arrowVariant = 'right' }) => {
  const width  = Math.max(24, w)
  const height = Math.max(24, h)
  const cx = width  / 2
  const cy = height / 2

  const horizontal = ['right', 'left', 'double-horizontal', 'chevron', 'block', 'tapered'].includes(arrowVariant)
  const length    = horizontal ? width  : height
  const thickness = horizontal ? height : width

  const HEAD_MIN = 18; const HEAD_MAX = 72; const HEAD_IDEAL_RATIO = 0.28
  const headLengthRaw = Math.sqrt(length / 200) * 80 * HEAD_IDEAL_RATIO * 3.5
  const headLength    = clamp(headLengthRaw, HEAD_MIN, Math.min(HEAD_MAX, length * 0.45))

  const HEAD_BREADTH_MIN = 14; const HEAD_BREADTH_MAX = 64
  const headBreadth = clamp(thickness * 0.82, HEAD_BREADTH_MIN, HEAD_BREADTH_MAX)
  const hb = headBreadth / 2

  const SHAFT_BREADTH_MIN = 3; const SHAFT_BREADTH_MAX = 40
  const shaftBreadth = clamp(thickness * 0.38, SHAFT_BREADTH_MIN, Math.min(SHAFT_BREADTH_MAX, headBreadth * 0.65))
  const sb = shaftBreadth / 2

  const safeHb = Math.max(hb, sb + 3)

  if (arrowVariant === 'right') {
    const neck = width - headLength
    if (neck <= 2) return `M 0 ${cy} L ${width} ${cy - safeHb} L ${width} ${cy + safeHb} Z`
    return `M 0 ${cy - sb} L ${neck} ${cy - sb} L ${neck} ${cy - safeHb} L ${width} ${cy} L ${neck} ${cy + safeHb} L ${neck} ${cy + sb} L 0 ${cy + sb} Z`
  }
  if (arrowVariant === 'left') {
    const neck = headLength
    if (neck >= width - 2) return `M ${width} ${cy} L 0 ${cy - safeHb} L 0 ${cy + safeHb} Z`
    return `M ${width} ${cy - sb} L ${neck} ${cy - sb} L ${neck} ${cy - safeHb} L 0 ${cy} L ${neck} ${cy + safeHb} L ${neck} ${cy + sb} L ${width} ${cy + sb} Z`
  }
  if (arrowVariant === 'up') {
    const neck = headLength
    if (neck >= height - 2) return `M ${cx} 0 L ${cx - safeHb} ${height} L ${cx + safeHb} ${height} Z`
    return `M ${cx - sb} ${height} L ${cx - sb} ${neck} L ${cx - safeHb} ${neck} L ${cx} 0 L ${cx + safeHb} ${neck} L ${cx + sb} ${neck} L ${cx + sb} ${height} Z`
  }
  if (arrowVariant === 'down') {
    const neck = height - headLength
    if (neck <= 2) return `M ${cx} ${height} L ${cx - safeHb} 0 L ${cx + safeHb} 0 Z`
    return `M ${cx - sb} 0 L ${cx + sb} 0 L ${cx + sb} ${neck} L ${cx + safeHb} ${neck} L ${cx} ${height} L ${cx - safeHb} ${neck} L ${cx - sb} ${neck} Z`
  }
  if (arrowVariant === 'double-horizontal') {
    const leftNeck = headLength; const rightNeck = width - headLength
    if (rightNeck <= leftNeck + 4) return `M 0 ${cy} L ${cx} ${cy - safeHb} L ${width} ${cy} L ${cx} ${cy + safeHb} Z`
    return `M 0 ${cy} L ${leftNeck} ${cy - safeHb} L ${leftNeck} ${cy - sb} L ${rightNeck} ${cy - sb} L ${rightNeck} ${cy - safeHb} L ${width} ${cy} L ${rightNeck} ${cy + safeHb} L ${rightNeck} ${cy + sb} L ${leftNeck} ${cy + sb} L ${leftNeck} ${cy + safeHb} Z`
  }
  if (arrowVariant === 'double-vertical') {
    const topNeck = headLength; const bottomNeck = height - headLength
    if (bottomNeck <= topNeck + 4) return `M ${cx} 0 L ${cx + safeHb} ${cy} L ${cx} ${height} L ${cx - safeHb} ${cy} Z`
    return `M ${cx} 0 L ${cx + safeHb} ${topNeck} L ${cx + sb} ${topNeck} L ${cx + sb} ${bottomNeck} L ${cx + safeHb} ${bottomNeck} L ${cx} ${height} L ${cx - safeHb} ${bottomNeck} L ${cx - sb} ${bottomNeck} L ${cx - sb} ${topNeck} L ${cx - safeHb} ${topNeck} Z`
  }
  if (arrowVariant === 'chevron') {
    const tailNotch = clamp(headLength * 0.5, 8, 40)
    const neck = width - headLength
    if (neck <= 2) return `M 0 ${cy} L ${width} ${cy - safeHb} L ${width} ${cy + safeHb} Z`
    return `M 0 ${cy - sb} L ${neck} ${cy - sb} L ${width} ${cy} L ${neck} ${cy + sb} L 0 ${cy + sb} L ${tailNotch} ${cy} Z`
  }
  if (arrowVariant === 'block') {
    const neck = width - headLength
    if (neck <= 2) return `M 0 ${cy - safeHb} L ${width} ${cy} L 0 ${cy + safeHb} Z`
    return `M 0 ${cy - safeHb} L ${neck} ${cy - safeHb} L ${width} ${cy} L ${neck} ${cy + safeHb} L 0 ${cy + safeHb} Z`
  }
  if (arrowVariant === 'tapered') {
    const neck = width - headLength
    const tail = clamp(shaftBreadth * 0.4, 2, 18)
    if (neck <= 2) return `M 0 ${cy} L ${width} ${cy - safeHb} L ${width} ${cy + safeHb} Z`
    return `M 0 ${cy - tail} L ${neck} ${cy - safeHb} L ${width} ${cy} L ${neck} ${cy + safeHb} L 0 ${cy + tail} Z`
  }
  // Fallback → 'right'
  const neck = width - headLength
  if (neck <= 2) return `M 0 ${cy} L ${width} ${cy - safeHb} L ${width} ${cy + safeHb} Z`
  return `M 0 ${cy - sb} L ${neck} ${cy - sb} L ${neck} ${cy - safeHb} L ${width} ${cy} L ${neck} ${cy + safeHb} L ${neck} ${cy + sb} L 0 ${cy + sb} Z`
}

// ─── Fill props (solid / gradient) ───────────────────────────────────────────

export const getShapeFillProps = (item) => {
  if (item.fill === null || item.fill === 'transparent') return { fillEnabled: false }

  if (item.gradientType === 'linear' && item.gradientStops?.length >= 2) {
    const angle = (item.gradientAngle || 90) * (Math.PI / 180)
    return {
      fillEnabled: true,
      fillLinearGradientStartPoint: { x: item.w / 2 - (Math.cos(angle) * item.w) / 2, y: item.h / 2 - (Math.sin(angle) * item.h) / 2 },
      fillLinearGradientEndPoint:   { x: item.w / 2 + (Math.cos(angle) * item.w) / 2, y: item.h / 2 + (Math.sin(angle) * item.h) / 2 },
      fillLinearGradientColorStops: item.gradientStops.flatMap((s) => [s.offset, s.color]),
    }
  }
  if (item.gradientType === 'radial' && item.gradientStops?.length >= 2) {
    return {
      fillEnabled: true,
      fillRadialGradientStartPoint:  { x: item.w / 2, y: item.h / 2 },
      fillRadialGradientEndPoint:    { x: item.w / 2, y: item.h / 2 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius:   Math.max(item.w, item.h) / 2,
      fillRadialGradientColorStops:  item.gradientStops.flatMap((s) => [s.offset, s.color]),
    }
  }
  return { fill: item.fill || '#a78bfa', fillEnabled: true }
}

// ─── Text bounds inside shapes ────────────────────────────────────────────────

export const getShapeTextBounds = (item) => {
  const { w, h, shapeType, sides, arrowVariant, cornerRadius = 0 } = item
  const basePad = 8

  if (shapeType === 'rect') {
    const pad = basePad + cornerRadius * 0.15
    return { x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }
  }
  if (shapeType === 'circle' || shapeType === 'ellipse') {
    const textW = (w / Math.SQRT2) * 0.9
    const textH = (h / Math.SQRT2) * 0.9
    return { x: (w - textW) / 2, y: (h - textH) / 2, width: Math.max(1, textW), height: Math.max(1, textH) }
  }
  if (shapeType === 'polygon') {
    if (sides === 3) {
      const textW = w * 0.48; const textH = h * 0.28
      return { x: (w - textW) / 2, y: (h - textH) / 2 + h * 0.06, width: Math.max(1, textW), height: Math.max(1, textH) }
    }
    if (sides === 4) {
      const size = Math.min(w, h) * 0.48
      return { x: (w - size) / 2, y: (h - size) / 2, width: Math.max(1, size), height: Math.max(1, size) }
    }
    const insetRatio = sides === 5 ? 0.22 : sides === 6 ? 0.15 : 0.1
    const pad = Math.min(w, h) * insetRatio
    return { x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }
  }
  if (shapeType === 'star') {
    const innerRatio = item.starInnerRatio ?? 0.28
    const innerRadius = Math.min(w, h) * innerRatio
    return { x: w / 2 - innerRadius, y: h / 2 - innerRadius, width: Math.max(1, innerRadius * 2), height: Math.max(1, innerRadius * 2) }
  }
  if (shapeType === 'arrow-shape') {
    const isVertical = ['up', 'down', 'double-vertical'].includes(arrowVariant)
    const isDouble   = ['double-horizontal', 'double-vertical'].includes(arrowVariant)
    const length     = isVertical ? h : w
    const thickness  = isVertical ? w : h
    const headLengthRaw = Math.sqrt(length / 200) * 80 * 0.28 * 3.5
    const headLength    = Math.min(72, Math.min(headLengthRaw, length * 0.45))
    const shaftBreadth  = Math.max(16, thickness * 0.38)
    const isHeadAtStart = arrowVariant === 'left' || arrowVariant === 'up'

    if (isVertical) {
      const topPad    = isDouble || isHeadAtStart  ? headLength : basePad
      const bottomPad = isDouble || !isHeadAtStart ? headLength : basePad
      const textW = Math.max(1, shaftBreadth * 0.76)
      const textH = Math.max(1, h - topPad - bottomPad - basePad * 2)
      return { x: (w - textW) / 2, y: topPad + basePad, width: Math.max(1, textW), height: textH }
    }
    const leftPad  = isDouble || isHeadAtStart  ? headLength : basePad
    const rightPad = isDouble || !isHeadAtStart ? headLength : basePad
    const verticalInset = arrowVariant === 'chevron' || arrowVariant === 'tapered'
      ? Math.max(basePad, (h - shaftBreadth * 0.68) / 2)
      : Math.max(basePad, (h - shaftBreadth * 0.76) / 2)
    const textH = Math.max(1, h - verticalInset * 2)

    if (arrowVariant === 'chevron' || arrowVariant === 'tapered') {
      const bodyStart = arrowVariant === 'chevron'
        ? Math.max(headLength * 0.48, w * 0.16)
        : Math.max(headLength * 0.6,  w * 0.18)
      const bodyEnd = Math.max(bodyStart + 1, w - headLength * 0.82)
      return { x: bodyStart, y: verticalInset, width: Math.max(1, bodyEnd - bodyStart), height: textH }
    }
    return { x: leftPad + basePad, y: verticalInset, width: Math.max(1, w - leftPad - rightPad - basePad * 2), height: textH }
  }
  return { x: basePad, y: basePad, width: Math.max(1, w - basePad * 2), height: Math.max(1, h - basePad * 2) }
}

// ─── Minimum size for text ────────────────────────────────────────────────────

export const getShapeMinSizeForText = (item, textValue, fontSize) => {
  const charWidth  = fontSize * 0.6
  const lineHeight = fontSize * 1.35
  const lines      = (textValue || '').split('\n')
  const maxLineChars       = Math.max(...lines.map((l) => l.length), 1)
  const estimatedTextWidth  = maxLineChars * charWidth
  const estimatedTextHeight = lines.length * lineHeight
  const { shapeType, sides, arrowVariant } = item

  if (shapeType === 'rect') {
    const pad = 16 + (item.cornerRadius || 0) * 0.3
    return { minW: estimatedTextWidth + pad * 2, minH: estimatedTextHeight + pad * 2 }
  }
  if (shapeType === 'circle' || shapeType === 'ellipse') {
    const needed = Math.sqrt(estimatedTextWidth ** 2 + estimatedTextHeight ** 2) / 0.9
    return { minW: needed, minH: needed }
  }
  if (shapeType === 'polygon' && sides === 3)
    return { minW: Math.max(estimatedTextWidth / 0.44 + 32, 80), minH: Math.max(estimatedTextHeight / 0.32 + estimatedTextHeight * 0.55 + 16, 80) }
  if (shapeType === 'polygon' && sides === 4) {
    const size = Math.max(estimatedTextWidth, estimatedTextHeight) / 0.48 + 16
    return { minW: size, minH: size }
  }
  if (shapeType === 'polygon') {
    const insetRatio = sides === 5 ? 0.22 : sides === 6 ? 0.15 : 0.1
    const factor     = 1 - insetRatio * 2
    return { minW: estimatedTextWidth / factor + 16, minH: estimatedTextHeight / factor + 16 }
  }
  if (shapeType === 'star') {
    const innerRatio = item.starInnerRatio ?? 0.28
    const needed = Math.max(estimatedTextWidth, estimatedTextHeight) / innerRatio / 2 + 16
    return { minW: needed, minH: needed }
  }
  if (shapeType === 'arrow-shape') {
    const isVertical = ['up', 'down', 'double-vertical'].includes(arrowVariant)
    if (isVertical) return { minW: Math.max(item.w || 72, estimatedTextWidth * 1.3 + 16), minH: Math.max(item.h || 80, estimatedTextHeight + 80) }
    return { minW: Math.max(item.w || 80, estimatedTextWidth + 80), minH: Math.max(item.h || 72, estimatedTextHeight * 1.3 + 16) }
  }
  return { minW: estimatedTextWidth + 32, minH: estimatedTextHeight + 32 }
}

// ─── Wrap height estimation ───────────────────────────────────────────────────

export const getWrappedTextHeight = (textValue, fontSize, availableWidth) => {
  const safeWidth  = Math.max(1, availableWidth)
  const charWidth  = fontSize * 0.6
  const lineHeight = fontSize * 1.35
  const lines      = (textValue || '').split('\n')
  const visualLineCount = lines.reduce((count, line) => {
    const estimatedWidth = Math.max(charWidth, line.length * charWidth)
    return count + Math.max(1, Math.ceil(estimatedWidth / safeWidth))
  }, 0)
  return Math.max(lineHeight, visualLineCount * lineHeight)
}

export const getShapeMinHeightForTextWidth = (item, textValue, fontSize, width) => {
  if (!textValue) return item.h
  let targetHeight = Math.max(40, item.h)
  for (let i = 0; i < 8; i++) {
    const bounds        = getShapeTextBounds({ ...item, w: width, h: targetHeight })
    const contentHeight = getWrappedTextHeight(textValue, fontSize, bounds.width)
    if (bounds.height >= contentHeight) return targetHeight
    const deficit = contentHeight - bounds.height
    targetHeight += Math.max(deficit + fontSize * 0.75, fontSize)
  }
  return targetHeight
}

// ─── Resize helpers ───────────────────────────────────────────────────────────

export const getShapeResizeSize = (item, requestedWidth, requestedHeight, isFreeResize = false) => {
  const minSize = item.shapeType === 'arrow-shape' ? 32 : 40
  let w = Math.max(minSize, requestedWidth)
  let h = Math.max(minSize, requestedHeight)

  if (item.shapeType === 'circle') {
    const size = Math.max(w, h)
    return { w: size, h: size }
  }
  if (!isFreeResize && ['ellipse', 'polygon', 'star'].includes(item.shapeType)) {
    const aspectRatio = item.shapeAspectRatio || (item.w && item.h ? item.w / item.h : 1)
    if (aspectRatio >= 1) { h = w / aspectRatio } else { w = h * aspectRatio }
  }
  return { w, h }
}

export const getArrowResizeSize = (item, requestedWidth, requestedHeight, activeAnchor) => {
  const isVerticalArrow = ['up', 'down', 'double-vertical'].includes(item.arrowVariant)
  const isDoubleArrow   = ['double-horizontal', 'double-vertical'].includes(item.arrowVariant)
  const MIN_LENGTH    = isDoubleArrow ? 56 : 36
  const MIN_THICKNESS = 20

  if (isVerticalArrow) {
    const h = Math.max(MIN_LENGTH,    requestedHeight)
    const w = Math.max(MIN_THICKNESS, requestedWidth)
    if (activeAnchor === 'middle-left'  || activeAnchor === 'middle-right')  return { w, h: item.h }
    if (activeAnchor === 'top-center'   || activeAnchor === 'bottom-center') return { w: item.w, h }
    return { w, h }
  }
  const w = Math.max(MIN_LENGTH,    requestedWidth)
  const h = Math.max(MIN_THICKNESS, requestedHeight)
  if (activeAnchor === 'middle-left'  || activeAnchor === 'middle-right')  return { w, h: item.h }
  if (activeAnchor === 'top-center'   || activeAnchor === 'bottom-center') return { w: item.w, h }
  return { w, h }
}