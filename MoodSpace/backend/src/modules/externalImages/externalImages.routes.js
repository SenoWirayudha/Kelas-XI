import { Router } from 'express'
import { authRequired, optionalAuth } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import * as controller from './externalImages.controller.js'
import {
  externalImageEnsureSchema,
  externalImageIdSchema,
  externalImageSavedListSchema,
  externalImageSaveSchema,
  externalImageSearchSchema,
} from './externalImages.validation.js'

export const externalImagesRouter = Router()

externalImagesRouter.get('/search', optionalAuth, validate(externalImageSearchSchema), controller.search)
externalImagesRouter.get('/saved', authRequired, validate(externalImageSavedListSchema), controller.saved)
externalImagesRouter.post('/ensure', validate(externalImageEnsureSchema), controller.ensure)
externalImagesRouter.post('/save', authRequired, validate(externalImageSaveSchema), controller.save)
externalImagesRouter.get('/:id', optionalAuth, validate(externalImageIdSchema), controller.get)
externalImagesRouter.delete('/:id/save', authRequired, validate(externalImageIdSchema), controller.unsave)
