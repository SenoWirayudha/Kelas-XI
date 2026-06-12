import { Router } from 'express'
import { z } from 'zod'
import { optionalAuth } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import * as controller from './profiles.controller.js'

const profileSchema = z.object({
  params: z.object({ username: z.string().min(1).max(32) }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
})

export const profilesRouter = Router()

profilesRouter.get('/:username/profile', optionalAuth, validate(profileSchema), controller.getPublicProfile)
