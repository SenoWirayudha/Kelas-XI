import {
  insertInterestEvent,
  getTopRecentInterestQueries as getTopRecentInterestQueriesRows,
  getTopRecentInterestTags as getTopRecentInterestTagsRows,
  getTopRecentInterestTagsWithScores as getTopRecentInterestTagsWithScoresRows,
} from './interest.repository.js'

const EVENT_WEIGHTS = {
  save_post: 5,
  add_to_board: 5,
  drop_to_canvas: 4,
  search: 3,
  open_post: 2,
}

const stopWords = new Set([
  'a', 'an', 'and', 'atau', 'dan', 'di', 'dari', 'for', 'from', 'image', 'ini', 'itu',
  'ke', 'masa', 'movie', 'film', 'photo', 'picture', 'poster', 'music', 'musik', 'cinema',
  'cinematic', 'still', 'backdrop', 'wallpaper', 'art', 'design', 'of', 'on', 'or', 'the',
  'to', 'untuk', 'yang', 'jatuh', 'seperti', 'akan', 'bisa', 'ada', 'nya', 'past', 'lives',
])

const phraseStopWords = new Set([
  'a', 'an', 'and', 'atau', 'dan', 'di', 'dari', 'for', 'from', 'of', 'on', 'or', 'the',
  'to', 'untuk', 'yang', 'ini', 'itu', 'ke', 'akan', 'bisa', 'ada', 'nya',
])

const isStandaloneInterestToken = (token = '') => (
  token.length >= 4
    && !stopWords.has(token)
    && !/^\d+$/.test(token)
)

const cleanQueryTokens = (value = '') => (
  normalizeInterestTag(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !/^\d+$/.test(token))
)

const tokensToPhrase = (value = '') => {
  const tokens = cleanQueryTokens(value)
  const phraseTokens = tokens.filter((token) => !phraseStopWords.has(token))
  if (phraseTokens.length >= 2) return [phraseTokens.join(' ')]
  return []
}

export const normalizeInterestTag = (value = '') => (
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
)

const tagsFromQuery = (value = '') => (
  tokensToPhrase(value).length
    ? tokensToPhrase(value)
    : cleanQueryTokens(value).filter((token) => isStandaloneInterestToken(token))
)

const normalizeTags = ({ tags = [], query = '' }) => {
  const normalized = []

  const addTag = (value = '') => {
    const tokens = cleanQueryTokens(value)
    const phraseTokens = tokens.filter((token) => !phraseStopWords.has(token))

    if (phraseTokens.length >= 2) {
      const phrase = phraseTokens.join(' ')
      if (phrase.length >= 2 && phrase.length <= 40) normalized.push(phrase)
      return
    }

    tokens
      .filter((token) => isStandaloneInterestToken(token))
      .forEach((token) => normalized.push(token))
  }

  ;(Array.isArray(tags) ? tags : []).forEach((tag) => addTag(tag))
  addTag(query)

  return [...new Set(normalized)].slice(0, 16)
}

export const recordInterestEvent = async ({ userId, eventType, tags = [], query = null, projectId = null, weight = null }) => {
  if (!userId || !EVENT_WEIGHTS[eventType]) return null
  const normalizedTags = normalizeTags({ tags, query })
  if (!normalizedTags.length && !query) return null

  try {
    return await insertInterestEvent({
      userId,
      eventType,
      tags: normalizedTags,
      query,
      projectId,
      weight: weight ?? EVENT_WEIGHTS[eventType],
    })
  } catch (error) {
    console.warn('[interest] failed to record event', {
      eventType,
      userId,
      message: error.message,
    })
    return null
  }
}

export const getTopRecentInterestTags = async ({ userId, limit = 24 }) => {
  const rows = await getTopRecentInterestTagsRows({ userId, limit })
  return rows.map((row) => row.tag)
}

export const getTopRecentInterestTagsWithScores = async ({ userId, limit = 24 }) => {
  return getTopRecentInterestTagsWithScoresRows({ userId, limit })
}

export const getTopRecentInterestQueries = async ({ userId, limit = 12 }) => {
  const rows = await getTopRecentInterestQueriesRows({ userId, limit })
  return rows.map((row) => row.query)
}

export const getTopRecentInterestQuerySignals = async ({ userId, limit = 12 }) => {
  const rows = await getTopRecentInterestQueriesRows({ userId, limit })
  return rows.map((row) => ({
    query: row.query,
    score: Number(row.score || 0),
    eventCount: Number(row.eventCount || 0),
    eventTypes: row.eventTypes || [],
    lastSeenAt: row.lastSeenAt,
  }))
}
