import { notFound } from '../../utils/errors.js'
import { findPostById } from '../posts/posts.repository.js'
import { insertReport } from './reports.repository.js'

export const createReport = async ({ postId, reporterId, reason, detail }) => {
  const post = await findPostById({ postId })
  if (!post) throw notFound('Post not found')

  const result = await insertReport({ postId, reporterId, reason, detail })

  return {
    id: result.id,
    postId: result.post_id,
    reason: result.reason,
    detail: result.detail,
    createdAt: result.created_at,
  }
}
