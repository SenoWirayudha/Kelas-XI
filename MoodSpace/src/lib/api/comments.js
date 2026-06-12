import { apiRequest } from './client'

export const listComments = async (postId, { cursor } = {}) => (
  apiRequest(`/posts/${postId}/comments${cursor ? `?cursor=${cursor}` : ''}`)
)

export const createComment = async (postId, content) => (
  apiRequest(`/posts/${postId}/comments`, { method: 'POST', body: { content } })
)

export const deleteComment = async (commentId) => (
  apiRequest(`/posts/comments/${commentId}`, { method: 'DELETE' })
)
