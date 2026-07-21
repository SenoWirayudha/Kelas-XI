import { RawImage } from '@xenova/transformers'

const SAMPLE_COUNT = 500
const THUMB_SIZE = 48
const MAX_ITEMS = 24
const COLOR_BOOST_MAX = 0.05

// Map color names to dominantColor bucket names
const COLOR_MAP = {
  red: 'red', merah: 'red',
  orange: 'orange', jingga: 'orange', oranye: 'orange',
  yellow: 'yellow', kuning: 'yellow',
  green: 'green', hijau: 'green',
  cyan: 'cyan', biru_muda: 'cyan',
  blue: 'blue', biru: 'blue',
  purple: 'purple', ungu: 'purple', violet: 'purple',
  pink: 'pink', rose: 'pink', merah_muda: 'pink',
}

const COLOR_WORDS = Object.keys(COLOR_MAP)

export const STYLES = {
  bw: {
    keywords: ['black and white', 'black white', 'monochrome', 'grayscale', 'greyscale', 'b&w', 'b w', 'hitam putih', 'monokrom'],
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

export const detectColors = (text) => {
  if (!text) return []
  const lower = text.toLowerCase()
  const tokens = lower.split(/\s+/)
  const matched = new Set()
  for (const [word, bucket] of Object.entries(COLOR_MAP)) {
    if (tokens.includes(word) || lower.includes(word)) matched.add(bucket)
  }
  return [...matched]
}

export const BW_RERANK_WORDS = STYLES.bw.keywords
export const BW_SAT_KEYWORDS = STYLES.bw.keywords
export const SATURATION_BOOST_MAX = STYLES.bw.boostMax

export const enrichForClipRerank = (text) => {
  if (!text) return text
  const styles = detectStyle(text)
  const extras = styles.map(k => STYLES[k].enrichText)
  const colors = detectColors(text)
  for (const bucket of colors) {
    const english = Object.entries(COLOR_MAP).find(([, v]) => v === bucket)?.[0]
    if (english && !extras.includes(english)) extras.push(english)
  }
  if (!extras.length) return text
  return text + ' ' + extras.join(' ')
}

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('image fetch timeout')), ms)),
])

export const computeStyleMetrics = async (imageUrl, timeoutMs = 4000) => {
  const start = Date.now()
  try {
    const img = await withTimeout(RawImage.read(imageUrl), timeoutMs)
    const fetchTime = Date.now() - start
    await img.resize(THUMB_SIZE, THUMB_SIZE)
    img.rgb()
    const { data } = img
    const pixelCount = data.length / 3
    const step = Math.max(1, Math.floor(pixelCount / SAMPLE_COUNT))

    let totalSat = 0, totalWarm = 0, totalLum = 0, sampled = 0
    const lumValues = []

    // Color bucket counters: only counts pixels with enough saturation + visible lightness
    const colorBuckets = { red: 0, orange: 0, yellow: 0, green: 0, cyan: 0, blue: 0, purple: 0, pink: 0 }
    let coloredPixels = 0

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

      // Dominant color: skip near-gray, near-black, near-white pixels
      if (sat >= 0.05 && lightness >= 0.02 && lightness <= 0.95) {
        let hue = 0
        if (delta > 1e-9) {
          if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60
          else if (max === g) hue = ((b - r) / delta + 2) * 60
          else hue = ((r - g) / delta + 4) * 60
        }
        if (hue <= 25 || hue > 335) colorBuckets.red++
        else if (hue <= 45) colorBuckets.orange++
        else if (hue <= 70) colorBuckets.yellow++
        else if (hue <= 160) colorBuckets.green++
        else if (hue <= 200) colorBuckets.cyan++
        else if (hue <= 265) colorBuckets.blue++
        else if (hue <= 300) colorBuckets.purple++
        else colorBuckets.pink++
        coloredPixels++
      }
    }

    if (!sampled) return null

    const avgSat = totalSat / sampled
    const avgWarm = totalWarm / sampled
    const avgLum = totalLum / sampled

    // Contrast = std dev of luminance
    const lumMean = avgLum
    const variance = lumValues.reduce((acc, v) => acc + (v - lumMean) ** 2, 0) / sampled
    const stdLum = Math.sqrt(variance)

    // Dominant color: find bucket with most non-gray pixels
    let dominantColor = null
    let colorConfidence = 0
    const colorScores = { red: 0, orange: 0, yellow: 0, green: 0, cyan: 0, blue: 0, purple: 0, pink: 0 }
    if (coloredPixels > 0) {
      let maxCount = 0
      for (const [color, count] of Object.entries(colorBuckets)) {
        if (count > maxCount) { maxCount = count; dominantColor = color }
        colorScores[color] = count / coloredPixels
      }
      colorConfidence = maxCount / coloredPixels
    }

    if (fetchTime > 2000) {
      console.log('[STYLE-METRICS] slow fetch:', Math.round(fetchTime), 'ms for', imageUrl.slice(0, 80))
    }

    return {
      bw: 1 - Math.min(avgSat, 1),
      warm: Math.min(1, Math.max(0, (avgWarm - 1.0) / 2.0)),
      dark: 1 - avgLum,
      vibrant: avgSat,
      pastel: (1 - Math.min(avgSat, 1)) * avgLum,
      highContrast: Math.min(1, stdLum * 2),
      dominantColor,
      colorConfidence,
      colorScores,
    }
  } catch (error) {
    console.log('[STYLE-METRICS] fetch failed:', error?.message?.slice(0, 60), Math.round(Date.now() - start), 'ms for', imageUrl.slice(0, 80))
    return null
  }
}

const computeMetricMap = async (items) => {
  if (!items.length) return {}
  const candidates = items.length > MAX_ITEMS ? items.slice(0, MAX_ITEMS) : items
  const metricMap = {}
  await Promise.allSettled(
    candidates.map(async (item) => {
      const url = item.thumbnailUrl || item.url || item.coverPublicUrl
      if (!url) return
      const metrics = await computeStyleMetrics(url)
      if (metrics) metricMap[item.id] = metrics
    })
  )
  return metricMap
}

export const applyStyleBoost = async (items, rerankText, scoreField = 'clipScore') => {
  const styles = detectStyle(rerankText)
  const colors = detectColors(rerankText)
  if ((!styles.length && !colors.length) || !items.length) return items

  const metricMap = await computeMetricMap(items)
  const boostedIds = Object.keys(metricMap)
  if (!boostedIds.length) return items

  // Compute style boost
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

  const logged = styles.length ? `styles: ${styles.join(', ')}, ` : ''
  console.log(`[STYLE-BOOST] ${logged}items: ${boostedIds.length}, query: ${rerankText.slice(0, 60)}`)

  return items
    .map((item) => ({
      ...item,
      [scoreField]: (item[scoreField] || 0) + (boostMap[item.id] || 0),
      _styleMetrics: metricMap[item.id] || undefined,
    }))
    .sort((a, b) => (b[scoreField] ?? -Infinity) - (a[scoreField] ?? -Infinity))
}

export const applyColorBoost = async (items, rerankText, scoreField = 'clipScore') => {
  const colors = detectColors(rerankText)
  if (!colors.length || !items.length) return items

  // Ensure metrics exist for items that don't have _styleMetrics yet
  const needsMetrics = items.filter(i => !i._styleMetrics)
  if (needsMetrics.length) {
    const metricMap = await computeMetricMap(needsMetrics)
    items = items.map(item => ({
      ...item,
      _styleMetrics: item._styleMetrics || metricMap[item.id] || undefined,
    }))
  }

  let boosted = 0
  for (const item of items) {
    const cs = item._styleMetrics?.colorScores
    if (!cs) continue
    let totalColorBoost = 0
    for (const color of colors) {
      const score = cs[color] || 0
      totalColorBoost += COLOR_BOOST_MAX * score
    }
    if (totalColorBoost > 0) {
      item[scoreField] = (item[scoreField] || 0) + totalColorBoost
      boosted++
    }
  }

  if (boosted) {
    console.log(`[COLOR-BOOST] colors: ${colors.join(', ')}, boosted: ${boosted}/${items.length} items, query: ${rerankText.slice(0, 60)}`)
    items.sort((a, b) => (b[scoreField] ?? -Infinity) - (a[scoreField] ?? -Infinity))
  }
  return items
}

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
