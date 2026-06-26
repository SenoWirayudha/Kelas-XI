import { z } from 'zod'

const uuid = z.string().uuid()

export const createBoardSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).nullable().optional(),
    categories: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
    visibility: z.enum(['private', 'public']).default('private'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const boardIdSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const addBoardItemSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    postId: uuid.optional(),
    mediaId: uuid.optional(),
    externalImageId: z.string().min(3).max(180).optional(),
    externalImage: z.object({
      id: z.string().min(3).max(180),
      provider: z.string().min(1).max(40),
      externalId: z.string().min(1).max(180),
      title: z.string().max(300).optional().nullable(),
      description: z.string().max(2000).optional().nullable(),
      tags: z.array(z.string().max(60)).max(30).optional(),
      url: z.string().url(),
      thumbnailUrl: z.string().url().optional().nullable(),
      width: z.number().int().positive().optional().nullable(),
      height: z.number().int().positive().optional().nullable(),
      mimeType: z.string().max(80).optional().nullable(),
      author: z.string().max(240).optional().nullable(),
      license: z.string().max(240).optional().nullable(),
      sourceUrl: z.string().url().optional().nullable(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }).optional(),
  }).refine((value) => Number(!!value.postId) + Number(!!value.mediaId) + Number(!!value.externalImageId || !!value.externalImage) === 1, {
    message: 'Exactly one of postId, mediaId, or externalImage is required',
  }),
  query: z.object({}).optional(),
})

export const updateBoardSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    visibility: z.enum(['private', 'public']).optional(),
  }),
  query: z.object({}).optional(),
})

export const boardItemIdSchema = z.object({
  params: z.object({ id: uuid, itemId: uuid }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})
