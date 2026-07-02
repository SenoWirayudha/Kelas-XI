import { getSearchSuggestions, searchPosts, getPostsByEmbeddingSimilarity } from '../posts/posts.repository.js'
import { serializePost } from '../posts/posts.service.js'
import { recordInterestEvent } from '../interest/interest.service.js'
import { clearSearchHistory, listSearchHistory, recordSearchHistory } from './search.repository.js'
import { classifyMovieQuery, searchExternalImages } from '../externalImages/externalImages.service.js'
import { cosineSimilarity, getTextEmbedding } from '../externalImages/clip.service.js'

const SEARCH_SYNONYMS = {
  film: ['movie', 'cinema', 'movies', 'films'],
  movie: ['film', 'cinema', 'movies', 'films'],
  foto: ['photo', 'photography', 'picture', 'fotografi'],
  photo: ['foto', 'photography', 'picture', 'fotografi'],
}

const getSynonyms = (word) => SEARCH_SYNONYMS[word] || []

const buildFtsQuery = (q) => {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  return words.map((word) => {
    const syns = getSynonyms(word)
    if (!syns.length) return word
    return `(${[word, ...syns].join(' | ')})`
  }).join(' & ')
}

const collectSynonymTags = (q) => {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const tags = new Set()
  words.forEach((word) => {
    tags.add(word)
    getSynonyms(word).forEach((syn) => tags.add(syn))
  })
  return [...tags]
}

const parseTags = (value = '') => (
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12)
)

const SEMANTIC_SCORE_THRESHOLD = 0.30

export const search = async ({ viewerId = null, query }) => {
  const tags = parseTags(query.tags)
  const q = query.q?.trim() || ''
  const ftsQuery = buildFtsQuery(q)
  const synonymTags = collectSynonymTags(q)
  const rows = await searchPosts({
    viewerId,
    q,
    ftsQuery,
    synonymTags,
    tags,
    sort: query.sort,
    limit: query.limit + 1,
    offset: query.offset,
  })
  let items = rows
  // Only use semantic path when keyword search returns too few results
  const shouldUseSemantic = query.semantic && q && items.length < 5
  if (shouldUseSemantic) {
    const queryEmb = await getTextEmbedding(q).catch(() => null)
    if (queryEmb) {
      // Text-to-image only: query text → post image embedding (CLIP zero-shot visual match)
      const imagePool = await getPostsByEmbeddingSimilarity({ viewerId, limit: 500 })
      const imageSim = imagePool
        .filter(p => p.embedding)
        .map(p => ({ ...p, _semScore: cosineSimilarity(queryEmb, p.embedding) }))
        .filter(p => p._semScore >= SEMANTIC_SCORE_THRESHOLD)
        .sort((a, b) => b._semScore - a._semScore)
        .slice(0, 10)

      // Merge: 4 keyword : 1 text-to-image
      const seenIds = new Set(items.map(i => i.id))
      const merged = []
      let ki = 0, ii = 0
      while (ki < items.length || ii < imageSim.length) {
        for (let c = 0; c < 4 && ki < items.length; c++) merged.push(items[ki++])
        while (ii < imageSim.length && seenIds.has(imageSim[ii].id)) ii++
        if (ii < imageSim.length) { seenIds.add(imageSim[ii].id); merged.push(imageSim[ii++]) }
      }
      items = merged
    }
  }
  const hasMore = items.length > query.limit
  const trimmed = hasMore ? items.slice(0, query.limit) : items
  return {
    items: trimmed.map(serializePost),
    nextOffset: hasMore ? query.offset + query.limit : null,
    query: q,
    tags,
    sort: query.sort,
  }
}

export const suggestions = async ({ query }) => {
  const q = query.q?.trim() || ''
  const expandedQuery = collectSynonymTags(q).join(' ')
  const items = await getSearchSuggestions({
    q,
    expandedQuery,
    limit: query.limit,
  })
  const merged = [...items]
  const seen = new Set(items.map((item) => `${item.type}:${item.value}`.toLowerCase()))
  if (q && (classifyMovieQuery(q) || q.split(/\s+/).filter(Boolean).length >= 2)) {
    const external = await searchExternalImages({
      q,
      limit: Math.max(3, Math.min(query.limit, 5)),
      context: 'search',
      mode: 'for-you',
    }).catch(() => ({ items: [] }))
    for (const image of external.items || []) {
      const value = image.title?.trim()
      if (!value) continue
      const key = `external:${value.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push({ value, type: 'external' })
      if (merged.length >= query.limit) break
    }
  }
  return { items: merged.slice(0, query.limit) }
}

export const history = async ({ userId, query }) => {
  const rows = await listSearchHistory({ userId, limit: query.limit })
  return { items: rows }
}

export const recordHistory = async ({ userId, body }) => {
  const item = await recordSearchHistory({ userId, value: body.query })
  await recordInterestEvent({
    userId,
    eventType: 'search',
    query: body.query,
  })
  return { item }
}

export const clearHistory = async ({ userId }) => {
  await clearSearchHistory({ userId })
  return { cleared: true }
}
