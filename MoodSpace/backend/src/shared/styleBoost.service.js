import { RawImage } from '@xenova/transformers'

const SAMPLE_COUNT = 500
const THUMB_SIZE = 48
const MAX_ITEMS = 24

export const STYLES = {
  bw: {
    keywords: ['black and white', 'monochrome', 'grayscale', 'greyscale', 'b&w', 'b w', 'hitam putih', 'monokrom'],
    singleWords: ['hitam', 'putih', 'black', 'white'],
    enrichText: 'monochrome grayscale black and white no color',
    boostMax: 0.10,
    name: 'black and white',
  },
  warm: {
    keywords: ['warm', 'vintage', 'retro', 'sepia', 'oldschool', 'old school', 'grunge', 'film grain'],
    singleWords: [],
    enrichText: 'warm tone vintage retro sepia grainy orange tinted',
    boostMax: 0.08,
    name: 'warm tone',
  },
  dark: {
    keywords: ['dark', 'moody', 'gothic', 'noir', 'shadow', 'low key', 'lowkey', 'gloomy'],
    singleWords: [],
    enrichText: 'dark moody gothic shadow low key noir gloomy',
    boostMax: 0.08,
    name: 'dark moody',
  },
  vibrant: {
    keywords: ['vibrant', 'neon', 'colorful', 'bright', 'pop', 'bold', 'saturated'],
    singleWords: [],
    enrichText: 'vibrant neon colorful high saturation pop',
    boostMax: 0.08,
    name: 'vibrant',
  },
  pastel: {
    keywords: ['pastel', 'soft', 'gentle', 'muted', 'faded', 'washed'],
    singleWords: [],
    enrichText: 'pastel soft gentle muted faded light',
    boostMax: 0.08,
    name: 'pastel',
  },
  highContrast: {
    keywords: ['high contrast', 'contrast', 'dramatic', 'hard light', 'chiaroscuro'],
    singleWords: [],
    enrichText: 'high contrast dramatic hard light shadow black and white',
    boostMax: 0.08,
    name: 'high contrast',
  },
}

const ALL_KEYWORDS = Object.values(STYLES).flatMap(s => s.keywords)
const ALL_SINGLE_WORDS = Object.values(STYLES).flatMap(s => s.singleWords)

export const detectStyle = (text) => {
  if (!text) return []
  const lower = text.toLowerCase()
  const matched = []
  for (const [key, style] of Object.entries(STYLES)) {
    const hasMulti = style.keywords.some(kw => lower.includes(kw))
    const hasSingle = style.singleWords.length > 0 && style.singleWords.some(w => {
      const tokens = lower.split(/\s+/)
      return tokens.includes(w)
    })
    if (hasMulti || hasSingle) matched.push(key)
  }
  return matched
}

// Backward compat: B&W detection uses bw style keywords
export const detectBwQuery = (text) => {
  if (!text) return false
  const lower = text.toLowerCase()
  return STYLES.bw.keywords.some(kw => lower.includes(kw))
}

export const BW_RERANK_WORDS = STYLES.bw.keywords
export const BW_SAT_KEYWORDS = STYLES.bw.keywords
export const SATURATION_BOOST_MAX = STYLES.bw.boostMax

export const enrichForClipRerank = (text) => {
  if (!text) return text
  const styles = detectStyle(text)
  if (!styles.length) return text
  const extras = styles.map(k => STYLES[k].enrichText).join(' ')
  return text + ' ' + extras
}

export const computeStyleMetrics = async (imageUrl) => {
  try {
    const img = await RawImage.read(imageUrl)
    await img.resize(THUMB_SIZE, THUMB_SIZE)
    img.rgb()
    const { data } = img
    const pixelCount = data.length / 3
    const step = Math.max(1, Math.floor(pixelCount / SAMPLE_COUNT))

    let totalSat = 0, totalWarm = 0, totalLum = 0, sampled = 0
    const lumValues = []

    for (let i = 0; i < data.length; i += 3 * step) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255

      // HSL saturation
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const delta = max - min
      const lightness = (max + min) / 2
      const sat = lightness === 0 || lightness === 1
        ? 0
        : delta / (1 - Math.abs(2 * lightness - 1))
      totalSat += sat

      // Warmth = R/B ratio
      totalWarm += r / Math.max(b, 0.001)

      // Perceptual luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      totalLum += lum
      lumValues.push(lum)

      sampled++
    }

    if (!sampled) return null

    const avgSat = totalSat / sampled
    const avgWarm = totalWarm / sampled
    const avgLum = totalLum / sampled

    // Contrast = std dev of luminance
    const lumMean = avgLum
    const variance = lumValues.reduce((acc, v) => acc + (v - lumMean) ** 2, 0) / sampled
    const stdLum = Math.sqrt(variance)

    return {
      bw: 1 - Math.min(avgSat, 1),
      warm: Math.min(1, Math.max(0, (avgWarm - 1.0) / 2.0)),
      dark: 1 - avgLum,
      vibrant: avgSat,
      pastel: (1 - Math.min(avgSat, 1)) * avgLum,
      highContrast: Math.min(1, stdLum * 2),
    }
  } catch {
    return null
  }
}

export const applyStyleBoost = async (items, rerankText, scoreField = 'clipScore') => {
  const styles = detectStyle(rerankText)
  if (!styles.length || !items.length) return items

  const candidates = items.length > MAX_ITEMS ? items.slice(0, MAX_ITEMS) : items

  // Download thumbnail once per item, compute all metrics
  const metricMap = {}
  await Promise.allSettled(
    candidates.map(async (item) => {
      const url = item.thumbnailUrl || item.url || item.coverPublicUrl
      if (!url) return
      const metrics = await computeStyleMetrics(url)
      if (metrics) metricMap[item.id] = metrics
    })
  )

  const boostedIds = Object.keys(metricMap)
  if (!boostedIds.length) return items

  // Compute total boost from all detected styles
  const boostMap = {}
  for (const id of boostedIds) {
    let totalBoost = 0
    for (const style of styles) {
      const metric = metricMap[id][style]
      const boostMax = STYLES[style].boostMax
      totalBoost += boostMax * metric
    }
    boostMap[id] = totalBoost
  }

  console.log('[STYLE-BOOST] styles:', styles.join(', '), 'items:', boostedIds.length, 'query:', rerankText.slice(0, 60))

  return items
    .map((item) => ({
      ...item,
      [scoreField]: (item[scoreField] || 0) + (boostMap[item.id] || 0),
    }))
    .sort((a, b) => b[scoreField] - a[scoreField])
}

// Backward compat: B&W-only saturation boost — now generalized via applyStyleBoost
export const applySaturationBoost = async (items, rerankText, scoreField = 'clipScore') => {
  if (!items.length) return items
  return applyStyleBoost(items, rerankText, scoreField)
}

const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const norm = Math.sqrt(na) * Math.sqrt(nb)
  return norm === 0 ? 0 : dot / norm
}

export const applyStyleSimilarityBoost = async (items, referenceUrl, scoreField = 'clipScore', similarityWeight = 0.05, referenceVector = null) => {
  if (!items.length) return items

  let refVector
  if (referenceVector) {
    refVector = referenceVector
  } else {
    if (!referenceUrl) return items
    const refMetrics = await computeStyleMetrics(referenceUrl)
    if (!refMetrics) return items
    refVector = Object.values(refMetrics)
  }
  const candidates = items.length > MAX_ITEMS ? items.slice(0, MAX_ITEMS) : items

  // Compute metrics for candidates (1 thumbnail download per item)
  const metricMap = {}
  await Promise.allSettled(
    candidates.map(async (item) => {
      const url = item.thumbnailUrl || item.url || item.coverPublicUrl
      if (!url) return
      const metrics = await computeStyleMetrics(url)
      if (metrics) metricMap[item.id] = metrics
    })
  )

  const boostedIds = Object.keys(metricMap)
  if (!boostedIds.length) return items

  console.log('[STYLE-SIM] applying style similarity boost to', boostedIds.length, 'items, weight:', similarityWeight)

  return items
    .map((item) => {
      const candidateMetrics = metricMap[item.id]
      if (!candidateMetrics) return item
      const sim = cosineSimilarity(refVector, Object.values(candidateMetrics))
      return {
        ...item,
        [scoreField]: (item[scoreField] || 0) + similarityWeight * sim,
      }
    })
    .sort((a, b) => b[scoreField] - a[scoreField])
}
