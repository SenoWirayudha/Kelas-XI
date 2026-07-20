/**
 * bevelEmboss.js
 * Height-map based Bevel & Emboss effect — pure pixel pipeline.
 *
 * Input:  ImageData (RGBA Uint8ClampedArray)
 * Steps:  alpha → box-blur (softness) → height field
 *         → Sobel X/Y derivatives → normal map
 *         → Lambertian lighting (angle)
 *         → highlight/shadow color blend
 *
 * This is designed as a generic height-map pipeline reusable for
 * future effects (e.g. Omino Glass, dithering height fields).
 */

const { clamp } = (() => {
  const c = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  return { clamp: c }
})()

/**
 * Parse a hex color (#rrggbb) to { r, g, b } (0-255)
 */
const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16) || 0,
    g: parseInt(h.substring(2, 4), 16) || 0,
    b: parseInt(h.substring(4, 6), 16) || 0,
  }
}

/**
 * Single-channel box blur (separated passes) on a Float32Array.
 * radius = blur kernel radius in pixels.
 */
const boxBlurChannel = (src, w, h, radius) => {
  const k = Math.max(1, Math.round(radius))
  const dst = new Float32Array(src.length)
  const tmp = new Float32Array(src.length)

  // Horizontal pass
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

  // Vertical pass
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

/**
 * Core bevel/emboss pipeline.
 * Operates in-place on `imageData.data` (RGBA).
 *
 * Params:
 *   style            'inner' | 'outer' | 'emboss'
 *   depth            steepness multiplier (0.5 – 20)
 *   angle            light direction in degrees (0 – 360)
 *   softness         blur radius for alpha (0 – 50 px)
 *   highlightColor   hex '#rrggbb'
 *   highlightOpacity 0 – 1
 *   shadowColor      hex '#rrggbb'
 *   shadowOpacity    0 – 1
 */
export const applyBevelEmboss = (imageData, params) => {
  const {
    style = 'inner',
    depth = 5,
    angle = 120,
    softness = 5,
    highlightColor = '#ffffff',
    highlightOpacity = 1,
    shadowColor = '#000000',
    shadowOpacity = 1,
  } = params

  const d = imageData.data
  const w = imageData.width
  const h = imageData.height
  if (w < 2 || h < 2) return

  const n = w * h
  const hl = hexToRgb(highlightColor)
  const sh = hexToRgb(shadowColor)

  // --- Step 1: Extract alpha channel (0-1) ---
  const alpha = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    alpha[i] = d[i * 4 + 3] / 255
  }

  // --- Step 2: Blur alpha → height field ---
  const height = boxBlurChannel(alpha, w, h, softness)

  // --- Step 3: Sobel gradient (central differences) ---
  const dx = new Float32Array(n)
  const dy = new Float32Array(n)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      const left  = x > 0     ? height[idx - 1] : height[idx]
      const right = x < w - 1 ? height[idx + 1] : height[idx]
      const up    = y > 0     ? height[idx - w] : height[idx]
      const down  = y < h - 1 ? height[idx + w] : height[idx]

      dx[idx] = (right - left) / 2
      dy[idx] = (down - up) / 2
    }
  }

  // --- Step 4: Normal + Lambertian lighting ---
  const angleRad = (angle % 360) * Math.PI / 180
  const lx = Math.cos(angleRad)
  const ly = Math.sin(angleRad)
  const lz = 0.5
  const lLen = Math.sqrt(lx * lx + ly * ly + lz * lz)
  const lnx = lx / lLen
  const lny = ly / lLen
  const lnz = lz / lLen

  const depthScale = Math.max(0.1, depth)

  for (let i = 0; i < n; i++) {
    const idx = i * 4
    const origR = d[idx]
    const origG = d[idx + 1]
    const origB = d[idx + 2]
    const a = d[idx + 3]

    // Skip fully transparent pixels
    if (a === 0) continue

    const gx = dx[i]
    const gy = dy[i]

    // --- Normal from height field ---
    // N = normalize(-gx * depth, -gy * depth, 1.0)
    const ndx = -gx * depthScale
    const ndy = -gy * depthScale
    const ndz = 1.0

    const nLen = Math.sqrt(ndx * ndx + ndy * ndy + ndz * ndz)
    if (nLen < 1e-8) continue

    const nnx = ndx / nLen
    const nny = ndy / nLen
    const nnz = ndz / nLen

    // --- Lambertian: dot(normal, light) ---
    let diffuse = nnx * lnx + nny * lny + nnz * lnz

    // Style adjustment
    if (style === 'outer') {
      diffuse = -diffuse
    } else if (style === 'emboss') {
      // Emboss: both sides, center the response around 0
      // Keep as-is — gradient direction determines highlight vs shadow
    }

    // --- Edge mask: fade effect at extreme edges ---
    // Only apply bevel where alpha transition exists (gradient magnitude > threshold)
    const gradMag = Math.sqrt(gx * gx + gy * gy)

    // --- Apply highlight/shadow with opacity ---
    const highlight = Math.max(0, diffuse) * highlightOpacity
    const shadow = Math.max(0, -diffuse) * shadowOpacity

    // Blend using overlay-like combination:
    // highlight adds color, shadow subtracts
    const hlr = hl.r * highlight
    const hlg = hl.g * highlight
    const hlb = hl.b * highlight

    const shr = sh.r * shadow
    const shg = sh.g * shadow
    const shb = sh.b * shadow

    // For inner bevel, weight by how much we're inside the shape (alpha)
    // For outer, weight by how much we're outside (1 - alpha)
    // For emboss, weight by gradient magnitude
    let weight
    if (style === 'inner') {
      weight = a / 255
    } else if (style === 'outer') {
      weight = 1 - a / 255
    } else {
      weight = Math.min(gradMag * 4, 1) // emboss: strong at edges only
    }

    // Scale by gradient magnitude so flat areas are unaffected
    const edgeWeight = Math.min(gradMag * 8, 1)

    d[idx]     = clamp(origR + (hlr - shr) * edgeWeight, 0, 255)
    d[idx + 1] = clamp(origG + (hlg - shg) * edgeWeight, 0, 255)
    d[idx + 2] = clamp(origB + (hlb - shb) * edgeWeight, 0, 255)
    // Alpha unchanged
  }
}
