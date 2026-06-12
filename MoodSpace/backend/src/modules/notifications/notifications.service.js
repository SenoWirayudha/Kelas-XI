import * as repo from './notifications.repository.js'

export const getNotifications = async ({ userId, page = 1, pageSize = 20 }) => {
  const limit = Math.min(pageSize, 50)
  const offset = ((page || 1) - 1) * limit

  const [items, unreadCount] = await Promise.all([
    repo.findByUserId({ userId, limit, offset }),
    repo.countUnread(userId),
  ])

  return { items, unreadCount, page, pageSize: limit }
}

export const getUnreadCount = async (userId) => {
  const total = await repo.countUnread(userId)
  return { total }
}

export const readNotification = async (notificationId, userId) => {
  const result = await repo.markAsRead(notificationId, userId)
  if (!result) throw new Error('Notification not found')
  return result
}

export const readAllNotifications = async (userId) => {
  await repo.markAllAsRead(userId)
}
