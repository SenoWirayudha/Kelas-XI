import { query } from '../../db/pool.js'

export const countUsers = async () => {
  const { rows } = await query('select count(*)::int as total from users')
  return rows[0].total
}

export const countPosts = async () => {
  const { rows } = await query('select count(*)::int as total from posts where status = $1', ['published'])
  return rows[0].total
}

export const countReports = async (resolved = false) => {
  const { rows } = await query(
    `select count(*)::int as total from reports
     where resolved_at is${resolved ? ' not' : ''} null`,
  )
  return rows[0].total
}

export const countComments = async () => {
  const { rows } = await query('select count(*)::int as total from comments')
  return rows[0].total
}

export const countMedia = async () => {
  const { rows } = await query('select count(*)::int as total from media_assets where deleted_at is null')
  return rows[0].total
}

export const countNewUsersToday = async () => {
  const { rows } = await query(
    `select count(*)::int as total from users
     where created_at >= date_trunc('day', now())`,
  )
  return rows[0].total
}

export const getPostsPublishedTodayCount = async () => {
  const { rows } = await query(
    `select count(*)::int as total from posts
     where status = 'published' and published_at >= date_trunc('day', now())`,
  )
  return rows[0].total
}

export const getRegistrationTrend = async (days = 30) => {
  const { rows } = await query(
    `select
       date_trunc('day', created_at)::date as date,
       count(*)::int as value
     from users
     where created_at >= now() - ($1 || ' days')::interval
     group by 1
     order by 1`,
    [String(days)],
  )
  return rows
}

export const getPostTrend = async (days = 30) => {
  const { rows } = await query(
    `select
       date_trunc('day', published_at)::date as date,
       count(*)::int as value
     from posts
     where status = 'published' and published_at >= now() - ($1 || ' days')::interval
     group by 1
     order by 1`,
    [String(days)],
  )
  return rows
}

export const listAllUsers = async ({ search, role, status, limit, offset }) => {
  const conditions = []
  const params = []
  let idx = 1

  if (search) {
    conditions.push(`(u.username ilike $${idx} or u.display_name ilike $${idx} or u.email ilike $${idx})`)
    params.push(`%${search}%`)
    idx++
  }
  if (role) {
    conditions.push(`u.role = $${idx}`)
    params.push(role)
    idx++
  }
  if (status) {
    conditions.push(`u.status = $${idx}`)
    params.push(status)
    idx++
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''

  const { rows } = await query(
    `select
       u.id, u.email, u.username, u.display_name as "displayName",
       u.role, u.status, u.created_at as "createdAt",
       u.last_login_at as "lastLoginAt",
       p.avatar_media_id as "avatarMediaId"
     from users u
     left join user_profiles p on p.user_id = u.id
     ${where}
     order by u.created_at desc
     limit $${idx} offset $${idx + 1}`,
    [...params, limit, offset],
  )
  return rows
}

export const countAllUsers = async ({ search, role, status }) => {
  const conditions = []
  const params = []
  let idx = 1

  if (search) {
    conditions.push(`(username ilike $${idx} or display_name ilike $${idx} or email ilike $${idx})`)
    params.push(`%${search}%`)
    idx++
  }
  if (role) {
    conditions.push(`role = $${idx}`)
    params.push(role)
    idx++
  }
  if (status) {
    conditions.push(`status = $${idx}`)
    params.push(status)
    idx++
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''

  const { rows } = await query(
    `select count(*)::int as total from users ${where}`,
    params,
  )
  return rows[0].total
}

export const updateUser = async (userId, patch) => {
  const setClauses = []
  const params = []
  let idx = 1

  if (patch.role !== undefined) {
    setClauses.push(`role = $${idx}`)
    params.push(patch.role)
    idx++
  }
  if (patch.status !== undefined) {
    setClauses.push(`status = $${idx}`)
    params.push(patch.status)
    idx++
  }

  if (setClauses.length === 0) return null

  setClauses.push(`updated_at = now()`)
  params.push(userId)

  const { rows } = await query(
    `update users set ${setClauses.join(', ')} where id = $${idx}
     returning id, email, username, display_name as "displayName", role, status, created_at as "createdAt"`,
    params,
  )
  return rows[0] || null
}

export const listAllPosts = async ({ search, status, limit, offset }) => {
  const conditions = []
  const params = []
  let idx = 1

  if (search) {
    conditions.push(`(p.title ilike $${idx} or p.caption ilike $${idx})`)
    params.push(`%${search}%`)
    idx++
  }
  if (status) {
    conditions.push(`p.status = $${idx}`)
    params.push(status)
    idx++
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''

  const { rows } = await query(
    `select
       p.id, p.title, p.caption, p.status, p.visibility,
       p.save_count as "saveCount", p.view_count as "viewCount",
       p.published_at as "publishedAt", p.created_at as "createdAt",
       p.cover_media_id as "coverMediaId",
       u.id as "authorId", u.username, u.display_name as "authorDisplayName",
       ma.public_url as "coverUrl"
     from posts p
     left join users u on u.id = p.author_id
     left join media_assets ma on ma.id = p.cover_media_id and ma.deleted_at is null
     ${where}
     order by p.created_at desc
     limit $${idx} offset $${idx + 1}`,
    [...params, limit, offset],
  )
  return rows
}

export const countAllPosts = async ({ search, status }) => {
  const conditions = []
  const params = []
  let idx = 1

  if (search) {
    conditions.push(`(title ilike $${idx} or caption ilike $${idx})`)
    params.push(`%${search}%`)
    idx++
  }
  if (status) {
    conditions.push(`status = $${idx}`)
    params.push(status)
    idx++
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''

  const { rows } = await query(
    `select count(*)::int as total from posts ${where}`,
    params,
  )
  return rows[0].total
}

export const banPostById = async (postId) => {
  const { rows } = await query(
    `update posts set status = 'banned' where id = $1 returning id, title, author_id as "authorId"`,
    [postId],
  )
  return rows[0] || null
}

export const deletePostById = async (postId) => {
  const { rows } = await query(
    `delete from posts where id = $1 returning id`,
    [postId],
  )
  return rows[0] || null
}

export const listAllReports = async ({ resolved, limit, offset }) => {
  const where = resolved ? 'where r.resolved_at is not null' : 'where r.resolved_at is null'
  const { rows } = await query(
    `select
       r.id, r.reason, r.detail, r.created_at as "createdAt",
       r.resolved_at as "resolvedAt", r.resolution,
        r.target_type as "targetType",
       p.id as "postId", p.title as "postTitle", p.status as "postStatus",
       c.id as "commentId", c.content as "commentContent",
       reported_user.id as "reportedUserId", reported_user.username as "reportedUsername",
       reporter.id as "reporterId", reporter.username as "reporterUsername",
       author.id as "authorId", author.username as "authorUsername",
       comment_author.id as "commentAuthorId", comment_author.username as "commentAuthorUsername"
     from reports r
     left join posts p on p.id = r.post_id
     left join comments c on c.id = r.comment_id
     left join users reported_user on reported_user.id = r.reported_user_id
     join users reporter on reporter.id = r.reporter_id
     left join users author on author.id = p.author_id
     left join users comment_author on comment_author.id = c.author_id
     ${where}
     order by r.created_at desc
     limit $1 offset $2`,
    [limit, offset],
  )
  return rows
}

export const countAllReports = async (resolved) => {
  const where = resolved === undefined ? '' : (resolved ? 'where resolved_at is not null' : 'where resolved_at is null')
  const { rows } = await query(`select count(*)::int as total from reports ${where}`)
  return rows[0].total
}

export const findReportById = async (reportId) => {
  const { rows } = await query(
    `select
       r.id, r.reason, r.detail, r.resolution,
       r.target_type as "targetType",
       p.id as "postId", p.title as "postTitle",
        c.id as "commentId", c.content as "commentContent",
       c.author_id as "commentAuthorId",
       comment_author.username as "commentAuthorUsername",
       reported_user.id as "reportedUserId", reported_user.username as "reportedUsername",
       reporter.id as "reporterId",
       author.id as "authorId", author.username as "authorUsername"
     from reports r
     left join posts p on p.id = r.post_id
     left join comments c on c.id = r.comment_id
     left join users reported_user on reported_user.id = r.reported_user_id
     join users reporter on reporter.id = r.reporter_id
     left join users author on author.id = p.author_id
     left join users comment_author on comment_author.id = c.author_id
     where r.id = $1`,
    [reportId],
  )
  return rows[0] || null
}

export const resolveReport = async (reportId, adminId, resolution) => {
  const { rows } = await query(
    `update reports set
       resolved_at = now(),
       resolved_by = $2,
       resolution = $3
     where id = $1
     returning id, resolved_at as "resolvedAt", resolution`,
    [reportId, adminId, resolution],
  )
  return rows[0] || null
}

export const listAllComments = async ({ search, limit, offset }) => {
  const conditions = []
  const params = []
  let idx = 1

  if (search) {
    conditions.push(`c.content ilike $${idx}`)
    params.push(`%${search}%`)
    idx++
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''

  const { rows } = await query(
    `select
       c.id, c.content, c.status, c.created_at as "createdAt",
       u.id as "authorId", u.username as "authorUsername",
       p.id as "postId", p.title as "postTitle"
     from comments c
     join users u on u.id = c.author_id
     join posts p on p.id = c.post_id
     ${where}
     order by c.created_at desc
     limit $${idx} offset $${idx + 1}`,
    [...params, limit, offset],
  )
  return rows
}

export const countAllComments = async ({ search }) => {
  const conditions = []
  const params = []
  let idx = 1

  if (search) {
    conditions.push(`content ilike $${idx}`)
    params.push(`%${search}%`)
    idx++
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''

  const { rows } = await query(
    `select count(*)::int as total from comments ${where}`,
    params,
  )
  return rows[0].total
}

export const deleteCommentById = async (commentId) => {
  const { rows } = await query(
    'delete from comments where id = $1 returning id',
    [commentId],
  )
  return rows[0] || null
}

export const banCommentById = async (commentId, adminId) => {
  const { rows } = await query(
    `update comments set status = 'banned', banned_at = now(), banned_by = $2 where id = $1 returning id, author_id as "authorId"`,
    [commentId, adminId],
  )
  return rows[0] || null
}

export const banUserContentById = async (userId) => {
  await query(
    `update posts set status = 'banned' where author_id = $1 and status = 'published'`,
    [userId],
  )
  await query(
    `update comments set status = 'banned', banned_at = now() where author_id = $1 and status = 'active'`,
    [userId],
  )
}

export const banUserById = async (userId) => {
  const { rows } = await query(
    `update users set status = 'banned', updated_at = now() where id = $1 returning id, username`,
    [userId],
  )
  if (rows[0]) {
    await banUserContentById(userId)
  }
  return rows[0] || null
}

export const listAllMedia = async ({ limit, offset }) => {
  const { rows } = await query(
    `select
       ma.id,
       ma.metadata->>'originalFilename' as "fileName",
       ma.size_bytes as "fileSize",
       ma.mime_type as "mimeType",
       ma.public_url as "publicUrl",
       ma.created_at as "createdAt",
       u.id as "ownerId",
       u.username as "ownerUsername"
     from media_assets ma
     left join users u on u.id = ma.owner_id
     where ma.deleted_at is null
     order by ma.created_at desc
     limit $1 offset $2`,
    [limit, offset],
  )
  return rows
}

export const countAllMedia = async () => {
  const { rows } = await query(
    "select count(*)::int as total from media_assets where deleted_at is null",
  )
  return rows[0].total
}

export const sumAllMediaSize = async () => {
  const { rows } = await query(
    "select coalesce(sum(size_bytes), 0)::bigint as total from media_assets where deleted_at is null",
  )
  return rows[0].total
}

export const deleteMediaById = async (mediaId) => {
  const { rows } = await query(
    `update media_assets set deleted_at = now() where id = $1 and deleted_at is null returning id`,
    [mediaId],
  )
  return rows[0] || null
}

export const setUserRoleAsAdmin = async (identifier) => {
  const { rows } = await query(
    `update users set role = 'admin', updated_at = now()
     where (email = $1 or username = $1) and status = 'active'
     returning id, email, username, role, status`,
    [identifier],
  )
  return rows[0] || null
}
