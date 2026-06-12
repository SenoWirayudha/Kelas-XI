import { Router } from 'express'
import { adminRequired } from '../../middleware/adminRequired.js'
import { validate } from '../../middleware/validate.js'
import {
  updateUserSchema,
  resolveReportSchema,
  makeAdminSchema,
} from './admin.validation.js'
import * as controller from './admin.controller.js'

export const adminRouter = Router()

adminRouter.get('/stats', adminRequired, controller.getStats)

adminRouter.get('/users', adminRequired, controller.listUsers)
adminRouter.patch('/users/:id', adminRequired, validate(updateUserSchema), controller.patchUser)

adminRouter.get('/posts', adminRequired, controller.listPosts)
adminRouter.delete('/posts/:id', adminRequired, controller.deletePost)

adminRouter.get('/reports', adminRequired, controller.listReports)
adminRouter.patch('/reports/:id/resolve', adminRequired, validate(resolveReportSchema), controller.resolveReport)

adminRouter.get('/comments', adminRequired, controller.listComments)
adminRouter.delete('/comments/:id', adminRequired, controller.deleteComment)

adminRouter.get('/media', adminRequired, controller.listMedia)
adminRouter.delete('/media/:id', adminRequired, controller.deleteMedia)

adminRouter.post('/make-admin', adminRequired, validate(makeAdminSchema), controller.makeAdmin)
