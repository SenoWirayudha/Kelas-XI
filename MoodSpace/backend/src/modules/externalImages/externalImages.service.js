import { env } from '../../config/env.js'
import { notFound } from '../../utils/errors.js'
import { getTopRecentInterestQuerySignals, getTopRecentInterestTagsWithScores, normalizeInterestTag, recordInterestEvent } from '../interest/interest.service.js'
import {
  findExternalImageById,
  listSavedExternalImages,
  saveExternalImage,
  unsaveExternalImage,
  upsertExternalImage,
} from './externalImages.repository.js'

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

const normalizeTag = (value = '') => cleanText(value)
  .toLowerCase()
  .replace(/^file:/, '')
  .replace(/\.[a-z0-9]{2,5}$/i, '')
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

const movieIntentWords = ['movie', 'film', 'cinema', 'cinematic', 'poster', 'scene', 'still', 'wallpaper', 'backdrop', 'key art']
const movieBackdropWords = ['scene', 'still', 'wallpaper', 'cinematic shot', 'cinematic', 'backdrop']
const moviePosterWords = ['poster', 'movie poster', 'film poster', 'cinema poster', 'key art']
const nonMovieWords = ['album', 'music', 'song', 'vinyl', 'interior', 'room', 'fashion', 'typography', 'logo', 'ui', 'ux']
const titleNoiseWords = [
  'movie', 'film', 'cinema', 'cinematic', 'shot', 'scene', 'still', 'wallpaper', 'backdrop', 'poster', 'key', 'art',
  'minimal', 'editorial', 'design', 'inspiration', 'moodboard', 'graphic', 'aesthetic', 'official',
  'cast', 'crew', 'actor', 'actress', 'director', 'starring', 'pemeran', 'pemain', 'karakter', 'character',
]

export const classifyMovieQuery = (value = '') => {
  const normalized = normalizeTag(value)
  const tokens = normalized.split(' ')
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

  const gate2 = !titleCandidate || (!hasMovieIntent && titleCandidate.split(' ').length >= 8)
  if (gate2) { console.log('[TMDB-DEBUG] classifyMovieQuery REJECTED gate2 (>=5 tokens no movie intent):', { raw: value, normalized, hasMovieIntent, titleCandidate, tokenCount: titleCandidate.split(' ').length }); return null }

  const visualType = movieBackdropWords.some(matchWord)
    ? 'backdrop'
    : moviePosterWords.some(matchWord)
      ? 'poster'
      : 'poster'

  const result = { visualType, titleCandidate: titleCandidate || normalized, normalizedQuery: normalized }
  console.log('[TMDB-DEBUG] classifyMovieQuery PASS:', { raw: value, normalized, hasMovieIntent, titleCandidate, result })
  return result
}

const buildMovieSearchVariants = (classifier) => {
  if (!classifier) return []
  const query = classifier.titleCandidate || classifier.normalizedQuery
  const queryYear = query.match(/\b(19|20)\d{2}\b/)?.[0]
  const queryTitle = queryYear ? query.replace(queryYear, '').trim() : query
  const variants = [queryTitle]
  if (queryTitle !== query) variants.push(query)
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

const expandHomeTagToQueries = (tag) => {
  const normalized = normalizeInterestTag(tag)
  if (!normalized) return []
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

const strongQueryEventTypes = new Set(['save_post', 'add_to_board', 'drop_to_canvas'])

const isStableHomeQuerySignal = (signal) => (
  Number(signal?.score || 0) >= 3
  || Number(signal?.eventCount || 0) >= 1
  || (signal?.eventTypes || []).some((eventType) => strongQueryEventTypes.has(eventType))
)

const allocateQuerySlots = (queries = [], max = 6) => {
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
  const effectiveTags = stableTags.length ? stableTags : recentTags.slice(0, 3)

  const movieSignals = stableQueries.filter((item) => item.query && classifyMovieQuery(item.query))

  const fallbackQuery = homeFallbackQueries[mode]?.[0] || homeFallbackQueries['for-you'][0]

  if (movieSignals.length >= 1) {
    const querySlots = allocateQuerySlots(movieSignals, max)
    const queries = uniqueQueries(
      [
        ...querySlots.map((item) => item.query),
        fallbackQuery,
        ...effectiveTags.flatMap(expandHomeTagToQueries).slice(0, 1),
      ],
      max,
    )
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
  const expandedTagSignals = effectiveTags
    .filter((tag) => !classifyMovieQuery(tag))
    .flatMap((tag) => expandHomeTagToQueries(tag))

  const queries = uniqueQueries(
    [
      ...expandedQuerySignals,
      ...expandedTagSignals,
      fallbackQuery,
    ],
    max,
  )
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
  if (queryYear && relYear === queryYear) score += 18
  if (queryYear && relYear && relYear !== queryYear) score -= 20
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
  console.log('[TMDB-DEBUG] searchTmdb gate:', { query, classifier: !!classifier, entityId, skipped: gateSkipped })
  if (gateSkipped) return { provider: 'tmdb', items: [], cursor: null, skipped: true }

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

const providerSearchers = [
  ['tmdb', searchTmdb],
  ['tmdbCredits', searchTmdbCredits],
  ['tmdbPerson', searchTmdbPerson],
  ['tmdbCompany', searchTmdbCompany],
  ['wikimedia', searchWikimedia],
  ['unsplash', searchUnsplash],
  ['pexels', searchPexels],
  ['pixabay', searchPixabay],
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
  if (context === 'home' && classifyMovieQuery(query)) {
    return [
      ['tmdb', searchTmdb],
      ['wikimedia', searchWikimedia],
    ]
  }
  return providerSearchers
}

const interleaveProviderItems = (providerResults, limit, { preferTmdb = false } = {}) => {
  const counts = providerResults.map((r) => ({ provider: r.provider, items: r.items?.length || 0, firstTitle: r.items?.[0]?.title || r.items?.[0]?.alt_description || null }))
  console.log('[TMDB-DEBUG] interleaveProviderItems input:', { preferTmdb, limit, providerCounts: counts })
  if (preferTmdb) {
    const tmdbQueue = providerResults
      .filter((result) => result.provider === 'tmdb' && result.items?.length)
      .flatMap((result) => result.items)
    const creditsQueue = providerResults
      .filter((result) => (result.provider === 'tmdbCredits' || result.provider === 'tmdbPerson') && result.items?.length)
      .flatMap((result) => result.items)
    const otherItems = providerResults
      .filter((result) => result.provider !== 'tmdb' && result.provider !== 'tmdbCredits' && result.provider !== 'tmdbPerson' && result.items?.length)
      .flatMap((result) => result.items)
    const result = []
    let tmdbi = 0, creditsi = 0
    while (result.length < limit && (tmdbi < tmdbQueue.length || creditsi < creditsQueue.length)) {
      if (tmdbi < tmdbQueue.length) result.push(tmdbQueue[tmdbi++])
      if (result.length >= limit) break
      if (creditsi < creditsQueue.length) result.push(creditsQueue[creditsi++])
    }
    while (result.length < limit && otherItems.length) result.push(otherItems.shift())
    console.log('[TMDB-DEBUG] interleaveProviderItems result:', { tmdbCount: tmdbQueue.length, creditsCount: creditsQueue.length, otherCount: otherItems.length, finalCount: result.length })
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

export const searchExternalImages = async ({ q = '', limit = 12, cursor = null, context = '', mode = 'for-you', seed = '', viewerId = null, tmdbId = null, mediaType = 'movie', visualType = 'poster' } = {}) => {
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
    const nextCursor = tmdbResult.cursor
      ? encodeCursor({ queries: { 0: { __query: `tmdb:${mediaType}:${tmdbId}:${visualType}`, tmdb: tmdbResult.cursor } } })
      : null
    return {
      providers: [{
        provider: 'tmdb',
        query: `tmdb:${mediaType}:${tmdbId}:${visualType}`,
        requested: limit,
        count: tmdbResult.items?.length || 0,
        disabled: !!tmdbResult.disabled,
        error: tmdbResult.error || null,
      }],
      query: `tmdb:${mediaType}:${tmdbId}:${visualType}`,
      generatedQueries: [`tmdb:${mediaType}:${tmdbId}:${visualType}`],
      recentTags: [],
      recentQueries: [],
      fallbackUsed: false,
      movieQuery: true,
      items: tmdbResult.items || [],
      nextCursor,
    }
  }

  const queryPlan = await resolveExternalQueries({ q, context, mode, viewerId, seed })
  const decodedCursor = decodeCursor(cursor)
  const queries = queryPlan.generatedQueries.length ? queryPlan.generatedQueries : ['design inspiration']
  const querySlots = queries.map((query) => {
    const slot = queryPlan.querySlots?.find((item) => item.query === query)
    return {
      query,
      slots: Math.max(1, Number(slot?.slots || 1)),
    }
  })
  const totalQuerySlots = querySlots.reduce((sum, item) => sum + item.slots, 0)
  const hasMovieQuery = queries.some((query) => !!classifyMovieQuery(query))
  const perQueryLimit = Math.max(1, Math.ceil(limit / Math.max(1, queries.length)))

  console.log('[TMDB-DEBUG] searchExternalImages routing:', {
    context, queries, hasMovieQuery, perQueryLimit, limit, cursor: !!cursor,
  })

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
          : provider === 'tmdbCompany'
            ? Math.max(weightedQueryLimit, Math.ceil(limit * 0.6))
            : provider === 'tmdbCredits'
              ? Math.max(weightedQueryLimit, Math.ceil(limit * 0.7))
              : provider === 'tmdbPerson'
                ? Math.max(weightedQueryLimit, Math.ceil(limit * 0.4))
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

  const nextCursor = providerResults.reduce((acc, result) => {
    if (!acc.queries) acc.queries = {}
    if (!acc.queries[result.queryIndex]) acc.queries[result.queryIndex] = {}
    acc.queries[result.queryIndex].__query = result.query
    acc.queries[result.queryIndex][result.provider] = result.cursor || { exhausted: true }
    return acc
  }, {})
  const hasActiveCursor = providerResults.some((result) => !!result.cursor)
  const items = uniqueItemsById(
    interleaveProviderItems(providerResults, limit * 2, { preferTmdb: hasMovieQuery }),
  ).slice(0, limit)

  console.log('[TMDB-DEBUG] searchExternalImages FINAL response:', {
    totalItems: items.length,
    firstItemProvider: items[0]?.provider || items[0]?.source || null,
    movieQuery: hasMovieQuery,
    itemProviders: [...new Set(items.map((i) => i.provider || i.source || 'unknown'))],
    itemTitles: items.slice(0, 3).map((i) => i.title || i.alt_description || '(no title)'),
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
    items,
    nextCursor: hasActiveCursor ? encodeCursor(nextCursor) : null,
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
