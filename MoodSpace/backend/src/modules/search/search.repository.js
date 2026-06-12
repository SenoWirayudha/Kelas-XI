import { query } from '../../db/pool.js'

export const listSearchHistory = async ({ userId, limit = 8 }) => {
  const { rows } = await query(
    `select query, updated_at as "updatedAt"
     from search_history
     where user_id = $1
     order by updated_at desc
     limit $2`,
    [userId, limit],
  )
  return rows
}

export const recordSearchHistory = async ({ userId, value }) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const { rows } = await query(
    `insert into search_history (user_id, query)
     values ($1, $2)
     on conflict (user_id, query_normalized)
     do update set
       query = excluded.query,
       updated_at = now()
     returning query, updated_at as "updatedAt"`,
    [userId, trimmed],
  )
  return rows[0] || null
}

export const clearSearchHistory = async ({ userId }) => {
  await query('delete from search_history where user_id = $1', [userId])
}
