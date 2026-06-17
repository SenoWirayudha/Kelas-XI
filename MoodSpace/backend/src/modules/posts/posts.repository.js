import { query, withTransaction } from '../../db/pool.js'

const followerVisibilitySql = `or (p.visibility = 'unlisted' and exists (
  select 1 from follows f1
  join follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
  where f1.follower_id = $1 and f1.following_id = p.author_id
))`

const postSelect = `
  select
    p.embedding,
    p.id,
    p.author_id as "authorId",
    p.workspace_id as "workspaceId",
    p.published_version_id as "publishedVersionId",
    p.post_type as "postType",
    p.title,
    p.caption,
    p.metadata,
    p.cover_media_id as "coverMediaId",
    p.visibility,
    p.status,
    p.save_count as "saveCount",
    p.like_count as "likeCount",
    p.view_count as "viewCount",
    p.unique_view_count as "uniqueViewCount",
    p.published_at as "publishedAt",
    p.created_at as "createdAt",
    p.updated_at as "updatedAt",
    u.username,
    u.display_name as "displayName",
    up.avatar_media_id as "avatarMediaId",
    cover.public_url as "coverPublicUrl",
    cover.bucket as "coverBucket",
    cover.object_key as "coverObjectKey",
    cover.source_type as "coverSourceType",
    cover.mime_type as "coverMimeType",
    cover.width as "coverWidth",
    cover.height as "coverHeight",
    avatar.public_url as "avatarPublicUrl",
    avatar.bucket as "avatarBucket",
    avatar.object_key as "avatarObjectKey",
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'mediaId', media.id,
        'publicUrl', media.public_url,
        'bucket', media.bucket,
        'objectKey', media.object_key,
        'sourceType', media.source_type,
        'mimeType', media.mime_type,
        'width', media.width,
        'height', media.height,
        'position', pm.position
      ) order by pm.position)
      from post_media pm
      join media_assets media on media.id = pm.media_id and media.deleted_at is null
      where pm.post_id = p.id
    ), '[]'::jsonb) as media,
    exists (
      select 1 from post_saves ps
      where ps.post_id = p.id and ps.user_id = $1
    ) as "isSaved",
    exists (
      select 1 from post_likes pl
      where pl.post_id = p.id and pl.user_id = $1
    ) as "isLiked"
  from posts p
  join users u on u.id = p.author_id
  left join user_profiles up on up.user_id = u.id
  left join media_assets cover on cover.id = p.cover_media_id
  left join media_assets avatar on avatar.id = up.avatar_media_id
`

export const findPostById = async ({ postId, viewerId = null }) => {
  const { rows } = await query(
    `${postSelect}
     where p.id = $2
       and u.status = 'active'
       and (
         p.status = 'published'
         or (p.status = 'draft' and p.author_id = $1)
       )
     limit 1`,
    [viewerId, postId],
  )
  return rows[0] || null
}

export const recordPostView = async ({ postId, viewerId }) => withTransaction(async (client) => {
  if (!viewerId) return { counted: false, unique: false }

  const postResult = await client.query(
    `select id, author_id as "authorId", visibility
     from posts p
     where p.id = $1
       and p.status = 'published'
       and (p.visibility = 'public' or (p.visibility = 'unlisted' and exists (
         select 1 from follows f1
         join follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
         where f1.follower_id = $2 and f1.following_id = p.author_id
       )))
     limit 1`,
    [postId, viewerId],
  )
  const post = postResult.rows[0]
  if (!post || post.authorId === viewerId) return { counted: false, unique: false }

  const recentResult = await client.query(
    `select id
     from post_views
     where post_id = $1
       and viewer_id = $2
       and viewed_at > now() - interval '30 minutes'
     limit 1`,
    [postId, viewerId],
  )
  if (recentResult.rows[0]) return { counted: false, unique: false }

  const firstViewResult = await client.query(
    `select id
     from post_views
     where post_id = $1
       and viewer_id = $2
     limit 1`,
    [postId, viewerId],
  )
  const isUnique = !firstViewResult.rows[0]

  await client.query(
    `insert into post_views (post_id, viewer_id)
     values ($1, $2)`,
    [postId, viewerId],
  )
  await client.query(
    `update posts
     set view_count = view_count + 1,
         unique_view_count = unique_view_count + $2,
         updated_at = now()
     where id = $1`,
    [postId, isUnique ? 1 : 0],
  )

  return { counted: true, unique: isUnique }
})

export const publishWorkspacePost = async ({
  ownerId,
  workspaceId,
  snapshot,
  snapshotHash,
  title,
  caption,
  visibility,
  coverMediaId,
  metadata = {},
}) => withTransaction(async (client) => {
  const workspaceResult = await client.query(
    `select
       id,
       title,
       owner_id as "ownerId",
       thumbnail_media_id as "thumbnailMediaId"
     from workspaces
     where id = $1 and owner_id = $2 and deleted_at is null
     for update`,
    [workspaceId, ownerId],
  )
  const workspace = workspaceResult.rows[0]
  if (!workspace) return null

  const latestResult = await client.query(
    `select version_no as "versionNo"
     from workspace_versions
     where workspace_id = $1
     order by version_no desc
     limit 1`,
    [workspaceId],
  )
  const nextVersionNo = (latestResult.rows[0]?.versionNo || 0) + 1

  const versionResult = await client.query(
    `insert into workspace_versions (workspace_id, version_no, save_type, snapshot, snapshot_hash, created_by)
     values ($1, $2, 'publish', $3::jsonb, $4, $5)
     returning id, version_no as "versionNo", created_at as "createdAt"`,
    [workspaceId, nextVersionNo, JSON.stringify(snapshot), snapshotHash, ownerId],
  )
  const version = versionResult.rows[0]
  const resolvedCoverMediaId = coverMediaId || workspace.thumbnailMediaId || null

  const postResult = await client.query(
    `insert into posts (
       author_id, workspace_id, published_version_id, post_type,
       title, caption, metadata, cover_media_id, visibility, status, published_at
     )
     values ($1, $2, $3, 'workspace', $4, $5, $6::jsonb, $7, $8, 'published', now())
     returning id`,
    [
      ownerId,
      workspaceId,
      version.id,
      title || workspace.title,
      caption || null,
      JSON.stringify(metadata),
      resolvedCoverMediaId,
      visibility,
    ],
  )
  const postId = postResult.rows[0].id

  if (resolvedCoverMediaId) {
    await client.query(
      `insert into post_media (post_id, media_id, position)
       values ($1, $2, 0)
       on conflict do nothing`,
      [postId, resolvedCoverMediaId],
    )
  }

  await client.query(
    `update workspaces
     set status = 'published',
         visibility = $3,
         published_version_id = $2,
         thumbnail_media_id = coalesce($4, thumbnail_media_id),
         published_at = now(),
         updated_at = now()
     where id = $1`,
    [workspaceId, version.id, visibility, resolvedCoverMediaId],
  )

  await client.query(
    `insert into workspace_activity (workspace_id, user_id, activity_type, version_id, metadata)
     values ($1, $2, 'published', $3, $4::jsonb)`,
    [workspaceId, ownerId, version.id, JSON.stringify({ postId })],
  )

  return { postId, version }
})

export const createMediaPost = async ({ ownerId, title, caption, visibility, mediaIds, metadata = {} }) => withTransaction(async (client) => {
  const postResult = await client.query(
    `insert into posts (
       author_id, post_type, title, caption, metadata, cover_media_id, visibility, status, published_at
     )
     values ($1, 'media', $2, $3, $4::jsonb, $5, $6, 'published', now())
     returning id`,
    [ownerId, title, caption || null, JSON.stringify(metadata), mediaIds[0], visibility],
  )
  const postId = postResult.rows[0].id

  for (const [position, mediaId] of mediaIds.entries()) {
    await client.query(
      `insert into post_media (post_id, media_id, position)
       values ($1, $2, $3)`,
      [postId, mediaId, position],
    )
  }

  return { postId }
})

export const createMediaPostDraft = async ({ ownerId, title, caption, visibility, mediaIds, metadata = {} }) => withTransaction(async (client) => {
  const postResult = await client.query(
    `insert into posts (
       author_id, post_type, title, caption, metadata, cover_media_id, visibility, status, published_at
     )
     values ($1, 'media', $2, $3, $4::jsonb, $5, $6, 'draft', now())
     returning id`,
    [ownerId, title || null, caption || null, JSON.stringify(metadata), mediaIds[0] || null, visibility],
  )
  const postId = postResult.rows[0].id

  for (const [position, mediaId] of mediaIds.entries()) {
    await client.query(
      `insert into post_media (post_id, media_id, position)
       values ($1, $2, $3)`,
      [postId, mediaId, position],
    )
  }

  return { postId }
})

export const updateMediaPostDraft = async ({ ownerId, postId, title, caption, visibility, mediaIds, metadata = {} }) => withTransaction(async (client) => {
  const postResult = await client.query(
    `update posts
     set title = $3,
         caption = $4,
         metadata = $5::jsonb,
         cover_media_id = $6,
         visibility = $7,
         updated_at = now()
     where id = $1
       and author_id = $2
       and post_type = 'media'
       and status = 'draft'
     returning id`,
    [postId, ownerId, title || null, caption || null, JSON.stringify(metadata), mediaIds[0] || null, visibility],
  )
  if (!postResult.rows[0]) return null

  await client.query('delete from post_media where post_id = $1', [postId])
  for (const [position, mediaId] of mediaIds.entries()) {
    await client.query(
      `insert into post_media (post_id, media_id, position)
       values ($1, $2, $3)`,
      [postId, mediaId, position],
    )
  }

  return { postId }
})

export const publishMediaPostDraft = async ({ ownerId, postId }) => {
  const { rows } = await query(
    `update posts
     set status = 'published',
         published_at = now(),
         updated_at = now()
     where id = $1
       and author_id = $2
       and post_type = 'media'
       and status = 'draft'
     returning id`,
    [postId, ownerId],
  )
  return rows[0] || null
}

export const getMediaTagSources = async ({ ownerId, mediaIds = [] }) => {
  if (!mediaIds.length) return []
  const { rows } = await query(
    `select
       m.id,
       m.metadata,
       ua.title,
       ua.description
     from media_assets m
     left join uploaded_assets ua on ua.media_id = m.id and ua.user_id = $1
     where m.owner_id = $1
       and m.id = any($2::uuid[])
       and m.deleted_at is null`,
    [ownerId, mediaIds],
  )
  return rows
}

export const getHomeFeed = async ({ viewerId = null, cursor = null, limit = 20, mode = 'for-you', seed = '', recentInterestTags = [], snapshot = null }) => {
  if (mode === 'recent') {
    const values = [viewerId, limit + 1]
    let cursorClause = ''
    let snapshotClause = ''
    if (cursor) {
      values.push(cursor.publishedAt, cursor.id)
      cursorClause = `and (p.published_at, p.id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`
    }
    if (snapshot) {
      values.push(snapshot)
      snapshotClause = `and p.published_at <= $${values.length}::timestamptz`
    }

    const { rows } = await query(
      `${postSelect}
       where p.status = 'published'
         and (p.visibility = 'public' ${followerVisibilitySql})
         and u.status = 'active'
         ${cursorClause}
         ${snapshotClause}
       order by p.published_at desc, p.id desc
       limit $2`,
      values,
    )
    return rows
  }

  const values = [viewerId, limit + 1, seed || new Date().toISOString().slice(0, 10), recentInterestTags]
  let cursorClause = ''
  let snapshotClause = ''
  if (cursor?.score !== undefined && cursor?.score !== null) {
    values.push(Number(cursor.score), cursor.publishedAt, cursor.id)
    cursorClause = `and (scored.score, scored."publishedAt", scored.id) < ($${values.length - 2}::float, $${values.length - 1}::timestamptz, $${values.length}::uuid)`
  } else if (cursor) {
    values.push(cursor.publishedAt, cursor.id)
    cursorClause = `and (scored."publishedAt", scored.id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`
  }
  if (snapshot) {
    values.push(snapshot)
    snapshotClause = `and scored."publishedAt" <= $${values.length}::timestamptz`
  }

  const { rows } = await query(
    `with viewer_tags as (
       select distinct
         lower(tag_value.tag) as tag,
         regexp_replace(lower(tag_value.tag), '[^a-z0-9]+', '', 'g') as tag_key
       from (
         select liked_post.metadata
         from post_likes pl
         join posts liked_post on liked_post.id = pl.post_id
         where pl.user_id = $1
         union all
         select saved_post.metadata
         from post_saves ps
         join posts saved_post on saved_post.id = ps.post_id
         where ps.user_id = $1
         union all
         select viewed_post.metadata
         from post_views pv
         join posts viewed_post on viewed_post.id = pv.post_id
         where pv.viewer_id = $1
           and pv.viewed_at > now() - interval '60 days'
       ) viewer_posts
       cross join lateral jsonb_array_elements_text(coalesce(viewer_posts.metadata->'tags', '[]'::jsonb)) tag_value(tag)
     ),
     recent_tags as (
       select
         lower(tag_value.tag) as tag,
         regexp_replace(lower(tag_value.tag), '[^a-z0-9]+', '', 'g') as tag_key
       from unnest($4::text[]) tag_value(tag)
     ),
     scored as (
       select base_posts.*,
         (
           ${mode === 'popular'
             ? `0.14 * greatest(0, 1 - (extract(epoch from (now() - base_posts."publishedAt")) / extract(epoch from interval '90 days')))
           + 0.78 * least(1, (ln(1 + base_posts."likeCount" * 2 + base_posts."saveCount" * 3 + base_posts."viewCount" * 0.15) / 6))
           + 0.04 * case when base_posts."authorId" = $1 then 0 else 1 end
           + 0.04 * ((hashtext(base_posts.id::text || ':' || $3::text)::bigint + 2147483648)::float / 4294967295)`
             : `0.33 * greatest(0, 1 - (extract(epoch from (now() - base_posts."publishedAt")) / extract(epoch from interval '60 days')))
           + 0.25 * least(1, (ln(1 + base_posts."likeCount" * 2 + base_posts."saveCount" * 3 + base_posts."viewCount" * 0.15) / 6))
           + 0.14 * case
             when $1::uuid is null then 0
             else least(1, coalesce((
               select count(*)::float
               from jsonb_array_elements_text(coalesce(base_posts.metadata->'tags', '[]'::jsonb)) post_tag(tag)
               join viewer_tags vt
                 on vt.tag = lower(post_tag.tag)
                 or vt.tag_key = regexp_replace(lower(post_tag.tag), '[^a-z0-9]+', '', 'g')
             ), 0) / greatest(1, coalesce(jsonb_array_length(base_posts.metadata->'tags'), 0)))
           end
           + 0.18 * least(1, coalesce((
             select count(*)::float
             from jsonb_array_elements_text(coalesce(base_posts.metadata->'tags', '[]'::jsonb)) post_tag(tag)
             join recent_tags rt
               on rt.tag = lower(post_tag.tag)
                 or rt.tag_key = regexp_replace(lower(post_tag.tag), '[^a-z0-9]+', '', 'g')
           ), 0) / greatest(1, coalesce(jsonb_array_length(base_posts.metadata->'tags'), 0)))
           + 0.06 * case when base_posts."authorId" = $1 then 0 else 1 end
           + 0.04 * ((hashtext(base_posts.id::text || ':' || $3::text)::bigint + 2147483648)::float / 4294967295)`}
         )::float as score
       from (
           ${postSelect}
           where p.status = 'published'
             and (p.visibility = 'public' ${followerVisibilitySql})
             and u.status = 'active'
         ) base_posts
     )
     select *
     from scored
     where true
       ${cursorClause}
       ${snapshotClause}
     order by scored.score desc, scored."publishedAt" desc, scored.id desc
     limit $2`,
    values,
  )
  return rows
}

export const getPostsByUsername = async ({ viewerId = null, username, cursor = null, limit = 20 }) => {
  const values = [viewerId, username, limit + 1]
  let cursorClause = ''
  if (cursor) {
    values.push(cursor.publishedAt, cursor.id)
    cursorClause = `and (p.published_at, p.id) < ($4::timestamptz, $5::uuid)`
  }

  const { rows } = await query(
    `${postSelect}
     where lower(u.username) = lower($2)
       and u.status = 'active'
       and (
         (p.status = 'published' and (p.visibility = 'public' or p.author_id = $1 ${followerVisibilitySql}))
         or (p.status = 'draft' and p.author_id = $1)
       )
       ${cursorClause}
     order by p.published_at desc, p.id desc
     limit $3`,
    values,
  )
  return rows
}

export const getSavedPosts = async ({ viewerId, cursor = null, limit = 20 }) => {
  const values = [viewerId, limit + 1]
  let cursorClause = ''
  if (cursor) {
    values.push(cursor.publishedAt, cursor.id)
    cursorClause = `and (p.published_at, p.id) < ($3::timestamptz, $4::uuid)`
  }

  const { rows } = await query(
    `${postSelect}
     join post_saves viewer_save on viewer_save.post_id = p.id and viewer_save.user_id = $1
      where p.status = 'published'
        and u.status = 'active'
        and (p.visibility = 'public' or p.author_id = $1 ${followerVisibilitySql})
       ${cursorClause}
     order by p.published_at desc, p.id desc
     limit $2`,
    values,
  )
  return rows
}

export const getRecommendedPosts = async ({ viewerId = null, postId, limit = 6, offset = 0 }) => {
  const { rows } = await query(
    `with current_post as (
       select id, author_id, title, caption, metadata
       from posts
       where id = $2
       limit 1
     ),
     current_tags as (
       select
         lower(tag_value.tag) as tag,
         regexp_replace(lower(tag_value.tag), '[^a-z0-9]+', '', 'g') as tag_key
       from current_post cp
       cross join lateral jsonb_array_elements_text(coalesce(cp.metadata->'tags', '[]'::jsonb)) tag_value(tag)
     ),
     candidate_scores as (
       select base_posts.*,
         (
           0.40 * least(1, coalesce((
             select count(*)::float
             from jsonb_array_elements_text(coalesce(base_posts.metadata->'tags', '[]'::jsonb)) candidate_tag(tag)
             join current_tags ct
               on ct.tag = lower(candidate_tag.tag)
               or ct.tag_key = regexp_replace(lower(candidate_tag.tag), '[^a-z0-9]+', '', 'g')
           ), 0) / greatest(1, (select count(*) from current_tags)))
           + 0.18 * case
             when trim(coalesce((select title from current_post), '') || ' ' || coalesce((select caption from current_post), '')) = '' then 0
             else ts_rank_cd(
               setweight(to_tsvector('simple', coalesce(base_posts.title, '')), 'A') ||
               setweight(to_tsvector('simple', coalesce(base_posts.caption, '')), 'B'),
               plainto_tsquery('simple', coalesce((select title from current_post), '') || ' ' || coalesce((select caption from current_post), ''))
             )
           end
           + 0.18 * least(1, coalesce((
             select count(*)::float
             from (
               select ps2.post_id
               from post_saves ps1
               join post_saves ps2 on ps2.user_id = ps1.user_id and ps2.post_id = base_posts.id
               where ps1.post_id = $2
               union all
               select pl2.post_id
               from post_likes pl1
               join post_likes pl2 on pl2.user_id = pl1.user_id and pl2.post_id = base_posts.id
               where pl1.post_id = $2
             ) collaborative
           ), 0) / 5)
           + 0.16 * least(1, (ln(1 + base_posts."likeCount" * 2 + base_posts."saveCount" * 3 + base_posts."viewCount" * 0.15) / 6))
           + 0.08 * greatest(0, 1 - (extract(epoch from (now() - base_posts."publishedAt")) / extract(epoch from interval '60 days')))
         )::float as related_score
       from (
          ${postSelect}
           where p.id != $2
             and p.status = 'published'
             and (p.visibility = 'public' ${followerVisibilitySql})
             and u.status = 'active'
        ) base_posts
      ),
     diversified as (
       select *,
         row_number() over (partition by "authorId" order by related_score desc, "publishedAt" desc) as author_rank
       from candidate_scores
     )
     select *
     from diversified
      where author_rank <= 4
         or related_score >= 0.34
     order by related_score desc, "publishedAt" desc, id desc
     limit $3
     offset $4`,
    [viewerId, postId, limit, offset],
  )
  return rows
}

const addParam = (values, value) => {
  values.push(value)
  return values.length
}

export const searchPosts = async ({ viewerId = null, q = '', ftsQuery = '', synonymTags = [], tags = [], sort = 'relevance', limit = 30, offset = 0 }) => {
  const values = [viewerId, limit, offset]
  const where = [
    `p.status = 'published'`,
    `(p.visibility = 'public' or (p.visibility = 'unlisted' and exists (
       select 1 from follows f1
       join follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
       where f1.follower_id = $1 and f1.following_id = p.author_id
    )))`,
    `u.status = 'active'`,
  ]
  const searchTerm = q.trim()
  let qIndex = null
  let ftsIndex = null
  let synIndex = null

  if (synonymTags.length) {
    synIndex = addParam(values, synonymTags)
  }

  if (ftsQuery) {
    ftsIndex = addParam(values, ftsQuery)
  }

  if (searchTerm) {
    qIndex = addParam(values, searchTerm)
    where.push(`(
      ${ftsIndex ? `p.search_vector @@ to_tsquery('simple', $${ftsIndex})` : '1=0'}
      or lower(coalesce(p.title, '')) like '%' || lower($${qIndex}) || '%'
      or lower(coalesce(p.caption, '')) like '%' || lower($${qIndex}) || '%'
      or exists (
        select 1
        from jsonb_array_elements_text(coalesce(p.metadata->'tags', '[]'::jsonb)) search_tag(tag)
        where lower(search_tag.tag) like '%' || lower($${qIndex}) || '%'
           or regexp_replace(lower(search_tag.tag), '[^a-z0-9]+', '', 'g') like '%' || regexp_replace(lower($${qIndex}), '[^a-z0-9]+', '', 'g') || '%'
           ${synIndex ? `or lower(search_tag.tag) = any($${synIndex}::text[])` : ''}
      )
      or exists (
        select 1
        from post_media pm
        join media_assets ma on ma.id = pm.media_id and ma.deleted_at is null
        left join uploaded_assets ua on ua.media_id = ma.id
        where pm.post_id = p.id
          and (
            lower(coalesce(ma.metadata->>'originalFilename', '')) like '%' || lower($${qIndex}) || '%'
            or lower(coalesce(ua.title, '')) like '%' || lower($${qIndex}) || '%'
            or lower(coalesce(ua.description, '')) like '%' || lower($${qIndex}) || '%'
          )
      )
    )`)
  }

  if (tags.length > 0) {
    values.push(tags.map((tag) => tag.toLowerCase()))
    const tagIndex = values.length
    values.push(tags.map((tag) => tag.toLowerCase().replace(/[^a-z0-9]+/g, '')))
    const compactTagIndex = values.length
    where.push(`exists (
      select 1
      from jsonb_array_elements_text(coalesce(p.metadata->'tags', '[]'::jsonb)) filter_tag(tag)
      where lower(filter_tag.tag) = any($${tagIndex}::text[])
         or regexp_replace(lower(filter_tag.tag), '[^a-z0-9]+', '', 'g') = any($${compactTagIndex}::text[])
    )`)
  }

  const orderBy = sort === 'recent'
    ? `p.published_at desc, p.id desc`
    : sort === 'popular'
      ? `p.like_count desc, p.save_count desc, p.view_count desc, p.published_at desc, p.id desc`
      : ftsIndex
        ? `(
             ts_rank_cd(p.search_vector, to_tsquery('simple', $${ftsIndex})) * 8
             + case when lower(coalesce(p.title, '')) like '%' || lower($${qIndex}) || '%' then 5 else 0 end
             + case when lower(coalesce(p.caption, '')) like '%' || lower($${qIndex}) || '%' then 3 else 0 end
             + case when exists (
                 select 1
                 from jsonb_array_elements_text(coalesce(p.metadata->'tags', '[]'::jsonb)) rank_tag(tag)
                 where lower(rank_tag.tag) = lower($${qIndex})
                    or regexp_replace(lower(rank_tag.tag), '[^a-z0-9]+', '', 'g') = regexp_replace(lower($${qIndex}), '[^a-z0-9]+', '', 'g')
                    ${synIndex ? `or lower(rank_tag.tag) = any($${synIndex}::text[])` : ''}
               ) then 4 else 0 end
             + case when exists (
                 select 1
                 from jsonb_array_elements_text(coalesce(p.metadata->'tags', '[]'::jsonb)) rank_tag(tag)
                 where lower(rank_tag.tag) like '%' || lower($${qIndex}) || '%'
                    or regexp_replace(lower(rank_tag.tag), '[^a-z0-9]+', '', 'g') like '%' || regexp_replace(lower($${qIndex}), '[^a-z0-9]+', '', 'g') || '%'
                    ${synIndex ? `or lower(rank_tag.tag) = any($${synIndex}::text[])` : ''}
               ) then 2 else 0 end
             + case when exists (
                 select 1
                 from post_media pm
                 join media_assets ma on ma.id = pm.media_id and ma.deleted_at is null
                 left join uploaded_assets ua on ua.media_id = ma.id
                 where pm.post_id = p.id
                   and (
                     lower(coalesce(ma.metadata->>'originalFilename', '')) like '%' || lower($${qIndex}) || '%'
                     or lower(coalesce(ua.title, '')) like '%' || lower($${qIndex}) || '%'
                     or lower(coalesce(ua.description, '')) like '%' || lower($${qIndex}) || '%'
                   )
               ) then 2 else 0 end
           ) desc,
           p.like_count desc,
           p.save_count desc,
           p.published_at desc,
           p.id desc`
        : qIndex
          ? `(
               ts_rank_cd(p.search_vector, plainto_tsquery('simple', $${qIndex})) * 8
               + case when lower(coalesce(p.title, '')) like '%' || lower($${qIndex}) || '%' then 5 else 0 end
               + case when lower(coalesce(p.caption, '')) like '%' || lower($${qIndex}) || '%' then 3 else 0 end
               + case when exists (
                   select 1
                   from jsonb_array_elements_text(coalesce(p.metadata->'tags', '[]'::jsonb)) rank_tag(tag)
                   where lower(rank_tag.tag) = lower($${qIndex})
                      or regexp_replace(lower(rank_tag.tag), '[^a-z0-9]+', '', 'g') = regexp_replace(lower($${qIndex}), '[^a-z0-9]+', '', 'g')
                 ) then 4 else 0 end
               + case when exists (
                   select 1
                   from jsonb_array_elements_text(coalesce(p.metadata->'tags', '[]'::jsonb)) rank_tag(tag)
                   where lower(rank_tag.tag) like '%' || lower($${qIndex}) || '%'
                      or regexp_replace(lower(rank_tag.tag), '[^a-z0-9]+', '', 'g') like '%' || regexp_replace(lower($${qIndex}), '[^a-z0-9]+', '', 'g') || '%'
                 ) then 2 else 0 end
               + case when exists (
                   select 1
                   from post_media pm
                   join media_assets ma on ma.id = pm.media_id and ma.deleted_at is null
                   left join uploaded_assets ua on ua.media_id = ma.id
                   where pm.post_id = p.id
                     and (
                       lower(coalesce(ma.metadata->>'originalFilename', '')) like '%' || lower($${qIndex}) || '%'
                       or lower(coalesce(ua.title, '')) like '%' || lower($${qIndex}) || '%'
                       or lower(coalesce(ua.description, '')) like '%' || lower($${qIndex}) || '%'
                     )
                 ) then 2 else 0 end
             ) desc,
             p.like_count desc,
             p.save_count desc,
             p.published_at desc,
             p.id desc`
          : `p.like_count desc, p.save_count desc, p.published_at desc, p.id desc`

  const { rows } = await query(
    `${postSelect}
     where ${where.join('\n       and ')}
     order by ${orderBy}
     limit $2
     offset $3`,
    values,
  )
  return rows
}

export const getSearchSuggestions = async ({ q = '', expandedQuery = '', limit = 8 }) => {
  const searchTerm = q.trim().toLowerCase()
  const expanded = expandedQuery || searchTerm
  const expandedPattern = expanded.split(/\s+/).filter(Boolean).map((term) => term.replace(/[^a-z0-9]+/g, '')).filter(Boolean).join('|')
  const values = [searchTerm, expandedPattern, limit]
  const { rows } = await query(
    `with tag_matches as (
       select distinct lower(tag_value.tag) as value, 'tag' as type
       from posts p
       cross join lateral jsonb_array_elements_text(coalesce(p.metadata->'tags', '[]'::jsonb)) tag_value(tag)
       where p.status = 'published'
         and p.visibility = 'public'
         and (
           $1 = ''
           or lower(tag_value.tag) like '%' || $1 || '%'
           or regexp_replace(lower(tag_value.tag), '[^a-z0-9]+', '', 'g') ~ $2
         )
       limit $3
     ),
     title_matches as (
       select distinct p.title as value, 'post' as type
       from posts p
       where p.status = 'published'
         and p.visibility = 'public'
         and p.title is not null
         and trim(p.title) <> ''
         and ($1 = '' or lower(p.title) like '%' || $1 || '%' or lower(p.title) ~ $2)
       order by p.title asc
       limit $3
     ),
     media_matches as (
       select distinct coalesce(nullif(trim(ua.title), ''), nullif(trim(ma.metadata->>'originalFilename'), '')) as value, 'media' as type
       from posts p
       join post_media pm on pm.post_id = p.id
       join media_assets ma on ma.id = pm.media_id and ma.deleted_at is null
       left join uploaded_assets ua on ua.media_id = ma.id
       where p.status = 'published'
         and p.visibility = 'public'
         and coalesce(nullif(trim(ua.title), ''), nullif(trim(ma.metadata->>'originalFilename'), '')) is not null
         and (
           $1 = ''
           or lower(coalesce(ua.title, '')) like '%' || $1 || '%'
           or lower(coalesce(ma.metadata->>'originalFilename', '')) like '%' || $1 || '%'
           or coalesce(nullif(trim(ua.title), ''), nullif(trim(ma.metadata->>'originalFilename'), '')) ~* $2
         )
       limit $3
     )
     select value, type
     from (
       select * from tag_matches
       union all
       select * from title_matches
       union all
       select * from media_matches
     ) suggestions
     where value is not null and trim(value) <> ''
     limit $3`,
    values,
  )
  return rows
}

export const savePost = async ({ userId, postId }) => withTransaction(async (client) => {
  const postResult = await client.query(
    `select id, author_id as "authorId", title
     from posts
     where id = $1
       and status = 'published'
       and (visibility = 'public' or author_id = $2 or (visibility = 'unlisted' and exists (
         select 1 from follows f1
         join follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
         where f1.follower_id = $2 and f1.following_id = posts.author_id
       )))
     limit 1`,
    [postId, userId],
  )
  const post = postResult.rows[0]
  if (!post) return null

  const saveResult = await client.query(
    `insert into post_saves (user_id, post_id)
     values ($1, $2)
     on conflict do nothing
     returning post_id as "postId"`,
    [userId, postId],
  )
  const inserted = !!saveResult.rows[0]

  if (inserted) {
    await client.query(
      `update posts set save_count = save_count + 1, updated_at = now() where id = $1`,
      [postId],
    )
    if (post.authorId !== userId) {
      await client.query(
        `insert into notifications (user_id, actor_id, type, target_type, target_id, metadata)
         values ($1, $2, 'save', 'post', $3, $4::jsonb)`,
        [post.authorId, userId, postId, JSON.stringify({ postTitle: post.title })],
      )
    }
  }

  return { inserted }
})

export const likePost = async ({ userId, postId }) => withTransaction(async (client) => {
  const postResult = await client.query(
    `select id, author_id as "authorId", title
     from posts
     where id = $1
       and status = 'published'
       and (visibility = 'public' or author_id = $2 or (visibility = 'unlisted' and exists (
         select 1 from follows f1
         join follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
         where f1.follower_id = $2 and f1.following_id = posts.author_id
       )))
     limit 1`,
    [postId, userId],
  )
  const post = postResult.rows[0]
  if (!post) return null

  const likeResult = await client.query(
    `insert into post_likes (user_id, post_id)
     values ($1, $2)
     on conflict do nothing
     returning post_id as "postId"`,
    [userId, postId],
  )
  const inserted = !!likeResult.rows[0]

  if (inserted) {
    await client.query(
      `update posts set like_count = like_count + 1, updated_at = now() where id = $1`,
      [postId],
    )
    if (post.authorId !== userId) {
      await client.query(
        `insert into notifications (user_id, actor_id, type, target_type, target_id, metadata)
         values ($1, $2, 'like', 'post', $3, $4::jsonb)`,
        [post.authorId, userId, postId, JSON.stringify({ postTitle: post.title })],
      )
    }
  }

  return { inserted }
})

export const updatePostRecord = async ({ ownerId, postId, title, caption, visibility, mediaIds, metadata }) => withTransaction(async (client) => {
  const sets = []
  const values = [postId, ownerId]
  let idx = 3

  const push = (field, value) => {
    sets.push(`${field} = $${idx++}`)
    values.push(value)
  }

  if (title !== undefined) push('title', title)
  if (caption !== undefined) push('caption', caption)
  if (visibility !== undefined) push('visibility', visibility)
  if (metadata !== undefined) push('metadata', JSON.stringify(metadata))

  push('updated_at', new Date().toISOString())

  const postResult = await client.query(
    `update posts set ${sets.join(', ')} where id = $1 and author_id = $2 returning id`,
    values,
  )
  if (!postResult.rows[0]) return null

  if (mediaIds) {
    await client.query('delete from post_media where post_id = $1', [postId])
    for (const [position, mediaId] of mediaIds.entries()) {
      await client.query(
        `insert into post_media (post_id, media_id, position) values ($1, $2, $3)`,
        [postId, mediaId, position],
      )
    }
    await client.query(
      `update posts set cover_media_id = $2 where id = $1`,
      [postId, mediaIds[0]],
    )
  }

  return { postId }
})

export const updatePostEmbedding = async ({ postId, embedding }) => {
  const { rows } = await query(
    `update posts
     set embedding = $2::jsonb, updated_at = now()
     where id = $1
     returning id`,
    [postId, JSON.stringify(embedding)],
  )
  return rows[0] || null
}

export const getPostsWithoutEmbedding = async ({ limit = 50 }) => {
  const { rows } = await query(
    `select p.id, m.public_url
     from posts p
     join media_assets m on m.id = p.cover_media_id
     where p.embedding is null
       and m.public_url is not null
       and p.status = 'published'
     order by p.published_at desc
     limit $1`,
    [limit],
  )
  return rows
}

export const getPostsByEmbeddingSimilarity = async ({ viewerId = null, limit = 50 }) => {
  const { rows } = await query(
    `select
       p.id,
       p.author_id as "authorId",
       p.workspace_id as "workspaceId",
       p.published_version_id as "publishedVersionId",
       p.post_type as "postType",
       p.title,
       p.caption,
       p.metadata,
       p.cover_media_id as "coverMediaId",
       p.visibility,
       p.status,
       p.save_count as "saveCount",
       p.like_count as "likeCount",
       p.view_count as "viewCount",
       p.unique_view_count as "uniqueViewCount",
       p.published_at as "publishedAt",
       p.created_at as "createdAt",
       p.updated_at as "updatedAt",
       p.embedding,
       u.username,
       u.display_name as "displayName",
       up.avatar_media_id as "avatarMediaId",
       cover.public_url as "coverPublicUrl",
       cover.bucket as "coverBucket",
       cover.object_key as "coverObjectKey",
       cover.source_type as "coverSourceType",
       cover.mime_type as "coverMimeType",
       cover.width as "coverWidth",
       cover.height as "coverHeight",
       avatar.public_url as "avatarPublicUrl",
       avatar.bucket as "avatarBucket",
       avatar.object_key as "avatarObjectKey",
       coalesce((
         select jsonb_agg(jsonb_build_object(
           'mediaId', media.id,
           'publicUrl', media.public_url,
           'bucket', media.bucket,
           'objectKey', media.object_key,
           'sourceType', media.source_type,
           'mimeType', media.mime_type,
           'width', media.width,
           'height', media.height,
           'position', pm.position
         ) order by pm.position)
         from post_media pm
         join media_assets media on media.id = pm.media_id and media.deleted_at is null
         where pm.post_id = p.id
       ), '[]'::jsonb) as media,
       exists (
         select 1 from post_saves ps
         where ps.post_id = p.id and ps.user_id = $1
       ) as "isSaved",
       exists (
         select 1 from post_likes pl
         where pl.post_id = p.id and pl.user_id = $1
       ) as "isLiked"
     from posts p
     join users u on u.id = p.author_id
     left join user_profiles up on up.user_id = u.id
     left join media_assets cover on cover.id = p.cover_media_id
     left join media_assets avatar on avatar.id = up.avatar_media_id
     where p.status = 'published'
       and (p.visibility = 'public' ${followerVisibilitySql})
       and u.status = 'active'
       and p.embedding is not null
     order by p.published_at desc
     limit $2`,
    [viewerId, limit],
  )
  return rows
}

export const deletePostRecord = async ({ postId, ownerId }) => {
  const { rows } = await query(
    `delete from posts where id = $1 and author_id = $2 returning id`,
    [postId, ownerId],
  )
  return rows[0] || null
}

export const unsavePost = async ({ userId, postId }) => withTransaction(async (client) => {
  const deleteResult = await client.query(
    `delete from post_saves
     where user_id = $1 and post_id = $2
     returning post_id`,
    [userId, postId],
  )
  const deleted = !!deleteResult.rows[0]

  if (deleted) {
    await client.query(
      `update posts
       set save_count = greatest(save_count - 1, 0),
           updated_at = now()
       where id = $1`,
      [postId],
    )
  }

  return { deleted }
})

export const unlikePost = async ({ userId, postId }) => withTransaction(async (client) => {
  const deleteResult = await client.query(
    `delete from post_likes
     where user_id = $1 and post_id = $2
     returning post_id`,
    [userId, postId],
  )
  const deleted = !!deleteResult.rows[0]

  if (deleted) {
    await client.query(
      `update posts
       set like_count = greatest(like_count - 1, 0),
           updated_at = now()
       where id = $1`,
      [postId],
    )
  }

  return { deleted }
})
