const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Hermite interpolation dengan tangent berbasis slope asli (non-uniform aware).
// p1, p2 = titik segmen aktif. p0, p3 = tetangga kiri-kanan (untuk hitung tangent).
// t = posisi relatif dalam segmen (0..1).
const hermiteInterpolate = (p0, p1, p2, p3, t) => {
  const t2 = t * t
  const t3 = t2 * t
  const dx = p2.x - p1.x || 1

  const dx02 = (p2.x - p0.x) || dx
  const m1 = ((p2.y - p0.y) / dx02) * dx

  const dx13 = (p3.x - p1.x) || dx
  const m2 = ((p3.y - p1.y) / dx13) * dx

  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2

  return h00 * p1.y + h10 * m1 + h01 * p2.y + h11 * m2
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
    if (x <= pts[0].x) { lut[x] = pts[0].y; continue }
    if (x >= pts[pts.length - 1].x) { lut[x] = pts[pts.length - 1].y; continue }

    let seg = -1
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) { seg = i; break }
    }
    if (seg === -1) { lut[x] = x; continue }

    const p1 = pts[seg]
    const p2 = pts[seg + 1]
    const spanX = p2.x - p1.x
    if (spanX === 0) { lut[x] = p1.y; continue }

    const p0 = seg > 0
      ? pts[seg - 1]
      : { x: p1.x - (p2.x - p1.x), y: p1.y - (p2.y - p1.y) }

    const p3 = seg < pts.length - 2
      ? pts[seg + 2]
      : { x: p2.x + (p2.x - p1.x), y: p2.y + (p2.y - p1.y) }

    const t = (x - p1.x) / spanX
    const y = hermiteInterpolate(p0, p1, p2, p3, t)
    lut[x] = clamp(Math.round(y), 0, 255)
  }

  return lut
}

export const hasActiveCurves = (curves) => {
  if (!curves) return false
  for (const pts of Object.values(curves)) {
    if (!pts || !Array.isArray(pts) || pts.length < 2) continue
    if (pts.length > 2) return true
    if (pts[0].x !== 0 || pts[0].y !== 0 || pts[1].x !== 255 || pts[1].y !== 255) return true
  }
  return false
}

export const linearInterpolatePoint = linearInterpolate

export const sampleCurveForDisplay = (controlPoints, numSamples = 64) => {
  if (!controlPoints || controlPoints.length < 2) {
    const samples = []
    for (let i = 0; i < numSamples; i++) {
      const x = (i / (numSamples - 1)) * 255
      samples.push({ x, y: x })
    }
    return samples
  }

  const pts = controlPoints
    .map((p) => ({ x: clamp(p.x, 0, 255), y: clamp(p.y, 0, 255) }))
    .sort((a, b) => a.x - b.x)

  const samples = []
  for (let i = 0; i < numSamples; i++) {
    const x = (i / (numSamples - 1)) * 255

    if (x <= pts[0].x) { samples.push({ x, y: pts[0].y }); continue }
    if (x >= pts[pts.length - 1].x) { samples.push({ x, y: pts[pts.length - 1].y }); continue }

    let seg = -1
    for (let j = 0; j < pts.length - 1; j++) {
      if (x >= pts[j].x && x <= pts[j + 1].x) { seg = j; break }
    }
    if (seg === -1) { samples.push({ x, y: x }); continue }

    const p1 = pts[seg], p2 = pts[seg + 1]
    const spanX = p2.x - p1.x
    if (spanX === 0) { samples.push({ x, y: p1.y }); continue }

    const p0 = seg > 0
      ? pts[seg - 1]
      : { x: p1.x - (p2.x - p1.x), y: p1.y - (p2.y - p1.y) }
    const p3 = seg < pts.length - 2
      ? pts[seg + 2]
      : { x: p2.x + (p2.x - p1.x), y: p2.y + (p2.y - p1.y) }

    const t = (x - p1.x) / spanX
    const y = hermiteInterpolate(p0, p1, p2, p3, t)
    samples.push({ x, y: clamp(y, 0, 255) })
  }
  return samples
}