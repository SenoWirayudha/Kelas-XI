import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import { followParamsSchema } from './follows.validation.js'
import * as controller from './follows.controller.js'

export const followsRouter = Router()

followsRouter.post('/:userId', authRequired, validate(followParamsSchema), controller.follow)
followsRouter.delete('/:userId', authRequired, validate(followParamsSchema), controller.unfollow)
followsRouter.get('/:userId/followers', authRequired, validate(followParamsSchema), controller.followers)
followsRouter.get('/:userId/following', authRequired, validate(followParamsSchema), controller.following)
