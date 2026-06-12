import { query } from '../../db/pool.js'

export const insertComment = async ({ postId, authorId, content }) => {
  const { rows } = await query(
    `insert into comments (post_id, author_id, content)
     values ($1, $2, $3)
     returning id, created_at`,
    [postId, authorId, content],
  )
  return rows[0]
}

export const listCommentsByPost = async ({ postId, cursor, limit }) => {
  const { rows } = await query(
    `select
       c.id,
       c.content,
       c.created_at as "createdAt",
       c.author_id as "authorId",
       u.username,
       u.display_name as "displayName",
       up.avatar_media_id as "avatarMediaId",
       ma.public_url as "avatarUrl"
     from comments c
     join users u on u.id = c.author_id
     left join user_profiles up on up.user_id = u.id
     left join media_assets ma on ma.id = up.avatar_media_id and ma.deleted_at is null
     where c.post_id = $1
       and ($2::uuid is null or c.created_at < (select created_at from comments where id = $2))
     order by c.created_at desc
     limit $3`,
    [postId, cursor, limit + 1],
  )

  const hasMore = rows.length > limit
  if (hasMore) rows.pop()

  return {
    comments: rows,
    nextCursor: hasMore ? rows[rows.length - 1]?.id : null,
  }
}

export const findCommentById = async ({ commentId, authorId }) => {
  const { rows } = await query(
    `select id from comments where id = $1 and author_id = $2`,
    [commentId, authorId],
  )
  return rows[0] || null
}

export const deleteCommentRecord = async ({ commentId, authorId }) => {
  const { rows } = await query(
    `delete from comments where id = $1 and author_id = $2 returning id`,
    [commentId, authorId],
  )
  return rows[0] || null
}
