import { badRequest, notFound } from '../../utils/errors.js'
import { findPostById } from '../posts/posts.repository.js'
import { findUserById } from '../auth/auth.repository.js'
import { findCommentById } from '../comments/comments.repository.js'
import { insertReport } from './reports.repository.js'

const targetValidators = {
  post: async (id) => { const p = await findPostById({ postId: id }); if (!p) throw notFound('Post not found'); return p },
  user: async (id) => { const u = await findUserById(id); if (!u) throw notFound('User not found'); return u },
  comment: async (id) => { const c = await findCommentById({ commentId: id }); if (!c) throw notFound('Comment not found'); return c },
}

export const createReport = async ({ targetType, targetId, reporterId, reason, detail }) => {
  if (!targetType || !targetId) throw badRequest('targetType and targetId are required')

  const validate = targetValidators[targetType]
  if (!validate) throw badRequest(`Invalid targetType: ${targetType}`)

  await validate(targetId)

  const result = await insertReport({ targetType, targetId, reporterId, reason, detail })

  return {
    id: result.id,
    targetType: result.target_type,
    targetId: targetType === 'post' ? result.post_id : targetType === 'comment' ? result.comment_id : result.reported_user_id,
    reason: result.reason,
    detail: result.detail,
    createdAt: result.created_at,
  }
}
