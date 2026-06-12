import { apiRequest } from './client'

export const getNotifications = async ({ page = 1, pageSize = 20 } = {}) => (
  apiRequest(`/notifications?page=${page}&pageSize=${pageSize}`)
)

export const getUnreadCount = async () => (
  apiRequest('/notifications/unread-count')
)

export const markAsRead = async (id) => (
  apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })
)

export const markAllAsRead = async () => (
  apiRequest('/notifications/read-all', { method: 'POST' })
)
