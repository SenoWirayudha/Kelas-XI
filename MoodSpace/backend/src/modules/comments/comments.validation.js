import { z } from 'zod'

const uuid = z.string().uuid()

export const createCommentSchema = z.object({
  params: z.object({ postId: uuid }),
  body: z.object({
    content: z.string().trim().min(1).max(2000),
  }),
  query: z.object({}).optional(),
})

export const listCommentsSchema = z.object({
  params: z.object({ postId: uuid }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
})

export const deleteCommentSchema = z.object({
  params: z.object({ commentId: uuid }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})
