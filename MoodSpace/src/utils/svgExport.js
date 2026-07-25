import { getArrowShapePath } from './shapeUtils'

export function generateSvgString(items, { width, height, background }) {
  const visibleItems = items.filter((i) => i.visible !== false && !i.isAdjustmentLayer)
  const groups = {}
  const ungrouped = []
  for (const item of visibleItems) {
    if (item.groupId && !item.compositeMode) {
      if (!groups[item.groupId]) groups[item.groupId] = []
      groups[item.groupId].push(item)
    } else {
      ungrouped.push(item)
    }
  }

  const defs = []
  const elements = []

  renderBackground(elements, defs, width, height, background)

  for (const item of ungrouped) {
    elements.push(renderItemSvg(item, defs))
  }
  for (const [gid, gitems] of Object.entries(groups)) {
    elements.push(`<g id="group-${gid}">`)
    for (const item of gitems) {
      elements.push(renderItemSvg(item, defs))
    }
    elements.push('</g>')
  }

  const defsSection = defs.length ? `<defs>\n${defs.join('\n')}\n</defs>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${defsSection}
  ${elements.join('\n')}
</svg>`
}

function renderBackground(elements, defs, w, h, bg) {
  if (!bg || bg.type === 'transparent' || bg.type === 'none') return
  if (bg.type === 'solid' || !bg.type) {
    elements.push(`<rect x="0" y="0" width="${w}" height="${h}" fill="${esc(bg.color || '#ffffff')}" />`)
  } else if (bg.type === 'gradient') {
    const angle = ((bg.angle ?? 90) * Math.PI) / 180
    const id = 'bg-grad'
    defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${toFixed(cos(angle))}" y2="${toFixed(sin(angle))}">
  <stop offset="0%" stop-color="${esc(bg.from || '#ffffff')}" />
  <stop offset="100%" stop-color="${esc(bg.to || '#d8d2ff')}" />
</linearGradient>`)
    elements.push(`<rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id})" />`)
  }
}

function renderItemSvg(item, defs) {
  const sx = item.scaleX || 1
  const sy = item.scaleY || 1
  const fw = item.w * sx
  const fh = item.h * sy
  const cx = item.w / 2
  const cy = item.h / 2

  const parts = [`translate(${toFixed(item.x)},${toFixed(item.y)})`]
  if (item.rotation) {
    parts.push(`rotate(${toFixed(item.rotation)},${toFixed(cx * sx)},${toFixed(cy * sy)})`)
  }
  const transformStr = parts.join(' ')

  const styleParts = []
  if (item.opacity !== undefined && item.opacity !== 1) {
    styleParts.push(`opacity:${item.opacity}`)
  }
  if (item.compositeBlendMode && item.compositeBlendMode !== 'source-over') {
    const css = gcoToCssBlendMode(item.compositeBlendMode)
    if (css) styleParts.push(`mix-blend-mode:${css}`)
  }
  const styleStr = styleParts.length ? ` style="${styleParts.join(';')}"` : ''

  const filterAttr = buildDropShadow(item, defs)

  let inner
  if (item.kind === 'text') {
    inner = renderText(item, fw, fh)
  } else if (item.kind === 'shape') {
    inner = renderShape(item, fw, fh, defs)
  }
  if (!inner) return ''

  return `<g transform="${transformStr}"${styleStr}${filterAttr}>
  ${indent(inner, 2)}
</g>`
}

function renderShape(item, fw, fh, defs) {
  const fill = getSvgFill(item, defs)
  const stroke = getSvgStroke(item)
  const ct = item.shapeType

  if (ct === 'rect') {
    return `<rect x="0" y="0" width="${fw}" height="${fh}" rx="${item.cornerRadius || 0}"${fill}${stroke} />`
  }
  if (ct === 'circle') {
    const r = Math.min(fw, fh) / 2
    return `<circle cx="${fw / 2}" cy="${fh / 2}" r="${r}"${fill}${stroke} />`
  }
  if (ct === 'ellipse') {
    return `<ellipse cx="${fw / 2}" cy="${fh / 2}" rx="${fw / 2}" ry="${fh / 2}"${fill}${stroke} />`
  }
  if (ct === 'polygon') {
    const pts = getRegularPolygonPoints(fw, fh, item.sides || 3)
    return `<polygon points="${pts}"${fill}${stroke} />`
  }
  if (ct === 'star') {
    const pts = getStarPoints(fw, fh, item.numPoints || 5, item.starInnerRatio ?? 0.25)
    return `<polygon points="${pts}"${fill}${stroke} />`
  }
  if (ct === 'arrow-shape') {
    const d = getArrowShapePath({ w: item.w, h: item.h, arrowVariant: item.arrowVariant })
    return `<path d="${d}"${fill}${stroke} />`
  }
  if (ct === 'arrow') {
    const pts = item.points || [0, fh / 2, fw, fh / 2]
    return buildArrowPath(pts, item.pointerLength || 20, item.pointerWidth || 20, item.stroke || item.fill || '#000000')
  }
  if (ct === 'line') {
    const pts = item.points || [0, fh / 2, fw, fh / 2]
    return `<line x1="${pts[0]}" y1="${pts[1]}" x2="${pts[2]}" y2="${pts[3]}"${stroke} />`
  }
  if (ct === 'freehand') {
    if (item.strokes) {
      return item.strokes.map((sp) => {
        const d = pointsToSvgPath(sp)
        return `<path d="${d}"${stroke} fill="none" />`
      }).join('\n')
    }
    const d = pointsToSvgPath(item.points || [])
    return `<path d="${d}"${stroke} fill="none" />`
  }
  if (ct === 'bezier-path') {
    const d = buildBezierDisplayPath(item)
    return `<path d="${d}"${fill}${stroke} />`
  }
  return ''
}

function renderText(item, fw, fh) {
  const fontFamily = esc(item.fontFamily || 'Inter, Arial')
  const fontSize = item.fontSize || 24
  const align = item.align || 'left'
  const anchorMap = { left: 'start', center: 'middle', right: 'end' }
  const anchor = anchorMap[align] || 'start'
  const textX = align === 'center' ? fw / 2 : align === 'right' ? fw : 0
  const fontWeight = item.isBold ? 'bold' : 'normal'
  const fontStyle = item.isItalic ? 'italic' : 'normal'
  const textDeco = item.isUnderline ? 'underline' : 'none'

  const runs = item.runs && item.runs.length > 0 ? item.runs : [
    { text: item.text || '', bold: item.isBold, italic: item.isItalic, underline: item.isUnderline },
  ]

  let tspans = ''
  for (const run of runs) {
    const rfw = run.fontWeight || (run.bold ? 'bold' : fontWeight)
    const rfs = run.fontStyle || (run.italic ? 'italic' : fontStyle)
    const rtd = run.underline ? 'underline' : textDeco
    const rff = run.fontFamily || fontFamily
    const rfsz = run.fontSize || fontSize
    let attrs = ''
    if (rfw !== 'normal') attrs += ` font-weight="${rfw}"`
    if (rfs !== 'normal') attrs += ` font-style="${rfs}"`
    if (rtd !== 'none') attrs += ` text-decoration="${rtd}"`
    if (rff !== fontFamily) attrs += ` font-family="${esc(rff)}"`
    if (rfsz !== fontSize) attrs += ` font-size="${rfsz}"`
    tspans += `<tspan${attrs}>${escXml(run.text || '')}</tspan>`
  }

  return `<text x="${textX}" y="0" font-family="${fontFamily}" font-size="${fontSize}" fill="${esc(item.fill || '#2b2830')}" text-anchor="${anchor}" dominant-baseline="hanging" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDeco}">${tspans}</text>`
}

function getSvgFill(item, defs) {
  if (item.fill === null || item.fill === 'transparent' || item.fill === 'none') return ''
  if (item.gradientType === 'linear' && item.gradientStops?.length >= 2) {
    const id = `fill-grad-${item.id}`
    const angle = (item.gradientAngle || 90) * (Math.PI / 180)
    const c = Math.cos(angle); const s = Math.sin(angle)
    const cx = item.w / 2; const cy = item.h / 2
    defs.push(`<linearGradient id="${id}" x1="${toFixed(cx - c * cx)}" y1="${toFixed(cy - s * cy)}" x2="${toFixed(cx + c * cx)}" y2="${toFixed(cy + s * cy)}">
  ${item.gradientStops.map((st) => `<stop offset="${Math.round(st.offset * 100)}%" stop-color="${esc(st.color)}" />`).join('\n')}
</linearGradient>`)
    return ` fill="url(#${id})"`
  }
  if (item.gradientType === 'radial' && item.gradientStops?.length >= 2) {
    const id = `fill-rgrad-${item.id}`
    defs.push(`<radialGradient id="${id}" cx="50%" cy="50%" r="50%">
  ${item.gradientStops.map((st) => `<stop offset="${Math.round(st.offset * 100)}%" stop-color="${esc(st.color)}" />`).join('\n')}
</radialGradient>`)
    return ` fill="url(#${id})"`
  }
  return ` fill="${esc(item.fill || '#a78bfa')}"`
}

function getSvgStroke(item) {
  if (!item.stroke && !item.strokeWidth) return ''
  const sw = item.strokeWidth || 0
  let s = ` stroke="${esc(item.stroke || '#000000')}" stroke-width="${sw}"`
  if (item.dash) s += ` stroke-dasharray="${item.dash.join(',')}"`
  if (item.lineCap) s += ` stroke-linecap="${item.lineCap}"`
  return s
}

function buildDropShadow(item, defs) {
  if (!item.shadowEnabled || !item.shadowColor || !item.shadowBlur) return ''
  const dx = item.shadowOffsetX || 0
  const dy = item.shadowOffsetY || 0
  const blur = item.shadowBlur || 4
  const opacity = item.shadowOpacity ?? 1
  const key = `${item.shadowColor}_${dx}_${dy}_${blur}_${opacity}`
  const fid = `shadow-${key.replace(/[^a-z0-9]/gi, '-')}`
  if (!defs.find((d) => d.includes(`id="${fid}"`))) {
    defs.push(`<filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%">
  <feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur / 2}" flood-color="${esc(item.shadowColor)}" flood-opacity="${opacity}" />
</filter>`)
  }
  return ` filter="url(#${fid})"`
}

function buildArrowPath(points, pointerLength, pointerWidth, strokeColor) {
  if (!points || points.length < 4) return ''
  const x1 = points[0]; const y1 = points[1]; const x2 = points[2]; const y2 = points[3]
  const dx = x2 - x1; const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return ''
  const ux = dx / len; const uy = dy / len
  const px = -uy; const py = ux
  const pl = Math.min(pointerLength || 20, len * 0.5)
  const pw = (pointerWidth || 20) / 2
  const nx = x2 - ux * pl; const ny = y2 - uy * pl
  return `<polygon points="${toFixed(x1)},${toFixed(y1)} ${toFixed(x2)},${toFixed(y2)} ${toFixed(nx + px * pw)},${toFixed(ny + py * pw)} ${toFixed(nx)},${toFixed(ny)} ${toFixed(nx - px * pw)},${toFixed(ny - py * pw)}" fill="${esc(strokeColor)}" />`
}

function buildBezierDisplayPath(item) {
  const pts = []
  const parts = item.path?.match(/[ML]\s+([\d.]+)\s*,\s*([\d.]+)/g)
  if (!parts || parts.length < 2) return item.path || ''
  for (const p of parts) {
    const m = p.match(/[ML]\s+([\d.]+)\s*,\s*([\d.]+)/)
    if (m) pts.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) })
  }
  const cp = item.bezierData
  const n = pts.length
  let result = `M ${toFixed(pts[0].x)},${toFixed(pts[0].y)}`
  for (let i = 0; i < n; i++) {
    const curr = pts[i]; const next = pts[(i + 1) % n]
    const cpo = cp?.[i]; const cpi = cp?.[(i + 1) % n]
    const hasCurve = cpo && cpi && (cpo.cpOutX || cpo.cpOutY || cpi.cpInX || cpi.cpInY)
    if (hasCurve) {
      result += ` C ${toFixed(curr.x + cpo.cpOutX)},${toFixed(curr.y + cpo.cpOutY)} ${toFixed(next.x + cpi.cpInX)},${toFixed(next.y + cpi.cpInY)} ${toFixed(next.x)},${toFixed(next.y)}`
    } else {
      result += ` L ${toFixed(next.x)},${toFixed(next.y)}`
    }
  }
  return result + ' Z'
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function indent(str, n) {
  const pad = '  '.repeat(n)
  return str.split('\n').map((l) => pad + l).join('\n')
}

function toFixed(v) {
  return Number(v).toFixed(2)
}

function cos(a) { return Math.cos(a) }
function sin(a) { return Math.sin(a) }

function getRegularPolygonPoints(w, h, sides) {
  const cx = w / 2; const cy = h / 2
  const r = Math.min(w, h) / 2
  const step = (2 * Math.PI) / sides
  const pts = []
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + i * step
    pts.push(`${toFixed(cx + r * Math.cos(a))},${toFixed(cy + r * Math.sin(a))}`)
  }
  return pts.join(' ')
}

function getStarPoints(w, h, numPoints, innerRatio) {
  const cx = w / 2; const cy = h / 2
  const baseSize = Math.min(w, h)
  const outerR = baseSize / 2
  const innerR = baseSize * innerRatio
  const step = Math.PI / numPoints
  const pts = []
  for (let i = 0; i < numPoints * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = -Math.PI / 2 + i * step
    pts.push(`${toFixed(cx + r * Math.cos(a))},${toFixed(cy + r * Math.sin(a))}`)
  }
  return pts.join(' ')
}

function pointsToSvgPath(points) {
  if (!points || points.length < 2) return ''
  let d = `M ${points[0]} ${points[1]}`
  for (let i = 2; i < points.length; i += 2) {
    d += ` L ${points[i]} ${points[i + 1]}`
  }
  return d
}

function gcoToCssBlendMode(gco) {
  const map = {
    'source-over': null, multiply: 'multiply', screen: 'screen', overlay: 'overlay',
    darken: 'darken', lighten: 'lighten', 'color-dodge': 'color-dodge',
    'color-burn': 'color-burn', 'hard-light': 'hard-light', 'soft-light': 'soft-light',
    difference: 'difference', exclusion: 'exclusion', hue: 'hue',
    saturation: 'saturation', color: 'color', luminosity: 'luminosity',
  }
  return map[gco] || null
}
