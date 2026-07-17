import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default('moodspace_refresh'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  STORAGE_PROVIDER: z.enum(['supabase', 's3', 'local']).default('supabase'),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().default('moodspace'),
  MEDIA_PUBLIC_BASE_URL: z.string().optional().default(''),
  UNSPLASH_ACCESS_KEY: z.string().optional().default(''),
  PEXELS_API_KEY: z.string().optional().default(''),
  PIXABAY_API_KEY: z.string().optional().default(''),
  TMDB_API_KEY: z.string().optional().default(''),
  HF_TOKEN: z.string().optional().default(''),
  ENTITY_MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.85),
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('onboarding@resend.dev'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
