function renderTextToCanvas(text, fontFamily, fontSize, fontStyle, fill, stroke, strokeWidth, w, h) {
  const pad = 20
  const cw = Math.ceil((w || 200) + pad * 2)
  const ch = Math.ceil((h || 60) + pad * 2)
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')

  ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'center'
  ctx.fillStyle = fill || '#000'
  if (stroke && strokeWidth) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = strokeWidth
    ctx.lineJoin = 'round'
  }

  const lines = (text || '').split('\n')
  const lineHeight = fontSize * 1.2
  lines.forEach((line, i) => {
    const y = pad + i * lineHeight
    const x = cw / 2
    if (ctx.lineWidth > 0) ctx.strokeText(line, x, y)
    ctx.fillText(line, x, y)
  })

  return canvas
}

function bilinearSample(data, w, h, sx, sy) {
  const x0 = Math.floor(sx), y0 = Math.floor(sy)
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1)
  if (x0 < 0 || y0 < 0) return [0, 0, 0, 0]
  const fx = sx - x0, fy = sy - y0
  const i00 = (y0 * w + x0) * 4, i10 = (y0 * w + x1) * 4
  const i01 = (y1 * w + x0) * 4, i11 = (y1 * w + x1) * 4
  return [
    Math.round(data[i00] * (1 - fx) * (1 - fy) + data[i10] * fx * (1 - fy) + data[i01] * (1 - fx) * fy + data[i11] * fx * fy),
    Math.round(data[i00 + 1] * (1 - fx) * (1 - fy) + data[i10 + 1] * fx * (1 - fy) + data[i01 + 1] * (1 - fx) * fy + data[i11 + 1] * fx * fy),
    Math.round(data[i00 + 2] * (1 - fx) * (1 - fy) + data[i10 + 2] * fx * (1 - fy) + data[i01 + 2] * (1 - fx) * fy + data[i11 + 2] * fx * fy),
    Math.round(data[i00 + 3] * (1 - fx) * (1 - fy) + data[i10 + 3] * fx * (1 - fy) + data[i01 + 3] * (1 - fx) * fy + data[i11 + 3] * fx * fy),
  ]
}

export function applyBubbleText(textCanvas, amount = 0.5, radius = 0.8) {
  const w = textCanvas.width, h = textCanvas.height
  const ctx = textCanvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, w, h)
  const src = new Uint8ClampedArray(imageData.data)
  const dst = imageData.data

  const cx = w / 2, cy = h / 2
  const maxR = Math.sqrt(cx * cx + cy * cy) * radius

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const di = (y * w + x) * 4

      if (dist >= maxR) {
        dst[di] = src[di]; dst[di + 1] = src[di + 1]; dst[di + 2] = src[di + 2]; dst[di + 3] = src[di + 3]
        continue
      }

      const t = dist / maxR
      const barrel = Math.pow(t, 1.0 - amount * 0.6) * maxR / (dist || 1)
      const s = bilinearSample(src, w, h, cx + dx * barrel, cy + dy * barrel)
      dst[di] = s[0]; dst[di + 1] = s[1]; dst[di + 2] = s[2]; dst[di + 3] = s[3]
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export function applyStretchText(textCanvas, { scaleX = 1, scaleY = 1, skewX = 0, skewY = 0, taperTop = 0, taperBottom = 0 } = {}) {
  const sw = textCanvas.width, sh = textCanvas.height
  const outW = Math.ceil(sw * Math.max(scaleX, 1) + Math.abs(skewX) * sh)
  const outH = Math.ceil(sh * Math.max(scaleY, 1) + Math.abs(skewY) * sw)

  if (outW === sw && outH === sh && !skewX && !skewY && !taperTop && !taperBottom) return

  const outCanvas = document.createElement('canvas')
  outCanvas.width = outW; outCanvas.height = outH
  const ctx = outCanvas.getContext('2d')

  const srcCtx = textCanvas.getContext('2d')
  const srcData = srcCtx.getImageData(0, 0, sw, sh)
  const src = srcData.data
  const dstData = ctx.getImageData(0, 0, outW, outH)
  const dst = dstData.data

  const ocx = outW / 2, ocy = outH / 2, scx = sw / 2, scy = sh / 2

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const nx = (x - ocx) / (outW / 2), ny = (y - ocy) / (outH / 2)
      const taperFactor = Math.max(0.01, 1 - (ny + 1) / 2 * taperTop - (1 - (ny + 1) / 2) * taperBottom)
      let srcNx = nx / (scaleX * taperFactor) - skewX * ny
      let srcNy = ny / scaleY - skewY * nx
      const srcX = srcNx * (sw / 2) + scx, srcY = srcNy * (sh / 2) + scy

      if (srcX < 0 || srcX >= sw - 1 || srcY < 0 || srcY >= sh - 1) continue

      const di = (y * outW + x) * 4
      const s = bilinearSample(src, sw, sh, srcX, srcY)
      dst[di] = s[0]; dst[di + 1] = s[1]; dst[di + 2] = s[2]; dst[di + 3] = s[3]
    }
  }

  ctx.putImageData(dstData, 0, 0)
  Object.assign(textCanvas, { width: outW, height: outH })
  ctx.drawImage(outCanvas, 0, 0)
}
