import multer from 'multer'
import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import { fontIdParamSchema, fontFamilyParamSchema, fontFamilyBodySchema } from './fonts.validation.js'
import * as controller from './fonts.controller.js'

export const fontsRouter = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

fontsRouter.use(authRequired)

fontsRouter.post('/', upload.single('file'), controller.uploadFont)
fontsRouter.get('/', controller.listFonts)
fontsRouter.get('/favorites', controller.listFavorites)
fontsRouter.post('/favorites', validate(fontFamilyBodySchema), controller.addFavorite)
fontsRouter.delete('/favorites/:fontFamily', validate(fontFamilyParamSchema), controller.removeFavorite)
fontsRouter.delete('/:id', validate(fontIdParamSchema), controller.deleteFont)
