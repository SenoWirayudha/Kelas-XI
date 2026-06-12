import { query } from '../../db/pool.js'

const externalImageSelect = `
  select
    ei.id,
    ei.provider,
    ei.external_id as "externalId",
    ei.title,
    ei.description,
    ei.tags,
    ei.url,
    ei.thumbnail_url as "thumbnailUrl",
    ei.width,
    ei.height,
    ei.mime_type as "mimeType",
    ei.author,
    ei.license,
    ei.source_url as "sourceUrl",
    ei.metadata,
    ei.created_at as "createdAt",
    ei.updated_at as "updatedAt"
  from external_images ei
`

export const upsertExternalImage = async (image) => {
  const { rows } = await query(
    `insert into external_images (
       id, provider, external_id, title, description, tags, url, thumbnail_url,
       width, height, mime_type, author, license, source_url, metadata
     )
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)
     on conflict (id)
     do update set
       title = excluded.title,
       description = excluded.description,
       tags = excluded.tags,
       url = excluded.url,
       thumbnail_url = excluded.thumbnail_url,
       width = excluded.width,
       height = excluded.height,
       mime_type = excluded.mime_type,
       author = excluded.author,
       license = excluded.license,
       source_url = excluded.source_url,
       metadata = external_images.metadata || excluded.metadata,
       updated_at = now()
     returning id`,
    [
      image.id,
      image.provider,
      image.externalId,
      image.title || null,
      image.description || null,
      JSON.stringify(image.tags || []),
      image.url,
      image.thumbnailUrl || image.url,
      image.width || null,
      image.height || null,
      image.mimeType || null,
      image.author || null,
      image.license || null,
      image.sourceUrl || null,
      JSON.stringify(image.metadata || {}),
    ],
  )
  return rows[0]
}

export const findExternalImageById = async ({ id, userId = null }) => {
  const { rows } = await query(
    `${externalImageSelect}
     where ei.id = $1
     limit 1`,
    [id],
  )
  const image = rows[0] || null
  if (!image || !userId) return image
  const saveResult = await query(
    `select 1 from external_image_saves where user_id = $1 and external_image_id = $2 limit 1`,
    [userId, id],
  )
  return { ...image, isSaved: !!saveResult.rows[0] }
}

export const saveExternalImage = async ({ userId, externalImageId }) => {
  const { rows } = await query(
    `insert into external_image_saves (user_id, external_image_id)
     values ($1, $2)
     on conflict do nothing
     returning external_image_id as "externalImageId"`,
    [userId, externalImageId],
  )
  return { inserted: !!rows[0] }
}

export const unsaveExternalImage = async ({ userId, externalImageId }) => {
  await query(
    `delete from external_image_saves where user_id = $1 and external_image_id = $2`,
    [userId, externalImageId],
  )
}

export const listSavedExternalImages = async ({ userId, limit = 30 }) => {
  const { rows } = await query(
    `${externalImageSelect}
     join external_image_saves eis on eis.external_image_id = ei.id and eis.user_id = $1
     order by eis.created_at desc
     limit $2`,
    [userId, limit],
  )
  return rows.map((row) => ({ ...row, isSaved: true }))
}
