import { Router } from 'express'
import { optionalAuth } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import { createFeedbackSchema } from './feedback.validation.js'
import * as controller from './feedback.controller.js'

export const feedbackRouter = Router()

feedbackRouter.post('/', optionalAuth, validate(createFeedbackSchema), controller.createFeedback)
