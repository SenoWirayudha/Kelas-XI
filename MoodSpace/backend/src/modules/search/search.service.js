import { getSearchSuggestions, searchPosts } from '../posts/posts.repository.js'
import { serializePost } from '../posts/posts.service.js'
import { recordInterestEvent } from '../interest/interest.service.js'
import { clearSearchHistory, listSearchHistory, recordSearchHistory } from './search.repository.js'
import { classifyMovieQuery, searchExternalImages } from '../externalImages/externalImages.service.js'

const parseTags = (value = '') => (
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12)
)

export const search = async ({ viewerId = null, query }) => {
  const tags = parseTags(query.tags)
  const rows = await searchPosts({
    viewerId,
    q: query.q,
    tags,
    sort: query.sort,
    limit: query.limit + 1,
    offset: query.offset,
  })
  const hasMore = rows.length > query.limit
  const items = hasMore ? rows.slice(0, query.limit) : rows
  return {
    items: items.map(serializePost),
    nextOffset: hasMore ? query.offset + query.limit : null,
    query: query.q,
    tags,
    sort: query.sort,
  }
}

export const suggestions = async ({ query }) => {
  const items = await getSearchSuggestions({
    q: query.q,
    limit: query.limit,
  })
  const merged = [...items]
  const seen = new Set(items.map((item) => `${item.type}:${item.value}`.toLowerCase()))
  const trimmed = query.q?.trim() || ''
  if (trimmed && (classifyMovieQuery(trimmed) || trimmed.split(/\s+/).filter(Boolean).length >= 2)) {
    const external = await searchExternalImages({
      q: trimmed,
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
