import { z } from 'zod'

export const fontIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const fontFamilyParamSchema = z.object({
  params: z.object({
    fontFamily: z.string().min(1),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const fontFamilyBodySchema = z.object({
  body: z.object({
    fontFamily: z.string().min(1),
  }),
  query: z.object({}).optional(),
})
