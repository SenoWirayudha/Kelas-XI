/**
 * bevelEmboss.js
 * Height-map based Bevel & Emboss effect — pure pixel pipeline.
 *
 * Input:  ImageData (RGBA Uint8ClampedArray) + optional maskImageData
 * Steps:  height source (alpha from mask, or luminance) → 3-pass
 *         box-blur (=Gaussian, softness) → Sobel X/Y derivatives
 *         → normal map (from height) → Lambertian lighting (angle)
 *         → highlight/shadow color blend (per-mode formulas)
 *
 * Dual-buffer design for transparent-fill support:
 *   imageData    — the actual-fill render; read for base colour/alpha,
 *                  written with the bevel result
 *   maskImageData — solid-forced render (opaque fill); read ONLY for
 *                   height source, giving proper geometry alpha even
 *                   when the actual fill is fully transparent.
 *
 * The caller (konvaUtils.js → imageFilters.js) captures both buffers
 * and passes them separately. When maskImageData is null, the function
 * falls back to reading height from imageData (standard case).
 */

// Set true to log height-map metrics to console for debugging.
const DEBUG_BEVEL = false

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
 * Single-channel box blur pass (separated horizontal + vertical) on a
 * Float32Array. radius = blur kernel radius in pixels.
 */
const boxBlurPass = (src, w, h, radius) => {
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
 * 3-pass box blur approximates a Gaussian blur — this is what gives
 * the smooth curved bevel profile (bell-curve gradient) instead of a
 * hard linear ramp with sharp edges.
 */
const boxBlurChannel = (src, w, h, radius) => {
  let data = src
  for (let pass = 0; pass < 3; pass++) {
    data = boxBlurPass(data, w, h, radius)
  }
  return data
}

/**
 * Apply a single channel blend between base and blendColor weighted by factor.
 *   base:       0-255 original pixel channel value
 *   blend:      0-255 color channel value (highlight or shadow color)
 *   factor:     0-1 composite of lighting factor × opacity × weight
 *
 * Each mode returns an unclamped value; the caller clamps to 0-255.
 */
const applyBlendMode = (mode, base, blend, factor) => {
  switch (mode) {
    case 'linear-dodge':
      return base + blend * factor
    case 'linear-burn':
      return base - (255 - blend) * factor
    case 'multiply':
      return base * (1 - factor) + (base * blend / 255) * factor
    case 'screen':
      return base * (1 - factor) + (255 - (255 - base) * (255 - blend) / 255) * factor
    case 'overlay': {
      const ov = base < 128
        ? (2 * base * blend) / 255
        : 255 - (2 * (255 - base) * (255 - blend)) / 255
      return base * (1 - factor) + ov * factor
    }
    case 'soft-light': {
      const sl = blend < 128
        ? base - (255 - 2 * blend) * base * (255 - base) / (255 * 255)
        : base + (2 * blend - 255) * (Math.sqrt(base / 255) * 255 - base) / 255
      return base * (1 - factor) + sl * factor
    }
    case 'normal':
    default:
      return base * (1 - factor) + blend * factor
  }
}

/**
 * Core bevel/emboss pipeline.
 * Operates in-place on `imageData.data` (RGBA).
 *
 * When `maskImageData` is provided, the height map (Step 1) is extracted
 * from that buffer (solid-forced render with proper geometry alpha),
 * while the base colour/alpha for blending is read from `imageData`
 * (the actual-fill render, possibly transparent). This dual-buffer
 * approach allows correct bevel results for transparent-fill items:
 * interior remains transparent, the bevel edge appears at the geometry
 * boundary with boosted alpha from the lighting effect strength.
 *
 * Params:
 *   style            'inner' | 'emboss'
 *   depth            steepness multiplier (0.5 – 20)
 *   angle            light direction in degrees (0 – 360)
 *   softness         blur radius for height map (0 – 50 px)
 *   highlightColor   hex '#rrggbb'
 *   highlightOpacity 0 – 1
 *   shadowColor      hex '#rrggbb'
 *   shadowOpacity    0 – 1
 *   mapSource        'alpha' | 'luminance'
 *                      alpha:     height from alpha channel (edge bevel)
 *                      luminance: height from grayscale of RGB (texture emboss)
 *
 * @param {ImageData} imageData     — base render (actual fill); read + written
 * @param {object}    params
 * @param {?ImageData} maskImageData — solid-forced render; read ONLY for height
 */
export const applyBevelEmboss = (imageData, params, maskImageData = null) => {
  const {
    style = 'inner',
    depth = 5,
    angle = 120,
    softness = 5,
    highlightColor = '#ffffff',
    highlightOpacity = 1,
    shadowColor = '#000000',
    shadowOpacity = 1,
    mapSource = 'alpha',
    highlightBlendMode = 'linear-dodge',
    shadowBlendMode = 'linear-burn',
  } = params

  const tStart = performance.now()

  const d = imageData.data
  const w = imageData.width
  const h = imageData.height
  if (w < 2 || h < 2) return

  // When maskImageData is provided, read height from the solid-forced
  // render (which has correct geometry alpha) instead of from `imageData`
  // (which may have alpha = 0 everywhere for transparent-fill items).
  const hd = maskImageData ? maskImageData.data : d

  const n = w * h
  const hl = hexToRgb(highlightColor)
  const sh = hexToRgb(shadowColor)

  // --- Step 1: Extract height source ---
  // Always read from hd (mask buffer) so the height map follows the
  // real geometry boundary even when the base render is transparent.
  const raw = new Float32Array(n)
  if (mapSource === 'luminance') {
    for (let i = 0; i < n; i++) {
      const idx = i * 4
      raw[i] = (0.299 * hd[idx] + 0.587 * hd[idx + 1] + 0.114 * hd[idx + 2]) / 255
    }
  } else {
    // alpha channel
    for (let i = 0; i < n; i++) {
      raw[i] = hd[i * 4 + 3] / 255
    }
  }

  // NOTE: The alpha-flat fallback (switch to luminance when mask is null and
  // alpha is flat) was removed because the dual-buffer path now guarantees
  // maskImageData is always provided for transparent-fill items. When no mask
  // is present (solid-fill path), the base render always has proper alpha
  // geometry (inside=255 / outside=0) so the fallback would never trigger.
  // The old fallback logic was erroneously triggered after the fill fix
  // (fillEnabled: true + fillOpacity: 0) produced legitimate α=0 pixels,
  // causing solid-white opaque renders. See AGENTS.md Session 2026-07-22.

  // --- Step 2: Blur (3-pass, Gaussian-approx) → height field ---
  const height = boxBlurChannel(raw, w, h, softness)

  // --- Debug: log height map stats ---
  if (DEBUG_BEVEL) {
    let hMin = Infinity, hMax = -Infinity, hSum = 0
    for (let i = 0; i < n; i++) {
      const v = height[i]
      if (v < hMin) hMin = v
      if (v > hMax) hMax = v
      hSum += v
    }
    console.log('[BEVEL] height map:', { min: hMin.toFixed(3), max: hMax.toFixed(3), mean: (hSum / n).toFixed(3), mapSource, w, h })
  }

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

  // Depth scaling: maps slider 0-100 to a moderate height multiplier.
  // Combined with the contrast curve below this gives clean edge contrast
  // without needing extreme depth values.
  const depthScale = depth * 1.5

  // Collect first few pixels where maskAlpha differs from a
  // (transparent-fill verification).
  const DEBUG_PIXELS = []

  for (let i = 0; i < n; i++) {
    const idx = i * 4
    const origR = d[idx]
    const origG = d[idx + 1]
    const origB = d[idx + 2]
    const a = d[idx + 3]

    const gx = dx[i]
    const gy = dy[i]
    const gradMag = Math.sqrt(gx * gx + gy * gy)

    // Skip flat areas (no gradient → no normal perturbation)
    if (gradMag < 1e-6) continue

    // --- Normal from height field ---
    // N = normalize(-gx * depthScale, -gy * depthScale, 1.0)
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

    // Subtract base lighting of flat surface (normal = (0,0,1))
    // so flat areas get exactly zero contribution.
    diffuse -= lnz

    // Sharpen the lighting transition — mimics a contrast/gamma curve so
    // mid-range gradients read as more distinct highlight/shadow, similar
    // to how Photoshop's Depth parameter behaves at higher values.
    const contrastPower = 0.6
    diffuse = Math.sign(diffuse) * Math.pow(Math.abs(diffuse), contrastPower)

    // --- Linear Dodge (add) for highlight, Linear Burn for shadow ---
    const highlightFactor = Math.max(0, diffuse)
    const shadowFactor    = Math.max(0, -diffuse)

    // Weight: alpha-based spatial mask for inner vs emboss.
    // Inner bevel (alpha source) — effect concentrated at the edge
    // gradient, not the flat interior. Smoothstep emphasis makes the
    // falloff sharper so inner appears tight to the shape edge,
    // clearly distinct from emboss.
    // Emboss (luminance source) — full weight everywhere luminance
    // varies, giving a texture-relief look.
    //
    // IMPORTANT: maskAlpha is read from the pre-blur height-source
    // buffer (raw[i]), NOT from d[idx+3] (the visually rendered alpha).
    // For transparent-fill shapes (a = 0 everywhere), raw[i] still has
    // valid mask values from the position-based fallback, so the
    // smoothstep weight follows the SHAPE GEOMETRY, not the render.
    const maskAlpha = mapSource === 'luminance' ? 1 : Math.min(raw[i], 1)
    let weight
    if (mapSource === 'luminance') {
      weight = 1
    } else {
      weight = maskAlpha * maskAlpha * (3 - 2 * maskAlpha) // smoothstep 0→1
    }

    // Debug: log maskAlpha vs a for first few edge pixels where they differ
    if (maskAlpha !== a / 255 && maskAlpha > 0.01 && gradMag > 0.01 && DEBUG_PIXELS.length < 5) {
      DEBUG_PIXELS.push({
        x: i % w, y: Math.floor(i / w),
        a_orig: a,
        maskAlpha: maskAlpha.toFixed(3),
        gradMag: gradMag.toFixed(4),
        weight: weight.toFixed(3),
      })
    }

    const hw = highlightFactor * highlightOpacity * weight
    const sw = shadowFactor    * shadowOpacity    * weight

    // Blend highlight and shadow independently with per-mode formulas.
    // Each applyBlendMode call returns an unclamped result; the two
    // contributions are summed and then clamped together so that both
    // a highlight and a shadow can affect the same pixel (e.g. emboss
    // where one side is hit by light and the opposite side is shadowed).
    const hlR = applyBlendMode(highlightBlendMode, origR, hl.r, hw)
    const hlG = applyBlendMode(highlightBlendMode, origG, hl.g, hw)
    const hlB = applyBlendMode(highlightBlendMode, origB, hl.b, hw)

    const shR = applyBlendMode(shadowBlendMode, origR, sh.r, sw)
    const shG = applyBlendMode(shadowBlendMode, origG, sh.g, sw)
    const shB = applyBlendMode(shadowBlendMode, origB, sh.b, sw)

    // Highlight and shadow are independent deltas from base.
    // The final result is base + highlightDelta + shadowDelta.
    const dr = (hlR - origR) + (shR - origR)
    const dg = (hlG - origG) + (shG - origG)
    const db = (hlB - origB) + (shB - origB)

    d[idx]     = clamp(origR + dr, 0, 255)
    d[idx + 1] = clamp(origG + dg, 0, 255)
    d[idx + 2] = clamp(origB + db, 0, 255)

    // For pixels where α = 0 (transparent fill / edge pixels past fill
    // boundary), the RGB change is invisible unless we also raise alpha
    // proportional to the effect intensity.
    // hw (highlight weight) and sw (shadow weight) encode the combined
    // contribution of lighting factor × opacity × spatial mask.
    const effectStrength = Math.max(hw, sw)
    const newAlpha = Math.max(a, effectStrength * 255)
    d[idx + 3] = clamp(newAlpha, 0, 255)

  }

  if (DEBUG_BEVEL && DEBUG_PIXELS.length > 0) {
    console.log('[BEVEL] maskAlpha vs a (pixel samples):')
    DEBUG_PIXELS.forEach(p => {
      console.log(`  pos(${p.x},${p.y}) a_orig=${p.a_orig} maskAlpha=${p.maskAlpha} gradMag=${p.gradMag} weight=${p.weight}`)
    })
  }

  // --- Performance: execution time ---
  const tElapsed = performance.now() - tStart
  if (DEBUG_BEVEL) {
    console.log(`[BEVEL] pipeline: ${(tElapsed).toFixed(2)}ms for ${w}x${h} (${(w*h/1000).toFixed(0)}K px)`)
  }

  // --- Debug: log gradient and modification stats ---
  if (DEBUG_BEVEL) {
    let gMin = Infinity, gMax = -Infinity, modified = 0
    for (let i = 0; i < n; i++) {
      const m = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i])
      if (m < gMin) gMin = m
      if (m > gMax) gMax = m
      if (m > 0.001) modified++
    }
    console.log('[BEVEL] gradient:', { min: gMin.toFixed(6), max: gMax.toFixed(6), nonZeroPx: modified, totalPx: n })
  }
}