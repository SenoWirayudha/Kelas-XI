import { z } from 'zod'

const uuid = z.string().uuid()

export const signUploadSchema = z.object({
  body: z.object({
    filename: z.string().min(1).max(240),
    mimeType: z.string().regex(/^image\/(png|jpe?g|webp|gif)$/),
    sizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
    sourceType: z.enum(['upload', 'workspace_thumbnail', 'post', 'profile', 'project_seed']).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const completeUploadSchema = z.object({
  body: z.object({
    mediaId: uuid,
    title: z.string().max(160).optional(),
    description: z.string().max(500).optional(),
    visibility: z.enum(['private', 'unlisted', 'public']).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    sizeBytes: z.number().int().positive().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const mediaIdParamSchema = z.object({
  params: z.object({
    id: uuid,
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const uploadFileHeadersSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.instanceof(Buffer),
})
