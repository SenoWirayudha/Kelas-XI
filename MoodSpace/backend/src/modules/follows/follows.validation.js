import { z } from 'zod'

export const followParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
})
