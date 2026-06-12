import { Router } from 'express'
import { authRequired, optionalAuth } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import { createCommentSchema, deleteCommentSchema, listCommentsSchema } from './comments.validation.js'
import * as controller from './comments.controller.js'

export const commentsRouter = Router()

commentsRouter.get('/:postId/comments', optionalAuth, validate(listCommentsSchema), controller.listComments)
commentsRouter.post('/:postId/comments', authRequired, validate(createCommentSchema), controller.createComment)
commentsRouter.delete('/comments/:commentId', authRequired, validate(deleteCommentSchema), controller.deleteComment)
