import { RawImage } from '@xenova/transformers'

export const BW_RERANK_WORDS = [
  'black and white', 'monochrome', 'grayscale', 'greyscale', 'black', 'white', 'b&w', 'b w',
  'hitam putih', 'hitam', 'putih', 'monokrom',
]

export const BW_SAT_KEYWORDS = [
  'black and white', 'monochrome', 'grayscale', 'greyscale', 'b&w', 'b w',
  'hitam putih', 'monokrom',
]

export const enrichForClipRerank = (text) => {
  if (!text) return text
  const lower = text.toLowerCase()
  const hasBW = BW_RERANK_WORDS.some((word) => lower.includes(word))
  if (hasBW) {
    return text + ' monochrome grayscale black and white no color'
  }
  return text
}

export const detectBwQuery = (text) => {
  if (!text) return false
  const lower = text.toLowerCase()
  return BW_SAT_KEYWORDS.some((word) => lower.includes(word))
}

export const SATURATION_BOOST_MAX = 0.10
const SAT_SAMPLE_COUNT = 500
const SAT_THUMB_SIZE = 48
const SAT_MAX_ITEMS = 24

const computeAvgSaturation = async (imageUrl) => {
  try {
    const img = await RawImage.read(imageUrl)
    await img.resize(SAT_THUMB_SIZE, SAT_THUMB_SIZE)
    img.rgb()
    const { data } = img
    const pixelCount = data.length / 3
    const step = Math.max(1, Math.floor(pixelCount / SAT_SAMPLE_COUNT))
    let totalSat = 0
    let sampled = 0
    for (let i = 0; i < data.length; i += 3 * step) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const delta = max - min
      if (max === 0) continue
      const lightness = (max + min) / 2
      const sat = lightness === 0 || lightness === 1 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
      totalSat += sat
      sampled++
    }
    return sampled > 0 ? totalSat / sampled : 0.5
  } catch {
    return 0.5
  }
}

export const applySaturationBoost = async (items, rerankText, scoreField = 'clipScore') => {
  if (!detectBwQuery(rerankText) || !items.length) return items
  const candidates = items.length > SAT_MAX_ITEMS ? items.slice(0, SAT_MAX_ITEMS) : items
  const boostMap = {}
  await Promise.allSettled(
    candidates.map(async (item) => {
      const url = item.thumbnailUrl || item.url || item.coverPublicUrl
      if (!url) return
      const avgSat = await computeAvgSaturation(url)
      boostMap[item.id] = SATURATION_BOOST_MAX * (1 - Math.min(avgSat, 1))
    })
  )
  const boostedIds = Object.keys(boostMap)
  if (!boostedIds.length) return items
  console.log('[SAT-BOOST] applied to', boostedIds.length, 'items for B&W query:', rerankText.slice(0, 60))
  return items
    .map((item) => ({
      ...item,
      [scoreField]: (item[scoreField] || 0) + (boostMap[item.id] || 0),
    }))
    .sort((a, b) => b[scoreField] - a[scoreField])
}
