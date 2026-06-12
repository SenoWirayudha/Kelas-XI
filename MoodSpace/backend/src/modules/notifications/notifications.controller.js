import * as notificationService from './notifications.service.js'

export const list = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications({
      userId: req.auth.sub,
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
    })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const unreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.auth.sub)
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const read = async (req, res, next) => {
  try {
    const result = await notificationService.readNotification(req.params.id, req.auth.sub)
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const readAll = async (req, res, next) => {
  try {
    await notificationService.readAllNotifications(req.auth.sub)
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
}
