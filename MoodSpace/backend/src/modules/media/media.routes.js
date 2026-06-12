import multer from 'multer'
import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import {
  completeUploadSchema,
  mediaIdParamSchema,
  signUploadSchema,
} from './media.validation.js'
import * as controller from './media.controller.js'

export const mediaRouter = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
})

mediaRouter.use(authRequired)
mediaRouter.post('/uploads/file', upload.single('file'), controller.uploadFile)
mediaRouter.post('/uploads/sign', validate(signUploadSchema), controller.signUpload)
mediaRouter.post('/uploads/complete', validate(completeUploadSchema), controller.completeUpload)
mediaRouter.get('/uploads', controller.listUploads)
mediaRouter.delete('/:id', validate(mediaIdParamSchema), controller.deleteMedia)
