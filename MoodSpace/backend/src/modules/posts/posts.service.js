import { forbidden, notFound } from '../../utils/errors.js'
import { buildPublicUrl } from '../media/storage.service.js'
import { getOwnedReadyMedia } from '../media/media.service.js'
import { findWorkspaceById, getLatestVersion } from '../workspaces/workspaces.repository.js'
import { hashSnapshot } from '../workspaces/snapshot.service.js'
import { getTopRecentInterestTags, recordInterestEvent } from '../interest/interest.service.js'
import { cosineSimilarity, getImageEmbedding, getTextEmbedding } from '../externalImages/clip.service.js'
import { findAnyEmbedding } from '../externalImages/externalImages.repository.js'
import { findMediaById } from '../media/media.repository.js'
import { getUserProfileEmbedding, rankPostsByProfile, updateProfile } from '../profile/profile.service.js'
import { findMutualFollow } from '../follows/follows.repository.js'
import { decodeCursor, encodeCursor } from './cursor.js'
import { query } from '../../db/pool.js'
import {
  findPostById,
  createMediaPost as createMediaPostRecord,
  createMediaPostDraft,
  getMediaTagSources,
  getHomeFeed,
  getRecommendedPosts,
  getPostsByEmbeddingSimilarity,
  getPostsByUsername,
  getSavedPosts,
  likePost,
  publishWorkspacePost,
  recordPostView,
  publishMediaPostDraft,
  savePost,
  unlikePost,
  unsavePost,
  updateMediaPostDraft,
  updatePostRecord,
  updatePostEmbedding,
  deletePostRecord,
} from './posts.repository.js'

const CLIP_SCORE_THRESHOLD = 0.20

const SIGNAL_CONFIG = {
  view:     { weight: 0.2 },
  like:     { weight: 0.6 },
  save:     { weight: 0.6 },
  ext_save: { weight: 0.6 },
}

const RECENCY_HALF_LIFE_DAYS = 30
const LOW_SIGNAL_THRESHOLD = 5
const COLD_START_TOTAL_WEIGHT_CAP = 10
const SIGNAL_FETCH_LIMIT = 200

const buildProfileFromSignals = async (userId) => {
  const { rows } = await query(
    `select item_id, embedding, base_weight, signal_at, signal_type
     from (
       select pv.post_id::text as item_id, p.embedding, $2::float as base_weight,
              pv.viewed_at as signal_at, 'view' as signal_type
       from post_views pv
       join posts p on p.id = pv.post_id and p.embedding is not null
       where pv.viewer_id = $1
       union all
       select pl.post_id::text, p.embedding, $3::float, pl.created_at, 'like'
       from post_likes pl
       join posts p on p.id = pl.post_id and p.embedding is not null
       where pl.user_id = $1
       union all
       select ps.post_id::text, p.embedding, $4::float, ps.created_at, 'save'
       from post_saves ps
       join posts p on p.id = ps.post_id and p.embedding is not null
       where ps.user_id = $1
       union all
       select eis.external_image_id, ei.embedding, $5::float, eis.created_at, 'ext_save'
       from external_image_saves eis
       join external_images ei on ei.id = eis.external_image_id and ei.embedding is not null
       where eis.user_id = $1
     ) signals
     where embedding is not null
     order by signal_at desc
     limit $6`,
    [
      userId,
      SIGNAL_CONFIG.view.weight,
      SIGNAL_CONFIG.like.weight,
      SIGNAL_CONFIG.save.weight,
      SIGNAL_CONFIG.ext_save.weight,
      SIGNAL_FETCH_LIMIT,
    ],
  )

  const dim = 512
  let visualEmb = null
  let weightedCount = 0

  if (rows.length) {
    const grouped = new Map()
    for (const row of rows) {
      const key = `${row.item_id}:${row.signal_type}`
      const existing = grouped.get(key)
      if (existing) {
        existing.count++
        if (row.signal_at > existing.latestAt) existing.latestAt = row.signal_at
      } else {
        grouped.set(key, {
          embedding: row.embedding,
          baseWeight: row.base_weight,
          count: 1,
          latestAt: row.signal_at,
          signalType: row.signal_type,
        })
      }
    }

    const now = new Date()
    let weightedSum = new Array(dim).fill(0)
    let totalDecayedWeight = 0

    for (const entry of grouped.values()) {
      const multiplier = Math.min(entry.count, 3)
      const weight = entry.baseWeight * multiplier
      const daysOld = (now - new Date(entry.latestAt)) / (1000 * 60 * 60 * 24)
      const decay = Math.pow(0.5, daysOld / RECENCY_HALF_LIFE_DAYS)
      const decayedWeight = weight * decay

      for (let i = 0; i < dim; i++) {
        weightedSum[i] += (entry.embedding[i] || 0) * decayedWeight
      }
      totalDecayedWeight += decayedWeight
    }

    if (totalDecayedWeight > 0) {
      const rawEmb = new Array(dim)
      for (let i = 0; i < dim; i++) {
        rawEmb[i] = weightedSum[i] / totalDecayedWeight
      }
      visualEmb = l2Normalize(rawEmb)
    }

    weightedCount = Array.from(grouped.values())
      .reduce((sum, e) => sum + Math.min(e.count, 3) * e.baseWeight, 0)
  }

  let finalEmb = visualEmb

  // low-signal or zero-signal blending — fallback ke text embedding dari interest tags
  if (!finalEmb || weightedCount < LOW_SIGNAL_THRESHOLD) {
    try {
      const { rows: [tagsRow] } = await query(
        `select array_agg(distinct lower(tag)) as tags
         from user_interest_events uie
         cross join lateral unnest(uie.tags) tag
         where uie.user_id = $1`,
        [userId],
      )
      const tags = (tagsRow?.tags || []).filter(Boolean).slice(0, 10)
      if (tags.length >= 3) {
        const textEmb = await getTextEmbedding(tags.join(', '))
        if (!finalEmb) {
          finalEmb = l2Normalize(textEmb)
        } else {
          const ratio = weightedCount / LOW_SIGNAL_THRESHOLD
          const blended = new Array(dim)
          for (let i = 0; i < dim; i++) {
            blended[i] = ratio * visualEmb[i] + (1 - ratio) * textEmb[i]
          }
          finalEmb = l2Normalize(blended)
        }
      }
    } catch (e) {
      console.log('[buildProfileFromSignals] text blend failed:', e.message)
    }
  }

  if (!finalEmb) return null

  const cappedWeight = Math.min(weightedCount, COLD_START_TOTAL_WEIGHT_CAP)

  await query(
    `insert into user_embeddings (user_id, embedding, momentum, total_weight)
     values ($1, $2::jsonb, $3, $4)
     on conflict (user_id) do update
       set embedding = $2::jsonb,
           momentum = $3,
           total_weight = $4,
           updated_at = now()`,
    [userId, JSON.stringify(finalEmb), 0.7, cappedWeight],
  )

  return finalEmb
}

const stopWords = new Set([
  'a', 'an', 'and', 'atau', 'by', 'dan', 'dengan', 'di', 'for', 'from', 'gambar', 'image', 'img',
  'ini', 'ke', 'of', 'on', 'or', 'photo', 'picture', 'the', 'to', 'untuk', 'yang',
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'file', 'upload', 'uploaded',
])

const normalizeTag = (value = '') => (
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
)

const tokenizeTagText = (value = '') => (
  normalizeTag(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopWords.has(token) && !/^\d+$/.test(token))
)

const uniquePush = (target, value, max = 12) => {
  const tag = normalizeTag(value)
  if (!tag || tag.length < 2 || tag.length > 40 || target.length >= max) return
  if (target.some((item) => item.toLowerCase() === tag.toLowerCase())) return
  target.push(tag)
}

const extractAutoTags = (sources = [], max = 12) => {
  const tags = []
  const tokens = []

  sources.forEach((source) => {
    const nextTokens = tokenizeTagText(source)
    tokens.push(...nextTokens)
    const phrase = normalizeTag(source)
    if (phrase && phrase.length <= 40 && phrase.split(' ').length <= 3 && !stopWords.has(phrase)) {
      uniquePush(tags, phrase, max)
    }
  })

  tokens.forEach((token) => uniquePush(tags, token, max))
  for (let index = 0; index < tokens.length - 1; index += 1) {
    uniquePush(tags, `${tokens[index]} ${tokens[index + 1]}`, max)
  }

  return tags
}

const buildPostMetadata = async ({ userId, title, caption, metadata = {}, mediaIds = [] }) => {
  const manualTags = Array.isArray(metadata?.tags) ? metadata.tags : []
  const mediaSources = mediaIds.length ? await getMediaTagSources({ ownerId: userId, mediaIds }) : []
  const sourceTexts = [
    title,
    caption,
    ...mediaSources.flatMap((media) => [
      media.title,
      media.description,
      media.metadata?.originalFilename,
    ]),
  ].filter(Boolean)
  const autoTags = extractAutoTags(sourceTexts)
  const tags = []
  manualTags.forEach((tag) => uniquePush(tags, tag))
  autoTags.forEach((tag) => uniquePush(tags, tag))

  return {
    ...metadata,
    tags,
    autoTags,
  }
}

const l2Normalize = (vector) => {
  let norm = 0
  for (let i = 0; i < vector.length; i++) norm += vector[i] * vector[i]
  norm = Math.sqrt(norm)
  if (norm === 0) return vector
  const out = new Array(vector.length)
  for (let i = 0; i < vector.length; i++) out[i] = vector[i] / norm
  return out
}

const averageEmbeddings = (embeddings) => {
  if (!embeddings.length) return null
  if (embeddings.length === 1) return embeddings[0]
  const dim = embeddings[0].length
  const sum = new Array(dim).fill(0)
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) sum[i] += emb[i]
  }
  const avg = sum.map((v) => v / embeddings.length)
  return l2Normalize(avg)
}

const computePostEmbedding = async (postId) => {
  try {
    const { rows: mediaUrls } = await query(
      `select m.public_url
       from post_media pm
       join media_assets m on m.id = pm.media_id
       where pm.post_id = $1
         and m.public_url is not null
       union
       select m.public_url
       from posts p
       join media_assets m on m.id = p.cover_media_id
       where p.id = $1
         and m.public_url is not null
       limit 5`,
      [postId],
    )
    const urls = [...new Set(mediaUrls.map((r) => r.public_url).filter(Boolean))]

    let combined = null
    if (uniqueUrls.length) {
      const results = await Promise.allSettled(
        uniqueUrls.map((url) => getImageEmbedding(url)),
      )
      const embeddings = results
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value)
      if (embeddings.length) {
        combined = averageEmbeddings(embeddings)
      }
    }

    if (!combined) {
      const { rows: [post] } = await query(
        `select title, caption, metadata from posts where id = $1`,
        [postId],
      )
      if (!post) return
      const tags = post.metadata?.tags || []
      const parts = [post.title, post.caption, ...tags].filter(Boolean)
      const text = parts.join(', ')
      if (text.length >= 3) {
        combined = await getTextEmbedding(text)
      } else {
        return
      }
    }

    await updatePostEmbedding({ postId, embedding: combined })
    console.log('[EMBED] Stored embedding for post', postId, uniqueUrls.length ? `(${uniqueUrls.length} images)` : '(text fallback)')
  } catch (error) {
    console.error('[EMBED] Failed for post', postId, error.message)
  }
}

export const serializePost = (post) => {
  const { _clipScore, embedding: _, ...p } = post
  return {
    id: p.id,
    postType: p.postType,
    workspaceId: p.workspaceId,
    publishedVersionId: p.publishedVersionId,
    title: p.title,
    caption: p.caption,
    metadata: p.metadata || {},
    tags: p.metadata?.tags || [],
    allowComments: p.metadata?.allowComments !== false,
    visibility: p.visibility,
    saveCount: p.saveCount,
    likeCount: p.likeCount || 0,
    viewCount: p.viewCount,
    uniqueViewCount: p.uniqueViewCount || 0,
    isSaved: !!p.isSaved,
    isLiked: !!p.isLiked,
    publishedAt: p.publishedAt,
    status: p.status,
    updatedAt: p.updatedAt,
    ...(_clipScore !== undefined ? { clipScore: _clipScore } : {}),
    cover: p.coverMediaId ? {
      mediaId: p.coverMediaId,
      url: buildPublicUrl({
        publicUrl: p.coverPublicUrl,
        bucket: p.coverBucket,
        objectKey: p.coverObjectKey,
      }),
      sourceType: p.coverSourceType,
      mimeType: p.coverMimeType,
      width: p.coverWidth,
      height: p.coverHeight,
    } : null,
    media: (p.media || []).map((media) => ({
      mediaId: media.mediaId,
      url: buildPublicUrl({
        publicUrl: media.publicUrl,
        bucket: media.bucket,
        objectKey: media.objectKey,
      }),
      sourceType: media.sourceType,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height,
      position: media.position,
    })),
    author: {
      id: p.authorId,
      username: p.username,
      displayName: p.displayName,
      avatarMediaId: p.avatarMediaId,
      avatarUrl: p.avatarMediaId ? buildPublicUrl({
        publicUrl: p.avatarPublicUrl,
        bucket: p.avatarBucket,
        objectKey: p.avatarObjectKey,
      }) : null,
    },
  }
}

export const createMediaPost = async ({ userId, body }) => {
  for (const mediaId of body.mediaIds) {
    await getOwnedReadyMedia({ userId, mediaId })
  }
  const metadata = await buildPostMetadata({
    userId,
    title: body.title,
    caption: body.caption,
    metadata: body.metadata || {},
    mediaIds: body.mediaIds,
  })
  const result = await createMediaPostRecord({
    ownerId: userId,
    title: body.title,
    caption: body.caption,
    visibility: body.visibility,
    mediaIds: body.mediaIds,
    metadata,
  })
  computePostEmbedding(result.postId).catch((error) => {
    console.error('[EMBED] Background embedding failed:', error.message)
  })
  return serializePost(await findPostById({ postId: result.postId, viewerId: userId }))
}

const assertOwnedMediaIds = async ({ userId, mediaIds = [] }) => {
  for (const mediaId of mediaIds) {
    await getOwnedReadyMedia({ userId, mediaId })
  }
}

export const saveMediaDraft = async ({ userId, postId = null, body }) => {
  await assertOwnedMediaIds({ userId, mediaIds: body.mediaIds })
  const metadata = await buildPostMetadata({
    userId,
    title: body.title,
    caption: body.caption,
    metadata: body.metadata || {},
    mediaIds: body.mediaIds,
  })
  const payload = {
    ownerId: userId,
    title: body.title,
    caption: body.caption,
    visibility: body.visibility,
    mediaIds: body.mediaIds,
    metadata,
  }
  const result = postId
    ? await updateMediaPostDraft({ ...payload, postId })
    : await createMediaPostDraft(payload)
  if (!result) throw notFound('Draft not found')
  return serializePost(await findPostById({ postId: result.postId, viewerId: userId }))
}

export const publishMediaDraft = async ({ userId, postId }) => {
  const result = await publishMediaPostDraft({ ownerId: userId, postId })
  if (!result) throw notFound('Draft not found')
  computePostEmbedding(postId).catch((error) => {
    console.error('[EMBED] Background embedding failed:', error.message)
  })
  return serializePost(await findPostById({ postId, viewerId: userId }))
}

const paginate = (rows, limit) => {
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items[items.length - 1]
  return {
    items: items.map(serializePost),
    nextCursor: hasMore && last ? encodeCursor(last) : null,
  }
}

export const publishWorkspace = async ({ userId, body }) => {
  const workspace = await findWorkspaceById(body.workspaceId)
  if (!workspace) throw notFound('Workspace not found')
  if (workspace.ownerId !== userId) throw forbidden('You do not own this workspace')

  if (body.coverMediaId) {
    await getOwnedReadyMedia({ userId, mediaId: body.coverMediaId })
  }

  const latestVersion = await getLatestVersion(body.workspaceId)
  const snapshot = body.snapshot || latestVersion?.snapshot
  if (!snapshot) throw notFound('Workspace has no snapshot to publish')

  const metadata = await buildPostMetadata({
    userId,
    title: body.title || workspace.title,
    caption: body.caption,
    metadata: body.metadata || {},
    mediaIds: body.coverMediaId ? [body.coverMediaId] : [],
  })
  const result = await publishWorkspacePost({
    ownerId: userId,
    workspaceId: body.workspaceId,
    snapshot,
    snapshotHash: hashSnapshot(snapshot),
    title: body.title || workspace.title,
    caption: body.caption,
    visibility: body.visibility,
    coverMediaId: body.coverMediaId,
    metadata,
  })
  if (!result) throw notFound('Workspace not found')

  computePostEmbedding(result.postId).catch((error) => {
    console.error('[EMBED] Background embedding failed:', error.message)
  })

  const post = await findPostById({ postId: result.postId, viewerId: userId })
  return serializePost(post)
}

export const homeFeed = async ({ viewerId = null, query }) => {
  const decoded = decodeCursor(query.cursor)
  const recentInterestTags = viewerId ? await getTopRecentInterestTags({ userId: viewerId, limit: 24 }) : []

  // Cek profile dulu sebelum fetch — menentukan skip SQL cursor atau tidak
  let profile = null
  if (viewerId) {
    profile = await getUserProfileEmbedding(viewerId)
    if (!profile) {
      profile = await buildProfileFromSignals(viewerId)
    }
  }

  const hasProfile = !!profile

  // Ketika profile aktif: overfetch besar + in-memory pagination via sortPos
  // Jangan kirim SQL cursor — fetch dari awal setiap halaman biar pool konsisten
  // Snapshot anchor dan frozen seed dikunci di page 1 untuk stabilitas batch
  const sortPos = (hasProfile && decoded?.sortPos) || 0
  const snapshot = (hasProfile && decoded?.snapshot) || (hasProfile ? new Date().toISOString() : null)
  const frozenSeed = (hasProfile && decoded?.frozenSeed) || (hasProfile ? (query.seed || new Date().toISOString().slice(0, 10)) : null)
  const fetchLimit = hasProfile ? (query.limit * 3 + 50) : query.limit

  const rows = await getHomeFeed({
    viewerId,
    cursor: hasProfile ? null : decoded,
    limit: fetchLimit,
    mode: query.mode,
    seed: frozenSeed,
    snapshot,
    recentInterestTags,
  })

  if (hasProfile && rows.length) {
    const reranked = rankPostsByProfile(rows, profile)

    let filtered = reranked.filter(p => p._clipScore >= CLIP_SCORE_THRESHOLD)

    const HARD_FLOOR = Math.min(10, query.limit)
    const target = query.limit

    if (filtered.length < target) {
      const loosened = reranked.filter(p => p._clipScore >= 0.02)
      if (loosened.length >= target) {
        filtered = loosened.slice(0, target)
      } else if (loosened.length >= HARD_FLOOR) {
        filtered = loosened
      } else {
        filtered = loosened.length ? loosened.slice(0, Math.min(HARD_FLOOR, loosened.length)) : filtered
      }
    }

    // In-memory pagination: skip ke sortPos, ambil limit item
    const start = Math.min(sortPos, filtered.length)
    const pageItems = filtered.slice(start, start + query.limit)
    const hasMore = start + pageItems.length < filtered.length
    const last = pageItems[pageItems.length - 1]

    return {
      items: pageItems.map(serializePost),
      nextCursor: hasMore && last
        ? Buffer.from(JSON.stringify({
            publishedAt: last.publishedAt,
            id: last.id,
            score: last.score,
            sortPos: start + pageItems.length,
            snapshot,
            frozenSeed,
          })).toString('base64url')
        : null,
    }
  }

  // Jalur tanpa profile: pakai SQL cursor pagination yang lama (tidak berubah)
  return paginate(rows, query.limit)
}

export const userPosts = async ({ viewerId = null, username, query }) => {
  const cursor = decodeCursor(query.cursor)
  const rows = await getPostsByUsername({
    viewerId,
    username,
    cursor,
    limit: query.limit,
  })
  return paginate(rows, query.limit)
}

export const getPost = async ({ viewerId = null, postId }) => {
  const post = await findPostById({ postId, viewerId })
  const canView = post && (
    post.status === 'published'
    || (post.status === 'draft' && post.authorId === viewerId)
  ) && (
    post.visibility === 'public'
    || post.authorId === viewerId
    || (post.visibility === 'unlisted' && viewerId && await findMutualFollow({ userIdA: viewerId, userIdB: post.authorId }))
  )
  if (!canView) {
    throw notFound('Post not found')
  }
  await recordPostView({ postId, viewerId })
  const nextPost = await findPostById({ postId, viewerId })
  if (viewerId) {
    await recordInterestEvent({
      userId: viewerId,
      eventType: 'open_post',
      tags: nextPost?.metadata?.tags || [],
    })
    if (nextPost.embedding) {
      updateProfile({
        userId: viewerId,
        embedding: nextPost.embedding,
        weight: 0.2,
      }).catch(() => {})
    }
  }
  return serializePost(nextPost)
}

export const savedPosts = async ({ viewerId, query }) => {
  const cursor = decodeCursor(query.cursor)
  const rows = await getSavedPosts({
    viewerId,
    cursor,
    limit: query.limit,
  })
  return paginate(rows, query.limit)
}

export const recommendedPosts = async ({ viewerId = null, postId, query: params }) => {
  const currentPost = await findPostById({ postId, viewerId })
  const canView = currentPost && (
    currentPost.status === 'published'
    || (currentPost.status === 'draft' && currentPost.authorId === viewerId)
  ) && (
    currentPost.visibility === 'public'
    || currentPost.authorId === viewerId
    || (currentPost.visibility === 'unlisted' && viewerId && await findMutualFollow({ userIdA: viewerId, userIdB: currentPost.authorId }))
  )
  if (!canView) {
    throw notFound('Post not found')
  }

  const { rows: [postEmbed] } = await query(
    `select embedding from posts where id = $1 and embedding is not null`,
    [postId],
  )

  const rows = await getRecommendedPosts({
    viewerId,
    postId,
    limit: params.limit + 1,
    offset: params.offset,
  })

  let items = rows
  if (postEmbed?.embedding) {
    const qLower = `${currentPost.title || ''} ${(currentPost.metadata?.tags || []).join(' ')}`.trim().toLowerCase()
    items = items
      .map(p => ({
        ...p,
        _clipScore: p.embedding ? cosineSimilarity(postEmbed.embedding, p.embedding) : 0,
      }))
      .filter(p => {
        if (!qLower) return p._clipScore >= CLIP_SCORE_THRESHOLD
        const text = `${p.title || ''} ${p.caption || ''} ${(p.metadata?.tags || []).join(' ')}`.toLowerCase()
        return qLower.split(/\s+/).some(word => text.includes(word)) && p._clipScore >= CLIP_SCORE_THRESHOLD
      })
      .sort((a, b) => b._clipScore - a._clipScore)
  }

  if (items.length === 0 && postEmbed?.embedding) {
    const fallback = await getPostsByEmbeddingSimilarity({ viewerId, limit: 100 })
    items = fallback
      .map(p => ({
        ...p,
        _clipScore: p.embedding ? cosineSimilarity(postEmbed.embedding, p.embedding) : 0,
      }))
      .filter(p => p._clipScore >= CLIP_SCORE_THRESHOLD)
      .sort((a, b) => b._clipScore - a._clipScore)
      .slice(0, params.limit)
    return { items: items.map(serializePost), nextOffset: null }
  }

  const hasMore = items.length > params.limit
  const trimmed = hasMore ? items.slice(0, params.limit) : items
  return {
    items: trimmed.map(serializePost),
    nextOffset: hasMore ? params.offset + params.limit : null,
  }
}

const uploadEmbeddingCache = new Map()

const getEmbeddingForImageId = async (imageId) => {
  let emb = await findAnyEmbedding({ id: imageId })
  if (!emb && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(imageId)) {
    if (uploadEmbeddingCache.has(imageId)) {
      emb = uploadEmbeddingCache.get(imageId)
    } else {
      try {
        const media = await findMediaById(imageId)
        if (media?.publicUrl) {
          const computed = await getImageEmbedding(media.publicUrl)
          if (computed) {
            uploadEmbeddingCache.set(imageId, computed)
            emb = computed
          }
        }
      } catch {
        void 0
      }
    }
  }
  return emb
}

export const similarPostsByImage = async ({ viewerId = null, imageId, q, limit = 12 }) => {
  const ids = imageId.split(',').filter(Boolean)
  const embeddings = (await Promise.all(ids.map(getEmbeddingForImageId))).filter(Boolean)
  const embedding = averageEmbeddings(embeddings)
  if (!embedding) return { items: [] }

  const rows = await getPostsByEmbeddingSimilarity({ viewerId, limit: 200 })
  if (!rows.length) return { items: [] }

  const qLower = q?.trim().toLowerCase()
  const scored = rows
    .filter(p => {
      if (!qLower) return true
      const text = `${p.title || ''} ${p.caption || ''} ${(p.metadata?.tags || []).join(' ')}`.toLowerCase()
      return qLower.split(/\s+/).some(word => text.includes(word))
    })
    .map(p => ({
      ...p,
      _clipScore: p.embedding ? cosineSimilarity(embedding, p.embedding) : 0,
    }))
    .filter(p => p._clipScore >= CLIP_SCORE_THRESHOLD)
    .sort((a, b) => b._clipScore - a._clipScore)
    .slice(0, Math.min(limit, 12))

  return { items: scored.map(serializePost) }
}

export const save = async ({ userId, postId }) => {
  const result = await savePost({ userId, postId })
  if (!result) throw notFound('Post not found')
  if (result.inserted) {
    const post = await findPostById({ postId, viewerId: userId })
    await recordInterestEvent({
      userId,
      eventType: 'save_post',
      tags: post?.metadata?.tags || [],
    })
    if (post.embedding) {
      updateProfile({
        userId,
        embedding: post.embedding,
        weight: 0.6,
      }).catch(() => {})
    }
  }
  return { saved: true, changed: result.inserted }
}

export const unsave = async ({ userId, postId }) => {
  await unsavePost({ userId, postId })
  return { saved: false }
}

export const like = async ({ userId, postId }) => {
  const result = await likePost({ userId, postId })
  if (!result) throw notFound('Post not found')
  return { liked: true, changed: result.inserted }
}

export const unlike = async ({ userId, postId }) => {
  await unlikePost({ userId, postId })
  return { liked: false }
}

export const updatePost = async ({ userId, postId, body }) => {
  const existing = await findPostById({ postId, viewerId: userId })
  if (!existing || existing.authorId !== userId) throw notFound('Post not found')

  if (body.mediaIds) {
    for (const mediaId of body.mediaIds) {
      await getOwnedReadyMedia({ userId, mediaId })
    }
  }

  const mediaIds = body.mediaIds || (existing.media || []).map((media) => media.mediaId).filter(Boolean)
  const metadata = await buildPostMetadata({
    userId,
    title: body.title ?? existing.title,
    caption: body.caption ?? existing.caption,
    metadata: body.metadata || existing.metadata || {},
    mediaIds,
  })

  const result = await updatePostRecord({
    postId,
    ownerId: userId,
    title: body.title,
    caption: body.caption,
    visibility: body.visibility,
    mediaIds: body.mediaIds,
    metadata,
  })
  if (!result) throw notFound('Post not found')
  if (body.mediaIds) {
    computePostEmbedding(postId).catch((error) => {
      console.error('[EMBED] Background embedding failed:', error.message)
    })
  }
  return serializePost(await findPostById({ postId, viewerId: userId }))
}

export const deletePost = async ({ userId, postId }) => {
  const existing = await findPostById({ postId, viewerId: userId })
  if (!existing || existing.authorId !== userId) throw notFound('Post not found')
  await deletePostRecord({ postId, ownerId: userId })
}
