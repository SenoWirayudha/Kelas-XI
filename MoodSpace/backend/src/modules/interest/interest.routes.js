import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import { interestEventSchema } from './interest.validation.js'
import * as controller from './interest.controller.js'

export const interestRouter = Router()

interestRouter.post('/events', authRequired, validate(interestEventSchema), controller.recordEvent)
