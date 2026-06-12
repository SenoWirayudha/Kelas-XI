import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import { createReportSchema } from './reports.validation.js'
import * as controller from './reports.controller.js'

export const reportsRouter = Router()

reportsRouter.post('/', authRequired, validate(createReportSchema), controller.createReport)
