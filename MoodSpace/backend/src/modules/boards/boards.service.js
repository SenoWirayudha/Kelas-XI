import { notFound } from '../../utils/errors.js'
import { query } from '../../db/pool.js'
import { ensureExternalImage } from '../externalImages/externalImages.service.js'
import { findExternalImageById, findExternalImageEmbedding } from '../externalImages/externalImages.repository.js'
import { recordInterestEvent } from '../interest/interest.service.js'
import { updateProfile } from '../profile/profile.service.js'
import { getOwnedReadyMedia } from '../media/media.service.js'
import { findPostById } from '../posts/posts.repository.js'
import {
  createBoard as createBoardRecord,
  deleteBoardItem as deleteBoardItemRecord,
  deleteBoardRecord,
  findBoardById,
  findBoardablePost,
  insertBoardItem,
  listBoardItems,
  listBoardsByOwner,
} from './boards.repository.js'

const serializeBoard = (board) => ({
  id: board.id,
  name: board.name,
  description: board.description,
  categories: board.categories || [],
  visibility: board.visibility,
  itemCount: board.itemCount || 0,
  coverImages: board.coverImages || [],
  createdAt: board.createdAt,
  updatedAt: board.updatedAt,
})

export const listBoards = async (userId) => (
  (await listBoardsByOwner(userId)).map(serializeBoard)
)

export const getBoard = async ({ userId, boardId }) => {
  const board = await findBoardById({ boardId, ownerId: userId })
  if (!board) throw notFound('Board not found')
  const items = await listBoardItems({ boardId, ownerId: userId })
  return { ...serializeBoard(board), items }
}

export const createBoard = async ({ userId, body }) => (
  serializeBoard(await createBoardRecord({ ownerId: userId, ...body }))
)

export const addBoardItem = async ({ userId, boardId, body }) => {
  const board = await findBoardById({ boardId, ownerId: userId })
  if (!board) throw notFound('Board not found')
  if (body.mediaId) await getOwnedReadyMedia({ userId, mediaId: body.mediaId })
  let externalImageId = body.externalImageId || null
  if (body.externalImage) {
    const image = await ensureExternalImage({ image: body.externalImage })
    externalImageId = image.id
  }
  if (body.postId) {
    const post = await findBoardablePost({ postId: body.postId, userId })
    if (!post) throw notFound('Post not found')
  }

  const item = await insertBoardItem({
    boardId,
    ownerId: userId,
    postId: body.postId,
    mediaId: body.mediaId,
    externalImageId,
  })
  if (!item) return { added: false }
  if (body.postId) {
    const post = await findPostById({ postId: body.postId, viewerId: userId })
    await recordInterestEvent({
      userId,
      eventType: 'add_to_board',
      tags: post?.metadata?.tags || [],
    })
    if (post?.embedding) {
      updateProfile({ userId, embedding: post.embedding, weight: 0.8 }).catch(() => {})
    }
  } else if (externalImageId) {
    const image = await findExternalImageById({ id: externalImageId, userId })
    await recordInterestEvent({
      userId,
      eventType: 'add_to_board',
      tags: image?.tags || [],
      query: image?.title || null,
    })
    const emb = await findExternalImageEmbedding({ id: externalImageId })
    if (emb) {
      updateProfile({ userId, embedding: emb, weight: 0.8 }).catch(() => {})
    }
  }
  return { added: true, itemId: item.id }
}

export const removeBoardItem = async ({ userId, boardId, itemId }) => {
  const item = await deleteBoardItemRecord({ boardId, itemId, ownerId: userId })
  if (!item) throw notFound('Board item not found')
}

export const deleteBoard = async ({ userId, boardId }) => {
  const board = await deleteBoardRecord({ boardId, ownerId: userId })
  if (!board) throw notFound('Board not found')
}
