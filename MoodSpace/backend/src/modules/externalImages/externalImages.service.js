import { env } from '../../config/env.js'
import { notFound } from '../../utils/errors.js'
import { getTopRecentInterestQuerySignals, getTopRecentInterestTagsWithScores, normalizeInterestTag, recordInterestEvent } from '../interest/interest.service.js'
import { updateProfile, getUserProfileEmbedding } from '../profile/profile.service.js'
import { findMediaById } from '../media/media.repository.js'
import {
  findAnyEmbedding,
  findEmbeddingsByItemIds,
  findExternalImageById,
  findExternalImageEmbedding,
  findImagesByVisualSimilarity,
  listSavedExternalImages,
  saveExternalImage,
  unsaveExternalImage,
  updateEmbedding,
  upsertExternalImage,
} from './externalImages.repository.js'
import { getTextEmbedding, getImageEmbedding, rerankByQueryEmbedding, averageEmbeddings, cosineSimilarity } from './clip.service.js'
import { enrichForClipRerank, applySaturationBoost } from '../../shared/bwColorBoost.service.js'
import { computeZeroShotTags } from '../../shared/clipZeroShot.service.js'
import { clearEntityCache } from '../../shared/entityMatch.service.js'

const uploadEmbeddingCache = new Map()

const commonsApiUrl = 'https://commons.wikimedia.org/w/api.php'
const tmdbApiUrl = 'https://api.themoviedb.org/3'
const tmdbImageBaseUrl = 'https://image.tmdb.org/t/p/original'
const tmdbThumbBaseUrl = 'https://image.tmdb.org/t/p/w780'
const unsplashApiUrl = 'https://api.unsplash.com/search/photos'
const pexelsApiUrl = 'https://api.pexels.com/v1/search'
const pixabayApiUrl = 'https://pixabay.com/api/'
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const cleanText = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const EXT_WORD_RE = /\b(?:jpe?g|png|webp|gif|bmp|svg|tiff?|avif|heic?)\b/gi
const normalizeTag = (value = '') => cleanText(value)
  .toLowerCase()
  .replace(/^file:/, '')
  .replace(/\.[a-z0-9]{2,5}$/i, '')
  .replace(EXT_WORD_RE, '')
  .replace(/\s*\.\s*/g, ' ')
  .replace(/[_-]+/g, ' ')
  .replace(/[^a-z0-9\s]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const buildTags = (...sources) => {
  const stopWords = new Set(['file', 'image', 'photo', 'picture', 'jpeg', 'jpg', 'png', 'webp', 'unsplash', 'pexels', 'pixabay'])
  const tokens = normalizeTag(sources.filter(Boolean).join(' '))
    .split(' ')
    .filter((token) => token.length >= 3 && !stopWords.has(token))
  return [...new Set(tokens)].slice(0, 12)
}

const movieIntentWords = ['movie', 'film', 'cinema', 'cinematic', 'scene', 'still', 'wallpaper', 'backdrop', 'key art']
const movieBackdropWords = ['scene', 'still', 'wallpaper', 'cinematic shot', 'cinematic', 'backdrop']
const moviePosterWords = ['poster', 'movie poster', 'film poster', 'cinema poster', 'key art']
const nonMovieWords = ['album', 'music', 'song', 'vinyl', 'interior', 'room', 'fashion', 'typography', 'logo', 'ui', 'ux', 'null', 'unggahan', 'trending']

const connectingWords = ['and', 'or', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'to', 'from']

const genericVisualWords = [
  'black', 'white', 'hitam', 'putih', 'monokrom', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange',
  'grey', 'gray', 'brown', 'gold', 'silver', 'teal', 'navy', 'beige', 'cream',
  'dark', 'light', 'bright', 'pale', 'deep', 'vintage', 'retro', 'old', 'classic',
  'modern', 'minimal', 'abstract', 'moody', 'dramatic', 'dreamy', 'romantic',
  'calm', 'serene', 'tranquil', 'ethereal', 'surreal', 'whimsical', 'peaceful',
  'beautiful', 'pretty', 'stunning', 'gorgeous', 'lovely', 'nice', 'cool',
  'shadow', 'silhouette', 'rain', 'night', 'sunset', 'sunrise', 'cloud', 'sky',
  'ocean', 'nature', 'urban', 'city', 'street', 'landscape', 'aesthetic',
  'hd', '4k', 'high', 'resolution', 'quality', 'cover', 'desktop', 'mobile',
  'christmas', 'halloween', 'winter', 'spring', 'summer', 'autumn', 'fall',
  'rainy', 'foggy', 'misty', 'snowy', 'floral', 'forest', 'mountain', 'beach',
  'indie', 'folk', 'artistic', 'pixel', 'vector', 'flat', 'gradient',
  'japanese', 'korean', 'japan', 'korea',
]

const designIntentWords = new Set([
  'texture', 'pattern', 'background', 'overlay', 'grunge', 'noise', 'grain', 'paper',
  'fabric', 'canvas', 'brush', 'stroke', 'splatter', 'watercolor', 'acrylic', 'oil',
  'pastel', 'ink', 'marker', 'pencil', 'sketch', 'doodle', 'scribble', 'calligraphy',
  'typography', 'typeface', 'font', 'lettering', 'abstract', 'geometric', 'organic',
  'floral', 'botanical', 'marble', 'concrete', 'wood', 'metal', 'rust', 'brick',
  'stone', 'sand', 'gradient', 'mesh', 'grid', 'line', 'shape', 'form', 'vintage',
  'retro', 'antique', 'worn', 'distressed', 'creased', 'folded', 'torn', 'ripped',
  'collage', 'mixed media', 'multimedia', 'layered', 'composition', 'moodboard',
  'design', 'graphic', 'visual', 'artistic', 'decorative', 'ornamental', 'motif',
  'seamless', 'tile', 'repeat', 'backdrop', 'wallpaper', 'surface', 'material',
  'textile', 'weave', 'knit', 'crosshatch', 'hatch', 'stipple', 'dot', 'pointillism',
  'pixel', 'digital', 'render', '3d', 'cgi', 'vector', 'svg', 'png',
  'transparent', 'cutout', 'silhouette', 'stencil', 'stamp', 'imprint', 'emboss',
  'foil', 'gold', 'silver', 'copper', 'bronze', 'glitter', 'sparkle', 'shimmer',
  'neon', 'glow', 'light', 'shadow', 'drop shadow', 'highlight', 'reflection',
  'bokeh', 'lens flare', 'sunburst', 'ray', 'beam', 'prism', 'rainbow',
  'color', 'colour', 'palette', 'swatch', 'hue', 'tint', 'shade', 'tone',
  'monochrome', 'grayscale', 'black and white', 'sepia', 'duotone',
  'minimal', 'minimalist', 'clean', 'simple', 'elegant', 'sophisticated',
  'rustic', 'bohemian', 'boho', 'scandinavian', 'industrial', 'modern',
  'contemporary', 'art deco', 'art nouveau', 'bauhaus', 'mid century',
  'photocopy', 'scan', 'fax', 'print', 'screen', 'offset', 'risograph',
  'zine', 'fanzine', 'ephemera', 'sticker', 'label', 'badge', 'emblem',
  'frame', 'border', 'edge', 'corner', 'ornament', 'vignette',
  'smudge', 'smear', 'blot', 'blotch', 'stain', 'splash', 'drip',
  'spray', 'aerosol', 'airbrush', 'sponge', 'rag', 'cloth',
  'palette knife', 'spatula', 'tool', 'brushstroke',
])

const nonDesignWords = new Set([
  'person', 'people', 'man', 'woman', 'boy', 'girl', 'child', 'baby', 'adult',
  'portrait', 'selfie', 'face', 'headshot', 'profile', 'fashion', 'model',
  'animal', 'dog', 'cat', 'bird', 'fish', 'horse', 'pet', 'wildlife', 'insect', 'moth', 'beetle', 'bug', 'spider', 'butterfly', 'caterpillar', 'worm', 'snail', 'slug', 'reptile', 'snake', 'lizard', 'turtle', 'frog', 'toad', 'mammal', 'bear', 'wolf', 'fox', 'rabbit', 'deer', 'mouse', 'rat', 'squirrel', 'bat', 'whale', 'dolphin', 'shark', 'octopus', 'jellyfish', 'crab', 'lobster', 'prawn', 'shrimp', 'seal', 'otter',
  'food', 'meal', 'dish', 'recipe', 'restaurant', 'kitchen', 'cooking', 'baking',
  'car', 'vehicle', 'truck', 'bus', 'train', 'plane', 'boat', 'ship', 'bicycle',
  'building', 'house', 'home', 'architecture', 'cityscape', 'skyline',
  'landscape', 'mountain', 'ocean', 'beach', 'sunset', 'sunrise', 'forest', 'tree', 'nature',
  'travel', 'tourism', 'vacation', 'holiday', 'destination', 'landmark',
  'sport', 'game', 'match', 'player', 'team', 'stadium', 'athlete',
  'concert', 'festival', 'performance', 'stage', 'audience', 'crowd',
  'wedding', 'event', 'party', 'celebration', 'ceremony',
  'document', 'certificate', 'form', 'receipt', 'invoice', 'letter', 'memo',
  'screenshot', 'screen capture', 'ui', 'ux', 'interface', 'mockup',
  'product', 'advertisement', 'commercial', 'promotion', 'marketing',
])

const isDesignItem = (item) => {
  const text = [
    item.title,
    item.description,
    item.alt_description,
    ...(Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? [item.tags] : []),
  ].filter(Boolean).join(' ').toLowerCase()

  const hasDesignWord = [...designIntentWords].some((w) => text.includes(w))
  if (hasDesignWord) return true

  const hasNonDesignWord = [...nonDesignWords].some((w) => text.includes(w))
  if (hasNonDesignWord) return false

  return true
}
const titleNoiseWords = [
  'movie', 'film', 'films', 'cinema', 'cinematic', 'shot', 'scene', 'still', 'wallpaper', 'backdrop', 'poster', 'key', 'art',
  'minimal', 'editorial', 'design', 'inspiration', 'moodboard', 'graphic', 'aesthetic', 'official',
  'cast', 'crew', 'actor', 'actress', 'director', 'starring', 'pemeran', 'pemain', 'karakter', 'character',
  'the', 'a', 'an',
]

const FILE_EXT_RE = /\.(webp|jpe?g|png|gif|bmp|svg|tiff?|avif|heic?)\b/i

export const classifyMovieQuery = (value = '') => {
  const normalized = normalizeTag(value)
  const tokens = normalized.split(' ')

  // Gate 0: filter nonsense queries — file extension, too long
  if (FILE_EXT_RE.test(value) || normalized.length > 50) {
    console.log('[TMDB-DEBUG] classifyMovieQuery REJECTED gate0 (nonsense query):', { raw: value, normalized, len: normalized.length })
    return null
  }

  const matchWord = (word) => word.includes(' ') ? normalized.includes(word) : tokens.includes(word)
  const gate1 = !normalized || tokens.some((token) => nonMovieWords.includes(token))
  if (gate1) { console.log('[TMDB-DEBUG] classifyMovieQuery REJECTED gate1 (null/empty/nonMovie):', { raw: value, normalized }); return null }
  const hasMovieIntent = movieIntentWords.some(matchWord)
  const titleTokens = []
  normalized.split(' ').forEach((token) => {
    if (titleNoiseWords.includes(token)) return
    if (titleTokens.includes(token)) return
    titleTokens.push(token)
  })
  const titleCandidate = titleTokens.join(' ').trim()

  const allTokensAreMovieNoise = tokens.length > 0 && tokens.every((token) => (
    titleNoiseWords.includes(token) || movieIntentWords.includes(token)
  ))
  const titleTokensAreGeneric = titleTokens.length > 0 && titleTokens.every((token) =>
    genericVisualWords.includes(token) || connectingWords.includes(token)
  )
  const isGeneric = allTokensAreMovieNoise || titleTokensAreGeneric

  // Gate 3: generic design-only queries (e.g. "design inspiration editorial poster moodboard")
  // have no actual movie title and no strong movie intent → not a movie query
  if (isGeneric && !titleCandidate) {
    const strongMovieIntent = tokens.some((t) =>
      ['movie', 'film', 'cinema', 'cinematic', 'scene', 'still'].includes(t)
    )
    if (!strongMovieIntent) {
      console.log('[TMDB-DEBUG] classifyMovieQuery REJECTED gate3 (design-only generic):', { raw: value, normalized })
      return null
    }
  }

  // Gate 3b: isGeneric AND all titleTokens are generic visual/connecting words.
  // Query describes a VISUAL STYLE (color, country, vibe), not a movie entity title.
  // Title tokens like "black", "and", "white", "korean", "vintage" are not specific
  // enough to be movie titles — they describe the desired aesthetic.
  // Exception: if there's a non-generic word in the original tokens (e.g. "parasite"
  // in "korean parasite poster"), titleTokens contains it and this gate skips.
  // Hybrid routing in getProviderSearchersForQuery will still include TMDB when
  // movie intent words (like "film", "movie") are present in the query.
  if (isGeneric && titleTokensAreGeneric) {
    console.log('[TMDB-DEBUG] classifyMovieQuery REJECTED gate3b (visual-only title tokens):', { raw: value, normalized, titleCandidate })
    return null
  }

  if (!isGeneric) {
    const gate2 = !titleCandidate || (!hasMovieIntent && titleCandidate.split(' ').length >= 8)
    if (gate2) { console.log('[TMDB-DEBUG] classifyMovieQuery REJECTED gate2 (>=5 tokens no movie intent):', { raw: value, normalized, hasMovieIntent, titleCandidate, tokenCount: titleCandidate.split(' ').length }); return null }
  }

  // Gate 4: single-word titleCandidate without movie intent → too generic for TMDB title search.
  // Single common nouns like "films", "movie", "cinema" are not specific entity titles.
  // Multi-word candidates (e.g. "past lives", "la haine") are specific enough.
  if (titleCandidate && !titleCandidate.includes(' ') && !hasMovieIntent) {
    console.log('[TMDB-DEBUG] classifyMovieQuery REJECTED gate4 (single word, no movie intent):', { raw: value, titleCandidate })
    return null
  }

  const visualType = movieBackdropWords.some(matchWord)
    ? 'backdrop'
    : moviePosterWords.some(matchWord)
      ? 'poster'
      : 'poster'

  const result = { visualType, titleCandidate: titleCandidate || normalized, normalizedQuery: normalized, isGeneric }
  console.log('[TMDB-DEBUG] classifyMovieQuery PASS:', { raw: value, normalized, hasMovieIntent, titleCandidate, isGeneric, result })
  return result
}

const musicKeywords = ['album', 'music', 'song', 'vinyl', 'single', 'ep', 'mixtape', 'remix', 'feat', 'featuring', 'soundtrack', 'ost', 'band', 'singer', 'rapper', 'producer', 'record', 'playlist']
const musicMatch = (lower, word) => word.includes(' ') ? lower.includes(word) : lower.split(' ').includes(word)
const classifyMusicQuery = (query) => {
  if (!query || typeof query !== 'string') return false
  const lower = query.trim().toLowerCase()
  if (!lower || lower.length < 2) return false
  const movieResult = classifyMovieQuery(query)
  if (movieResult?.isGeneric) return false
  // Rejected by classifyMovieQuery (e.g. garbage like filenames, "unggahan") → only music if explicit music keywords
  if (!movieResult) return musicKeywords.some((w) => musicMatch(lower, w))
  if (movieResult.titleCandidate.split(' ').length === 1) return false
  const movieIntentWords = ['movie', 'film', 'cinema', 'cinematic', 'poster', 'scene', 'still', 'backdrop', 'key art']
  if (movieIntentWords.some((w) => lower.includes(w))) return false
  // If none of the rejection clauses caught it, only classify as music when
  // explicit music keywords are present — prevents movie titles like "past lives"
  // (which has no movie-intent keyword) from being falsely classified as music.
  return musicKeywords.some((w) => musicMatch(lower, w))
}

const buildMovieSearchVariants = (classifier) => {
  if (!classifier) return []
  const query = classifier.normalizedQuery || classifier.titleCandidate
  const queryYear = query.match(/\b(19|20)\d{2}\b/)?.[0]
  const queryTitle = queryYear ? query.replace(queryYear, '').trim() : query
  const variants = queryTitle !== query ? [query, queryTitle] : [queryTitle]
  const tokens = queryTitle
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
  if (tokens.length > 1) {
    tokens.forEach((_, index) => {
      const reduced = tokens.filter((_, tokenIndex) => tokenIndex !== index).join(' ').trim()
      if (reduced && reduced !== queryTitle) variants.push(reduced)
    })
  }
  return uniqueQueries(variants, 6)
}

const decodeCursor = (cursor) => {
  if (!cursor) return {}
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
  } catch {
    return {}
  }
}

const encodeCursor = (value) => (
  value && Object.keys(value).length ? Buffer.from(JSON.stringify(value)).toString('base64url') : null
)

const getProviderLimit = (totalLimit, providerCount) => Math.max(1, Math.ceil(totalLimit / Math.max(1, providerCount)))

const homeFallbackQueries = {
  'for-you': ['design inspiration editorial poster moodboard'],
  recent: ['contemporary design photography inspiration'],
  popular: ['popular creative design poster photography'],
}

const queryExpansionMap = [
  { match: ['film poster', 'movie poster', 'poster'], queries: ['editorial poster', 'minimal poster', 'cinematic poster'] },
  { match: ['album', 'music'], queries: ['album cover', 'music cover art', 'vinyl cover'] },
  { match: ['fashion'], queries: ['fashion editorial', 'lookbook', 'fashion campaign'] },
  { match: ['interior', 'room'], queries: ['interior moodboard', 'minimal interior design', 'design space'] },
  { match: ['typography', 'type'], queries: ['typography poster', 'editorial typography', 'graphic design poster'] },
  { match: ['moodboard', 'mood board'], queries: ['visual moodboard', 'design moodboard', 'aesthetic moodboard'] },
]

const uniqueQueries = (queries = [], max = 3) => {
  const seen = new Set()
  return queries
    .map((query) => cleanText(query).toLowerCase())
    .filter((query) => {
      if (!query || query.length < 3 || seen.has(query)) return false
      seen.add(query)
      return true
    })
    .slice(0, max)
}

const EXPAND_EXT_RE = /\.(webp|jpe?g|png|gif|bmp|svg|tiff?|avif|heic?)/i
const HOME_GARBAGE_WORDS = new Set(['unggahan', 'saved', 'download', 'untitled', 'screenshot', 'file', 'null'])
const isHomeGarbageTag = (tag) => {
  const s = tag.trim().toLowerCase()
  if (!s) return true
  if (EXPAND_EXT_RE.test(s.replace(/\s+/g, ''))) return true
  if (!s.includes(' ') && s.length > 12) return true
  if (HOME_GARBAGE_WORDS.has(s.split(' ')[0])) return true
  return false
}
const expandHomeTagToQueries = (tag) => {
  if (EXPAND_EXT_RE.test(tag.replace(/\s+/g, ''))) return []
  const normalized = normalizeInterestTag(tag)
  if (!normalized) return []
  if (isHomeGarbageTag(tag) || isHomeGarbageTag(normalized)) return []
  const matched = queryExpansionMap.find((entry) => (
    entry.match.some((keyword) => normalized === keyword || normalized.includes(keyword) || keyword.includes(normalized))
  ))
  if (matched) return matched.queries
  return [
    normalized,
    `${normalized} inspiration`,
    `${normalized} moodboard`,
  ]
}

const rotateQueriesBySeed = (queries, seed = '') => {
  if (queries.length <= 1) return queries
  const offset = Math.abs(hashString(seed || new Date().toISOString().slice(0, 10))) % queries.length
  return [...queries.slice(offset), ...queries.slice(0, offset)]
}

const hashString = (value = '') => (
  Array.from(String(value)).reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0)
)

const seededRandom = (seed) => {
  let s = Math.abs(hashString(String(seed))) || 1
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

const weightedSampleByScore = (items = [], count = 1, seed = '') => {
  if (!items.length) return []
  if (items.length <= count) return [...items]
  const rng = seededRandom(seed)
  const result = []
  const pool = items.map((item) => ({ ...item }))
  while (result.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + Math.max(0.001, Number(item.score || 0.001)), 0)
    const r = rng() * total
    let cumulative = 0
    const idx = pool.findIndex((item) => {
      cumulative += Math.max(0.001, Number(item.score || 0.001))
      return cumulative >= r
    })
    result.push(pool.splice(idx >= 0 ? idx : 0, 1)[0])
  }
  return result
}

const strongQueryEventTypes = new Set(['save_post', 'add_to_board', 'drop_to_canvas'])

const isStableHomeQuerySignal = (signal) => (
  Number(signal?.score || 0) >= 3
  || Number(signal?.eventCount || 0) >= 1
  || (signal?.eventTypes || []).some((eventType) => strongQueryEventTypes.has(eventType))
)

const allocateQuerySlots = (queries = [], max = 6, maxSlotsPerItem = null) => {
  if (!queries.length) return []
  const totalScore = queries.reduce((sum, item) => sum + Math.max(0, Number(item.score || 0)), 0)
  const baseSlots = queries.map((item) => ({
    query: item.query,
    score: Number(item.score || 0),
    slots: Math.max(1, totalScore ? Math.round((Number(item.score || 0) / totalScore) * max) : 1),
  }))
  let slotTotal = baseSlots.reduce((sum, item) => sum + item.slots, 0)

  while (slotTotal > max && baseSlots.some((item) => item.slots > 1)) {
    const target = [...baseSlots].sort((a, b) => b.slots - a.slots || a.score - b.score)[0]
    target.slots -= 1
    slotTotal -= 1
  }

  while (slotTotal < max) {
    const target = [...baseSlots].sort((a, b) => b.score - a.score)[0]
    target.slots += 1
    slotTotal += 1
  }

  if (maxSlotsPerItem && maxSlotsPerItem > 0) {
    let excess = 0
    for (const item of baseSlots) {
      if (item.slots > maxSlotsPerItem) {
        excess += item.slots - maxSlotsPerItem
        item.slots = maxSlotsPerItem
      }
    }
    while (excess > 0) {
      const target = [...baseSlots]
        .filter((item) => item.slots < maxSlotsPerItem)
        .sort((a, b) => b.score - a.score)[0]
      if (!target) break
      const room = maxSlotsPerItem - target.slots
      const give = Math.min(excess, room)
      target.slots += give
      excess -= give
    }
  }

  return baseSlots
}

const buildWeightedQueryCandidates = (signals = []) => {
  const byQuery = new Map()
  signals.forEach((signal) => {
    const query = cleanText(signal.query).toLowerCase()
    if (!query) return
    const score = Number(signal.score || 0)
    const existing = byQuery.get(query)
    if (!existing || score > existing.score) byQuery.set(query, { query, score })
  })
  return [...byQuery.values()].sort((a, b) => b.score - a.score)
}

const buildHomeExternalQueries = ({ recentQuerySignals = [], recentTags = [], recentTagScores = {}, seed = '', viewerId = null, mode = 'for-you', max = 6 }) => {
  const stableQuerySignals = recentQuerySignals
    .filter(isStableHomeQuerySignal)
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
  const stableQueries = buildWeightedQueryCandidates(stableQuerySignals)

  const stableTags = recentTags.filter((tag) => (recentTagScores[tag] || 0) >= 4)
  const effectiveTags = (stableTags.length ? stableTags : recentTags.slice(0, 3))
    .filter((tag) => !isHomeGarbageTag(tag))

  const movieSignals = stableQueries.filter((item) => item.query && classifyMovieQuery(item.query))

  const fallbackQuery = homeFallbackQueries[mode]?.[0] || homeFallbackQueries['for-you'][0]

  const buildExplorationQueries = (tags, suffix) => {
    if (!tags.length) return []
    return tags.slice(0, 2).map((tag, i) => {
      const variants = [`${tag} ${suffix}`, tag, `${tag} inspiration`, `trending ${tag}`]
      const idx = Math.abs(hashString(seed + ':explore:' + i)) % variants.length
      return variants[idx]
    })
  }

  const MAX_SLOTS_PER_FILM = Math.ceil(max / 2)

  const ensureFallback = (queries) => {
    if (!queries.includes(fallbackQuery)) {
      if (queries.length >= max) queries.pop()
      queries.push(fallbackQuery)
    }
    return queries
  }

  if (movieSignals.length >= 1) {
    const querySlots = allocateQuerySlots(movieSignals, max, MAX_SLOTS_PER_FILM)
    const explorationQueries = buildExplorationQueries(effectiveTags, 'cinematic')
    let queries = uniqueQueries(
      [
        ...querySlots.map((item) => item.query),
        ...explorationQueries,
        fallbackQuery,
        ...effectiveTags.flatMap(expandHomeTagToQueries).slice(0, 1),
      ].filter(Boolean),
      max,
    )
    queries = ensureFallback(queries)
    return {
      queries,
      slotsPerQuery: querySlots.filter((item) => queries.includes(item.query)),
    }
  }

  const nonMovieQuerySlots = allocateQuerySlots(
    stableQueries.filter((item) => !classifyMovieQuery(item.query)),
    max,
  )
  const expandedQuerySignals = nonMovieQuerySlots
    .filter((item) => !classifyMovieQuery(item.query))
    .flatMap((item) => expandHomeTagToQueries(item.query))

  // Include ALL tags (movie + non-movie) for query diversity.
  // Round-robin interleave across tags with per-tag slot cap
  // to prevent a single high-score tag from dominating all slots.
  const interleaveTagExpansions = (tags = [], scores = {}, maxSlotsPerTag = 3, seed = '') => {
    const batches = tags
      .map((tag) => ({ tag, queries: expandHomeTagToQueries(tag), score: scores[tag] || 0 }))
      .filter(({ queries }) => queries.length > 0)
    // Weighted sample when more tags than available query slots
    const usedBatches = seed && batches.length > MAX_SLOTS_PER_FILM
      ? weightedSampleByScore(batches, Math.max(MAX_SLOTS_PER_FILM, Math.min(batches.length, 8)), seed)
      : batches
    const result = []
    const maxLen = Math.max(...usedBatches.map((b) => Math.min(b.queries.length, maxSlotsPerTag)), 0)
    for (let round = 0; round < maxLen; round++) {
      for (const { tag, queries } of usedBatches) {
        if (round < queries.length) {
          result.push(queries[round])
        }
      }
    }
    return result
  }
  const expandedTagSignals = interleaveTagExpansions(effectiveTags, recentTagScores, MAX_SLOTS_PER_FILM, seed)

  const explorationQueries = buildExplorationQueries(effectiveTags, 'explore')

  let queries = uniqueQueries(
    [
      ...expandedQuerySignals,
      ...expandedTagSignals,
      ...explorationQueries,
      fallbackQuery,
    ].filter(Boolean),
    max,
  )
  queries = ensureFallback(queries)
  return {
    queries,
    slotsPerQuery: queries.map((query) => {
      const source = nonMovieQuerySlots.find((item) => (
        item.query === query
        || expandHomeTagToQueries(item.query).some((expanded) => cleanText(expanded).toLowerCase() === query)
      ))
      return {
        query,
        slots: source?.slots || 1,
        score: source?.score || 0,
      }
    }),
  }
}

const resolveExternalQueries = async ({ q = '', context = '', mode = 'for-you', viewerId = null, seed = '' }) => {
  const directQuery = q?.trim()
  if (directQuery) {
    return {
      recentTags: [],
      recentQueries: [],
      generatedQueries: [directQuery],
      fallbackUsed: false,
    }
  }

  if (context !== 'home') {
    return {
      recentTags: [],
      recentQueries: [],
      generatedQueries: ['design inspiration'],
      fallbackUsed: true,
    }
  }

  const tagsResult = viewerId ? await getTopRecentInterestTagsWithScores({ userId: viewerId, limit: 8 }) : []
  const recentTags = tagsResult.map((t) => t.tag)
  const recentTagScores = Object.fromEntries(tagsResult.map((r) => [r.tag, Number(r.score || 0)]))
  const recentQuerySignals = viewerId ? await getTopRecentInterestQuerySignals({ userId: viewerId, limit: 8 }) : []

  const timeBucket = Math.floor(Date.now() / (1000 * 60 * 30))
  const effectiveSeed = `${seed}:${timeBucket}`

  const generatedFromTags = buildHomeExternalQueries({
    recentQuerySignals,
    recentTags,
    recentTagScores,
    seed: effectiveSeed,
    viewerId,
    mode,
    max: 6,
  })

  const fallbackQueries = homeFallbackQueries[mode] || homeFallbackQueries['for-you']
  const generatedQueries = generatedFromTags.queries?.length
    ? rotateQueriesBySeed(generatedFromTags.queries, effectiveSeed)
    : fallbackQueries

  return {
    recentTags,
    recentQueries: recentQuerySignals.map((s) => s.query),
    generatedQueries,
    querySlots: generatedFromTags.slotsPerQuery || [],
    fallbackUsed: !generatedFromTags.queries?.length,
  }
}

const safeFetchJson = async (url, options = {}) => {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`External image provider failed (${response.status})`)
  return response.json()
}

const safeFetchTmdb = async (path, params = {}) => {
  const searchParams = new URLSearchParams({
    api_key: env.TMDB_API_KEY,
    include_adult: 'false',
    language: 'en-US',
    ...params,
  })
  return safeFetchJson(`${tmdbApiUrl}${path}?${searchParams.toString()}`)
}

const normalizedTokenSet = (value = '') => new Set(
  normalizeTag(value)
    .split(' ')
    .filter((token) => token.length >= 3),
)

const tokenOverlapScore = (a = '', b = '') => {
  const left = normalizedTokenSet(a)
  const right = normalizedTokenSet(b)
  if (!left.size || !right.size) return 0
  let overlap = 0
  left.forEach((token) => {
    if (right.has(token)) overlap += 1
  })
  return overlap / Math.max(left.size, right.size)
}


const scoreTmdbEntity = (entity, classifier) => {
  const isTv = entity.media_type === 'tv'
  const title = normalizeTag(isTv ? entity.name : entity.title || '')
  const originalTitle = normalizeTag(isTv ? entity.original_name : entity.original_title || '')
  const query = normalizeTag(classifier.titleCandidate || classifier.normalizedQuery)
  const aliases = [
    ...(entity.alternativeTitles || []),
    ...(entity.translatedTitles || []),
  ].map(normalizeTag).filter(Boolean)
  const queryYear = query.match(/\b(19|20)\d{2}\b/)?.[0]
  const queryTitle = queryYear ? query.replace(queryYear, '').trim() : query
  const effectiveTitle = queryTitle || query
  const relYear = String(entity.release_date || entity.first_air_date || '').slice(0, 4)
  let score = 0
  if (title === effectiveTitle || originalTitle === effectiveTitle) score += 40
  if (aliases.some((alias) => alias === effectiveTitle)) score += 44
  if (title.includes(effectiveTitle) || effectiveTitle.includes(title)) score += 20
  if (originalTitle.includes(effectiveTitle) || effectiveTitle.includes(originalTitle)) score += 12
  if (aliases.some((alias) => alias.includes(effectiveTitle) || effectiveTitle.includes(alias))) score += 24
  score += Math.max(
    tokenOverlapScore(title, effectiveTitle),
    tokenOverlapScore(originalTitle, effectiveTitle),
    ...aliases.map((alias) => tokenOverlapScore(alias, effectiveTitle)),
  ) * 18
  if (queryYear && relYear === queryYear) score += 80
  if (queryYear && relYear && relYear !== queryYear) score -= 60
  score += Math.min(20, Number(entity.popularity || 0) / 4)
  score += Math.min(10, Number(entity.vote_count || 0) / 500)
  return score
}

const enrichTmdbEntityForMatching = async (entity) => {
  if (!entity?.id) return entity
  const isTv = entity.media_type === 'tv'
  const basePath = isTv ? `/tv/${entity.id}` : `/movie/${entity.id}`
  const [detailsResult, titlesResult] = await Promise.allSettled([
    safeFetchTmdb(basePath, {}),
    safeFetchTmdb(isTv ? `/tv/${entity.id}/alternative_titles` : `/movie/${entity.id}/alternative_titles`, {}),
  ])
  const details = detailsResult.status === 'fulfilled' ? detailsResult.value : {}
  const titlesPayload = titlesResult.status === 'fulfilled' ? titlesResult.value : {}
  const translatedTitles = [
    isTv ? details.name : details.title,
    isTv ? details.original_name : details.original_title,
  ].filter(Boolean)
  const alternativeTitles = (titlesPayload.titles || [])
    .flatMap((item) => [item.title, item.iso_3166_1 === 'US' || item.iso_3166_1 === 'GB' ? item.title : null])
    .filter(Boolean)
  return {
    ...entity,
    ...details,
    title: isTv ? (details.name || entity.name) : (details.title || entity.title),
    original_title: isTv ? (details.original_name || entity.original_name) : (details.original_title || entity.original_title),
    release_date: isTv ? (details.first_air_date || entity.first_air_date) : (details.release_date || entity.release_date),
    alternativeTitles,
    translatedTitles,
  }
}


const getTmdbDisplayTitle = (entity, type) => {
  if (type === 'tv') {
    return entity.name
      || entity.translatedTitles?.find(Boolean)
      || entity.alternativeTitles?.find(Boolean)
      || entity.original_name
      || 'TMDB TV'
  }
  return entity.title
    || entity.translatedTitles?.find(Boolean)
    || entity.alternativeTitles?.find(Boolean)
    || entity.original_title
    || 'TMDB movie'
}

const mapTmdbMediaImage = ({ entity, image, imageType, index }) => {
  const isTv = entity.media_type === 'tv'
  const displayTitle = getTmdbDisplayTitle(entity, isTv ? 'tv' : 'movie')
  const releaseYear = String(entity.release_date || entity.first_air_date || '').slice(0, 4)
  const titleSuffix = imageType === 'backdrop' ? 'cinematic still' : 'poster'
  const filePath = image.file_path
  return {
    id: `tmdb:${entity.id}:${imageType}:${filePath.replace(/^\//, '').replace(/\W+/g, '-')}`,
    provider: 'tmdb',
    externalId: `${entity.id}:${imageType}:${index}`,
    title: `${displayTitle}${releaseYear ? ` (${releaseYear})` : ''} ${titleSuffix}`,
    description: cleanText(entity.overview || ''),
    tags: buildTags(displayTitle, isTv ? entity.original_name : entity.original_title, releaseYear, titleSuffix, isTv ? 'tv' : 'film', isTv ? 'series' : 'movie', imageType),
    url: `${tmdbImageBaseUrl}${filePath}`,
    thumbnailUrl: `${tmdbThumbBaseUrl}${filePath}`,
    width: image.width || null,
    height: image.height || null,
    mimeType: 'image/jpeg',
    author: 'TMDB',
    license: 'TMDB',
    sourceUrl: `https://www.themoviedb.org/${isTv ? 'tv' : 'movie'}/${entity.id}`,
    metadata: {
      tmdbId: entity.id,
      mediaType: isTv ? 'tv' : 'movie',
      displayTitle,
      releaseDate: entity.release_date || entity.first_air_date || null,
      imageType,
      voteAverage: image.vote_average || 0,
      voteCount: image.vote_count || 0,
      language: image.iso_639_1 || null,
    },
  }
}

const tmdbTrendingCache = {
  trending: null,
  popular: null,
  trendingExpiry: 0,
  popularExpiry: 0,
  ttl: 60 * 60 * 1000,
}

const fetchTmdbTrendingMovies = async () => {
  const now = Date.now()
  if (!tmdbTrendingCache.trending || now > tmdbTrendingCache.trendingExpiry) {
    const payload = await safeFetchTmdb('/trending/movie/week', { page: '1' })
    tmdbTrendingCache.trending = (payload.results || []).map((m) => ({ ...m, media_type: 'movie', _source: 'trending' }))
    tmdbTrendingCache.trendingExpiry = now + tmdbTrendingCache.ttl
  }
  if (!tmdbTrendingCache.popular || now > tmdbTrendingCache.popularExpiry) {
    const payload = await safeFetchTmdb('/movie/popular', { page: '1' })
    tmdbTrendingCache.popular = (payload.results || []).map((m) => ({ ...m, media_type: 'movie', _source: 'popular' }))
    tmdbTrendingCache.popularExpiry = now + tmdbTrendingCache.ttl
  }
  return { trending: tmdbTrendingCache.trending, popular: tmdbTrendingCache.popular }
}

const searchTmdbTrending = async ({ visualType = 'poster', limit = 12, cursor = null }) => {
  if (!env.TMDB_API_KEY) return { provider: 'tmdb', items: [], cursor: null, disabled: true }
  const { trending, popular } = await fetchTmdbTrendingMovies()

  const seenIds = new Set()
  const merged = []
  for (const movie of [...trending, ...popular]) {
    if (!seenIds.has(movie.id)) { seenIds.add(movie.id); merged.push(movie) }
  }

  const offset = Number(cursor?.offset || 0)
  const pageMovies = merged.slice(offset, offset + limit)
  if (!pageMovies.length) return { provider: 'tmdb', items: [], cursor: null }

  const imageType = visualType === 'backdrop' ? 'backdrop' : 'poster'
  const imageResults = await Promise.allSettled(
    pageMovies.map((movie) =>
      safeFetchTmdb(`/movie/${movie.id}/images`, { include_image_language: 'en,null' }),
    ),
  )

  const items = []
  imageResults.forEach((result, index) => {
    if (result.status !== 'fulfilled') return
    const movie = pageMovies[index]
    const images = (result.value[`${imageType}s`] || [])
      .filter((img) => img.file_path)
      .sort((a, b) => (
        (Number(b.vote_average || 0) * 2 + Math.log1p(Number(b.vote_count || 0)))
        - (Number(a.vote_average || 0) * 2 + Math.log1p(Number(a.vote_count || 0)))
      ))
    if (images.length) {
      items.push(mapTmdbMediaImage({ entity: movie, image: images[0], imageType, index }))
    }
  })

  const nextOffset = offset + pageMovies.length
  const hasMore = nextOffset < merged.length

  return { provider: 'tmdb', items, cursor: hasMore ? { offset: nextOffset } : null }
}

const searchTmdb = async ({ query, limit, cursor }) => {
  if (!env.TMDB_API_KEY) { console.log('[TMDB-DEBUG] searchTmdb DISABLED (no API key)'); return { provider: 'tmdb', items: [], cursor: null, disabled: true } }

  const entityId = cursor?.mediaId || cursor?.movieId || null
  let entity = null
  if (entityId) {
    const cursorType = cursor?.mediaType === 'tv' ? 'tv' : 'movie'
    const basePath = cursorType === 'tv' ? `/tv/${entityId}` : `/movie/${entityId}`
    const detail = await safeFetchTmdb(basePath, {}).catch(() => null)
    if (detail) {
      entity = { ...detail, media_type: cursorType, id: entityId }
    }
  }

  const classifier = classifyMovieQuery(query) || (entityId ? {
    visualType: cursor?.visualType === 'backdrop' ? 'backdrop' : 'poster',
    titleCandidate: '',
    normalizedQuery: '',
  } : null)
  const gateSkipped = !classifier && !entityId
  console.log('[TMDB-DEBUG] searchTmdb gate:', { query, classifier: !!classifier, entityId, skipped: gateSkipped, isGeneric: classifier?.isGeneric })
  if (gateSkipped) return { provider: 'tmdb', items: [], cursor: null, skipped: true }

  if (classifier?.isGeneric && !entityId) {
    console.log('[TMDB-DEBUG] searchTmdb routing to trending:', { visualType: classifier.visualType, limit, hasCursor: !!cursor })
    return searchTmdbTrending({ visualType: classifier.visualType, limit, cursor })
  }

  if (!entity) {
    let bestMatch = null
    const searchQueries = buildMovieSearchVariants(classifier)
    console.log('[TMDB-DEBUG] searchTmdb searchQueries:', searchQueries)
    for (const sq of searchQueries) {
      const multiPayload = await safeFetchTmdb('/search/multi', {
        query: sq,
        page: '1',
      })
      const results = multiPayload.results || []
      const movieCount = results.filter((r) => r.media_type === 'movie').length
      const tvCount = results.filter((r) => r.media_type === 'tv').length
      console.log('[TMDB-DEBUG] searchTmdb multi results:', { sq, total: results.length, movieCount, tvCount })
      const entities = results
        .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
        .slice(0, 5)
      console.log('[TMDB-DEBUG] searchTmdb entities for scoring:', entities.map((e) => ({ id: e.id, type: e.media_type, name: e.title || e.name, pop: e.popularity })))
      const enriched = await Promise.all(entities.map(enrichTmdbEntityForMatching))
      const scored = enriched.map((item) => ({ entity: item, score: scoreTmdbEntity(item, classifier) }))
      console.log('[TMDB-DEBUG] searchTmdb scored candidates:', scored.map((s) => ({ id: s.entity.id, type: s.entity.media_type, title: s.entity.title || s.entity.name, score: s.score })))
      const candidate = scored.sort((a, b) => b.score - a.score)[0] || null
      if (candidate) {
        if (!bestMatch || candidate.score > bestMatch.score) bestMatch = candidate
        console.log('[TMDB-DEBUG] searchTmdb candidate update:', { sq, title: candidate.entity.title || candidate.entity.name, score: candidate.score, bestScore: bestMatch.score })
        if (bestMatch.score >= 42) { console.log('[TMDB-DEBUG] searchTmdb early break at score >= 42'); break }
      } else {
        console.log('[TMDB-DEBUG] searchTmdb no candidate for:', sq)
      }
    }
    entity = bestMatch?.entity || null
    console.log('[TMDB-DEBUG] searchTmdb bestMatch:', { entity: entity?.title || entity?.name, id: entity?.id, type: entity?.media_type, score: bestMatch?.score })
    if (entity && bestMatch.score < 20) {
      console.log('[TMDB-DEBUG] searchTmdb bestMatch score below threshold (20), discarding')
      entity = null
    }
  }
  if (!entity) { console.log('[TMDB-DEBUG] searchTmdb NO ENTITY FOUND, returning empty'); return { provider: 'tmdb', items: [], cursor: null } }

  const isTv = entity.media_type === 'tv'
  const imagesPath = isTv ? `/tv/${entity.id}/images` : `/movie/${entity.id}/images`
  const imagePayload = await safeFetchTmdb(imagesPath, {
    include_image_language: 'en,null',
  })
  const primaryImages = classifier?.visualType === 'backdrop'
    ? imagePayload.backdrops || []
    : imagePayload.posters || []
  const fallbackImages = classifier?.visualType === 'backdrop'
    ? imagePayload.posters || []
    : imagePayload.backdrops || []
  const orderedImages = [...primaryImages, ...fallbackImages]
    .filter((image) => image.file_path)
    .sort((a, b) => (
      (Number(b.vote_average || 0) * 2 + Math.log1p(Number(b.vote_count || 0)))
      - (Number(a.vote_average || 0) * 2 + Math.log1p(Number(a.vote_count || 0)))
    ))
  const imageType = classifier?.visualType === 'backdrop' ? 'backdrop' : 'poster'
  const offset = Number(cursor?.offset || 0)
  const pageItems = orderedImages.slice(offset, offset + limit)
  const nextOffset = offset + pageItems.length
  const hasMore = nextOffset < orderedImages.length
  const items = pageItems.map((image, index) => mapTmdbMediaImage({
      entity,
      image,
      imageType: offset + index < primaryImages.length ? imageType : (imageType === 'backdrop' ? 'poster' : 'backdrop'),
      index: offset + index,
    }))

  return {
    provider: 'tmdb',
    items,
    cursor: hasMore ? {
      mediaId: entity.id,
      mediaType: isTv ? 'tv' : 'movie',
      offset: nextOffset,
      visualType: imageType,
    } : null,
  }
}

const searchTmdbByEntity = async ({ tmdbId, mediaType = 'movie', visualType = 'poster', limit, cursor }) => (
  searchTmdb({
    query: `${visualType === 'backdrop' ? 'cinematic still' : 'poster'}`,
    limit,
    cursor: {
      mediaId: tmdbId,
      mediaType,
      visualType,
      offset: Number(cursor?.offset || 0),
    },
  })
)

const searchTmdbRecommendations = async ({ tmdbId, mediaType = 'movie', visualType = 'poster', limit = 12 }) => {
  if (!env.TMDB_API_KEY) return []
  const type = mediaType === 'tv' ? 'tv' : 'movie'
  const path = `/${type}/${tmdbId}/recommendations`
  const payload = await safeFetchTmdb(path, { page: '1' }).catch(() => null)
  if (!payload?.results?.length) return []
  const recIds = payload.results.slice(0, 6).map((r) => r.id)
  const perMovieLimit = Math.max(1, Math.ceil(limit / Math.max(1, recIds.length)))
  const allItems = []
  const seenIds = new Set()
  for (const recId of recIds) {
    const result = await searchTmdbByEntity({
      tmdbId: recId,
      mediaType: type,
      visualType,
      limit: perMovieLimit,
    })
    for (const item of result.items || []) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id)
        allItems.push(item)
      }
    }
    if (allItems.length >= limit) break
  }
  return allItems.slice(0, limit)
}

const searchTmdbCompany = async ({ query, limit }) => {
  if (!env.TMDB_API_KEY) return { provider: 'tmdbCompany', items: [], cursor: null, disabled: true }
  const companyPayload = await safeFetchTmdb('/search/company', { query, page: '1' })
  const companies = (companyPayload.results || []).slice(0, 3)
  if (!companies.length) return { provider: 'tmdbCompany', items: [], cursor: null }

  const companyIds = companies.map((c) => c.id)
  const allCompanyNames = [...new Set(companies.map((c) => c.name).filter(Boolean))]

  const [logoResults, discoverPayload] = await Promise.all([
    Promise.all(companyIds.map((id) => safeFetchTmdb(`/company/${id}/images`, {}).catch(() => ({})))),
    safeFetchTmdb('/discover/movie', { with_companies: companyIds.join('|'), sort_by: 'popularity.desc', page: '1' }),
  ])

  const items = []
  logoResults.forEach((payload, ci) => {
    const logos = (payload?.logos || []).filter((l) => l.file_path)
    const companyName = companies[ci]?.name || 'TMDB company'
    logos.forEach((logo, idx) => {
      items.push({
        id: `tmdb:company:${companyIds[ci]}:logo:${idx}`,
        provider: 'tmdb',
        externalId: `company:${companyIds[ci]}:logo:${idx}`,
        title: `${companyName} logo`,
        description: `Official logo of ${companyName}`,
        tags: buildTags(companyName, 'logo', 'brand', 'company', 'productions', 'studio'),
        url: `${tmdbImageBaseUrl}${logo.file_path}`,
        thumbnailUrl: `${tmdbThumbBaseUrl}${logo.file_path}`,
        width: logo.width || null,
        height: logo.height || null,
        mimeType: 'image/png',
        author: 'TMDB',
        license: 'TMDB',
        sourceUrl: `https://www.themoviedb.org/company/${companyIds[ci]}`,
        metadata: { tmdbId: companyIds[ci], mediaType: 'company', displayTitle: companyName, imageType: 'logo' },
      })
    })
  })

  const movies = discoverPayload.results || []
  if (movies.length) {
    const movieImages = await Promise.all(movies.map(async (movie) => {
      const imgPayload = await safeFetchTmdb(`/movie/${movie.id}/images`, { include_image_language: 'en,null' })
      return { movie, posters: imgPayload.posters || [], backdrops: imgPayload.backdrops || [] }
    }))
    movieImages.forEach(({ movie, posters, backdrops }) => {
      const movieTags = buildTags(movie.title || movie.original_title || '', 'film', 'movie', 'poster')
      movieTags.push('company', 'productions', 'studio', 'brand', ...allCompanyNames)
      posters.forEach((poster, pi) => {
        items.push({
          ...mapTmdbMediaImage({ entity: { ...movie, media_type: 'movie' }, image: poster, imageType: 'poster', index: pi }),
          title: `${allCompanyNames[0] || 'Company'} — ${movie.title || movie.original_title || 'film'} poster`,
          tags: movieTags,
        })
      })
      backdrops.forEach((backdrop, bi) => {
        items.push({
          ...mapTmdbMediaImage({ entity: { ...movie, media_type: 'movie' }, image: backdrop, imageType: 'backdrop', index: bi }),
          title: `${allCompanyNames[0] || 'Company'} — ${movie.title || movie.original_title || 'film'} cinematic still`,
          tags: movieTags,
        })
      })
    })
  }

  return { provider: 'tmdbCompany', items, cursor: null }
}

const searchTmdbPerson = async ({ query, limit }) => {
  if (!env.TMDB_API_KEY) return { provider: 'tmdbPerson', items: [], cursor: null, disabled: true }
  const personPayload = await safeFetchTmdb('/search/person', { query, page: '1' })
  const people = (personPayload.results || []).slice(0, 3)
  if (!people.length) return { provider: 'tmdbPerson', items: [], cursor: null }
  const queryNorm = normalizeTag(query)
  const scored = people.map((p) => ({ entity: p, score: scorePersonName(p.name, queryNorm, p.popularity) }))
  console.log('[TMDB-DEBUG] searchTmdbPerson scored:', scored.map((s) => ({ name: s.entity.name, score: s.score })))
  const best = scored.sort((a, b) => b.score - a.score)[0]
  if (!best || best.score < 15) return { provider: 'tmdbPerson', items: [], cursor: null }
  const imagesPayload = await safeFetchTmdb(`/person/${best.entity.id}/images`, {}).catch(() => null)
  const profiles = (imagesPayload?.profiles || []).filter((p) => p.file_path)
  if (!profiles.length) return { provider: 'tmdbPerson', items: [], cursor: null }
  const name = best.entity.name || 'TMDB person'
  const items = profiles.slice(0, limit).map((img, idx) => ({
    id: `tmdb:person:${best.entity.id}:profile:${idx}`,
    provider: 'tmdb',
    externalId: `person:${best.entity.id}:profile:${idx}`,
    title: `${name} profile photo`,
    description: `Portrait of ${name}${best.entity.known_for_department ? ` (${best.entity.known_for_department})` : ''}`,
    tags: buildTags(name, best.entity.known_for_department || '', 'person', 'celebrity', 'profile', 'portrait'),
    url: `${tmdbImageBaseUrl}${img.file_path}`,
    thumbnailUrl: `${tmdbThumbBaseUrl}${img.file_path}`,
    width: img.width || null,
    height: img.height || null,
    mimeType: 'image/jpeg',
    author: 'TMDB',
    license: 'TMDB',
    sourceUrl: `https://www.themoviedb.org/person/${best.entity.id}`,
    metadata: {
      tmdbId: best.entity.id,
      mediaType: 'person',
      displayTitle: name,
      knownFor: best.entity.known_for_department || null,
      imageType: 'profile',
      popularity: best.entity.popularity || 0,
    },
  }))
  return { provider: 'tmdbPerson', items, cursor: null }
}

const scorePersonName = (name, queryNorm, popularity) => {
  const nameNorm = normalizeTag(name || '')
  if (!nameNorm || !queryNorm) return 0
  let score = 0
  if (nameNorm === queryNorm) score += 50
  if (nameNorm.includes(queryNorm) || queryNorm.includes(nameNorm)) score += 25
  if (queryNorm.split(' ').some((t) => nameNorm.includes(t))) score += 10
  score += Math.min(15, Number(popularity || 0) / 4)
  return score
}

const searchTmdbCredits = async ({ query, limit }) => {
  if (!env.TMDB_API_KEY) return { provider: 'tmdbCredits', items: [], cursor: null, disabled: true }
  if (!query.match(/\b(?:cast|crew|actor|actress|director|starring|pemeran|pemain|karakter)\b/i)) return { provider: 'tmdbCredits', items: [], cursor: null }
  const classifier = classifyMovieQuery(query)
  if (!classifier) return { provider: 'tmdbCredits', items: [], cursor: null }
  const searchQuery = classifier.titleCandidate || classifier.normalizedQuery || query
  const multiPayload = await safeFetchTmdb('/search/multi', { query: searchQuery, page: '1' })
  const entities = (multiPayload.results || [])
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 3)
  const enriched = await Promise.all(entities.map(enrichTmdbEntityForMatching))
  const scored = enriched.map((item) => ({ entity: item, score: scoreTmdbEntity(item, classifier) }))
  console.log('[TMDB-DEBUG] searchTmdbCredits scored:', scored.map((s) => ({ id: s.entity.id, type: s.entity.media_type, title: s.entity.title || s.entity.name, score: s.score })))
  const bestEntity = scored.sort((a, b) => b.score - a.score)[0] || null
  console.log('[TMDB-DEBUG] searchTmdbCredits bestEntity:', { entity: bestEntity?.entity?.title || bestEntity?.entity?.name, score: bestEntity?.score, passed: bestEntity?.score >= 20 })
  if (!bestEntity || bestEntity.score < 20) return { provider: 'tmdbCredits', items: [], cursor: null }
  const isTv = bestEntity.entity.media_type === 'tv'
  const creditsPath = isTv ? `/tv/${bestEntity.entity.id}/credits` : `/movie/${bestEntity.entity.id}/credits`
  const creditsPayload = await safeFetchTmdb(creditsPath, {}).catch(() => null)
  if (!creditsPayload?.cast?.length && !creditsPayload?.crew?.length) return { provider: 'tmdbCredits', items: [], cursor: null }
  const cast = (creditsPayload.cast || [])
    .filter((c) => c.profile_path)
  const crew = (creditsPayload.crew || [])
    .filter((c) => c.profile_path && c.job && (c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Producer' || c.job === 'Cinematography' || c.job === 'Music' || c.job === 'Editor' || c.job === 'Production Design' || c.job === 'Costume Design'))
  const displayTitle = getTmdbDisplayTitle(bestEntity.entity, isTv ? 'tv' : 'movie')
  const entityName = isTv ? (bestEntity.entity.name || bestEntity.entity.original_name) : (bestEntity.entity.title || bestEntity.entity.original_title)
  const mapPerson = (person, role, roleType, index) => ({
    id: `tmdb:credits:${person.id}:${roleType}:${index}`,
    provider: 'tmdb',
    externalId: `credits:${person.id}:${roleType}:${index}`,
    title: roleType === 'cast' ? `${person.name} as ${role || 'unknown'} in ${displayTitle}` : `${person.name} (${role}) in ${displayTitle}`,
    description: roleType === 'cast' ? `${person.name} plays ${role}` : `${person.name} — ${role} of ${displayTitle}`,
    tags: buildTags(person.name, role || roleType, entityName || '', roleType, 'film', 'celebrity', 'profile'),
    url: `${tmdbImageBaseUrl}${person.profile_path}`,
    thumbnailUrl: `${tmdbThumbBaseUrl}${person.profile_path}`,
    width: null,
    height: null,
    mimeType: 'image/jpeg',
    author: 'TMDB',
    license: 'TMDB',
    sourceUrl: `https://www.themoviedb.org/person/${person.id}`,
    metadata: {
      tmdbId: person.id,
      mediaType: 'person',
      displayTitle: person.name,
      role: role || roleType,
      imageType: 'profile',
      popularity: person.popularity || 0,
    },
  })
  const items = [
    ...cast.map((p, i) => mapPerson(p, p.character, 'cast', i)),
    ...crew.map((p, i) => mapPerson(p, p.job, 'crew', i)),
  ]
  return { provider: 'tmdbCredits', items, cursor: null }
}

const mapCommonsPage = (page) => {
  const imageInfo = page.imageinfo?.[0]
  if (!imageInfo?.url || !allowedMimeTypes.has(imageInfo.mime)) return null
  const metadata = imageInfo.extmetadata || {}
  const title = cleanText(page.title || '').replace(/^File:/, '')
  const description = cleanText(metadata.ImageDescription?.value || metadata.ObjectName?.value || '')
  const author = cleanText(metadata.Artist?.value || metadata.Credit?.value || '')
  const license = cleanText(metadata.LicenseShortName?.value || metadata.UsageTerms?.value || '')

  return {
    id: `wikimedia:${page.pageid}`,
    provider: 'wikimedia',
    externalId: String(page.pageid),
    title: title || 'Wikimedia image',
    description,
    tags: buildTags(title, description),
    url: imageInfo.url,
    thumbnailUrl: imageInfo.thumburl || imageInfo.url,
    width: imageInfo.width || null,
    height: imageInfo.height || null,
    mimeType: imageInfo.mime,
    author,
    license,
    sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`,
  }
}

const searchWikimedia = async ({ query, limit, cursor }) => {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${query} filetype:bitmap`,
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: '640',
  })

  if (cursor?.gsroffset) params.set('gsroffset', String(cursor.gsroffset))
  const payload = await safeFetchJson(`${commonsApiUrl}?${params.toString()}`, {
    headers: { 'User-Agent': 'Moodspace/1.0 (external image discovery)' },
  })
  const pages = Object.values(payload.query?.pages || {})
  return {
    provider: 'wikimedia',
    items: pages.map(mapCommonsPage).filter(Boolean).slice(0, limit),
    cursor: payload.continue || null,
  }
}

const mapUnsplashPhoto = (photo) => ({
  id: `unsplash:${photo.id}`,
  provider: 'unsplash',
  externalId: photo.id,
  title: photo.description || photo.alt_description || 'Unsplash image',
  description: photo.alt_description || photo.description || '',
  tags: buildTags(photo.description, photo.alt_description, ...(photo.tags || []).map((tag) => tag.title)),
  url: photo.urls?.regular || photo.urls?.full || photo.urls?.raw,
  thumbnailUrl: photo.urls?.small || photo.urls?.thumb || photo.urls?.regular,
  width: photo.width || null,
  height: photo.height || null,
  mimeType: 'image/jpeg',
  author: photo.user?.name || photo.user?.username || '',
  license: 'Unsplash License',
  sourceUrl: photo.links?.html || '',
})

const searchUnsplash = async ({ query, limit, cursor }) => {
  if (!env.UNSPLASH_ACCESS_KEY) return { provider: 'unsplash', items: [], cursor: null, disabled: true }
  const page = Number(cursor?.page || 1)
  const params = new URLSearchParams({ query, per_page: String(limit), page: String(page), content_filter: 'high' })
  const payload = await safeFetchJson(`${unsplashApiUrl}?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` },
  })
  return {
    provider: 'unsplash',
    items: (payload.results || []).map(mapUnsplashPhoto).filter((item) => item.url).slice(0, limit),
    cursor: payload.total_pages && page < payload.total_pages ? { page: page + 1 } : null,
  }
}

const mapPexelsPhoto = (photo) => ({
  id: `pexels:${photo.id}`,
  provider: 'pexels',
  externalId: String(photo.id),
  title: photo.alt || 'Pexels image',
  description: photo.alt || '',
  tags: buildTags(photo.alt),
  url: photo.src?.large2x || photo.src?.large || photo.src?.original,
  thumbnailUrl: photo.src?.medium || photo.src?.small || photo.src?.large,
  width: photo.width || null,
  height: photo.height || null,
  mimeType: 'image/jpeg',
  author: photo.photographer || '',
  license: 'Pexels License',
  sourceUrl: photo.url || '',
})

const searchPexels = async ({ query, limit, cursor }) => {
  if (!env.PEXELS_API_KEY) return { provider: 'pexels', items: [], cursor: null, disabled: true }
  const page = Number(cursor?.page || 1)
  const params = new URLSearchParams({ query, per_page: String(limit), page: String(page), orientation: 'all' })
  const payload = await safeFetchJson(`${pexelsApiUrl}?${params.toString()}`, {
    headers: { Authorization: env.PEXELS_API_KEY },
  })
  return {
    provider: 'pexels',
    items: (payload.photos || []).map(mapPexelsPhoto).filter((item) => item.url).slice(0, limit),
    cursor: payload.next_page ? { page: page + 1 } : null,
  }
}

const mapPixabayImage = (image) => ({
  id: `pixabay:${image.id}`,
  provider: 'pixabay',
  externalId: String(image.id),
  title: image.tags || 'Pixabay image',
  description: image.tags || '',
  tags: buildTags(image.tags),
  url: image.largeImageURL || image.fullHDURL || image.webformatURL,
  thumbnailUrl: image.webformatURL || image.previewURL || image.largeImageURL,
  width: image.imageWidth || image.webformatWidth || null,
  height: image.imageHeight || image.webformatHeight || null,
  mimeType: 'image/jpeg',
  author: image.user || '',
  license: 'Pixabay Content License',
  sourceUrl: image.pageURL || '',
})

const searchPixabay = async ({ query, limit, cursor }) => {
  if (!env.PIXABAY_API_KEY) return { provider: 'pixabay', items: [], cursor: null, disabled: true }
  const page = Number(cursor?.page || 1)
  const params = new URLSearchParams({
    key: env.PIXABAY_API_KEY,
    q: query,
    image_type: 'photo',
    safesearch: 'true',
    per_page: String(Math.max(3, limit)),
    page: String(page),
  })
  const payload = await safeFetchJson(`${pixabayApiUrl}?${params.toString()}`)
  const totalPages = Math.ceil((payload.totalHits || 0) / Math.max(3, limit))
  return {
    provider: 'pixabay',
    items: (payload.hits || []).map(mapPixabayImage).filter((item) => item.url).slice(0, limit),
    cursor: page < totalPages ? { page: page + 1 } : null,
  }
}

const searchiTunes = async ({ query, limit = 12, cursor = null }) => {
  try {
    const page = Number(cursor?.page || 1)
    const itLimit = Math.min(limit, 25)
    const offset = (page - 1) * itLimit
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=${itLimit}&offset=${offset}`
    const payload = await safeFetchJson(url)
    const items = (payload.results || []).map((item) => {
      const artworkUrl = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb')
      return {
        id: `itunes:${item.collectionId}`,
        provider: 'itunes',
        externalId: String(item.collectionId),
        title: item.collectionName || 'Untitled',
        description: item.artistName || '',
        tags: buildTags(item.collectionName, item.artistName, 'album', 'music', 'cover'),
        url: artworkUrl,
        thumbnailUrl: artworkUrl,
        width: 600,
        height: 600,
        mimeType: 'image/jpeg',
        author: item.artistName || 'Unknown',
        license: 'Various (see source)',
        sourceUrl: item.collectionViewUrl || artworkUrl,
      }
    })
    return {
      provider: 'itunes',
      items,
      cursor: payload.results?.length >= itLimit ? { page: page + 1 } : null,
    }
  } catch {
    return { provider: 'itunes', items: [], cursor: null }
  }
}

const searchOpenverse = async ({ query, limit = 12, cursor = null }) => {
  try {
    const page = Number(cursor?.page || 1)
    const ovUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page=${page}&page_size=${Math.min(limit, 20)}`
    const payload = await safeFetchJson(ovUrl)
    const items = (payload.results || []).map((img) => ({
      id: `openverse:${img.id}`,
      provider: 'openverse',
      externalId: img.id,
      title: img.title || 'Untitled',
      description: img.description || '',
      tags: buildTags(img.title, img.source, img.license, ...(img.tags?.map((t) => t.name) || [])),
      url: img.url,
      thumbnailUrl: img.url,
      width: img.width || null,
      height: img.height || null,
      mimeType: 'image/jpeg',
      author: img.creator || 'Unknown',
      license: img.license || 'CC0',
      sourceUrl: img.url,
    }))
    return {
      provider: 'openverse',
      items,
      cursor: payload.results?.length >= limit ? { page: page + 1 } : null,
    }
  } catch {
    return { provider: 'openverse', items: [], cursor: null }
  }
}



const providerSearchers = [
  ['tmdb', searchTmdb],
  ['tmdbCredits', searchTmdbCredits],
  ['tmdbPerson', searchTmdbPerson],
  ['wikimedia', searchWikimedia],
  ['unsplash', searchUnsplash],
  ['pexels', searchPexels],
  ['pixabay', searchPixabay],
  ['openverse', searchOpenverse],
]

const providerSearchersWithItunes = [
  ...providerSearchers,
  ['itunes', searchiTunes],
]

const getProviderSearchers = ({ context = '', hasMovieQuery = false }) => {
  if (context === 'home' && hasMovieQuery) {
    return [
      ['tmdb', searchTmdb],
      ['wikimedia', searchWikimedia],
    ]
  }
  return providerSearchers
}

const getProviderSearchersForQuery = ({ context = '', query = '' }) => {
  const classifier = classifyMovieQuery(query)
  if (classifier) {
    if (context === 'home') {
      return [
        ['tmdb', searchTmdb],
        ['wikimedia', searchWikimedia],
      ]
    }
    if (context === 'browse_asset') {
      return [
        ['tmdb', searchTmdb],
        ['tmdbCredits', searchTmdbCredits],
        ['itunes', searchiTunes],
        ['wikimedia', searchWikimedia],
      ]
    }
    return providerSearchers
  }
  // Non-movie query in home context — use design providers (Unsplash, Pexels, etc.)
  if (context === 'home') {
    // Hybrid routing: jika query mengandung movie intent words (e.g. "korean poster film"
    // di-reject Gate 3b karena titleTokens=["korean"] visual-only, tapi tetap valid untuk
    // TMDB search karena ada kata "film"), include TMDB bersama design providers.
    const hasMovieIntentWords = movieIntentWords.some((word) => {
      if (word.includes(' ')) return query.includes(word)
      return query.split(' ').includes(word)
    })
    if (hasMovieIntentWords) {
      return [
        ['tmdb', searchTmdb],
        ['unsplash', searchUnsplash],
        ['pexels', searchPexels],
        ['pixabay', searchPixabay],
        ['openverse', searchOpenverse],
        ['wikimedia', searchWikimedia],
      ]
    }
    return [
      ['unsplash', searchUnsplash],
      ['pexels', searchPexels],
      ['pixabay', searchPixabay],
      ['openverse', searchOpenverse],
      ['wikimedia', searchWikimedia],
    ]
  }
  return providerSearchers
}

const interleaveProviderItems = (providerResults, limit, { preferTmdb = false, preferCoverArt = false, hasMusicQuery = false } = {}) => {
  const counts = providerResults.map((r) => ({ provider: r.provider, items: r.items?.length || 0, firstTitle: r.items?.[0]?.title || r.items?.[0]?.alt_description || null }))
  console.log('[TMDB-DEBUG] interleaveProviderItems input:', { preferTmdb, preferCoverArt, hasMusicQuery, limit, providerCounts: counts })
  if (preferTmdb) {
    const tmdbQueue = providerResults
      .filter((result) => result.provider === 'tmdb' && result.items?.length)
      .flatMap((result) => result.items)
    const creditsQueue = providerResults
      .filter((result) => (result.provider === 'tmdbCredits' || result.provider === 'tmdbPerson') && result.items?.length)
      .flatMap((result) => result.items)
    const otherItems = providerResults
      .filter((result) => result.provider !== 'tmdb' && result.provider !== 'tmdbCredits' && result.provider !== 'tmdbPerson' && result.provider !== 'itunes' && result.items?.length)
      .flatMap((result) => result.items)
    const result = []
    let tmdbi = 0, creditsi = 0
    // Reserve up to 2 slots for non-TMDB items so design items aren't
    // entirely obliterated when preferTmdb fills all limit slots.
    const tmdbReserve = Math.min(2, otherItems.length)
    while (result.length < limit - tmdbReserve && (tmdbi < tmdbQueue.length || creditsi < creditsQueue.length)) {
      if (tmdbi < tmdbQueue.length) result.push(tmdbQueue[tmdbi++])
      if (result.length >= limit - tmdbReserve) break
      if (creditsi < creditsQueue.length) result.push(creditsQueue[creditsi++])
    }
    if (result.length === 0) {
      const coverartQueue = providerResults
        .filter((r) => r.provider === 'itunes' && r.items?.length)
        .flatMap((r) => r.items)
      const remainingOther = providerResults
        .filter((r) => r.provider !== 'itunes' && r.provider !== 'tmdb' && r.provider !== 'tmdbCredits' && r.provider !== 'tmdbPerson' && r.items?.length)
        .flatMap((r) => r.items)
      let ci = 0
      while (result.length < limit && ci < coverartQueue.length) {
        result.push(coverartQueue[ci++])
      }
      while (result.length < limit && remainingOther.length) {
        result.push(remainingOther.shift())
      }
    } else {
      while (result.length < limit && otherItems.length) result.push(otherItems.shift())
      // Top up with TMDB/credits if non-TMDB items didn't fill remaining slots
      while (result.length < limit && (tmdbi < tmdbQueue.length || creditsi < creditsQueue.length)) {
        if (tmdbi < tmdbQueue.length) result.push(tmdbQueue[tmdbi++])
        if (result.length >= limit) break
        if (creditsi < creditsQueue.length) result.push(creditsQueue[creditsi++])
      }
    }
    console.log('[TMDB-DEBUG] interleaveProviderItems result:', { tmdbCount: tmdbQueue.length, creditsCount: creditsQueue.length, otherCount: otherItems.length, finalCount: result.length })
    return result
  }

  if (preferCoverArt) {
    const coverartQueue = providerResults
      .filter((result) => result.provider === 'itunes' && result.items?.length)
      .flatMap((result) => result.items)
    const tmdbQueue = providerResults
      .filter((result) => result.provider === 'tmdb' && result.items?.length)
      .flatMap((result) => result.items)
    const creditsQueue = providerResults
      .filter((result) => (result.provider === 'tmdbCredits' || result.provider === 'tmdbPerson') && result.items?.length)
      .flatMap((result) => result.items)
    const otherItems = providerResults
      .filter((result) => result.provider !== 'itunes' && result.provider !== 'tmdb' && result.provider !== 'tmdbCredits' && result.provider !== 'tmdbPerson' && result.items?.length)
      .flatMap((result) => result.items)
    const result = []
    let ci = 0, tmdbi = 0, creditsi = 0
    while (result.length < limit && (tmdbi < tmdbQueue.length || ci < coverartQueue.length || creditsi < creditsQueue.length)) {
      if (tmdbi < tmdbQueue.length) result.push(tmdbQueue[tmdbi++])
      if (result.length >= limit) break
      if (ci < coverartQueue.length) result.push(coverartQueue[ci++])
      if (result.length >= limit) break
      if (creditsi < creditsQueue.length) result.push(creditsQueue[creditsi++])
    }
    while (result.length < limit && otherItems.length) {
      result.push(otherItems.shift())
    }
    console.log('[TMDB-DEBUG] interleaveProviderItems coverart result:', { coverartCount: coverartQueue.length, tmdbCount: tmdbQueue.length, creditsCount: creditsQueue.length, otherCount: otherItems.length, finalCount: result.length })
    return result
  }

  const queues = providerResults
    .filter((result) => result.items?.length)
    .map((result) => [...result.items])
  const items = []
  while (items.length < limit && queues.some((queue) => queue.length)) {
    queues.forEach((queue) => {
      if (items.length < limit && queue.length) items.push(queue.shift())
    })
  }
  console.log('[TMDB-DEBUG] interleaveProviderItems fallback result:', { itemsCount: items.length })
  return items
}

const uniqueItemsById = (items = []) => {
  const seen = new Set()
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

const recCache = new Map()
const REC_CACHE_TTL = 10 * 60 * 1000

export const searchExternalImages = async ({ q = '', limit = 12, cursor = null, context = '', mode = 'for-you', seed = '', viewerId = null, tmdbId = null, mediaType = 'movie', visualType = 'poster', includeRecommendations = false, visualSimilarTo = '', semanticText = '' } = {}) => {
  if (tmdbId) {
    const decodedCursor = decodeCursor(cursor)
    const tmdbCursor = decodedCursor?.queries?.[0]?.tmdb || decodedCursor?.tmdb || null
    const tmdbResult = await searchTmdbByEntity({
      tmdbId,
      mediaType,
      visualType,
      limit,
      cursor: tmdbCursor,
    })

    let items = tmdbResult.items || []
    let adjustedCursor = tmdbResult.cursor

    if (includeRecommendations) {
      const cacheKey = `${tmdbId}:${mediaType}:${visualType}`
      let recItems = []
      const cached = recCache.get(cacheKey)
      if (cached && Date.now() - cached.ts < REC_CACHE_TTL) {
        recItems = cached.data
      } else if (!tmdbCursor) {
        recItems = await searchTmdbRecommendations({
          tmdbId,
          mediaType,
          visualType,
          limit: Math.min(limit, 12),
        })
        recCache.set(cacheKey, { data: recItems, ts: Date.now() })
      }
      if (recItems.length) {
        const mainIds = new Set(items.map(i => i.id))
        const uniqueRecItems = recItems.filter(i => !mainIds.has(i.id))
        const recOffset = Number(tmdbCursor?.recOffset || 0)
        const currentMainOffset = Number(tmdbCursor?.offset || 0)
        const mixed = []
        let mi = 0, ri = recOffset
        while (mi < items.length && mixed.length < limit) {
          for (let c = 0; c < 2 && mi < items.length && mixed.length < limit; c++) {
            mixed.push(items[mi++])
          }
          if (ri < uniqueRecItems.length && mixed.length < limit) {
            mixed.push(uniqueRecItems[ri++])
          }
        }
        items = mixed
        if (tmdbResult.cursor) {
          adjustedCursor = {
            ...tmdbResult.cursor,
            offset: currentMainOffset + mi,
            recOffset: ri,
          }
        }
      }
    }

    const nextCursor = adjustedCursor
      ? encodeCursor({ queries: { 0: { __query: `tmdb:${mediaType}:${tmdbId}:${visualType}`, tmdb: adjustedCursor } } })
      : null
    return {
      providers: [{
        provider: 'tmdb',
        query: `tmdb:${mediaType}:${tmdbId}:${visualType}`,
        requested: limit,
        count: items.length || 0,
        disabled: !!tmdbResult.disabled,
        error: tmdbResult.error || null,
      }],
      query: `tmdb:${mediaType}:${tmdbId}:${visualType}`,
      generatedQueries: [`tmdb:${mediaType}:${tmdbId}:${visualType}`],
      recentTags: [],
      recentQueries: [],
      fallbackUsed: false,
      movieQuery: true,
      items,
      nextCursor,
    }
  }

  const queryPlan = await resolveExternalQueries({ q, context, mode, viewerId, seed })
  const decodedCursor = decodeCursor(cursor)
  const queries = queryPlan.generatedQueries.length ? [...new Set(queryPlan.generatedQueries)] : ['design inspiration']
  const querySlots = queries.map((query) => {
    const slot = queryPlan.querySlots?.find((item) => item.query === query)
    return {
      query,
      slots: Math.max(1, Number(slot?.slots || 1)),
    }
  })
  const totalQuerySlots = querySlots.reduce((sum, item) => sum + item.slots, 0)
  const hasMovieQuery = queries.some((query) => !!classifyMovieQuery(query))
  const hasMusicQuery = queries.some((query) => !!classifyMusicQuery(query))
  const perQueryLimit = Math.max(1, Math.ceil(limit / Math.max(1, queries.length)))

  console.log('[TMDB-DEBUG] searchExternalImages routing:', {
    context, queries, hasMovieQuery, perQueryLimit, limit, cursor: !!cursor,
  })

  // browse_asset: skip all external provider searches (TMDB/iTunes/Wikimedia/dll).
  // Query dari asset names/tags tidak representatif sebagai judul film,
  // menghasilkan 0 results dan buang 60+ detik network wait.
  // Hanya gunakan visual similarity + semantic path + CLIP rerank.
  if (context === 'browse_asset') {
    console.log('[BROWSE-ASSET] Skipping provider search, queries:', queries.join(' | '), 'visualSimilarTo:', visualSimilarTo ? `${visualSimilarTo.split(',').length} ids` : 'none')
    console.time('[BROWSE-ASSET] Total')
    let items = []

    // Visual similarity (visualSimilarTo)
    if (visualSimilarTo) {
      console.time('[BROWSE-ASSET] Lazy CLIP for uploaded images')
      const ids = visualSimilarTo.split(',').filter(Boolean)
      const embeddings = []
      for (const id of ids) {
        console.time(`[BROWSE-ASSET] Process image ${id.slice(0,8)}`)
        let emb = await findAnyEmbedding({ id })
        console.timeLog(`[BROWSE-ASSET] Process image ${id.slice(0,8)}`, 'findAnyEmbedding done')
        if (!emb && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          if (uploadEmbeddingCache.has(id)) {
            console.timeLog(`[BROWSE-ASSET] Process image ${id.slice(0,8)}`, 'cache hit')
            emb = uploadEmbeddingCache.get(id)
          } else {
            try {
              const media = await findMediaById(id)
              console.timeLog(`[BROWSE-ASSET] Process image ${id.slice(0,8)}`, 'findMediaById done')
              if (media?.publicUrl) {
                console.timeLog(`[BROWSE-ASSET] Process image ${id.slice(0,8)}`, 'calling getImageEmbedding')
                const computed = await getImageEmbedding(media.publicUrl)
                console.timeLog(`[BROWSE-ASSET] Process image ${id.slice(0,8)}`, 'getImageEmbedding done')
                if (computed) {
                  uploadEmbeddingCache.set(id, computed)
                  emb = computed
                }
              }
            } catch { void 0 }
          }
        }
        console.timeEnd(`[BROWSE-ASSET] Process image ${id.slice(0,8)}`)
        if (emb) embeddings.push(emb)
      }
      console.timeEnd('[BROWSE-ASSET] Lazy CLIP for uploaded images')
      console.time('[BROWSE-ASSET] Visual similarity DB search')
      const embedding = averageEmbeddings(embeddings)
      if (embedding) {
        const dbResults = await findImagesByVisualSimilarity({ embedding, limit: Math.min(limit, 6), offset: 0 })
        console.timeEnd('[BROWSE-ASSET] Visual similarity DB search')
        if (dbResults.length) {
          items = dbResults.map((item) => {
            const { _embedding, createdAt, updatedAt, ...rest } = item
            return { ...rest, clipScore: item._clipScore }
          })
        }
      } else {
        console.timeEnd('[BROWSE-ASSET] Visual similarity DB search')
      }
    }

    // TMDB search from OCR text — only newest drop, split per line
    let tmdbQuery = null
    if (visualSimilarTo) {
      const ids = visualSimilarTo.split(',').filter(Boolean)
      const newestId = ids[0]
      if (newestId) {
        const media = await findMediaById(newestId).catch(() => null)
        if (media?.ocrText) {
          const lines = media.ocrText
            .split(/\r?\n/)
            .map((l) => l.replace(/[^a-zA-Z0-9\s':.!?-]/g, ' ').replace(/\s+/g, ' ').trim())
            .filter((l) => l.length > 3)
          for (const line of lines) {
            if (classifyMovieQuery(line)) {
              tmdbQuery = line.slice(0, 120)
              break
            }
          }
        }
      }
    }
    if (!tmdbQuery && queries.length) {
      tmdbQuery = queries.find((q) => classifyMovieQuery(q)) || null
    }
    if (tmdbQuery) {
      console.log('[BROWSE-ASSET] TMDB search for:', tmdbQuery)
      const tmdbResult = await searchTmdb({ query: tmdbQuery, limit: Math.min(limit, 6), cursor: null }).catch(() => null)
      if (tmdbResult?.items?.length) {
        const seen = new Set(items.map((i) => i.id))
        for (const tmdbItem of tmdbResult.items) {
          if (!seen.has(tmdbItem.id)) {
            items.push({ ...tmdbItem, clipScore: null })
            seen.add(tmdbItem.id)
          }
        }
        console.log('[BROWSE-ASSET] TMDB items added:', tmdbResult.items.length, 'total items:', items.length)
      }
    }

    // Final CLIP rerank (attach stored embeddings first)
    console.time('[BROWSE-ASSET] CLIP rerank')

  const rerankText = enrichForClipRerank(semanticText || queries.join(' '))
    const queryEmbedding = await getTextEmbedding(rerankText)
    if (queryEmbedding && items.length) {
      const itemIds = items.map((item) => item.id).filter(Boolean)
      const storedEmbeddings = itemIds.length ? await findEmbeddingsByItemIds(itemIds) : {}
      for (const item of items) {
        if (storedEmbeddings[item.id]) {
          item._embedding = storedEmbeddings[item.id]
        }
      }
      computeAndStoreEmbeddings(items).catch(() => {})
    }
    const rerankedItems = queryEmbedding ? rerankByQueryEmbedding(items, queryEmbedding) : items
    console.timeEnd('[BROWSE-ASSET] CLIP rerank')
    console.timeEnd('[BROWSE-ASSET] Total')

    const hasTmdbItems = items.some((i) => i.provider === 'tmdb')
    return {
      providers: hasTmdbItems ? ['tmdb'] : [],
      query: queries[0],
      generatedQueries: queries,
      recentTags: queryPlan.recentTags,
      recentQueries: queryPlan.recentQueries,
      fallbackUsed: queryPlan.fallbackUsed,
      movieQuery: hasTmdbItems,
      items: rerankedItems,
      nextCursor: null,
    }
  }

  const requests = querySlots.flatMap(({ query, slots }, queryIndex) => {
    const queryProviderSearchers = getProviderSearchersForQuery({ context, query })
    const queryIsMovie = !!classifyMovieQuery(query)
    const weightedQueryLimit = Math.max(1, Math.ceil((limit * slots) / Math.max(1, totalQuerySlots)))
    const fallbackProviderLimit = queryIsMovie ? 1 : getProviderLimit(weightedQueryLimit, queryProviderSearchers.length)
    const built = queryProviderSearchers
      .map(([provider, searcher]) => {
        const indexedCursor = decodedCursor?.queries?.[queryIndex]
        const queryCursor = Object.values(decodedCursor?.queries || {}).find((entry) => entry?.__query === query)
        const providerCursor = (indexedCursor?.__query === query ? indexedCursor?.[provider] : null)
          || queryCursor?.[provider]
          || (!indexedCursor?.__query ? indexedCursor?.[provider] : null)
          || null
        if (providerCursor?.exhausted) return null
        const requestLimit = provider === 'tmdb'
          ? Math.max(weightedQueryLimit, Math.ceil(limit * 0.8))
          : provider === 'tmdbCredits'
              ? Math.max(weightedQueryLimit, Math.ceil(limit * 0.7))
              : provider === 'tmdbPerson'
                ? Math.max(weightedQueryLimit, Math.ceil(limit * 0.4))
              : provider === 'itunes'
                ? Math.max(weightedQueryLimit, Math.ceil(limit * 0.6))
              : provider === 'openverse'
                ? Math.max(weightedQueryLimit, Math.ceil(limit * 0.5))
              : fallbackProviderLimit
        return {
          query,
          queryIndex,
          provider,
          searcher,
          limit: requestLimit,
          cursor: providerCursor || null,
        }
      })
      .filter(Boolean)
    console.log('[TMDB-DEBUG] queryProviderSearchers:', { query, queryIsMovie, providers: built.map((r) => ({ p: r.provider, limit: r.limit })) })
    return built
  })

  const results = await Promise.allSettled(requests.map((request) => (
    request.searcher({ query: request.query, limit: request.limit, cursor: request.cursor })
  )))

  const providerResults = results.map((result, index) => {
    const request = requests[index]
    return result.status === 'fulfilled'
      ? { ...result.value, query: request.query, queryIndex: request.queryIndex }
      : { provider: request.provider, query: request.query, queryIndex: request.queryIndex, items: [], cursor: null, error: result.reason?.message || 'Provider failed' }
  })

  providerResults.forEach((result) => {
    if (result.provider === 'tmdb' || result.provider === 'tmdbCredits' || result.provider === 'tmdbPerson' || result.provider === 'itunes') return
    if (result.items?.length && context !== 'browse_asset') {
      result.items = result.items.filter(isDesignItem)
    }
  })

  const nextCursor = providerResults.reduce((acc, result) => {
    if (!acc.queries) acc.queries = {}
    if (!acc.queries[result.queryIndex]) acc.queries[result.queryIndex] = {}
    acc.queries[result.queryIndex].__query = result.query
    acc.queries[result.queryIndex][result.provider] = result.cursor || { exhausted: true }
    return acc
  }, {})
  const hasActiveCursor = providerResults.some((result) => !!result.cursor)
  const items = uniqueItemsById(
    interleaveProviderItems(providerResults, limit * 2, { preferTmdb: hasMovieQuery && !hasMusicQuery, preferCoverArt: hasMusicQuery, hasMusicQuery }),
  ).slice(0, limit * 3)

  // For recommended context, skip text providers and use visual similarity as primary
  if (context === 'recommended' && !!visualSimilarTo) {
    items.splice(0, items.length)
  }

  // Visual offset pagination
  const visOffset = (decodedCursor && typeof decodedCursor === 'object' && 'visOffset' in decodedCursor)
    ? Number(decodedCursor.visOffset) || 0
    : 0
  let visExhausted = false

  let visualSimilarItems = []
  if (visualSimilarTo) {
    const ids = visualSimilarTo.split(',').filter(Boolean)
    const embeddings = []
    for (const id of ids) {
      let emb = await findAnyEmbedding({ id })
      if (!emb && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        if (uploadEmbeddingCache.has(id)) {
          emb = uploadEmbeddingCache.get(id)
        } else {
          try {
            const media = await findMediaById(id)
            if (media?.publicUrl) {
              const computed = await getImageEmbedding(media.publicUrl)
              if (computed) {
                uploadEmbeddingCache.set(id, computed)
                emb = computed
              }
            }
          } catch {
            void 0
          }
        }
      }
      if (emb) embeddings.push(emb)
    }
    const embedding = averageEmbeddings(embeddings)
    if (embedding) {
      const visLimit = context === 'recommended' ? Math.min(limit, 6) : Math.min(limit, 6)
      const dbResults = await findImagesByVisualSimilarity({ embedding, limit: visLimit, offset: visOffset })
      visExhausted = dbResults.length < visLimit
      if (dbResults.length) {
        visualSimilarItems = dbResults.map((item) => {
          const { _embedding, createdAt, updatedAt, ...rest } = item
          return { ...rest, clipScore: item._clipScore }
        })
        if (context === 'recommended') {
          // Visual similarity is primary — replace items entirely
          items.splice(0, items.length, ...visualSimilarItems.slice(0, limit))
        } else {
          const textIds = new Set(items.map((i) => i.id))
          const uniqueVisual = visualSimilarItems.filter((i) => !textIds.has(i.id))
          const mixed = []
          let ti = 0, vi = 0
          while (ti < items.length || vi < uniqueVisual.length) {
            for (let c = 0; c < 3 && ti < items.length; c++) mixed.push(items[ti++])
            if (vi < uniqueVisual.length) mixed.push(uniqueVisual[vi++])
          }
          items.splice(0, items.length, ...mixed.slice(0, limit))
        }
      }
    }
  }

  // Semantic text-to-image visual similarity
  if (semanticText) {
    const textEmb = await getTextEmbedding(enrichForClipRerank(semanticText)).catch(() => null)
    if (textEmb) {
      const dbResults = await findImagesByVisualSimilarity({ embedding: textEmb, limit: Math.min(limit * 2, 16), offset: 0 })
      if (dbResults.length) {
        const semanticItems = dbResults.map((item) => {
          const { _embedding, ...rest } = item
          return { ...rest, clipScore: item._clipScore }
        })
        const existingIds = new Set(items.map((i) => i.id))
        const uniqueSemantic = semanticItems.filter((i) => !existingIds.has(i.id))
        const mixed = []
        let ti = 0, si = 0
        while (ti < items.length || si < uniqueSemantic.length) {
          for (let c = 0; c < 2 && si < uniqueSemantic.length; c++) mixed.push(uniqueSemantic[si++])
          if (ti < items.length) mixed.push(items[ti++])
        }
        items.splice(0, items.length, ...mixed.slice(0, limit))
      }
    }
  }

  // Visual similarity pool — profile-based discovery for home feed
  // Uses stored user embedding (from EMA profile) to find visually similar
  // external images, independent of keyword/title search.
  if (context === 'home' && viewerId && !visualSimilarTo && !semanticText) {
    const profileEmb = await getUserProfileEmbedding(viewerId).catch(() => null)
    if (profileEmb) {
      const POOL_LIMIT = 6
      const dbResults = await findImagesByVisualSimilarity({ embedding: profileEmb, limit: POOL_LIMIT, offset: 0 })
      if (dbResults.length) {
        let poolItems = dbResults.map((item) => {
          const { _embedding, createdAt, updatedAt, ...rest } = item
          return { ...rest, clipScore: item._clipScore }
        })
        if (!hasMusicQuery) {
          poolItems = poolItems.filter((i) => i.provider !== 'itunes')
        }
        poolItems = poolItems.filter((i) => {
          if (i.provider === 'tmdb' || i.provider === 'itunes') return true
          return isDesignItem(i)
        })
        const existingIds = new Set(items.map((i) => i.id))
        const uniquePoolItems = poolItems.filter((i) => !existingIds.has(i.id))
        uniquePoolItems.sort((a, b) => (b.clipScore || 0) - (a.clipScore || 0))
        const mixed = []
        let ti = 0, pi = 0
        while (ti < items.length || pi < uniquePoolItems.length) {
          for (let c = 0; c < 2 && ti < items.length; c++) mixed.push(items[ti++])
          if (pi < uniquePoolItems.length) mixed.push(uniquePoolItems[pi++])
        }
        items.splice(0, items.length, ...mixed.slice(0, limit * 2))
      }
    }
  }

  const rerankText = enrichForClipRerank(semanticText || queries.join(' '))
  const textEmb = await getTextEmbedding(rerankText).catch(() => null)
  let imageEmb = null
  if (visualSimilarTo) {
    const ids = visualSimilarTo.split(',').filter(Boolean)
    imageEmb = await findAnyEmbedding({ id: ids[0] }).catch(() => null)
  }
  if ((textEmb || imageEmb) && items.length) {
    const itemIds = items.map((item) => item.id).filter(Boolean)
    const storedEmbeddings = itemIds.length ? await findEmbeddingsByItemIds(itemIds) : {}
    for (const item of items) {
      if (storedEmbeddings[item.id]) {
        item._embedding = storedEmbeddings[item.id]
      }
    }
    const pendingCount = items.filter((i) => !i._embedding).length
    console.log('[CLIP] Background embedding:',
      pendingCount ? `computing ${pendingCount} new items` : 'all ' + items.length + ' items already cached')
    computeAndStoreEmbeddings(items).then((stored) => {
      if (stored?.length) console.log('[CLIP] Background embedding stored:', stored.length, 'new items')
    }).catch((error) => {
      console.error('[CLIP] Background embedding failed:', error.message)
    })
  }
  let rerankedItems = (textEmb || imageEmb) && items.length
    ? items
      .map((item) => {
        const textScore = item._embedding && textEmb ? cosineSimilarity(textEmb, item._embedding) : 0
        const visScore = item._embedding && imageEmb ? cosineSimilarity(imageEmb, item._embedding) : 0
        const score = context === 'recommended' && imageEmb && item._embedding
          ? visScore * 0.8 + textScore * 0.2
          : Math.max(textScore, visScore)
        return { item, score }
      })
      .sort((a, b) => b.score - a.score)
      .filter(({ score }) => context !== 'recommended' || score >= 0.20)
      .map(({ item: { _embedding, ...rest }, score }) => ({ ...rest, clipScore: score }))
    : items.map(({ _embedding, ...rest }) => rest)

  // Pixel-based saturation boost for B&W intent queries (e.g. "black and white poster film").
  // CLIP text->image rerank is imprecise at distinguishing color attributes — items with similar
  // semantic relevance but high saturation (colorful) often outrank grayscale items. This computes
  // average pixel saturation from thumbnails and gives a small score boost (max +0.05) to items
  // with low saturation, so B&W/grayscale content ranks higher for B&W-related queries.
  // Only applies for non-recommended context (recommended uses visual similarity as primary).
  if (context !== 'recommended') {
    const bwRerankText = semanticText || queries.join(' ')
    rerankedItems = await applySaturationBoost(rerankedItems, bwRerankText)
  }

  // Per-film entity cap for home feed: prevent a single TMDB entity from
  // dominating all slots after CLIP rerank. Non-TMDB items (design, iTunes)
  // pass through without limitation.
  const MAX_TMDB_ITEMS_PER_ENTITY = 4
  const entityCount = new Map()
  const entityCapped = []
  for (const item of rerankedItems) {
    let entityKey = null
    if (item.provider === 'tmdb' && item.id) {
      const parts = item.id.split(':')
      if (parts.length >= 2) entityKey = parts[0] + ':' + parts[1]
    }
    if (entityKey) {
      const count = entityCount.get(entityKey) || 0
      if (count >= MAX_TMDB_ITEMS_PER_ENTITY) continue
      entityCount.set(entityKey, count + 1)
    }
    entityCapped.push(item)
  }
  let finalItems = entityCapped.slice(0, limit)

  // Design floor for home feed: ensure at least 2 non-TMDB items when
  // the user has design interest signals (non-movie queries from tags).
  // Without this, CLIP rerank centralizes all slots to film items and
  // completely buries design-style content (poster aesthetics, moodboard, etc.).
  if (context === 'home') {
    const fallbackQ = homeFallbackQueries[mode]?.[0] || homeFallbackQueries['for-you'][0]
    const nonFallbackQueries = queries.filter(q => q !== fallbackQ)
    const hasDesignInterest = nonFallbackQueries.length > 0 && nonFallbackQueries.some(q => !classifyMovieQuery(q))
    if (hasDesignInterest) {
      const nonTmdbInFull = entityCapped.filter(item => item.provider !== 'tmdb')
      if (nonTmdbInFull.length >= 2) {
        const nonTmdbInFinal = finalItems.filter(item => item.provider !== 'tmdb')
        const needed = Math.min(2 - nonTmdbInFinal.length, nonTmdbInFull.length)
        if (needed > 0) {
          const finalIds = new Set(finalItems.map(item => item.id))
          const candidates = nonTmdbInFull.filter(item => !finalIds.has(item.id)).slice(0, needed)
          const getEntityKey = (item) => item.provider === 'tmdb' && item.id
            ? item.id.split(':').slice(0, 2).join(':') : null
          const replaceable = finalItems
            .map((item, idx) => ({ item, idx }))
            .filter(({ item }) => item.provider === 'tmdb')
            .sort((a, b) => {
              const entA = getEntityKey(a.item)
              const entB = getEntityKey(b.item)
              const countA = entA ? finalItems.filter(i => getEntityKey(i) === entA).length : 0
              const countB = entB ? finalItems.filter(i => getEntityKey(i) === entB).length : 0
              if (countA !== countB) return countB - countA
              return (a.item.clipScore || 0) - (b.item.clipScore || 0)
            })
          const swapCount = Math.min(needed, candidates.length, replaceable.length)
          for (let i = 0; i < swapCount; i++) {
            finalItems[replaceable[i].idx] = candidates[i]
          }
        }
      }
    }
  }

  // Build hybrid cursor for recommended visual context
  let finalCursor = null
  if (context === 'recommended' && visualSimilarTo) {
    if (!visExhausted) {
      // Visual similarity has more pages — advance visOffset, carry provider cursors
      finalCursor = { visOffset: visOffset + limit }
      if (nextCursor?.queries) finalCursor.queries = nextCursor.queries
    } else if (hasActiveCursor) {
      // Visual exhausted but text providers remain
      finalCursor = nextCursor
    }
  } else if (hasActiveCursor) {
    finalCursor = nextCursor
  }

  const entityCapDebug = {}
  for (const [key, count] of entityCount) entityCapDebug[key] = count
  const designFloorActive = context === 'home' && (() => {
    const fallbackQ = homeFallbackQueries[mode]?.[0] || homeFallbackQueries['for-you'][0]
    const nonFallback = queries.filter(q => q !== fallbackQ)
    return nonFallback.length > 0 && nonFallback.some(q => !classifyMovieQuery(q))
  })()
  const nonTmdbCount = finalItems.filter(i => i.provider !== 'tmdb').length
  console.log('[TMDB-DEBUG] searchExternalImages FINAL response:', {
    totalItems: rerankedItems.length,
    finalItems: finalItems.length,
    entityCap: MAX_TMDB_ITEMS_PER_ENTITY,
    entityCounts: entityCapDebug,
    designFloor: designFloorActive,
    nonTmdbFinal: nonTmdbCount,
    firstItemProvider: finalItems[0]?.provider || finalItems[0]?.source || null,
    movieQuery: hasMovieQuery,
    clipReranked: !!(textEmb || imageEmb),
    itemProviders: [...new Set(finalItems.map((i) => i.provider || i.source || 'unknown'))],
    itemTitles: finalItems.slice(0, 3).map((i) => i.title || i.alt_description || '(no title)'),
    finalCursor,
  })

  return {
    providers: providerResults.map((result) => ({
      provider: result.provider,
      query: result.query,
      requested: requests.find((request) => request.provider === result.provider && request.query === result.query && request.queryIndex === result.queryIndex)?.limit || null,
      count: result.items?.length || 0,
      disabled: !!result.disabled,
      error: result.error || null,
    })),
    query: queries[0],
    generatedQueries: queries,
    recentTags: queryPlan.recentTags,
    recentQueries: queryPlan.recentQueries,
    fallbackUsed: queryPlan.fallbackUsed,
    movieQuery: hasMovieQuery,
    items: finalItems,
    nextCursor: finalCursor ? encodeCursor(finalCursor) : null,
  }
}

const computeAndStoreEmbeddings = async (items) => {
  const batch = items.filter((item) => !item._embedding)
  console.log('[CLIP] computeAndStoreEmbeddings called, batch:', batch.length, 'of', items.length)
  if (!batch.length) return []
  const results = await Promise.allSettled(
    batch.map(async (item) => {
      const thumbnailUrl = item.thumbnailUrl || item.url
      if (!thumbnailUrl) {
        console.log('[CLIP] No URL for item', item.id)
        return null
      }
      console.log('[CLIP] Computing embedding for', item.id, thumbnailUrl.slice(0, 80))
      const embedding = await getImageEmbedding(thumbnailUrl)
      if (!embedding) {
        console.log('[CLIP] Failed to compute embedding for', item.id)
        return null
      }
      console.log('[CLIP] Computed embedding for', item.id, 'length:', embedding.length)
      const zeroShotTags = await computeZeroShotTags(embedding)
      item.metadata = { ...item.metadata, autoGeneratedTags: zeroShotTags }
      return { item, id: item.id, embedding }
    }),
  )
  const stored = []
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const { item, id, embedding } = result.value
      item._embedding = embedding
      try {
        await upsertExternalImage({
          id: item.id,
          provider: item.provider,
          externalId: item.externalId || item.id,
          title: item.title,
          description: item.description || item.alt_description,
          tags: item.tags || [],
          url: item.url,
          thumbnailUrl: item.thumbnailUrl || item.url,
          width: item.width || null,
          height: item.height || null,
          mimeType: item.mimeType || item.mime_type || null,
          author: item.author || null,
          license: item.license || null,
          sourceUrl: item.sourceUrl || item.source_url || null,
          metadata: item.metadata || {},
          _embedding: embedding,
        })
        stored.push(id)
        console.log('[CLIP] Stored embedding for', id)
      } catch (error) {
        console.error('[CLIP] Failed to store embedding for', id, error.message)
      }
    } else if (result.status === 'rejected') {
      console.error('[CLIP] Embedding computation rejected:', result.reason?.message)
    }
  }
  console.log('[CLIP] Stored embeddings for', stored.length, 'items')
  if (stored.length) clearEntityCache()
  return stored
}

export const visualSearch = async ({ imageUrl, limit = 30, viewerId = null }) => {
  const embedding = await getImageEmbedding(imageUrl)
  if (!embedding) {
    throw new Error('Failed to compute image embedding')
  }

  const similarFromDb = await findImagesByVisualSimilarity({ embedding, limit, offset: 0 })

  const items = similarFromDb.map((item) => {
    const { _embedding, embedding: _, ...rest } = item
    return {
      ...rest,
      clipScore: item._clipScore,
      isSaved: false,
    }
  })

  return {
    query: imageUrl,
    items,
    visualSearch: true,
  }
}

export const ensureExternalImage = async ({ image }) => {
  await upsertExternalImage(image)
  return findExternalImageById({ id: image.id })
}

export const getExternalImage = async ({ id, userId = null }) => {
  const image = await findExternalImageById({ id, userId })
  if (!image) throw notFound('External image not found')
  if (userId) {
    await recordInterestEvent({
      userId,
      eventType: 'open_post',
      tags: image.tags || [],
      query: image.title || null,
    })
    const extEmb = await findExternalImageEmbedding({ id })
    if (extEmb) {
      updateProfile({ userId, embedding: extEmb, weight: 0.2 }).catch(() => {})
    }
  }
  return image
}

export const save = async ({ userId, image }) => {
  await upsertExternalImage(image)
  const result = await saveExternalImage({ userId, externalImageId: image.id })
  if (result.inserted) {
    await recordInterestEvent({
      userId,
      eventType: 'save_post',
      tags: image.tags || [],
      query: image.title || null,
    })
    const extEmb = await findExternalImageEmbedding({ id: image.id })
    if (extEmb) {
      updateProfile({ userId, embedding: extEmb, weight: 0.6 }).catch(() => {})
    }
  }
  return { saved: true, changed: result.inserted }
}

export const unsave = async ({ userId, id }) => {
  await unsaveExternalImage({ userId, externalImageId: id })
  return { saved: false }
}

export const saved = async ({ userId, limit = 30 }) => ({
  items: await listSavedExternalImages({ userId, limit }),
})
