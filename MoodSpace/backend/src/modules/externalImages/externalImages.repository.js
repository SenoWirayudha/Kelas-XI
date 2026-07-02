import { query } from '../../db/pool.js'
import { cosineSimilarity } from './clip.service.js'

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

const externalImageEmbeddingSelect = `
  ei.embedding as "_embedding"
`

const buildEmbeddingInsert = (image) => {
  const embedding = image._embedding || image.embedding
  return {
    embeddingJson: embedding ? JSON.stringify(embedding) : null,
    hasEmbedding: !!embedding,
  }
}

export const upsertExternalImage = async (image) => {
  const { embeddingJson, hasEmbedding } = buildEmbeddingInsert(image)
  const embeddingCol = hasEmbedding ? ', embedding' : ''
  const embeddingParam = hasEmbedding ? `, $16::jsonb` : ''
  const embeddingUpdate = hasEmbedding ? ', embedding = excluded.embedding' : ''
  const params = [
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
  ]
  if (hasEmbedding) params.push(embeddingJson)

  const { rows } = await query(
    `insert into external_images (
       id, provider, external_id, title, description, tags, url, thumbnail_url,
       width, height, mime_type, author, license, source_url, metadata${embeddingCol}
     )
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb${embeddingParam})
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
       metadata = external_images.metadata || excluded.metadata${embeddingUpdate},
       updated_at = now()
     returning id`,
    params,
  )
  return rows[0]
}

export const updateEmbedding = async ({ id, embedding }) => {
  const { rows } = await query(
    `update external_images
     set embedding = $2::jsonb, updated_at = now()
     where id = $1
     returning id`,
    [id, JSON.stringify(embedding)],
  )
  return rows[0] || null
}

export const findEmbeddingsByItemIds = async (ids) => {
  if (!ids?.length) return {}
  const chunks = []
  for (let i = 0; i < ids.length; i += 100) {
    chunks.push(ids.slice(i, i + 100))
  }
  const results = {}
  for (const chunk of chunks) {
    const placeholders = chunk.map((_, i) => `$${i + 1}`).join(',')
    const { rows } = await query(
      `select id, embedding from external_images where id in (${placeholders}) and embedding is not null`,
      chunk,
    )
    for (const row of rows) {
      results[row.id] = row.embedding
    }
  }
  return results
}

export const findImagesByVisualSimilarity = async ({ embedding, limit = 30, excludeIds = [] }) => {
  if (!embedding?.length) return []
  const { rows } = await query(
    `select id, provider, external_id as "externalId", title, description, tags,
            url, thumbnail_url as "thumbnailUrl", width, height,
            mime_type as "mimeType", author, license, source_url as "sourceUrl",
            metadata, embedding, created_at as "createdAt", updated_at as "updatedAt"
     from external_images
     where embedding is not null
     order by updated_at desc
     limit 500`,
  )
  const scored = rows
    .filter((row) => row.embedding && !excludeIds.includes(row.id))
    .map((row) => ({
      ...row,
      _embedding: row.embedding,
      _clipScore: cosineSimilarity(embedding, row.embedding),
    }))
    .sort((a, b) => b._clipScore - a._clipScore)
    .slice(0, limit)
  return scored
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

export const findExternalImageEmbedding = async ({ id }) => {
  const { rows } = await query(
    `select embedding from external_images where id = $1 and embedding is not null limit 1`,
    [id],
  )
  return rows[0]?.embedding || null
}

export const findAnyEmbedding = async ({ id }) => {
  const extEmb = await findExternalImageEmbedding({ id })
  if (extEmb) return extEmb
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null
  }
  const { rows } = await query(
    `select p.embedding from posts p
     join post_media pm on pm.post_id = p.id
     where pm.media_id = $1 and p.embedding is not null
     limit 1`,
    [id],
  )
  return rows[0]?.embedding || null
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

export const findEntityCandidates = async () => {
  const { rows } = await query(
    `select id, provider, external_id as "externalId",
            title, description, metadata, embedding
     from external_images
     where embedding is not null
       and provider in ('tmdb', 'itunes')
       and (provider != 'tmdb' or (metadata->>'imageType' in ('poster', 'backdrop')))`,
  )
  return rows
}
