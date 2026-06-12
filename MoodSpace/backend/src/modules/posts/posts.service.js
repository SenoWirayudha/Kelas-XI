import { forbidden, notFound } from '../../utils/errors.js'
import { buildPublicUrl } from '../media/storage.service.js'
import { getOwnedReadyMedia } from '../media/media.service.js'
import { findWorkspaceById, getLatestVersion } from '../workspaces/workspaces.repository.js'
import { hashSnapshot } from '../workspaces/snapshot.service.js'
import { getTopRecentInterestTags, recordInterestEvent } from '../interest/interest.service.js'
import { decodeCursor, encodeCursor } from './cursor.js'
import {
  findPostById,
  createMediaPost as createMediaPostRecord,
  createMediaPostDraft,
  getMediaTagSources,
  getHomeFeed,
  getRecommendedPosts,
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
  deletePostRecord,
} from './posts.repository.js'

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

export const serializePost = (post) => ({
  id: post.id,
  postType: post.postType,
  workspaceId: post.workspaceId,
  publishedVersionId: post.publishedVersionId,
  title: post.title,
  caption: post.caption,
  metadata: post.metadata || {},
  tags: post.metadata?.tags || [],
  allowComments: post.metadata?.allowComments !== false,
  visibility: post.visibility,
  saveCount: post.saveCount,
  likeCount: post.likeCount || 0,
  viewCount: post.viewCount,
  uniqueViewCount: post.uniqueViewCount || 0,
  isSaved: !!post.isSaved,
  isLiked: !!post.isLiked,
  publishedAt: post.publishedAt,
  status: post.status,
  updatedAt: post.updatedAt,
  cover: post.coverMediaId ? {
    mediaId: post.coverMediaId,
    url: buildPublicUrl({
      publicUrl: post.coverPublicUrl,
      bucket: post.coverBucket,
      objectKey: post.coverObjectKey,
    }),
    sourceType: post.coverSourceType,
    mimeType: post.coverMimeType,
    width: post.coverWidth,
    height: post.coverHeight,
  } : null,
  media: (post.media || []).map((media) => ({
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
    id: post.authorId,
    username: post.username,
    displayName: post.displayName,
    avatarMediaId: post.avatarMediaId,
    avatarUrl: post.avatarMediaId ? buildPublicUrl({
      publicUrl: post.avatarPublicUrl,
      bucket: post.avatarBucket,
      objectKey: post.avatarObjectKey,
    }) : null,
  },
})

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

  const post = await findPostById({ postId: result.postId, viewerId: userId })
  return serializePost(post)
}

export const homeFeed = async ({ viewerId = null, query }) => {
  const cursor = decodeCursor(query.cursor)
  const recentInterestTags = viewerId ? await getTopRecentInterestTags({ userId: viewerId, limit: 24 }) : []
  console.log('[homeFeed] viewerId:', viewerId)
  console.log('[homeFeed] recentInterestTags:', recentInterestTags)
  const rows = await getHomeFeed({
    viewerId,
    cursor,
    limit: query.limit,
    mode: query.mode,
    seed: query.seed,
    recentInterestTags,
  })
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
  if (!post || (post.status === 'draft' && post.authorId !== viewerId) || (post.status !== 'draft' && post.visibility !== 'public' && post.authorId !== viewerId)) {
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

export const recommendedPosts = async ({ viewerId = null, postId, query }) => {
  const currentPost = await findPostById({ postId, viewerId })
  if (!currentPost || (currentPost.status === 'draft' && currentPost.authorId !== viewerId) || (currentPost.status !== 'draft' && currentPost.visibility !== 'public' && currentPost.authorId !== viewerId)) {
    throw notFound('Post not found')
  }
  const rows = await getRecommendedPosts({
    viewerId,
    postId,
    limit: query.limit + 1,
    offset: query.offset,
  })
  const hasMore = rows.length > query.limit
  const items = hasMore ? rows.slice(0, query.limit) : rows
  return {
    items: items.map(serializePost),
    nextOffset: hasMore ? query.offset + query.limit : null,
  }
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
  return serializePost(await findPostById({ postId, viewerId: userId }))
}

export const deletePost = async ({ userId, postId }) => {
  const existing = await findPostById({ postId, viewerId: userId })
  if (!existing || existing.authorId !== userId) throw notFound('Post not found')
  await deletePostRecord({ postId, ownerId: userId })
}
