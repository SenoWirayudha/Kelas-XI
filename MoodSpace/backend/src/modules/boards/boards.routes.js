import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import { addBoardItemSchema, boardIdSchema, boardItemIdSchema, createBoardSchema } from './boards.validation.js'
import * as controller from './boards.controller.js'

export const boardsRouter = Router()

boardsRouter.use(authRequired)
boardsRouter.get('/', controller.listBoards)
boardsRouter.post('/', validate(createBoardSchema), controller.createBoard)
boardsRouter.get('/:id', validate(boardIdSchema), controller.getBoard)
boardsRouter.post('/:id/items', validate(addBoardItemSchema), controller.addBoardItem)
boardsRouter.delete('/:id', validate(boardIdSchema), controller.deleteBoard)
boardsRouter.delete('/:id/items/:itemId', validate(boardItemIdSchema), controller.removeBoardItem)
