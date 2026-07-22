import Konva from 'konva'
import { applyBevelEmboss } from './bevelEmboss'
import { applyInnerShadow } from './innerShadow'

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

const luminance = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

const rgbToHsl = (r, g, b) => {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const mx = Math.max(rn, gn, bn), mn = Math.min(rn, gn, bn)
  const d = mx - mn
  let h = 0, s = 0, l = (mx + mn) / 2
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    if (mx === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
    else if (mx === gn) h = ((bn - rn) / d + 2) * 60
    else h = ((rn - gn) / d + 4) * 60
  }
  return { h, s, l }
}

const hslToRgb = (h, s, l) => {
  if (s === 0) {
    const v = clamp(Math.round(l * 255), 0, 255)
    return [v, v, v]
  }
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1))
  const m = l - c / 2
  let r1 = 0, g1 = 0, b1 = 0
  if (hue < 60) { r1 = c; g1 = x; b1 = 0 }
  else if (hue < 120) { r1 = x; g1 = c; b1 = 0 }
  else if (hue < 180) { r1 = 0; g1 = c; b1 = x }
  else if (hue < 240) { r1 = 0; g1 = x; b1 = c }
  else if (hue < 300) { r1 = x; g1 = 0; b1 = c }
  else { r1 = c; g1 = 0; b1 = x }
  return [
    clamp(Math.round((r1 + m) * 255), 0, 255),
    clamp(Math.round((g1 + m) * 255), 0, 255),
    clamp(Math.round((b1 + m) * 255), 0, 255),
  ]
}

const processPixels = (imageData, fn) => {
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = fn(d[i], d[i + 1], d[i + 2], i / 4, imageData)
    d[i] = clamp(r, 0, 255)
    d[i + 1] = clamp(g, 0, 255)
    d[i + 2] = clamp(b, 0, 255)
  }
}

Konva.Filters.PhotoBrightness = function (imageData) {
  const val = this.getAttr('brightness') || 0
  if (val === 0) return
  const adjust = val / 100
  const d = imageData.data

  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let v = d[i + c] / 255
      if (adjust > 0) {
        const gamma = 1 - adjust * 0.35
        v = Math.pow(v, gamma)
        v = v * (1 - adjust * 0.15) + adjust * 0.15 * (1 - (1 - v) * (1 - v))
      } else {
        const gamma = 1 - adjust * 0.5
        v = Math.pow(v, gamma)
        v = v * (1 + adjust * 0.1) - adjust * 0.1 * v * v
      }
      d[i + c] = clamp(v * 255, 0, 255)
    }
  }
}

Konva.Filters.PhotoContrast = function (imageData) {
  const val = this.getAttr('contrast') || 0
  if (val === 0) return
  const c = val / 100
  const d = imageData.data

  for (let i = 0; i < d.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      let v = d[i + ch] / 255
      if (c > 0) {
        const power = 1 / (1 + c * 0.5)
        const diff = v - 0.5
        if (Math.abs(diff) < 0.001) continue
        v = 0.5 + Math.sign(diff) * Math.pow(Math.abs(diff), power) * Math.pow(0.5, 1 - power)
      } else {
        const s = -c * 0.55
        v = 0.5 + (v - 0.5) * (1 - s)
      }
      d[i + ch] = clamp(v * 255, 0, 255)
    }
  }
}

Konva.Filters.Exposure = function (imageData) {
  const val = this.getAttr('exposure') || 0
  if (val === 0) return
  const factor = Math.pow(2, val / 100)
  processPixels(imageData, (r, g, b) => [r * factor, g * factor, b * factor])
}

Konva.Filters.Temperature = function (imageData) {
  const val = this.getAttr('temperature') || 0
  if (val === 0) return
  const amount = val / 100 * 30
  processPixels(imageData, (r, g, b) => [r + amount, g, b - amount])
}

Konva.Filters.Highlights = function (imageData) {
  const val = this.getAttr('highlights') || 0
  if (val === 0) return
  const amount = val / 100 * 60
  processPixels(imageData, (r, g, b) => {
    const luma = luminance(r, g, b)
    if (luma > 128) {
      const f = (luma - 128) / 127
      return [r + amount * f, g + amount * f, b + amount * f]
    }
    return [r, g, b]
  })
}

Konva.Filters.Shadows = function (imageData) {
  const val = this.getAttr('shadows') || 0
  if (val === 0) return
  const amount = val / 100 * 60
  processPixels(imageData, (r, g, b) => {
    const luma = luminance(r, g, b)
    if (luma < 128) {
      const f = (128 - luma) / 128
      return [r + amount * f, g + amount * f, b + amount * f]
    }
    return [r, g, b]
  })
}

Konva.Filters.Whites = function (imageData) {
  const val = this.getAttr('whites') || 0
  if (val === 0) return
  const amount = val / 100 * 60
  processPixels(imageData, (r, g, b) => {
    const luma = luminance(r, g, b)
    const f = luma > 128 ? Math.pow((luma - 128) / 127, 2) : 0
    return [r + amount * f, g + amount * f, b + amount * f]
  })
}

Konva.Filters.Blacks = function (imageData) {
  const val = this.getAttr('blacks') || 0
  if (val === 0) return
  const amount = val / 100 * 60
  processPixels(imageData, (r, g, b) => {
    const luma = luminance(r, g, b)
    const f = luma < 128 ? Math.pow((128 - luma) / 128, 2) : 0
    return [r + amount * f, g + amount * f, b + amount * f]
  })
}

const boxBlurSep = (pixels, w, h, radius) => {
  const n = pixels.length
  const out = new Uint8ClampedArray(n)
  const k = Math.max(1, Math.round(radius))

  const blurRow = (src, dst, ch) => {
    for (let y = 0; y < h; y++) {
      let sum = 0
      const rowStart = y * w
      for (let x = 0; x < w; x++) {
        if (x === 0) {
          for (let kx = -k; kx <= k; kx++) {
            const px = clamp(kx, 0, w - 1)
            sum += src[(rowStart + px) * 4 + ch]
          }
        } else {
          const remove = src[(rowStart + clamp(x - k - 1, 0, w - 1)) * 4 + ch]
          const add = src[(rowStart + clamp(x + k, 0, w - 1)) * 4 + ch]
          sum = sum - remove + add
        }
        dst[(rowStart + x) * 4 + ch] = sum / (k * 2 + 1)
      }
    }
  }

  const blurCol = (src, dst, ch) => {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let y = 0; y < h; y++) {
        if (y === 0) {
          for (let ky = -k; ky <= k; ky++) {
            const py = clamp(ky, 0, h - 1)
            sum += src[(py * w + x) * 4 + ch]
          }
        } else {
          const remove = src[(clamp(y - k - 1, 0, h - 1) * w + x) * 4 + ch]
          const add = src[(clamp(y + k, 0, h - 1) * w + x) * 4 + ch]
          sum = sum - remove + add
        }
        dst[(y * w + x) * 4 + ch] = sum / (k * 2 + 1)
      }
    }
  }

  const tmp = new Uint8ClampedArray(n)
  for (let ch = 0; ch < 3; ch++) {
    blurRow(pixels, tmp, ch)
    blurCol(tmp, out, ch)
  }
  // Copy alpha channel
  for (let i = 3; i < n; i += 4) out[i] = pixels[i]
  return out
}

Konva.Filters.PhotoSharpen = function (imageData) {
  const val = this.getAttr('sharpen') || 0
  if (val === 0) return

  const w = imageData.width
  const h = imageData.height
  if (w < 3 || h < 3) return

  const d = imageData.data

  // Radius lebih besar = edge yang lebih tegas tertangkap
  // Sebelum: Math.min(w, h) * 0.005  → bisa < 2px untuk gambar kecil
  const radius = Math.max(2, Math.round(Math.min(w, h) * 0.012))

  const blurred = boxBlurSep(d, w, h, radius)

  // Amount dinaikkan: sebelumnya max 0.8, sekarang max 2.5
  // Pakai kurva non-linear agar nilai rendah tetap halus, nilai tinggi terasa kuat
  const t = val / 100
  const amount = t * t * 2.5 + t * 0.5   // range: ~0 → 3.0

  for (let i = 0; i < d.length; i += 4) {
    d[i]     = clamp(d[i]     + (d[i]     - blurred[i])     * amount, 0, 255)
    d[i + 1] = clamp(d[i + 1] + (d[i + 1] - blurred[i + 1]) * amount, 0, 255)
    d[i + 2] = clamp(d[i + 2] + (d[i + 2] - blurred[i + 2]) * amount, 0, 255)
  }
}

Konva.Filters.Vignette = function (imageData) {
  const val = this.getAttr('vignette') || 0
  if (val === 0) return
  const strength = val / 100 * 0.8
  const w = imageData.width
  const h = imageData.height
  const cx = w / 2
  const cy = h / 2
  const maxDist = Math.sqrt(cx * cx + cy * cy)
  const d = imageData.data

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const falloff = Math.pow(dist / maxDist, 1.8)
      const darken = 1 - falloff * strength
      d[idx] = clamp(d[idx] * darken, 0, 255)
      d[idx + 1] = clamp(d[idx + 1] * darken, 0, 255)
      d[idx + 2] = clamp(d[idx + 2] * darken, 0, 255)
    }
  }
}

const pixelPipeline = (params) => {
  const {
    d, w, h, len,
    expFactor, tempAmount, hueRotation,
    hslHue, hslSat, hslLgt,
    highAmount, shadowAmount,
    whiteAmount, blackAmount, brightAdj, contAdj, satAdj,
    vigStrength, cx, cy, maxDist, sharpenVal, blurVal,
  } = params

  for (let i = 0; i < len; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2]
    const px = (i >> 2) % w
    const py = (i >> 2) / w | 0

    if (expFactor) {
      r *= expFactor; g *= expFactor; b *= expFactor
    }

    if (tempAmount) {
      r += tempAmount; b -= tempAmount
    }

if (hueRotation) {
  const angle = hueRotation  // sudah dalam radian
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const rn = r/255, gn = g/255, bn = b/255
  
  const nr = rn*(0.213+cos*0.787-sin*0.213) + gn*(0.715-cos*0.715-sin*0.715) + bn*(0.072-cos*0.072+sin*0.928)
  const ng = rn*(0.213-cos*0.213+sin*0.143) + gn*(0.715+cos*0.285+sin*0.140) + bn*(0.072-cos*0.072-sin*0.283)
  const nb = rn*(0.213-cos*0.213-sin*0.787) + gn*(0.715-cos*0.715+sin*0.715) + bn*(0.072+cos*0.928+sin*0.072)
  
  r = nr*255; g = ng*255; b = nb*255
}

    if (hslHue || hslSat || hslLgt) {
      const { h, s, l } = rgbToHsl(r, g, b)
      let nh = hslHue ? ((h + hslHue) % 360 + 360) % 360 : h
      let ns = hslSat ? clamp(s + hslSat, 0, 1) : s
      let nl = hslLgt ? clamp(l + hslLgt, 0, 1) : l
      const rgb = hslToRgb(nh, ns, nl)
      r = rgb[0]; g = rgb[1]; b = rgb[2]
    }
    if (highAmount) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      if (luma > 128) {
        const f = (luma - 128) / 127
        r += highAmount * f; g += highAmount * f; b += highAmount * f
      }
    }

    if (shadowAmount) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      if (luma < 128) {
        const f = (128 - luma) / 128
        r += shadowAmount * f; g += shadowAmount * f; b += shadowAmount * f
      }
    }

    if (whiteAmount) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      const f = luma > 128 ? Math.pow((luma - 128) / 127, 2) : 0
      r += whiteAmount * f; g += whiteAmount * f; b += whiteAmount * f
    }

    if (blackAmount) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      const f = luma < 128 ? Math.pow((128 - luma) / 128, 2) : 0
      r += blackAmount * f; g += blackAmount * f; b += blackAmount * f
    }

    if (brightAdj) {
      const doBright = (v) => {
        let nv = v / 255
        if (brightAdj > 0) {
          const gamma = 1 - brightAdj * 0.35
          nv = Math.pow(nv, gamma)
          nv = nv * (1 - brightAdj * 0.15) + brightAdj * 0.15 * (1 - (1 - nv) * (1 - nv))
        } else {
          const gamma = 1 - brightAdj * 0.5
          nv = Math.pow(nv, gamma)
          nv = nv * (1 + brightAdj * 0.1) - brightAdj * 0.1 * nv * nv
        }
        return nv * 255
      }
      r = doBright(r); g = doBright(g); b = doBright(b)
    }

    if (contAdj) {
      const doContrast = (v) => {
        let nv = v / 255
        if (contAdj > 0) {
          const power = 1 / (1 + contAdj * 0.5)
          const diff = nv - 0.5
          if (Math.abs(diff) >= 0.001) {
            nv = 0.5 + Math.sign(diff) * Math.pow(Math.abs(diff), power) * Math.pow(0.5, 1 - power)
          }
        } else {
          const s = -contAdj * 0.55
          nv = 0.5 + (nv - 0.5) * (1 - s)
        }
        return nv * 255
      }
      r = doContrast(r); g = doContrast(g); b = doContrast(b)
    }

    if (satAdj) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      const factor = 1 + satAdj
      r = luma + (r - luma) * factor
      g = luma + (g - luma) * factor
      b = luma + (b - luma) * factor
    }

    if (vigStrength) {
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
      const falloff = Math.pow(dist / maxDist, 1.8)
      const darken = 1 - falloff * vigStrength
      r *= darken; g *= darken; b *= darken
    }

    d[i] = clamp(r, 0, 255)
    d[i + 1] = clamp(g, 0, 255)
    d[i + 2] = clamp(b, 0, 255)
  }

  if (sharpenVal !== 0) {
    if (w >= 3 && h >= 3) {
      const radius = Math.max(2, Math.round(Math.min(w, h) * 0.012))
      const blurred = boxBlurSep(d, w, h, radius)
      const t = sharpenVal / 100
      const amount = t * t * 2.5 + t * 0.5
      for (let i = 0; i < len; i += 4) {
        d[i]     = clamp(d[i]     + (d[i]     - blurred[i])     * amount, 0, 255)
        d[i + 1] = clamp(d[i + 1] + (d[i + 1] - blurred[i + 1]) * amount, 0, 255)
        d[i + 2] = clamp(d[i + 2] + (d[i + 2] - blurred[i + 2]) * amount, 0, 255)
      }
    }
  }

  if (blurVal !== 0) {
    const blurred = boxBlurSep(d, w, h, blurVal)
    for (let i = 0; i < len; i++) {
      d[i] = blurred[i]
    }
  }
}

const getParamSet = (vals) => {
  const expVal = vals.exposure ?? 0
  const tempVal = vals.temperature ?? 0
  const hueVal = vals.hue ?? 0
  const highVal = vals.highlights ?? 0
  const shadowVal = vals.shadows ?? 0
  const whiteVal = vals.whites ?? 0
  const blackVal = vals.blacks ?? 0
  const brightVal = vals.brightness ?? 0
  const contVal = vals.contrast ?? 0
  const satVal = vals.saturation ?? 0
  const sharpenVal = vals.sharpen ?? 0
  const vignetteVal = vals.vignette ?? 0
  const blurVal = vals.blur ?? 0

  const hsl = vals.hsl ?? null
  const hslHue = hsl?.master?.hue ?? 0
  const hslSat = hsl?.master?.saturation ?? 0
  const hslLgt = hsl?.master?.lightness ?? 0

  return {
    expFactor: expVal !== 0 ? Math.pow(2, expVal / 100) : 0,
    tempAmount: tempVal !== 0 ? tempVal / 100 * 30 : 0,
    hueRotation: hueVal !== 0 ? hueVal * Math.PI / 180 : 0,
    hslHue: hslHue || 0,
    hslSat: hslSat !== 0 ? hslSat / 100 : 0,
    hslLgt: hslLgt !== 0 ? hslLgt / 100 : 0,
    highAmount: highVal !== 0 ? highVal / 100 * 60 : 0,
    shadowAmount: shadowVal !== 0 ? shadowVal / 100 * 60 : 0,
    whiteAmount: whiteVal !== 0 ? whiteVal / 100 * 60 : 0,
    blackAmount: blackVal !== 0 ? blackVal / 100 * 60 : 0,
    brightAdj: brightVal !== 0 ? brightVal / 100 : 0,
    contAdj: contVal !== 0 ? contVal / 100 : 0,
    satAdj: satVal !== 0 ? satVal / 100 : 0,
    vigStrength: vignetteVal !== 0 ? vignetteVal / 100 * 0.8 : 0,
    sharpenVal,
    blurVal,
  }
}

export const applyMoodSpaceToImageData = (imageData, values) => {
  const params = getParamSet(values)
  const hasAdjustment = params.expFactor || params.tempAmount || params.hueRotation
    || params.hslHue || params.hslSat || params.hslLgt
    || params.highAmount || params.shadowAmount || params.whiteAmount || params.blackAmount
    || params.brightAdj || params.contAdj || params.satAdj
    || params.sharpenVal || params.vigStrength || params.blurVal

  if (!hasAdjustment) return

  const d = imageData.data
  const w = imageData.width
  const h = imageData.height
  const cx = w / 2
  const cy = h / 2

  pixelPipeline({
    d, w, h, len: d.length,
    cx, cy, maxDist: Math.sqrt(cx * cx + cy * cy),
    ...params,
  })
}

Konva.Filters.MoodSpaceCombined = function (imageData) {
  const vals = {
    exposure: this.getAttr('exposure') ?? 0,
    temperature: this.getAttr('temperature') ?? 0,
    hue: this.getAttr('hue') ?? 0,
    highlights: this.getAttr('highlights') ?? 0,
    shadows: this.getAttr('shadows') ?? 0,
    whites: this.getAttr('whites') ?? 0,
    blacks: this.getAttr('blacks') ?? 0,
    brightness: this.getAttr('brightness') ?? 0,
    contrast: this.getAttr('contrast') ?? 0,
    saturation: this.getAttr('saturation') ?? 0,
    sharpen: this.getAttr('sharpen') ?? 0,
    vignette: this.getAttr('vignette') ?? 0,
    blur: this.getAttr('blur') ?? 0,
    hsl: this.getAttr('hsl') || null,
  }
  applyMoodSpaceToImageData(imageData, vals)
}

// ─── Bevel & Emboss ────────────────────────────────────────────────────────────

Konva.Filters.BevelEmboss = function (imageData) {
  const style = this.getAttr('bevelEmbossStyle') || 'inner'
  // Map source is auto-derived from style — never user-configurable.
  //   inner  → alpha (edge bevel from alpha channel / position mask)
  //   emboss → luminance (texture emboss from RGB grayscale)
  const mapSource = style === 'emboss' ? 'luminance' : 'alpha'
  const vals = {
    style,
    depth: this.getAttr('bevelEmbossDepth') ?? 5,
    angle: this.getAttr('bevelEmbossAngle') ?? 120,
    softness: this.getAttr('bevelEmbossSoftness') ?? 5,
    highlightColor: this.getAttr('bevelEmbossHighlightColor') || '#ffffff',
    highlightOpacity: this.getAttr('bevelEmbossHighlightOpacity') ?? 1,
    shadowColor: this.getAttr('bevelEmbossShadowColor') || '#000000',
    shadowOpacity: this.getAttr('bevelEmbossShadowOpacity') ?? 1,
    mapSource,
    highlightBlendMode: this.getAttr('bevelEmbossHighlightBlendMode') || 'linear-dodge',
    shadowBlendMode: this.getAttr('bevelEmbossShadowBlendMode') || 'linear-burn',
  }
  // Dual-buffer support: if a real-fill capture was stored, use the stored
  // mask for height and overwrite the display buffer with the real (transparent)
  // render. The mask was saved during setup (applyBevelEmbossToNode /
  // applyInnerShadowToNode) and is shared between both filters.
  const realData = this.getAttr('_bevelRealImageData')
  let maskImageData = this.getAttr('_maskImageData')
  if (realData) {
    // If mask was not stored during setup (shouldn't happen with current code),
    // fall back to saving it at runtime from the cache's current pixels.
    if (!maskImageData) {
      const maskPixels = new Uint8ClampedArray(imageData.data)
      maskImageData = new ImageData(maskPixels, imageData.width, imageData.height)
    }
    // Replace cache pixels with the transparent render so Konva displays
    // the correct base (transparent interior) with bevel edge modifications.
    imageData.data.set(realData.data)
    applyBevelEmboss(imageData, vals, maskImageData)
  } else {
    applyBevelEmboss(imageData, vals, null)
  }
}

// ─── Inner Shadow ──────────────────────────────────────────────────────────────

Konva.Filters.InnerShadow = function (imageData) {
  const vals = {
    color: this.getAttr('innerShadowColor') || '#000000',
    opacity: this.getAttr('innerShadowOpacity') ?? 0.5,
    blur: this.getAttr('innerShadowBlur') ?? 5,
    distance: this.getAttr('innerShadowDistance') ?? 5,
    angle: this.getAttr('innerShadowAngle') ?? 135,
  }
  const realData = this.getAttr('_innerShadowRealImageData')
  let maskImageData = this.getAttr('_maskImageData')
  if (realData) {
    if (!maskImageData) {
      const maskPixels = new Uint8ClampedArray(imageData.data)
      maskImageData = new ImageData(maskPixels, imageData.width, imageData.height)
    }
    // Only overwrite cache with realData when BevelEmboss is NOT also
    // active. In the combined case, BevelEmboss already ran first and
    // overwrote imageData with realData + applied bevel; overwriting
    // again would lose the bevel modifications.
    if (!this.getAttr('_bevelRealImageData')) {
      imageData.data.set(realData.data)
    }
    applyInnerShadow(imageData, vals, maskImageData)
  } else {
    applyInnerShadow(imageData, vals, null)
  }
}

export const applyImageFilters = (node, item) => {
  const hasAny = ADJUSTMENT_KEYS.some((k) => (item[k] ?? 0) !== 0)
  const hsl = item.hsl ?? null
  const hasHsl = hsl && (hsl.master?.hue || hsl.master?.saturation || hsl.master?.lightness)

  if (!hasAny && !hasHsl) {
    node.filters([])
    node.clearCache()
    return
  }

  for (const key of ADJUSTMENT_KEYS) {
    node.setAttr(key, item[key] ?? 0)
  }
  node.setAttr('hsl', item.hsl || null)

  node.filters([Konva.Filters.MoodSpaceCombined])
  node.cache({ pixelRatio: Math.min(window.devicePixelRatio || 1, 2) })
}

const ADJUSTMENT_KEYS = [
  'exposure', 'temperature', 'hue', 'highlights', 'shadows',
  'whites', 'blacks', 'brightness', 'contrast', 'saturation',
  'sharpen', 'vignette', 'blur',
]
