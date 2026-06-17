import { z } from 'zod'

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(['post', 'user', 'comment']).optional(),
    targetId: z.string().uuid().optional(),
    postId: z.string().uuid().optional(),
    reason: z.enum(['spam', 'inappropriate', 'hate_speech', 'plagiarism', 'other']),
    detail: z.string().trim().max(2000).optional().default(''),
  }).refine((data) => {
    if (data.targetType && data.targetId) return true
    if (data.postId) return true
    return false
  }, { message: 'Either targetType+targetId or postId is required' }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})
