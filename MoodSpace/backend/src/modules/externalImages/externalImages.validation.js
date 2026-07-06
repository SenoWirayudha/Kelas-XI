import { z } from 'zod'

export const externalImageSearchSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional(),
    limit: z.coerce.number().int().min(1).max(30).default(12),
    cursor: z.string().trim().max(12000).optional(),
    context: z.enum(['home', 'search', 'related', 'browse_asset', 'recommended']).optional(),
    mode: z.enum(['for-you', 'recent', 'popular']).optional(),
    seed: z.string().trim().max(120).optional(),
    tmdbId: z.coerce.number().int().positive().optional(),
    mediaType: z.enum(['movie', 'tv']).optional(),
    visualType: z.enum(['poster', 'backdrop']).optional(),
    includeRecommendations: z.coerce.boolean().optional(),
    visualSimilarTo: z.string().trim().max(240).optional(),
    semanticText: z.string().trim().max(500).optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
})

export const externalImagePayloadSchema = z.object({
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
})

export const externalImageEnsureSchema = z.object({
  body: z.object({ image: externalImagePayloadSchema }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const externalImageSaveSchema = z.object({
  body: z.object({ image: externalImagePayloadSchema }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const externalImageIdSchema = z.object({
  params: z.object({ id: z.string().min(3).max(240) }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const externalImageSavedListSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(60).default(30),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
})

export const externalImageVisualSearchSchema = z.object({
  query: z.object({
    imageUrl: z.string().url().max(2000),
    limit: z.coerce.number().int().min(1).max(60).default(30),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
})
