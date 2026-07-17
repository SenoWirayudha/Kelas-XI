import { query } from '../../db/pool.js'

const mediaSelect = `
  select
    m.id,
    m.owner_id as "ownerId",
    m.source_type as "sourceType",
    m.storage_provider as "storageProvider",
    m.bucket,
    m.object_key as "objectKey",
    m.public_url as "publicUrl",
    m.mime_type as "mimeType",
    m.width,
    m.height,
    m.size_bytes as "sizeBytes",
    m.upload_status as "uploadStatus",
    m.metadata,
    m.ocr_text as "ocrText",
    m.created_at as "createdAt",
    m.updated_at as "updatedAt"
  from media_assets m
`

export const createPendingMedia = async ({ ownerId, sourceType, storageProvider, bucket, mimeType, sizeBytes, metadata = {} }) => {
  const { rows } = await query(
    `insert into media_assets (owner_id, source_type, storage_provider, bucket, mime_type, size_bytes, metadata)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)
     returning id`,
    [ownerId, sourceType, storageProvider, bucket, mimeType, sizeBytes || null, JSON.stringify(metadata)],
  )
  return rows[0]
}

export const insertMediaAssetDirect = async ({ id, ownerId, sourceType, storageProvider, bucket, objectKey, publicUrl, mimeType, width, height, sizeBytes, metadata = {} }) => {
  const { rows } = await query(
    `insert into media_assets (id, owner_id, source_type, storage_provider, bucket, object_key, public_url, mime_type, width, height, size_bytes, upload_status, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ready', $12::jsonb)
     returning id`,
    [id, ownerId, sourceType, storageProvider, bucket, objectKey, publicUrl, mimeType, width || null, height || null, sizeBytes || null, JSON.stringify(metadata)],
  )
  return rows[0] || null
}

export const updateMediaObjectKey = async ({ mediaId, objectKey, publicUrl }) => {
  const { rows } = await query(
    `update media_assets
     set object_key = $2,
         public_url = $3,
         updated_at = now()
     where id = $1
     returning id`,
    [mediaId, objectKey, publicUrl],
  )
  return rows[0] || null
}

export const findMediaById = async (mediaId) => {
  const { rows } = await query(
    `${mediaSelect}
     where m.id = $1 and m.deleted_at is null
     limit 1`,
    [mediaId],
  )
  return rows[0] || null
}

export const completeMediaUpload = async ({ mediaId, ownerId, width, height, sizeBytes, metadata = {} }) => {
  const { rows } = await query(
    `update media_assets
     set width = coalesce($3, width),
         height = coalesce($4, height),
         size_bytes = coalesce($5, size_bytes),
         metadata = metadata || $6::jsonb,
         upload_status = 'ready',
         updated_at = now()
     where id = $1
       and owner_id = $2
       and deleted_at is null
     returning id`,
    [mediaId, ownerId, width || null, height || null, sizeBytes || null, JSON.stringify(metadata)],
  )
  return rows[0] || null
}

export const createUploadedAsset = async ({ userId, mediaId, title, description, visibility = 'private' }) => {
  const { rows } = await query(
    `insert into uploaded_assets (user_id, media_id, title, description, visibility)
     values ($1, $2, $3, $4, $5)
     on conflict (user_id, media_id)
     do update set
       title = excluded.title,
       description = excluded.description,
       visibility = excluded.visibility,
       updated_at = now()
     returning id, user_id as "userId", media_id as "mediaId", title, description, visibility, created_at as "createdAt"`,
    [userId, mediaId, title || null, description || null, visibility],
  )
  return rows[0]
}

export const listUploadedAssets = async (userId) => {
  const { rows } = await query(
    `select
       ua.id,
       ua.title,
       ua.description,
       ua.visibility,
       ua.created_at as "createdAt",
       m.id as "mediaId",
       m.source_type as "sourceType",
       m.public_url as "publicUrl",
       m.bucket,
       m.object_key as "objectKey",
       m.mime_type as "mimeType",
       m.width,
       m.height,
       m.size_bytes as "sizeBytes",
       m.metadata
     from uploaded_assets ua
     join media_assets m on m.id = ua.media_id
     where ua.user_id = $1
       and m.deleted_at is null
       and m.source_type = 'upload'
     order by ua.created_at desc`,
    [userId],
  )
  return rows
}

export const deleteUploadedAssetsForMedia = async ({ mediaId, userId }) => {
  const { rowCount } = await query(
    `delete from uploaded_assets
     where media_id = $1
       and user_id = $2`,
    [mediaId, userId],
  )
  return rowCount
}

export const findMediaByUrl = async (url) => {
  const { rows } = await query(
    `${mediaSelect}
     where m.public_url = $1 and m.deleted_at is null
     limit 1`,
    [url],
  )
  return rows[0] || null
}

export const updateMediaAssetEmbedding = async ({ id, embedding, ocrText }) => {
  const { rows } = await query(
    `update media_assets
     set embedding = $2::jsonb,
         ocr_text = $3,
         updated_at = now()
     where id = $1
     returning id`,
    [id, embedding ? JSON.stringify(embedding) : null, ocrText || null],
  )
  return rows[0] || null
}

export const softDeleteMedia = async ({ mediaId, ownerId }) => {
  const { rows } = await query(
    `update media_assets
     set deleted_at = now(), updated_at = now()
     where id = $1
       and owner_id = $2
       and deleted_at is null
     returning id, bucket, object_key as "objectKey"`,
    [mediaId, ownerId],
  )
  return rows[0] || null
}
