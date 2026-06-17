import { z } from 'zod'

const uuid = z.string().uuid()
const jsonObject = z.record(z.string(), z.unknown())
const postMetadata = z.object({
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  allowComments: z.boolean().default(true),
}).default({})

export const publishWorkspaceSchema = z.object({
  body: z.object({
    workspaceId: uuid,
    title: z.string().min(1).max(160).optional(),
    caption: z.string().max(1000).nullable().optional(),
    visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
    coverMediaId: uuid.optional(),
    snapshot: jsonObject.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const createMediaPostSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(160),
    caption: z.string().max(1000).nullable().optional(),
    visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
    mediaIds: z.array(uuid).min(1).max(10),
    metadata: postMetadata.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const mediaPostDraftSchema = z.object({
  body: z.object({
    title: z.string().trim().max(160).optional(),
    caption: z.string().max(1000).nullable().optional(),
    visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
    mediaIds: z.array(uuid).max(10).default([]),
    metadata: postMetadata.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const mediaPostDraftParamSchema = mediaPostDraftSchema.extend({
  params: z.object({
    id: uuid,
  }),
})

export const postIdParamSchema = z.object({
  params: z.object({
    id: uuid,
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const updatePostSchema = z.object({
  params: z.object({
    id: uuid,
  }),
  body: z.object({
    title: z.string().trim().max(160).nullable().optional(),
    caption: z.string().max(1000).nullable().optional(),
    visibility: z.enum(['public', 'private', 'unlisted']).optional(),
    mediaIds: z.array(uuid).min(1).max(10).optional(),
    metadata: postMetadata.optional(),
  }),
})

export const feedQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    mode: z.enum(['for-you', 'recent', 'popular']).default('for-you'),
    seed: z.string().trim().max(96).optional().default(''),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
})

export const usernamePostsSchema = z.object({
  params: z.object({
    username: z.string().min(1).max(32),
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
  body: z.object({}).optional(),
})

export const savedPostsSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
})

export const recommendedPostsSchema = z.object({
  params: z.object({
    id: uuid,
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(18).default(8),
    offset: z.coerce.number().int().min(0).max(500).default(0),
  }),
  body: z.object({}).optional(),
})

const imageIdParam = z.string().min(1)
export const similarPostsSchema = z.object({
  params: z.object({
    imageId: imageIdParam,
  }),
  query: z.object({
    q: z.string().max(500).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
  body: z.object({}).optional(),
})
