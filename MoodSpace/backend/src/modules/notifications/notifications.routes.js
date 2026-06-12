import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import * as controller from './notifications.controller.js'

export const notificationsRouter = Router()

notificationsRouter.get('/', authRequired, controller.list)
notificationsRouter.get('/unread-count', authRequired, controller.unreadCount)
notificationsRouter.patch('/:id/read', authRequired, controller.read)
notificationsRouter.post('/read-all', authRequired, controller.readAll)
