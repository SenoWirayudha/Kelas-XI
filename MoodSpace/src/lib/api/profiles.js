import { apiRequest } from './client'

export const getPublicProfile = async (username) => (
  apiRequest(`/users/${encodeURIComponent(username)}/profile`)
)
