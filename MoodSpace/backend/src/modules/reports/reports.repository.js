import { query } from '../../db/pool.js'

export const insertReport = async ({ postId, reporterId, reason, detail }) => {
  const { rows } = await query(
    `insert into reports (post_id, reporter_id, reason, detail)
     values ($1, $2, $3, $4)
     returning id, post_id, reason, detail, created_at`,
    [postId, reporterId, reason, detail || null],
  )
  return rows[0]
}
