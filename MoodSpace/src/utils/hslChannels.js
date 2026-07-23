const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

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

/**
 * weightForChannel(hueDeg, rangeStart, rangeEnd, featherDeg) → number (0..1)
 *
 * Formula final (Adobe HSL-inspired):
 *   1. Normalisasi semua sudut ke [0, 360)
 *   2. Jika s <= e (non-wrap): hue di luar [s, e] → weight = 0
 *      Jika s > e (wrap): hue di (e, s) → weight = 0
 *   3. distToEdge = jarak hue ke tepi TERDEKAT range
 *   4. Jika distToEdge >= feather → weight = 1.0 (core zone)
 *      Jika distToEdge < feather → weight = distToEdge / feather (transisi linear)
 *
 * Reasoning:
 * - weight=1.0 di core zone: slider channel berdampak PENUH
 * - weight transisi linear: mencegah hard edge antar channel
 * - feather sama untuk start & end: simetris & sederhana
 */
export function weightForChannel(hueDeg, rangeStart, rangeEnd, featherDeg) {
  const h = ((hueDeg % 360) + 360) % 360
  const s = ((rangeStart % 360) + 360) % 360
  const e = ((rangeEnd % 360) + 360) % 360
  const f = Math.max(0, Math.min(featherDeg, 180))

  if (s <= e) {
    if (h < s || h > e) return 0
    const distToEdge = Math.min(h - s, e - h)
    return distToEdge >= f ? 1.0 : distToEdge / f
  }
  // wrap-around: range [s, 360) ∪ [0, e]
  if (h > e && h < s) return 0
  const distToStart = h >= s ? h - s : (h + 360) - s
  const distToEnd = h <= e ? e - h : (e + 360) - h
  const distToEdge = Math.min(distToStart, distToEnd)
  return distToEdge >= f ? 1.0 : distToEdge / f
}

/**
 * buildHueWeightLut(channelConfig) → { reds: Float32Array(360) | null, ... }
 *
 * Precompute weight untuk 360 hue values × 6 channel.
 * Rebuild HANYA saat rangeStart/rangeEnd/feather berubah (bukan tiap hsl slider).
 *
 * channelConfig: { reds: {rangeStart,rangeEnd,feather}, yellows: ..., ... }
 */
export function buildHueWeightLut(channelConfig) {
  const channels = ['reds', 'yellows', 'greens', 'cyans', 'blues', 'magentas']
  const luts = {}
  for (const ch of channels) {
    const cfg = channelConfig?.[ch]
    if (!cfg) { luts[ch] = null; continue }
    const lut = new Float32Array(360)
    const rs = cfg.rangeStart ?? 0
    const re = cfg.rangeEnd ?? 0
    const f = cfg.feather ?? 15
    for (let h = 0; h < 360; h++) {
      lut[h] = weightForChannel(h, rs, re, f)
    }
    luts[ch] = lut
  }
  return luts
}

/**
 * applyHslChannels(r, g, b, hslConfig, hslLuts) → [r, g, b]
 *
 * Terapkan HSL 6-channel (Reds/Yellows/Greens/Cyans/Blues/Magentas).
 *
 * Algoritma:
 *   1. RGB → HSL
 *   2. Untuk tiap 6 channel: lookup weight dari hslLuts[hueIdx]
 *      weight=0 → skip (optimasi)
 *   3. Weighted average delta dari semua channel
 *   4. HSL final → RGB
 */
export function applyHslChannels(r, g, b, hslConfig, hslLuts) {
  if (!hslConfig) return [r, g, b]

  const hasChannelAdj = hslLuts && (
    hslLuts.reds || hslLuts.yellows || hslLuts.greens
    || hslLuts.cyans || hslLuts.blues || hslLuts.magentas
  )

  if (!hasChannelAdj) return [r, g, b]

  const { h, s, l } = rgbToHsl(r, g, b)
  const hueIdx = Math.round(Math.max(0, Math.min(359, h)))

  let deltaHue = 0, deltaSat = 0, deltaLgt = 0, totalWeight = 0

  const channels = ['reds', 'yellows', 'greens', 'cyans', 'blues', 'magentas']
  for (const ch of channels) {
    const lut = hslLuts[ch]
    if (!lut) continue
    const w = lut[hueIdx]
    if (w <= 0) continue
    const cfg = hslConfig[ch]
    if (!cfg) continue
    deltaHue += w * (cfg.hue ?? 0)
    deltaSat += w * ((cfg.saturation ?? 0) / 100)
    deltaLgt += w * ((cfg.lightness ?? 0) / 100)
    totalWeight += w
  }

  if (totalWeight > 0) {
    deltaHue /= totalWeight
    deltaSat /= totalWeight
    deltaLgt /= totalWeight
  }

  let nh = (h + deltaHue) % 360
  if (nh < 0) nh += 360
  let ns = Math.max(0, Math.min(1, s + deltaSat))
  let nl = Math.max(0, Math.min(1, l + deltaLgt))

  return hslToRgb(nh, ns, nl)
}

export const hasActiveHsl = (hsl) => {
  if (!hsl) return false
  for (const ch of ['reds', 'yellows', 'greens', 'cyans', 'blues', 'magentas']) {
    const cfg = hsl[ch]
    if (cfg && (cfg.hue || cfg.saturation || cfg.lightness)) return true
  }
  return false
}
