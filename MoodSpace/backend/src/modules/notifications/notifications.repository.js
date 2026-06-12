import { query } from '../../db/pool.js'

export const findByUserId = async ({ userId, limit, offset }) => {
  const { rows } = await query(
    `select
       n.id,
       n.type,
       n.target_type as "targetType",
       n.target_id as "targetId",
       n.metadata,
       n.read_at as "readAt",
       n.created_at as "createdAt",
       actor.id as "actorId",
       actor.username as "actorUsername",
       coalesce(actor.display_name, actor.username) as "actorDisplayName"
     from notifications n
     left join users actor on actor.id = n.actor_id
     where n.user_id = $1
     order by n.created_at desc
     limit $2 offset $3`,
    [userId, limit, offset],
  )
  return rows
}

export const countUnread = async (userId) => {
  const { rows } = await query(
    'select count(*)::int as total from notifications where user_id = $1 and read_at is null',
    [userId],
  )
  return rows[0].total
}

export const markAsRead = async (notificationId, userId) => {
  const { rows } = await query(
    `update notifications set read_at = now()
     where id = $1 and user_id = $2
     returning id`,
    [notificationId, userId],
  )
  return rows[0] || null
}

export const markAllAsRead = async (userId) => {
  await query(
    `update notifications set read_at = now()
     where user_id = $1 and read_at is null`,
    [userId],
  )
}

export const insertNotification = async ({ userId, actorId, type, targetType, targetId, metadata }) => {
  const { rows } = await query(
    `insert into notifications (user_id, actor_id, type, target_type, target_id, metadata)
     values ($1, $2, $3, $4, $5, $6::jsonb)
     returning id`,
    [userId, actorId || null, type, targetType, targetId, JSON.stringify(metadata || {})],
  )
  return rows[0]
}
