import { apiRequest } from './client'

const withQuery = (path, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  const suffix = params.toString()
  return suffix ? `${path}?${suffix}` : path
}

export const getHomeFeed = async ({ cursor, limit = 20, mode = 'for-you', seed } = {}) => (
  apiRequest(withQuery('/feed', { cursor, limit, mode, seed }))
)

export const getUserPosts = async (username, { cursor, limit = 30 } = {}) => (
  apiRequest(withQuery(`/users/${encodeURIComponent(username)}/posts`, { cursor, limit }))
)

export const getSavedPosts = async ({ cursor, limit = 30 } = {}) => (
  apiRequest(withQuery('/posts/saved', { cursor, limit }))
)

export const getPost = async (postId) => (
  apiRequest(`/posts/${postId}`)
)

export const getRecommendedPosts = async (postId, { limit = 8, offset = 0 } = {}) => (
  apiRequest(withQuery(`/posts/${postId}/recommended`, { limit, offset }))
)

export const getSimilarPostsByImage = async (imageId, { limit = 12 } = {}) => (
  apiRequest(withQuery(`/posts/similar/${imageId}`, { limit }))
)

export const savePost = async (postId) => (
  apiRequest(`/posts/${postId}/save`, { method: 'POST', body: {} })
)

export const unsavePost = async (postId) => (
  apiRequest(`/posts/${postId}/save`, { method: 'DELETE' })
)

export const likePost = async (postId) => (
  apiRequest(`/posts/${postId}/like`, { method: 'POST', body: {} })
)

export const unlikePost = async (postId) => (
  apiRequest(`/posts/${postId}/like`, { method: 'DELETE' })
)

export const publishWorkspace = async (body) => (
  apiRequest('/posts/publish-workspace', { method: 'POST', body })
)

export const createMediaPost = async (body) => (
  apiRequest('/posts', { method: 'POST', body })
)

export const createMediaPostDraft = async (body) => (
  apiRequest('/posts/drafts', { method: 'POST', body })
)

export const updateMediaPostDraft = async (postId, body) => (
  apiRequest(`/posts/${postId}/draft`, { method: 'PUT', body })
)

export const publishMediaPostDraft = async (postId) => (
  apiRequest(`/posts/${postId}/publish`, { method: 'POST', body: {} })
)

export const updatePost = async (postId, body) => (
  apiRequest(`/posts/${postId}`, { method: 'PUT', body })
)

export const deletePost = async (postId) => (
  apiRequest(`/posts/${postId}`, { method: 'DELETE' })
)
