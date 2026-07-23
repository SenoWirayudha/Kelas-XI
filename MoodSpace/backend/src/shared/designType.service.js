import { getTextEmbedding, cosineSimilarity } from '../modules/externalImages/clip.service.js'

export const DESIGN_TYPE_BOOST = 0.05

const LABELS = [
  {
    key: 'poster',
    text: 'a movie poster design with title typography, credits, and promotional artwork; a film poster with graphic design elements, text overlay, and visual composition',
  },
  {
    key: 'photography',
    text: 'a raw photograph without text overlay or title; a candid photo, portrait, or landscape photography without graphic design elements',
  },
  {
    key: 'illustration',
    text: 'a digital illustration, vector art, drawing, graphic design artwork, digital art',
  },
  {
    key: 'artwork',
    text: 'a painting, fine art, abstract art, artistic creation, canvas art',
  },
  {
    key: 'screenshot',
    text: 'a screenshot, screen capture, digital interface, computer screen capture',
  },
]

const DESIGN_KEYWORDS = {
  poster: ['poster'],
  photography: ['photo', 'photography', 'photograph', 'foto', 'fotografi', 'camera', 'shot'],
  illustration: ['illustration', 'vector', 'drawing', 'digital art', 'graphic design'],
  artwork: ['artwork', 'painting', 'fine art', 'abstract art', 'canvas'],
  screenshot: ['screenshot', 'screen capture', 'screen'],
}

let cachedEmbeddings = null

const getLabelEmbeddings = async () => {
  if (cachedEmbeddings) return cachedEmbeddings
  cachedEmbeddings = await Promise.all(
    LABELS.map(async (l) => ({
      key: l.key,
      embedding: await getTextEmbedding(l.text),
    }))
  )
  return cachedEmbeddings
}

export const detectDesignType = (text) => {
  if (!text) return null
  const lower = text.toLowerCase()
  for (const [key, keywords] of Object.entries(DESIGN_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return key
  }
  return null
}

export const classifyDesignType = async (imageEmbedding, context = {}) => {
  if (!imageEmbedding) return null

  // Hybrid approach:
  // 1. TMDB items: provider metadata imageType is 100% accurate
  if (context.provider === 'tmdb' && context.metadata?.imageType) {
    const type = context.metadata.imageType
    if (type === 'poster') return 'poster'
    if (type === 'backdrop' || type === 'profile') return 'photography'
  }

  // 2. CLIP zero-shot fallback for non-TMDB items
  const labels = await getLabelEmbeddings()
  let best = { key: null, score: -1 }
  for (const { key, embedding } of labels) {
    const score = cosineSimilarity(imageEmbedding, embedding)
    if (score > best.score) best = { key, score }
  }
  return best.key
}
