import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().max(320),
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
    password: z.string().min(8).max(128),
    displayName: z.string().min(1).max(80).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1).max(320),
    password: z.string().min(1).max(128),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(20).optional(),
  }).optional().default({}),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    verificationCode: z.string().length(6).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().max(320),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const sendCodeSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(80).optional(),
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_.]+$/).optional(),
    bio: z.string().max(500).nullable().optional(),
    websiteUrl: z.string().url().nullable().optional(),
    location: z.string().max(120).nullable().optional(),
    avatarMediaId: z.string().uuid().nullable().optional(),
    bannerMediaId: z.string().uuid().nullable().optional(),
    profileMetadata: z.record(z.string(), z.unknown()).optional(),
    socialLinks: z.record(z.string(), z.string()).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})
