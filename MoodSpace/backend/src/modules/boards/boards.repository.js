import { query } from '../../db/pool.js'

const boardSelect = `
  select
    b.id,
    b.owner_id as "ownerId",
    b.name,
    b.description,
    b.categories,
    b.visibility,
    b.created_at as "createdAt",
    b.updated_at as "updatedAt",
    coalesce((
      select count(*)::int
      from board_items ci
      left join posts cp on cp.id = ci.post_id
      where ci.board_id = b.id
        and (cp.status is null or cp.status != 'banned')
    ), 0) as "itemCount",
    coalesce((
      select jsonb_agg(cover.url)
      from (
        select coalesce(post_media.public_url, direct_media.public_url, external_image.thumbnail_url, external_image.url) as url
        from board_items cover_item
        left join posts cover_post on cover_post.id = cover_item.post_id
        left join media_assets post_media on post_media.id = cover_post.cover_media_id and post_media.deleted_at is null
        left join media_assets direct_media on direct_media.id = cover_item.media_asset_id and direct_media.deleted_at is null
        left join external_images external_image on external_image.id = cover_item.external_image_id
        where cover_item.board_id = b.id
          and (cover_post.status is null or cover_post.status != 'banned')
        order by cover_item.created_at desc
        limit 4
      ) cover
      where cover.url is not null
    ), '[]'::jsonb) as "coverImages"
  from boards b
`

export const listPublicBoardsByUsername = async (username) => {
  const { rows } = await query(
    `${boardSelect}
     join users u on u.id = b.owner_id
     where u.username = $1
       and b.visibility = 'public'
     order by b.updated_at desc`,
    [username],
  )
  return rows
}

export const listBoardsByOwner = async (ownerId) => {
  const { rows } = await query(
    `${boardSelect}
     where b.owner_id = $1
     order by b.updated_at desc`,
    [ownerId],
  )
  return rows
}

export const findPublicBoardById = async (boardId) => {
  const { rows } = await query(
    `${boardSelect}
     where b.id = $1 and b.visibility = 'public'
     limit 1`,
    [boardId],
  )
  return rows[0] || null
}

export const findBoardById = async ({ boardId, ownerId }) => {
  const { rows } = await query(
    `${boardSelect}
     where b.id = $1 and b.owner_id = $2
     limit 1`,
    [boardId, ownerId],
  )
  return rows[0] || null
}

export const createBoard = async ({ ownerId, name, description, categories, visibility }) => {
  const { rows } = await query(
    `insert into boards (owner_id, name, description, categories, visibility)
     values ($1, $2, $3, $4::jsonb, $5)
     returning id`,
    [ownerId, name, description || null, JSON.stringify(categories || []), visibility],
  )
  return findBoardById({ boardId: rows[0].id, ownerId })
}

export const findBoardablePost = async ({ postId, userId }) => {
  const { rows } = await query(
    `select id
     from posts
     where id = $1
       and status = 'published'
       and (visibility = 'public' or author_id = $2)
     limit 1`,
    [postId, userId],
  )
  return rows[0] || null
}

export const listPublicBoardItems = async (boardId) => {
  const { rows } = await query(
    `select
       bi.id,
       bi.post_id as "postId",
       p.author_id as "postAuthorId",
       bi.media_asset_id as "mediaId",
       bi.external_image_id as "externalImageId",
       bi.created_at as "createdAt",
       coalesce(p.title, ua.title, external_image.title, 'Saved image') as title,
       coalesce(p.metadata->'tags', external_image.tags, '[]'::jsonb) as tags,
       coalesce(ua.description, external_image.description, '') as description,
       coalesce(post_media.metadata->>'originalFilename', direct_media.metadata->>'originalFilename', '') as "originalFilename",
       coalesce(post_media.public_url, direct_media.public_url, external_image.url) as "publicUrl",
       coalesce(post_media.width, direct_media.width, external_image.width) as width,
       coalesce(post_media.height, direct_media.height, external_image.height) as height,
       coalesce(post_media.mime_type, direct_media.mime_type, external_image.mime_type) as "mimeType",
       external_image.provider as "externalProvider",
       external_image.source_url as "sourceUrl",
       external_image.license,
       external_image.author,
       coalesce((
         select jsonb_agg(jsonb_build_object(
           'mediaId', ma.id,
           'url', ma.public_url,
           'width', ma.width,
           'height', ma.height,
           'mimeType', ma.mime_type,
           'originalFilename', coalesce(ma.metadata->>'originalFilename', '')
         ) order by pm.position)
         from post_media pm
         join media_assets ma on ma.id = pm.media_id and ma.deleted_at is null
         where pm.post_id = p.id
       ), '[]'::jsonb) as "postMedia",
       u.username,
       coalesce(u.display_name, u.username) as "displayName",
       coalesce(p.save_count, 0)::int as "saveCount",
       coalesce(p.view_count, 0)::int as "viewCount",
       coalesce(p.unique_view_count, 0)::int as "uniqueViewCount"
     from board_items bi
     left join posts p on p.id = bi.post_id
     left join users u on u.id = p.author_id
     left join media_assets post_media on post_media.id = p.cover_media_id and post_media.deleted_at is null
     left join media_assets direct_media on direct_media.id = bi.media_asset_id and direct_media.deleted_at is null
     left join external_images external_image on external_image.id = bi.external_image_id
     left join uploaded_assets ua on ua.media_id = direct_media.id
     where bi.board_id = $1
       and (p.status is null or p.status != 'banned')
     order by bi.created_at desc`,
    [boardId],
  )
  return rows
}

export const listBoardItems = async ({ boardId, ownerId }) => {
  const { rows } = await query(
    `select
       bi.id,
       bi.post_id as "postId",
       p.author_id as "postAuthorId",
       bi.media_asset_id as "mediaId",
       bi.external_image_id as "externalImageId",
       bi.created_at as "createdAt",
       coalesce(p.title, ua.title, external_image.title, 'Saved image') as title,
       coalesce(p.metadata->'tags', external_image.tags, '[]'::jsonb) as tags,
       coalesce(ua.description, external_image.description, '') as description,
       coalesce(post_media.metadata->>'originalFilename', direct_media.metadata->>'originalFilename', '') as "originalFilename",
       coalesce(post_media.public_url, direct_media.public_url, external_image.url) as "publicUrl",
       coalesce(post_media.width, direct_media.width, external_image.width) as width,
       coalesce(post_media.height, direct_media.height, external_image.height) as height,
       coalesce(post_media.mime_type, direct_media.mime_type, external_image.mime_type) as "mimeType",
       external_image.provider as "externalProvider",
       external_image.source_url as "sourceUrl",
       external_image.license,
       external_image.author,
       coalesce((
         select jsonb_agg(jsonb_build_object(
           'mediaId', ma.id,
           'url', ma.public_url,
           'width', ma.width,
           'height', ma.height,
           'mimeType', ma.mime_type,
           'originalFilename', coalesce(ma.metadata->>'originalFilename', '')
         ) order by pm.position)
         from post_media pm
         join media_assets ma on ma.id = pm.media_id and ma.deleted_at is null
         where pm.post_id = p.id
       ), '[]'::jsonb) as "postMedia",
       u.username,
       coalesce(u.display_name, u.username) as "displayName",
       coalesce(p.save_count, 0)::int as "saveCount",
       coalesce(p.view_count, 0)::int as "viewCount",
       coalesce(p.unique_view_count, 0)::int as "uniqueViewCount"
     from board_items bi
     join boards b on b.id = bi.board_id and b.owner_id = $2
     left join posts p on p.id = bi.post_id
     left join users u on u.id = p.author_id
     left join media_assets post_media on post_media.id = p.cover_media_id and post_media.deleted_at is null
     left join media_assets direct_media on direct_media.id = bi.media_asset_id and direct_media.deleted_at is null
     left join external_images external_image on external_image.id = bi.external_image_id
     left join uploaded_assets ua on ua.media_id = direct_media.id and ua.user_id = b.owner_id
      where bi.board_id = $1
        and (p.status is null or p.status != 'banned')
      order by bi.created_at desc`,
    [boardId, ownerId],
  )
  return rows
}

export const insertBoardItem = async ({ boardId, ownerId, postId, mediaId, externalImageId }) => {
  const { rows } = await query(
    `insert into board_items (board_id, post_id, media_asset_id, external_image_id)
     select b.id, $3, $4, $5
     from boards b
     where b.id = $1 and b.owner_id = $2
     on conflict do nothing
     returning id`,
    [boardId, ownerId, postId || null, mediaId || null, externalImageId || null],
  )
  if (rows[0]) {
    await query('update boards set updated_at = now() where id = $1', [boardId])
  }
  return rows[0] || null
}

export const deleteBoardItem = async ({ boardId, itemId, ownerId }) => {
  const { rows } = await query(
    `delete from board_items bi
     using boards b
     where bi.id = $1
       and bi.board_id = $2
       and b.id = bi.board_id
       and b.owner_id = $3
     returning bi.id`,
    [itemId, boardId, ownerId],
  )
  if (rows[0]) {
    await query('update boards set updated_at = now() where id = $1', [boardId])
  }
  return rows[0] || null
}

export const updateBoardRecord = async ({ boardId, ownerId, name, visibility }) => {
  const { rows } = await query(
    `update boards set name = coalesce($3, name), visibility = coalesce($4, visibility), updated_at = now()
     where id = $1 and owner_id = $2
     returning id, name, description, categories, visibility, created_at as "createdAt", updated_at as "updatedAt"`,
    [boardId, ownerId, name || null, visibility || null],
  )
  return rows[0] || null
}

export const deleteBoardRecord = async ({ boardId, ownerId }) => {
  const { rows } = await query(
    `delete from boards where id = $1 and owner_id = $2 returning id`,
    [boardId, ownerId],
  )
  return rows[0] || null
}
