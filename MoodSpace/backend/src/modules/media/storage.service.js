import { createClient } from '@supabase/supabase-js'
import { env } from '../../config/env.js'
import { AppError } from '../../utils/errors.js'

let supabase = null

const hasSupabaseConfig = () => (
  env.SUPABASE_URL &&
  env.SUPABASE_SERVICE_ROLE_KEY &&
  env.SUPABASE_STORAGE_BUCKET
)

const getSupabaseClient = () => {
  if (!hasSupabaseConfig()) {
    throw new AppError('Object storage is not configured', {
      status: 503,
      code: 'STORAGE_NOT_CONFIGURED',
    })
  }

  if (!supabase) {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return supabase
}

export const buildPublicUrl = ({ bucket = env.SUPABASE_STORAGE_BUCKET, objectKey, publicUrl }) => {
  if (publicUrl) return publicUrl
  if (!objectKey) return null
  if (env.MEDIA_PUBLIC_BASE_URL) return `${env.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey}`

  const client = getSupabaseClient()
  const { data } = client.storage.from(bucket).getPublicUrl(objectKey)
  return data.publicUrl
}

export const createSignedUploadUrl = async () => {
  throw new AppError('Signed browser upload is disabled for Supabase Storage. Use backend media upload endpoint.', {
    status: 410,
    code: 'SIGNED_UPLOAD_DISABLED',
  })
}

export const uploadBuffer = async ({ objectKey, mimeType, buffer, upsert = false }) => {
  const client = getSupabaseClient()
  const { error } = await client.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(objectKey, buffer, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert,
    })

  if (error) {
    throw new AppError('Failed to upload image to Supabase Storage', {
      status: 502,
      code: 'STORAGE_UPLOAD_FAILED',
      details: { message: error.message },
    })
  }
}

export const deleteObject = async ({ bucket = env.SUPABASE_STORAGE_BUCKET, objectKey }) => {
  if (!objectKey || !hasSupabaseConfig()) return
  const client = getSupabaseClient()
  const { error } = await client.storage.from(bucket).remove([objectKey])
  if (error) {
    throw new AppError('Failed to delete image from Supabase Storage', {
      status: 502,
      code: 'STORAGE_DELETE_FAILED',
      details: { message: error.message },
    })
  }
}

export const getStorageBucket = () => env.SUPABASE_STORAGE_BUCKET

export const copyObject = async ({ sourceKey, destKey }) => {
  const client = getSupabaseClient()
  const bucket = env.SUPABASE_STORAGE_BUCKET
  const { error } = await client.storage
    .from(bucket)
    .copy(sourceKey, destKey)

  if (error) {
    throw new AppError('Failed to copy object in Supabase Storage', {
      status: 502,
      code: 'STORAGE_COPY_FAILED',
      details: { sourceKey, destKey, message: error.message },
    })
  }
}
