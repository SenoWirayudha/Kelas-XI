const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

const catmullRom = (p0, p1, p2, p3, t) => {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

const linearInterpolate = (x0, y0, x1, y1, x) => {
  if (x1 === x0) return y0
  const t = (x - x0) / (x1 - x0)
  return y0 + t * (y1 - y0)
}

export const buildCurveLut = (controlPoints) => {
  if (!controlPoints || controlPoints.length < 2) {
    const identity = new Uint8Array(256)
    for (let i = 0; i < 256; i++) identity[i] = i
    return identity
  }

  const pts = controlPoints
    .map((p) => ({ x: clamp(Math.round(p.x), 0, 255), y: clamp(Math.round(p.y), 0, 255) }))
    .sort((a, b) => a.x - b.x)

  const lut = new Uint8Array(256)

  for (let x = 0; x < 256; x++) {
    if (x <= pts[0].x) {
      lut[x] = pts[0].y
      continue
    }
    if (x >= pts[pts.length - 1].x) {
      lut[x] = pts[pts.length - 1].y
      continue
    }

    let seg = -1
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        seg = i
        break
      }
    }

    if (seg === -1) {
      lut[x] = x
      continue
    }

    const p1 = pts[seg]
    const p2 = pts[seg + 1]
    const spanX = p2.x - p1.x
    if (spanX === 0) {
      lut[x] = p1.y
      continue
    }

    if (pts.length < 4) {
      lut[x] = Math.round(linearInterpolate(p1.x, p1.y, p2.x, p2.y, x))
      continue
    }

    const p0 = seg > 0
      ? pts[seg - 1]
      : { x: p1.x - (p2.x - p1.x), y: Math.max(0, p1.y - (p2.y - p1.y)) }

    const p3 = seg < pts.length - 2
      ? pts[seg + 2]
      : { x: p2.x + (p2.x - p1.x), y: Math.max(0, p2.y + (p2.y - p1.y)) }

    const t = (x - p1.x) / spanX
    const y = catmullRom(p0.y, p1.y, p2.y, p3.y, t)
    lut[x] = clamp(Math.round(y), 0, 255)
  }

  return lut
}

export const linearInterpolatePoint = linearInterpolate
