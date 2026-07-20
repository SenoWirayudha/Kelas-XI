import { z } from 'zod'

const uuid = z.string().uuid()
const jsonObject = z.record(z.string(), z.unknown())

export const createWorkspaceSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(160).default('Untitled Workspace'),
    description: z.string().max(1000).nullable().optional(),
    visibility: z.enum(['private', 'unlisted', 'public']).optional(),
    canvasWidth: z.number().int().positive().max(10000),
    canvasHeight: z.number().int().positive().max(10000),
    canvasRatio: z.string().max(40).nullable().optional(),
    background: jsonObject.optional(),
    settings: jsonObject.optional(),
    snapshot: jsonObject.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const workspaceIdParamSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const updateWorkspaceSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    title: z.string().min(1).max(160).optional(),
    description: z.string().max(1000).nullable().optional(),
    visibility: z.enum(['private', 'unlisted', 'public']).optional(),
    canvasWidth: z.number().int().positive().max(10000).optional(),
    canvasHeight: z.number().int().positive().max(10000).optional(),
    canvasRatio: z.string().max(40).nullable().optional(),
    background: jsonObject.optional(),
    settings: jsonObject.optional(),
  }),
  query: z.object({}).optional(),
})

export const saveWorkspaceSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    snapshot: jsonObject,
    title: z.string().min(1).max(160).optional(),
    canvasWidth: z.number().int().positive().max(10000).optional(),
    canvasHeight: z.number().int().positive().max(10000).optional(),
    canvasRatio: z.string().max(40).nullable().optional(),
    background: jsonObject.optional(),
    settings: jsonObject.optional(),
  }),
  query: z.object({}).optional(),
})

export const thumbnailSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    mediaId: uuid.optional(),
    dataUrl: z.string().startsWith('data:image/').optional(),
  }).refine((value) => value.mediaId || value.dataUrl, {
    message: 'mediaId or dataUrl is required',
  }),
  query: z.object({}).optional(),
})

export const inviteCollaboratorSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    userId: uuid,
    role: z.enum(['view', 'edit']),
  }),
  query: z.object({}).optional(),
})

export const collaboratorIdParamSchema = z.object({
  params: z.object({
    id: uuid,
    userId: uuid,
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const changeRoleSchema = z.object({
  params: z.object({
    id: uuid,
    userId: uuid,
  }),
  body: z.object({
    role: z.enum(['view', 'edit']),
  }),
  query: z.object({}).optional(),
})

export const shareAsTemplateSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const useAsTemplateSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const byTokenSchema = z.object({
  params: z.object({ token: z.string().min(1) }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const importByTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})
