import { apiRequest } from './client'

export const getAdminStats = async () => (
  apiRequest('/admin/stats')
)

export const listUsers = async ({ search, role, status, page, pageSize } = {}) => {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (role) params.set('role', role)
  if (status) params.set('status', status)
  if (page) params.set('page', String(page))
  if (pageSize) params.set('pageSize', String(pageSize))
  return apiRequest(`/admin/users?${params}`)
}

export const updateUser = async (id, patch) => (
  apiRequest(`/admin/users/${id}`, { method: 'PATCH', body: patch })
)

export const listPosts = async ({ search, status, page, pageSize } = {}) => {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  if (page) params.set('page', String(page))
  if (pageSize) params.set('pageSize', String(pageSize))
  return apiRequest(`/admin/posts?${params}`)
}

export const deletePost = async (id) => (
  apiRequest(`/admin/posts/${id}`, { method: 'DELETE' })
)

export const listReports = async ({ resolved, page, pageSize } = {}) => {
  const params = new URLSearchParams()
  if (resolved !== undefined) params.set('resolved', String(resolved))
  if (page) params.set('page', String(page))
  if (pageSize) params.set('pageSize', String(pageSize))
  return apiRequest(`/admin/reports?${params}`)
}

export const resolveReport = async (id, resolution) => (
  apiRequest(`/admin/reports/${id}/resolve`, { method: 'PATCH', body: { resolution } })
)

export const listComments = async ({ search, page, pageSize } = {}) => {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (page) params.set('page', String(page))
  if (pageSize) params.set('pageSize', String(pageSize))
  return apiRequest(`/admin/comments?${params}`)
}

export const deleteComment = async (id) => (
  apiRequest(`/admin/comments/${id}`, { method: 'DELETE' })
)

export const listMedia = async ({ page, pageSize } = {}) => {
  const params = new URLSearchParams()
  if (page) params.set('page', String(page))
  if (pageSize) params.set('pageSize', String(pageSize))
  return apiRequest(`/admin/media?${params}`)
}

export const deleteMedia = async (id) => (
  apiRequest(`/admin/media/${id}`, { method: 'DELETE' })
)

export const makeAdmin = async (identifier) => (
  apiRequest('/admin/make-admin', { method: 'POST', body: { identifier } })
)
