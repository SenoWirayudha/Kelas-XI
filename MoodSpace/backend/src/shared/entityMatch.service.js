import { env } from '../config/env.js'
import { cosineSimilarity } from '../modules/externalImages/clip.service.js'
import { findEntityCandidates } from '../modules/externalImages/externalImages.repository.js'

let candidatesCache = null

export const clearEntityCache = () => {
  candidatesCache = null
}

export const matchKnownEntity = async (imageEmbedding, { threshold = env.ENTITY_MATCH_THRESHOLD } = {}) => {
  if (!imageEmbedding) return null

  const candidates = candidatesCache || await findEntityCandidates()
  candidatesCache = candidates

  let best = null
  for (const c of candidates) {
    if (!c.embedding) continue
    if (!Array.isArray(c.embedding)) {
      console.log('[EMBED DEBUG] embedding is NOT array:', typeof c.embedding, c.id)
      continue
    }
    const score = cosineSimilarity(imageEmbedding, c.embedding)
    if (best && score > best.score) console.log('[EMBED DEBUG] score:', score.toFixed(3), 'for', c.metadata?.displayTitle || c.title, 'best:', best.score.toFixed(3))
    if (score >= threshold && (!best || score > best.score)) {
      const isTmdb = c.provider === 'tmdb'
      best = {
        type: isTmdb ? 'movie' : 'album',
        entityId: isTmdb
          ? `tmdb:${c.metadata?.tmdbId}`
          : `itunes:${c.externalId}`,
        title: isTmdb
          ? c.metadata?.displayTitle || c.title
          : c.title,
        score,
        status: 'suggested',
      }
    }
  }
  return best
}
