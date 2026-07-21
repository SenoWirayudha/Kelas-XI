import { getSearchSuggestions, searchPosts, getPostsByEmbeddingSimilarity } from '../posts/posts.repository.js'
import { serializePost } from '../posts/posts.service.js'
import { recordInterestEvent } from '../interest/interest.service.js'
import { clearSearchHistory, listSearchHistory, recordSearchHistory } from './search.repository.js'
import { classifyMovieQuery, searchExternalImages } from '../externalImages/externalImages.service.js'
import { cosineSimilarity, getTextEmbedding } from '../externalImages/clip.service.js'
import { enrichForClipRerank, applySaturationBoost, applyColorBoost, detectBwQuery, detectColors } from '../../shared/bwColorBoost.service.js'
import { detectDesignType, DESIGN_TYPE_BOOST } from '../../shared/designType.service.js'

const SEARCH_SYNONYMS = {
  film: ['movie', 'cinema', 'movies', 'films'],
  movie: ['film', 'cinema', 'movies', 'films'],
  foto: ['photo', 'photography', 'picture', 'fotografi'],
  photo: ['foto', 'photography', 'picture', 'fotografi'],
}

const getSynonyms = (word) => SEARCH_SYNONYMS[word] || []

const FTS_SPECIAL = /[&|!():]/g

const buildFtsQuery = (q) => {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  return words
    .map((word) => word.replace(FTS_SPECIAL, ''))
    .filter(Boolean)
    .map((word) => {
      const syns = getSynonyms(word)
      if (!syns.length) return word
      return `(${[word, ...syns].join(' | ')})`
    })
    .join(' & ')
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
const SEMANTIC_COLOR_THRESHOLD = 0.15

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

  // Semantic path: text-to-image CLIP similarity. Always runs to surface visually
  // relevant posts even when FTS already returns enough keyword matches.
  // This ensures posts with zero FTS match (e.g. tagged only by film title, not
  // by color words) are still discoverable via CLIP visual similarity.
  // NOTE: O(n) JS cosine scan over stored embeddings — migrate to pgvector when
  // posts exceed ~5k rows to avoid linear cost growth.
  if (query.semantic && q) {
    const queryEmb = await getTextEmbedding(enrichForClipRerank(q)).catch(() => null)
    if (queryEmb) {
      // Text-to-image only: query text → post image embedding (CLIP zero-shot visual match)
      const imagePool = await getPostsByEmbeddingSimilarity({ viewerId, limit: 500 })
      let imageSim = imagePool
        .filter(p => p.embedding)
        .map(p => ({
          ...p,
          _semScore: cosineSimilarity(queryEmb, p.embedding),
          _designType: p.metadata?.designType || undefined,
        }))
        .sort((a, b) => b._semScore - a._semScore)
        .slice(0, 50)

      // Design type boost: if query mentions poster/photo/illustration etc.,
      // boost items whose stored designType matches. Small increment (+0.05)
      // applied before saturation boost so matching items can cross threshold.
      const designType = detectDesignType(q)
      if (designType && imageSim.length) {
        for (const item of imageSim) {
          if (item._designType === designType) {
            item._semScore += DESIGN_TYPE_BOOST
          }
        }
      }

      // Saturation boost for B&W queries: prioritize low-saturation (grayscale) posts.
      // Applied BEFORE the threshold filter so B&W items with low CLIP semantic scores
      // (e.g. "Interstellar (2014)" B&W poster for query "black and white poster film")
      // still surface — their _semScore gets boosted above threshold.
      imageSim = await applySaturationBoost(imageSim, q, '_semScore')
      imageSim = await applyColorBoost(imageSim, q, '_semScore')

      const hasColor = detectColors(q).length > 0
      const threshold = hasColor ? SEMANTIC_COLOR_THRESHOLD : SEMANTIC_SCORE_THRESHOLD
      imageSim = imageSim
        .filter(p => p._semScore >= threshold)
        .slice(0, 10)

      // Dedup-only: append unique semantic items to FTS results.
      // No interleave here — that happens after final boosts (re-interleave step).
      const seenIds = new Set(items.map(i => i.id))
      for (const sem of imageSim) {
        if (!seenIds.has(sem.id)) {
          seenIds.add(sem.id)
          items.push(sem)
        }
      }
    }
  }

  // Saturation boost for B&W queries: applied to ALL results (FTS + semantic).
  // Boosts low-saturation (grayscale) items so B&W content ranks higher.
  items = await applySaturationBoost(items, q, '_rankScore')
  items = await applyColorBoost(items, q, '_rankScore')

  // Re-interleave: after _rankScore sort above, semantic-only items
  // (found by CLIP but NOT by FTS) get pushed below abundant FTS results
  // and would be invisible to the user. We re-weave them at a fixed ratio
  // (4 FTS : 1 semantic) so they get guaranteed visible slots.
  // Scope: SEMPIT — hanya items dengan _semScore != null (semantic-only,
  // zero FTS match). Items yang overlap FTS sudah di-dedup dan tidak punya
  // _semScore — mereka tetap murni bersaing by rank, tanpa floor.
  if (query.semantic && q) {
    const semOnly = items.filter(i => i._semScore != null)
    if (semOnly.length) {
      const hasColor = detectColors(q).length > 0
      const mergeRatio = hasColor ? 2 : 4
      const ftsGroup = items.filter(i => i._semScore == null)
      const remerged = []
      let fi = 0, si = 0
      while (fi < ftsGroup.length || si < semOnly.length) {
        for (let c = 0; c < mergeRatio && fi < ftsGroup.length; c++) remerged.push(ftsGroup[fi++])
        if (si < semOnly.length) remerged.push(semOnly[si++])
      }
      items = remerged
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
