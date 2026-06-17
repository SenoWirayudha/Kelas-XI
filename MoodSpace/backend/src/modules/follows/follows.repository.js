import { query } from '../../db/pool.js'

export const insertFollow = async ({ followerId, followingId }) => {
  const { rows } = await query(
    `insert into follows (follower_id, following_id)
     values ($1, $2)
     on conflict (follower_id, following_id) do nothing
     returning follower_id, following_id, created_at`,
    [followerId, followingId],
  )
  return rows[0] || null
}

export const deleteFollow = async ({ followerId, followingId }) => {
  const { rows } = await query(
    `delete from follows
     where follower_id = $1 and following_id = $2
     returning follower_id, following_id`,
    [followerId, followingId],
  )
  return rows[0] || null
}

export const findFollow = async ({ followerId, followingId }) => {
  const { rows } = await query(
    'select 1 from follows where follower_id = $1 and following_id = $2',
    [followerId, followingId],
  )
  return rows.length > 0
}

export const findMutualFollow = async ({ userIdA, userIdB }) => {
  const { rows } = await query(
    `select 1 from follows f1
     join follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
     where f1.follower_id = $1 and f1.following_id = $2`,
    [userIdA, userIdB],
  )
  return rows.length > 0
}

export const findFollowers = async ({ userId, viewerId }) => {
  const { rows } = await query(
    `select
       u.id,
       u.username,
       coalesce(u.display_name, u.username) as "displayName",
       avatar.public_url as "avatarUrl",
       f.created_at as "followedAt",
       exists (
         select 1 from follows f2
         where f2.follower_id = $2 and f2.following_id = u.id
       ) as "isFollowing"
     from follows f
     join users u on u.id = f.follower_id
     left join user_profiles p on p.user_id = u.id
     left join media_assets avatar on avatar.id = p.avatar_media_id and avatar.deleted_at is null
     where f.following_id = $1
       and u.status = 'active'
     order by f.created_at desc`,
    [userId, viewerId],
  )
  return rows
}

export const findFollowing = async ({ userId, viewerId }) => {
  const { rows } = await query(
    `select
       u.id,
       u.username,
       coalesce(u.display_name, u.username) as "displayName",
       avatar.public_url as "avatarUrl",
       f.created_at as "followedAt",
       exists (
         select 1 from follows f2
         where f2.follower_id = $2 and f2.following_id = u.id
       ) as "isFollowing"
     from follows f
     join users u on u.id = f.following_id
     left join user_profiles p on p.user_id = u.id
     left join media_assets avatar on avatar.id = p.avatar_media_id and avatar.deleted_at is null
     where f.follower_id = $1
       and u.status = 'active'
     order by f.created_at desc`,
    [userId, viewerId],
  )
  return rows
}
