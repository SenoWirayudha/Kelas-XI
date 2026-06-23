import { query } from '../../db/pool.js'
import { AppError } from '../../utils/errors.js'
import { uploadBuffer, deleteObject, buildPublicUrl } from '../media/storage.service.js'
import { createHash } from 'node:crypto'

export const listFavorites = async (userId) => {
  const { rows } = await query(
    `select font_family from user_font_favorites where user_id = $1 order by created_at desc`,
    [userId],
  )
  return rows.map((r) => r.font_family)
}

export const addFavorite = async ({ userId, fontFamily }) => {
  const { rows } = await query(
    `insert into user_font_favorites (user_id, font_family)
     values ($1, $2)
     on conflict (user_id, font_family) do nothing
     returning id`,
    [userId, fontFamily],
  )
  return { added: rows.length > 0 }
}

export const removeFavorite = async ({ userId, fontFamily }) => {
  await query(
    `delete from user_font_favorites where user_id = $1 and font_family = $2`,
    [userId, fontFamily],
  )
  return { deleted: true }
}

export const uploadFontFile = async ({ userId, fileBuffer, filename, mimeType, name }) => {
  const sizeBytes = fileBuffer?.length || 0

  if (!fileBuffer || sizeBytes === 0) {
    throw new AppError('Font file is required', { status: 400, code: 'FONT_FILE_REQUIRED' })
  }

  const allowedMimeTypes = ['font/ttf', 'font/otf', 'font/woff2', 'font/woff', 'application/x-font-ttf', 'application/x-font-otf', 'application/octet-stream']
  if (!allowedMimeTypes.includes(mimeType) && !mimeType.startsWith('font/')) {
    throw new AppError('Invalid font format. Accepted: .ttf, .otf, .woff2, .woff', {
      status: 400, code: 'INVALID_FONT_FORMAT',
    })
  }

  if (sizeBytes > 10 * 1024 * 1024) {
    throw new AppError('Font file too large. Maximum 10MB.', {
      status: 400, code: 'FONT_TOO_LARGE',
    })
  }

  const fontName = name || filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9 -]/g, '').trim() || 'Untitled Font'
  const ext = filename.split('.').pop()?.toLowerCase() || 'ttf'
  const checksum = createHash('sha256').update(fileBuffer).digest('hex').slice(0, 12)
  const storageKey = `users/${userId}/fonts/${checksum}-${Date.now()}.${ext}`

  const { rows } = await query(
    `insert into custom_fonts (user_id, name, family, storage_key, url, mime_type, size_bytes)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, user_id as "userId", name, family, storage_key as "storageKey", url, mime_type as "mimeType", size_bytes as "sizeBytes", created_at as "createdAt"`,
    [userId, fontName, fontName, storageKey, '', mimeType, sizeBytes],
  )
  const record = rows[0]

  const publicUrl = buildPublicUrl({ objectKey: storageKey })
  await query(
    `update custom_fonts set url = $1 where id = $2`,
    [publicUrl, record.id],
  )
  record.url = publicUrl

  await uploadBuffer({ objectKey: storageKey, mimeType, buffer: fileBuffer })

  return record
}

export const listUserFonts = async (userId) => {
  const { rows } = await query(
    `select id, user_id as "userId", name, family, storage_key as "storageKey", url, mime_type as "mimeType", size_bytes as "sizeBytes", created_at as "createdAt"
     from custom_fonts
     where user_id = $1
     order by created_at desc`,
    [userId],
  )
  return rows
}

export const deleteFont = async ({ fontId, userId }) => {
  const { rows } = await query(
    `select id, storage_key as "storageKey" from custom_fonts where id = $1 and user_id = $2`,
    [fontId, userId],
  )
  if (!rows.length) {
    throw new AppError('Font not found', { status: 404, code: 'FONT_NOT_FOUND' })
  }

  const font = rows[0]
  await deleteObject({ objectKey: font.storageKey })
  await query(`delete from custom_fonts where id = $1`, [font.id])
  return { deleted: true }
}
