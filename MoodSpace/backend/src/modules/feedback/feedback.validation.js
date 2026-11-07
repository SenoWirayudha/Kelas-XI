import { z } from 'zod'

export const createFeedbackSchema = z.object({
  body: z.object({
    category: z.enum(['bug', 'saran_fitur', 'pertanyaan', 'lainnya']),
    message: z.string().trim().min(10, 'Pesan minimal 10 karakter').max(2000, 'Pesan maksimal 2000 karakter'),
    contactEmail: z.string().trim().email('Email tidak valid').max(254),
    pageUrl: z.string().trim().url('URL tidak valid').max(500).optional().or(z.literal('').transform(() => undefined)),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})
