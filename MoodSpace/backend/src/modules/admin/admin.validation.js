import { z } from 'zod'

export const updateUserSchema = z.object({
  body: z.object({
    role: z.enum(['user', 'admin']).optional(),
    status: z.enum(['active', 'suspended', 'banned']).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
})

export const resolveReportSchema = z.object({
  body: z.object({
    resolution: z.enum(['dismissed', 'warned', 'post_deleted', 'user_banned']),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
})

export const makeAdminSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(1, 'Email or username is required'),
  }),
})

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional(),
    role: z.enum(['user', 'admin']).optional(),
    status: z.enum(['active', 'suspended', 'banned']).optional(),
    resolved: z.enum(['true', 'false']).optional(),
  }),
})
