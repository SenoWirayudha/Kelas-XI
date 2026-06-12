import { apiRequest } from './client'

export const followUser = async (userId) => (
  apiRequest(`/follows/${userId}`, { method: 'POST' })
)

export const unfollowUser = async (userId) => (
  apiRequest(`/follows/${userId}`, { method: 'DELETE' })
)

export const getFollowers = async (userId) => (
  apiRequest(`/follows/${userId}/followers`)
)

export const getFollowing = async (userId) => (
  apiRequest(`/follows/${userId}/following`)
)
