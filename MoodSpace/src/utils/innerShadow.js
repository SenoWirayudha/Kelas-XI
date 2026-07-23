/**
 * innerShadow.js
 * Inner Shadow effect — pure pixel pipeline.
 * Creates a shadow cast inside the shape boundary.
 */
const DEBUG_INNER_SHADOW = false

const { clamp } = (() => {
  const c = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  return { clamp: c }
})()

const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16) || 0,
    g: parseInt(h.substring(2, 4), 16) || 0,
    b: parseInt(h.substring(4, 6), 16) || 0,
  }
}

const boxBlurPass = (src, w, h, radius) => {
  const k = Math.max(1, Math.round(radius))
  const dst = new Float32Array(src.length)
  const tmp = new Float32Array(src.length)

  for (let y = 0; y < h; y++) {
    const rowStart = y * w
    for (let x = 0; x < w; x++) {
      let sum = 0
      let count = 0
      const x0 = Math.max(0, x - k)
      const x1 = Math.min(w - 1, x + k)
      for (let kx = x0; kx <= x1; kx++) {
        sum += src[rowStart + kx]
        count++
      }
      tmp[rowStart + x] = sum / count
    }
  }

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let sum = 0
      let count = 0
      const y0 = Math.max(0, y - k)
      const y1 = Math.min(h - 1, y + k)
      for (let ky = y0; ky <= y1; ky++) {
        sum += tmp[ky * w + x]
        count++
      }
      dst[y * w + x] = sum / count
    }
  }

  return dst
}

const boxBlurChannel = (src, w, h, radius) => {
  let data = src
  for (let pass = 0; pass < 3; pass++) {
    data = boxBlurPass(data, w, h, radius)
  }
  return data
}

/**
 * Core inner shadow pipeline.
 * Operates in-place on `imageData.data` (RGBA).
 *
 * Steps:
 *   1. Extract alpha channel → alpha mask
 *   2. Offset alpha mask by distance@angle → offsetAlpha
 *   3. Invert offsetAlpha and intersect with alpha → shadowMask
 *   4. Blur shadowMask for softness
 *   5. Modulate RGB with shadow color × opacity × shadowMask
 *
 * Params:
 *   color    hex '#rrggbb' — shadow tint
 *   opacity  0–1 — strength of the shadow
 *   blur     0–50 — blur radius (softness)
 *   distance 0–50 — how far from the edge the shadow starts
 *   angle    0–360 — direction of the light source
 *
 * @param {ImageData} imageData — in-place RGBA pixel data
 * @param {object} params
 */
export const applyInnerShadow = (imageData, params, maskImageData = null) => {
  const {
    color = '#000000',
    opacity = 0.5,
    blur = 5,
    distance = 5,
    angle = 135,
  } = params

  const d = imageData.data
  const w = imageData.width
  const h = imageData.height
  if (w < 2 || h < 2) return

  const tStart = performance.now()
  const n = w * h
  const col = hexToRgb(color)
  const angleRad = ((angle % 360) * Math.PI) / 180
  const dx = Math.cos(angleRad) * distance
  const dy = Math.sin(angleRad) * distance

  // --- Step 1: Extract alpha channel ---
  // When maskImageData is provided (dual-buffer), read alpha from the
  // solid-forced render which has correct geometry alpha even when the
  // actual fill is fully transparent.
  const hd = maskImageData ? maskImageData.data : d
  const alpha = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    alpha[i] = hd[i * 4 + 3] / 255
  }

  // --- Step 2: Offset alpha mask ---
  // Move in the direction OPPOSITE to the light (shadow side).
  const offsetAlpha = new Float32Array(n)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = x + dx
      const sy = y + dy
      if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
        offsetAlpha[y * w + x] = alpha[Math.floor(sy) * w + Math.floor(sx)]
      } else {
        offsetAlpha[y * w + x] = 0
      }
    }
  }

  // --- Step 3: Intersect inverted offset with original alpha ---
  // shadowMask = alpha * (1 - offsetAlpha)
  const shadowMask = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    shadowMask[i] = alpha[i] * (1 - offsetAlpha[i])
  }

  // --- Step 4: Blur shadow mask for soft edges ---
  const blurred = boxBlurChannel(shadowMask, w, h, blur)

  // --- Step 5: Apply shadow color + boost alpha ---
  // When maskImageData is present (dual-buffer), use additive blending so
  // the shadow color is visible even when the base RGB is 0 (transparent
  // fill). In standard mode, use multiplicative blending that preserves
  // the base color proportion (original behavior for solid fills).
  let maxFactor = 0
  for (let i = 0; i < n; i++) {
    const factor = blurred[i] * opacity
    if (factor > 0) {
      const idx = i * 4
      if (maskImageData) {
        // Dual-buffer mode: additive blend — shadow color is added on top
        // of whatever base is there (transparent black for fill none, or
        // the result of a preceding filter like BevelEmboss).
        d[idx]     = clamp(d[idx]     * (1 - factor) + col.r * factor, 0, 255)
        d[idx + 1] = clamp(d[idx + 1] * (1 - factor) + col.g * factor, 0, 255)
        d[idx + 2] = clamp(d[idx + 2] * (1 - factor) + col.b * factor, 0, 255)
      } else {
        // Standard mode: multiplicative — darkens base proportionally
        d[idx]     = clamp(d[idx]     * (1 - factor) + (d[idx]     * col.r / 255) * factor, 0, 255)
        d[idx + 1] = clamp(d[idx + 1] * (1 - factor) + (d[idx + 1] * col.g / 255) * factor, 0, 255)
        d[idx + 2] = clamp(d[idx + 2] * (1 - factor) + (d[idx + 2] * col.b / 255) * factor, 0, 255)
      }
      // Boost alpha proportional to shadow strength so the inner shadow
      // remains visible on transparent-fill shapes (fill none / 0%).
      const newAlpha = Math.max(d[idx + 3], factor * 255)
      d[idx + 3] = clamp(newAlpha, 0, 255)
      if (factor > maxFactor) maxFactor = factor
    }
  }

  if (DEBUG_INNER_SHADOW) {
    const tElapsed = performance.now() - tStart
    console.log(`[INNER SHADOW] ${(tElapsed).toFixed(2)}ms for ${w}x${h} (${(w*h/1000).toFixed(0)}K px) maxFactor=${maxFactor.toFixed(3)}`)
  }
}
