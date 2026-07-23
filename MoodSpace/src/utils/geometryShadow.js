import { getArrowShapePath } from './shapeUtils'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#050505')
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [5, 5, 5]
}

export function isEffectivelyFillNone(item) {
  if (item.kind === 'image') return false
  return (
    item.fill === null || item.fill === undefined || item.fill === '' ||
    item.fill === 'transparent' || item.fill === 'none' ||
    item.fillOpacity === 0
  )
}

function drawShapePath(ctx, item) {
  const { w, h } = item

  switch (item.shapeType) {
    case 'rect': {
      const r = item.cornerRadius || 0
      if (r > 0) {
        ctx.roundRect(0, 0, w, h, Math.min(r, Math.min(w, h) / 2))
      } else {
        ctx.rect(0, 0, w, h)
      }
      ctx.fill()
      ctx.stroke()
      break
    }
    case 'circle':
    case 'ellipse': {
      ctx.beginPath()
      ctx.ellipse(w / 2, h / 2, Math.max(0.5, w / 2), Math.max(0.5, h / 2), 0, 0, Math.PI * 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
    }
    case 'polygon': {
      const sides = item.sides || 3
      const cx = w / 2, cy = h / 2
      const radius = Math.min(w, h) / 2
      ctx.beginPath()
      for (let i = 0; i < sides; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides
        const px = cx + Math.cos(angle) * radius
        const py = cy + Math.sin(angle) * radius
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
    }
    case 'star': {
      const numPoints = item.numPoints || 5
      const innerRatio = item.starInnerRatio ?? 0.25
      const cx = w / 2, cy = h / 2
      const outerRadius = Math.min(w, h) / 2
      const innerRadius = outerRadius * innerRatio
      const total = numPoints * 2
      ctx.beginPath()
      for (let i = 0; i < total; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / total
        const px = cx + Math.cos(angle) * radius
        const py = cy + Math.sin(angle) * radius
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
    }
    case 'arrow-shape': {
      const svgPath = getArrowShapePath({ w, h, arrowVariant: item.arrowVariant || 'right' })
      const path = new Path2D(svgPath)
      ctx.beginPath()
      ctx.fill(path)
      ctx.stroke(path)
      break
    }
    case 'arrow': {
      const svgPath = getArrowShapePath({ w, h, arrowVariant: item.arrowVariant || 'right' })
      const path = new Path2D(svgPath)
      ctx.beginPath()
      ctx.fill(path)
      ctx.stroke(path)
      break
    }
    case 'line': {
      const pts = item.points || []
      if (pts.length < 2) break
      ctx.beginPath()
      ctx.moveTo(pts[0], pts[1])
      for (let i = 2; i < pts.length; i += 2) {
        ctx.lineTo(pts[i], pts[i + 1])
      }
      ctx.stroke()
      break
    }
    case 'freehand': {
      const strokes = item.strokes || (item.points ? [item.points] : [])
      for (const sp of strokes) {
        if (!sp || sp.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(sp[0], sp[1])
        for (let i = 2; i < sp.length; i += 2) {
          ctx.lineTo(sp[i], sp[i + 1])
        }
        ctx.stroke()
      }
      break
    }
    case 'bezier-path': {
      const d = item.path || ''
      if (!d) break
      const path = new Path2D(d)
      ctx.beginPath()
      ctx.fill(path)
      ctx.stroke(path)
      break
    }
    default:
      ctx.rect(0, 0, w, h)
      ctx.fill()
      ctx.stroke()
  }
}

export function generateGeometryShadowCanvas(item) {
  const { w, h } = item
  if (!w || !h || w <= 0 || h <= 0) return null

  const blur = Math.max(0, item.shadow ?? 0)
  const ox = item.shadowOffsetX ?? 0
  const oy = item.shadowOffsetY ?? 0
  const sw = Math.max(0, item.strokeWidth ?? 0)

  // Generous pad that accounts for blur kernel spread (3σ) + offset +
  // stroke width + safe margin. Matches Bevel & Emboss minimum (10).
  const pad = Math.max(10, Math.ceil(blur * 2 + sw + Math.abs(ox) + Math.abs(oy) + 10))
  const cw = Math.ceil(w) + pad * 2
  const ch = Math.ceil(h) + pad * 2
  if (cw <= 0 || ch <= 0) return null

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.save()
  ctx.translate(pad, pad)

  ctx.fillStyle = '#ffffff'
  if ((item.strokeWidth ?? 0) > 0 && item.strokeEnabled !== false) {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = sw
    ctx.lineJoin = 'round'
  } else {
    ctx.strokeStyle = 'transparent'
    ctx.lineWidth = 0
  }

  drawShapePath(ctx, item)
  ctx.restore()

  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = cw
  blurCanvas.height = ch
  const blurCtx = blurCanvas.getContext('2d')
  if (!blurCtx) return canvas

  if (blur > 0) {
    blurCtx.filter = `blur(${blur}px)`
  }
  blurCtx.drawImage(canvas, 0, 0)

  const imageData = blurCtx.getImageData(0, 0, cw, ch)
  const data = imageData.data
  const [sr, sg, sb] = hexToRgb(item.shadowColor)
  const alpha = item.shadowOpacity ?? 0.35

  for (let i = 0; i < data.length; i += 4) {
    const srcAlpha = data[i + 3]
    if (srcAlpha > 0) {
      data[i] = sr
      data[i + 1] = sg
      data[i + 2] = sb
      data[i + 3] = Math.round(srcAlpha * alpha)
    }
  }

  blurCtx.putImageData(imageData, 0, 0)
  return blurCanvas
}

function renderTextRun(ctx, text, x, y, font, sw, hasStroke) {
  ctx.font = font
  ctx.fillStyle = '#ffffff'
  if (hasStroke) {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = sw
    ctx.lineJoin = 'round'
    ctx.strokeText(text, x, y)
  }
  ctx.fillText(text, x, y)
}

function scanPixelBounds(ctx, cw, ch) {
  const imageData = ctx.getImageData(0, 0, cw, ch)
  const data = imageData.data
  let minX = cw, minY = ch, maxX = -1, maxY = -1
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (data[(y * cw + x) * 4 + 3] > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0 || maxY < 0) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

export function generateTextGeometryShadowCanvas(item, contentH, textWidth) {
  const { w, h, shadow, shadowColor, shadowOpacity, shadowOffsetX, shadowOffsetY,
          strokeWidth, strokeEnabled } = item
  const text = item.text || ''
  if (!text) return null

  // --- Phase 1: measurement canvas ----------------------------------------------------
  // Render text to a generous temp canvas, then pixel-scan to find the EXACT
  // bounding box of the rendered glyphs (including stroke). This eliminates
  // font-metric drift between canvas 2D and Konva (ascent/descent/baseline
  // differences, stroke-extension, etc.).

  const effectiveH = contentH ?? h ?? Math.ceil((item.fontSize || 48) * 1.5)
  const renderW = (textWidth && textWidth > 0) ? textWidth : Math.ceil(w || effectiveH * 3)

  const blur = Math.max(0, shadow ?? 0)
  const ox = shadowOffsetX ?? 0
  const oy = shadowOffsetY ?? 0
  const sw = Math.max(0, strokeWidth ?? 0)
  const hasSt = (sw > 0) && strokeEnabled !== false

  // Generous measurement canvas — large enough so the rendered text is never
  // clipped. We'll crop to the actual pixel bounds afterwards.
  const measCanvas = document.createElement('canvas')
  measCanvas.width = Math.max(1, Math.ceil(renderW + (sw * 2) + 20))
  measCanvas.height = Math.max(1, Math.ceil((effectiveH || renderW) + (sw * 2) + 40))
  const measCtx = measCanvas.getContext('2d')
  if (!measCtx) return null

  measCtx.save()
  // Render at center of measurement canvas — gives breathing room in all
  // directions so the pixel scan captures the full glyph including stroke.
  const measCX = measCanvas.width / 2
  const measCY = measCanvas.height / 2

  const ls = item.effects?.letterSpacing
  if (ls && typeof measCtx.letterSpacing !== 'undefined') {
    measCtx.letterSpacing = `${ls}px`
  }

  const align = item.align || 'center'
  const defaultFont = `${item.fontStyle || 'normal'} ${item.fontSize || 48}px ${item.fontFamily || 'Inter, Arial'}`

  if (item.runs && item.runs.length > 1) {
    measCtx.textAlign = 'left'
    measCtx.textBaseline = 'middle'
    let cx = 0, cy = measCY
    const runs = item.runs
    const meas = document.createElement('canvas').getContext('2d')
    let totalW = 0
    for (const run of runs) {
      const runText = text.substring(run.start, run.end)
      meas.font = `${run.fontStyle || 'normal'} ${run.fontSize || item.fontSize || 48}px ${run.fontFamily || item.fontFamily || 'Inter, Arial'}`
      totalW += Math.ceil(meas.measureText(runText).width)
    }
    // Align runs within renderW as Konva would.
    if (align === 'center') {
      cx = measCX - totalW / 2
    } else if (align === 'right') {
      cx = measCX + renderW / 2 - totalW
    } else {
      cx = measCX - renderW / 2
    }
    for (const run of runs) {
      const runText = text.substring(run.start, run.end)
      const font = `${run.fontStyle || 'normal'} ${run.fontSize || item.fontSize || 48}px ${run.fontFamily || item.fontFamily || 'Inter, Arial'}`
      renderTextRun(measCtx, runText, cx, cy, font, sw, hasSt)
      meas.font = font
      cx += Math.ceil(meas.measureText(runText).width)
    }
  } else {
    measCtx.textBaseline = 'middle'
    if (align === 'center') {
      measCtx.textAlign = 'center'
      renderTextRun(measCtx, text, measCX, measCY, defaultFont, sw, hasSt)
    } else if (align === 'right') {
      measCtx.textAlign = 'right'
      renderTextRun(measCtx, text, measCX + renderW / 2, measCY, defaultFont, sw, hasSt)
    } else {
      measCtx.textAlign = 'left'
      renderTextRun(measCtx, text, measCX - renderW / 2, measCY, defaultFont, sw, hasSt)
    }
  }
  measCtx.restore()

  // --- Phase 2: pixel-scan for tight bounds -------------------------------------------
  const bounds = scanPixelBounds(measCtx, measCanvas.width, measCanvas.height)
  if (!bounds) return null

  const textPixelW = bounds.w
  const textPixelH = bounds.h

  // --- Phase 3: final shadow canvas (tight bounds + pad) ------------------------------
  const pad = Math.max(10, Math.ceil(blur * 2 + Math.abs(ox) + Math.abs(oy) + 10))
  const cw = textPixelW + pad * 2
  const ch = textPixelH + pad * 2
  if (cw <= 0 || ch <= 0) return null

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Copy the tight-pixel region from the measurement canvas into the final
  // canvas positioned at (pad, pad). The glyph's visual top-left corner now
  // lives at canvas pixel (pad, pad), so the overlay Image needs to be at
  // (ox + textRect.x - pad, oy + textRect.y - pad) to align with Konva's
  // getClientRect() position.
  ctx.drawImage(measCanvas, bounds.x, bounds.y, textPixelW, textPixelH, pad, pad, textPixelW, textPixelH)

  // --- Phase 4: blur + colorize -------------------------------------------------------
  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = cw
  blurCanvas.height = ch
  const blurCtx = blurCanvas.getContext('2d')
  if (!blurCtx) return canvas

  if (blur > 0) {
    blurCtx.filter = `blur(${blur}px)`
  }
  blurCtx.drawImage(canvas, 0, 0)

  const imageData = blurCtx.getImageData(0, 0, cw, ch)
  const data = imageData.data
  const [sr, sg, sb] = hexToRgb(shadowColor)
  const alpha = shadowOpacity ?? 0.35

  for (let i = 0; i < data.length; i += 4) {
    const srcAlpha = data[i + 3]
    if (srcAlpha > 0) {
      data[i] = sr
      data[i + 1] = sg
      data[i + 2] = sb
      data[i + 3] = Math.round(srcAlpha * alpha)
    }
  }

  blurCtx.putImageData(imageData, 0, 0)
  return blurCanvas
}
