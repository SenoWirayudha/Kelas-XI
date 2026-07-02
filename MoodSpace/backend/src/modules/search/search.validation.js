import { z } from 'zod'

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional().default(''),
    tags: z.string().trim().max(240).optional().default(''),
    sort: z.enum(['relevance', 'recent', 'popular']).optional().default('relevance'),
    limit: z.coerce.number().int().min(1).max(50).optional().default(30),
    offset: z.coerce.number().int().min(0).max(1000).optional().default(0),
    semantic: z.coerce.boolean().optional().default(false),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
})

export const searchSuggestionsSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional().default(''),
    limit: z.coerce.number().int().min(1).max(12).optional().default(8),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
})

export const searchHistoryListSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(20).optional().default(8),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
})

export const searchHistoryRecordSchema = z.object({
  body: z.object({
    query: z.string().trim().min(1).max(120),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})
