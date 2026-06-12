import { z } from 'zod'

export const createReportSchema = z.object({
  body: z.object({
    postId: z.string().uuid(),
    reason: z.enum(['spam', 'inappropriate', 'hate_speech', 'plagiarism', 'other']),
    detail: z.string().trim().max(2000).optional().default(''),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})
