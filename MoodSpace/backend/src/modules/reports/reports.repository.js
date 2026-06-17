import { query } from '../../db/pool.js'

export const insertReport = async ({ targetType, targetId, reporterId, reason, detail }) => {
  const postId = targetType === 'post' ? targetId : null
  const commentId = targetType === 'comment' ? targetId : null
  const reportedUserId = targetType === 'user' ? targetId : null

  const { rows } = await query(
    `insert into reports (target_type, post_id, comment_id, reported_user_id, reporter_id, reason, detail)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, target_type, post_id, comment_id, reported_user_id, reason, detail, created_at`,
    [targetType, postId, commentId, reportedUserId, reporterId, reason, detail || null],
  )
  return rows[0]
}
