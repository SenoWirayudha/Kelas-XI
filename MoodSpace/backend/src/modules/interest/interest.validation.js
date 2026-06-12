import { z } from 'zod'

export const interestEventSchema = z.object({
  body: z.object({
    eventType: z.literal('drop_to_canvas'),
    tags: z.array(z.string().min(1).max(80)).max(16).default([]),
    query: z.string().max(200).optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
    weight: z.number().min(0.1).max(10).optional(),
  }),
})
