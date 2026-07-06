import path from 'path'
import { createHash, randomUUID } from 'crypto'
import { AppError, forbidden, notFound } from '../../utils/errors.js'
import { formatBytesMB } from '../../utils/format.js'
import {
  buildPublicUrl,
  createSignedUploadUrl,
  deleteObject,
  getStorageBucket,
  uploadBuffer,
} from './storage.service.js'
import {
  completeMediaUpload,
  createPendingMedia,
  createUploadedAsset,
  deleteUploadedAssetsForMedia,
  findMediaById,
  findMediaByUrl,
  listUploadedAssets,
  softDeleteMedia,
  updateMediaAssetEmbedding,
  updateMediaObjectKey,
} from './media.repository.js'
import { getImageEmbedding } from '../externalImages/clip.service.js'
import { extractText } from '../../shared/ocr.service.js'

const extensionFromMime = (mimeType, filename) => {
  const fromName = path.extname(filename || '').replace('.', '').toLowerCase()
  if (fromName) return fromName
  if (mimeType === 'image/jpeg') return 'jpg'
  return mimeType.split('/')[1] || 'bin'
}

const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
const maxUploadSize = 20 * 1024 * 1024

const assertValidImageUpload = ({ mimeType, sizeBytes }) => {
  console.log('[media upload] validation', {
    rawBytes: sizeBytes,
    sizeMB: formatBytesMB(sizeBytes),
    limitBytes: maxUploadSize,
    limitMB: formatBytesMB(maxUploadSize),
    mimeType,
  })

  if (!allowedImageTypes.has(mimeType)) {
    throw new AppError('Only PNG, JPG, WEBP, and GIF images are supported', {
      status: 400,
      code: 'INVALID_IMAGE_TYPE',
    })
  }
  if (!sizeBytes || sizeBytes > maxUploadSize) {
    throw new AppError(`Ukuran gambar ${formatBytesMB(sizeBytes)} melebihi limit ${formatBytesMB(maxUploadSize)}`, {
      status: 400,
      code: 'IMAGE_TOO_LARGE',
      details: {
        sizeBytes,
        sizeMB: formatBytesMB(sizeBytes),
        limitBytes: maxUploadSize,
        limitMB: formatBytesMB(maxUploadSize),
      },
    })
  }
}

const createObjectKey = ({ userId, sourceType, mediaId, mimeType, filename }) => {
  const ext = extensionFromMime(mimeType, filename)
  return `users/${userId}/${sourceType}/${mediaId}-${randomUUID()}.${ext}`
}

export const serializeMedia = (media) => ({
  id: media.id,
  ownerId: media.ownerId,
  sourceType: media.sourceType,
  mimeType: media.mimeType,
  width: media.width,
  height: media.height,
  sizeBytes: media.sizeBytes,
  uploadStatus: media.uploadStatus,
  url: buildPublicUrl(media),
  metadata: media.metadata || {},
  createdAt: media.createdAt,
})

export const signUpload = async ({ userId, filename, mimeType, sizeBytes, sourceType = 'upload' }) => {
  void userId
  void filename
  void mimeType
  void sizeBytes
  void sourceType
  throw new AppError('Signed browser upload is disabled for Supabase Storage. Use backend media upload endpoint.', {
    status: 410,
    code: 'SIGNED_UPLOAD_DISABLED',
  })
}

export const createPendingSignedUpload = async ({ userId, filename, mimeType, sizeBytes, sourceType = 'upload' }) => {
  assertValidImageUpload({ mimeType, sizeBytes })
  const media = await createPendingMedia({
    ownerId: userId,
    sourceType,
    storageProvider: 'supabase',
    bucket: getStorageBucket(),
    mimeType,
    sizeBytes,
    metadata: { originalFilename: filename },
  })
  const ext = extensionFromMime(mimeType, filename)
  const objectKey = `users/${userId}/${sourceType}/${media.id}.${ext}`
  const publicUrl = buildPublicUrl({ objectKey })
  await updateMediaObjectKey({ mediaId: media.id, objectKey, publicUrl })

  const uploadUrl = await createSignedUploadUrl({ objectKey, mimeType })

  return {
    mediaId: media.id,
    uploadUrl,
    objectKey,
    publicUrl,
    expiresIn: 300,
  }
}

export const uploadImageFile = async ({
  userId,
  fileBuffer,
  filename,
  mimeType,
  width,
  height,
  title,
  description,
  visibility = 'private',
  sourceType = 'upload',
  addToUploads = sourceType === 'upload',
}) => {
  const sizeBytes = fileBuffer?.length || 0
  assertValidImageUpload({ mimeType, sizeBytes })

  const checksum = createHash('sha256').update(fileBuffer).digest('hex')
  const media = await createPendingMedia({
    ownerId: userId,
    sourceType,
    storageProvider: 'supabase',
    bucket: getStorageBucket(),
    mimeType,
    sizeBytes,
    metadata: {
      originalFilename: filename || null,
      checksum,
    },
  })

  const objectKey = createObjectKey({ userId, sourceType, mediaId: media.id, mimeType, filename })
  const publicUrl = buildPublicUrl({ objectKey })
  await updateMediaObjectKey({ mediaId: media.id, objectKey, publicUrl })
  await uploadBuffer({ objectKey, mimeType, buffer: fileBuffer })
  await completeMediaUpload({
    mediaId: media.id,
    ownerId: userId,
    width,
    height,
    sizeBytes,
    metadata: {
      originalFilename: filename || null,
      checksum,
    },
  })

  // Background CLIP embedding + OCR (non-blocking)
  setImmediate(async () => {
    try {
      const embedding = await getImageEmbedding(fileBuffer)
      const ocrText = await extractText(fileBuffer)
      if (embedding || ocrText) {
        await updateMediaAssetEmbedding({ id: media.id, embedding, ocrText })
        console.log('[MEDIA] Background embedding done:', media.id)
      }
    } catch (err) {
      console.error('[MEDIA] Background embedding failed:', media.id, err.message)
    }
  })

  const asset = addToUploads ? await createUploadedAsset({
    userId,
    mediaId: media.id,
    title: title || filename || 'Uploaded image',
    description,
    visibility,
  }) : null
  const nextMedia = await findMediaById(media.id)

  return {
    asset,
    media: serializeMedia(nextMedia),
  }
}

export const completeUpload = async ({ userId, mediaId, title, description, visibility, width, height, sizeBytes, metadata }) => {
  const media = await findMediaById(mediaId)
  if (!media) throw notFound('Media not found')
  if (media.ownerId !== userId) throw forbidden('You do not own this media')

  const completed = await completeMediaUpload({
    mediaId,
    ownerId: userId,
    width,
    height,
    sizeBytes,
    metadata,
  })
  if (!completed) throw new AppError('Media upload could not be completed', { status: 400, code: 'MEDIA_COMPLETE_FAILED' })

  const asset = media.sourceType === 'upload'
    ? await createUploadedAsset({
      userId,
      mediaId,
      title,
      description,
      visibility,
    })
    : null
  const nextMedia = await findMediaById(mediaId)

  return {
    asset,
    media: serializeMedia(nextMedia),
  }
}

export const listUserUploads = async (userId) => {
  const rows = await listUploadedAssets(userId)
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    media: {
      id: row.mediaId,
      sourceType: row.sourceType,
      url: buildPublicUrl(row),
      mimeType: row.mimeType,
      width: row.width,
      height: row.height,
      sizeBytes: row.sizeBytes,
      metadata: row.metadata || {},
    },
    createdAt: row.createdAt,
  }))
}

export const deleteMediaByUrl = async ({ userId, url }) => {
  if (!url) throw new AppError('URL is required', { status: 400, code: 'URL_REQUIRED' })
  const media = await findMediaByUrl(url)
  if (!media) throw notFound('Media not found')
  if (media.ownerId !== userId) throw forbidden('You do not own this media')
  await softDeleteMedia({ mediaId: media.id, ownerId: userId })
  await deleteObject({ bucket: media.bucket, objectKey: media.objectKey })
  await deleteUploadedAssetsForMedia({ mediaId: media.id, userId })
}

export const deleteMedia = async ({ userId, mediaId }) => {
  const media = await softDeleteMedia({ mediaId, ownerId: userId })
  if (!media) throw notFound('Media not found')
  await deleteObject({ bucket: media.bucket, objectKey: media.objectKey })
  await deleteUploadedAssetsForMedia({ mediaId, userId })
}

export const getOwnedReadyMedia = async ({ userId, mediaId }) => {
  const media = await findMediaById(mediaId)
  if (!media) throw notFound('Media not found')
  if (media.ownerId !== userId) throw forbidden('You do not own this media')
  if (media.uploadStatus !== 'ready') {
    throw new AppError('Media is not ready', { status: 400, code: 'MEDIA_NOT_READY' })
  }
  return media
}

export const createMediaFromDataUrl = async ({
  userId,
  dataUrl,
  sourceType = 'workspace_thumbnail',
  title,
  objectKey: objectKeyOverride,
  upsert = false,
}) => {
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i.exec(dataUrl || '')
  if (!match) {
    throw new AppError('Invalid image data URL', { status: 400, code: 'INVALID_DATA_URL' })
  }

  const mimeType = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
    throw new AppError('Thumbnail image is too large', { status: 400, code: 'IMAGE_TOO_LARGE' })
  }

  const checksum = createHash('sha256').update(buffer).digest('hex')
  const media = await createPendingMedia({
    ownerId: userId,
    sourceType,
    storageProvider: 'supabase',
    bucket: getStorageBucket(),
    mimeType,
    sizeBytes: buffer.length,
    metadata: { title: title || null, checksum },
  })

  const objectKey = objectKeyOverride || createObjectKey({ userId, sourceType, mediaId: media.id, mimeType, filename: title })
  const publicUrl = buildPublicUrl({ objectKey })
  await updateMediaObjectKey({ mediaId: media.id, objectKey, publicUrl })
  await uploadBuffer({ objectKey, mimeType, buffer, upsert })
  await completeMediaUpload({
    mediaId: media.id,
    ownerId: userId,
    sizeBytes: buffer.length,
    metadata: { checksum },
  })

  return findMediaById(media.id)
}
