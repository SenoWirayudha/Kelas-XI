import { query } from '../../db/pool.js'
import { forbidden, notFound } from '../../utils/errors.js'
import {
  deleteCommentRecord,
  findCommentById,
  insertComment,
  listCommentsByPost,
} from './comments.repository.js'
import { findPostById } from '../posts/posts.repository.js'
import { insertNotification } from '../notifications/notifications.repository.js'

export const listComments = async ({ postId, cursor, limit }) => {
  const post = await findPostById({ postId })
  if (!post) throw notFound('Post not found')

  return listCommentsByPost({ postId, cursor, limit })
}

export const createComment = async ({ postId, userId, content }) => {
  const post = await findPostById({ postId })
  if (!post) throw notFound('Post not found')
  if (post.metadata?.allowComments === false) throw forbidden('Comments are disabled for this post')

  const result = await insertComment({ postId, authorId: userId, content })

  if (post.authorId && post.authorId !== userId) {
    await insertNotification({
      userId: post.authorId,
      actorId: userId,
      type: 'comment',
      targetType: 'post',
      targetId: postId,
      metadata: { postTitle: post.title || 'Untitled' },
    })
  }

  const { rows } = await query(
    `select
       u.username,
       u.display_name as "displayName",
       up.avatar_media_id as "avatarMediaId",
       ma.public_url as "avatarUrl"
     from users u
     left join user_profiles up on up.user_id = u.id
     left join media_assets ma on ma.id = up.avatar_media_id and ma.deleted_at is null
     where u.id = $1`,
    [userId],
  )

  return {
    id: result.id,
    content,
    createdAt: result.created_at,
    authorId: userId,
    ...rows[0],
  }
}

export const deleteComment = async ({ commentId, userId }) => {
  const deleted = await deleteCommentRecord({ commentId, authorId: userId })
  if (!deleted) throw notFound('Comment not found')
}
