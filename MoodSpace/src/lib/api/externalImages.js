import { apiRequest } from './client'

const withQuery = (path, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  const suffix = params.toString()
  return suffix ? `${path}?${suffix}` : path
}

export const searchExternalImages = async ({ q = '', limit = 12, cursor, context, mode, seed, tmdbId, mediaType, visualType } = {}) => (
  apiRequest(withQuery('/external-images/search', { q, limit, cursor, context, mode, seed, tmdbId, mediaType, visualType }))
)

export const ensureExternalImage = async (image) => (
  apiRequest('/external-images/ensure', { method: 'POST', body: { image } })
)

export const getExternalImage = async (id) => (
  apiRequest(`/external-images/${encodeURIComponent(id)}`)
)

export const saveExternalImage = async (image) => (
  apiRequest('/external-images/save', { method: 'POST', body: { image } })
)

export const unsaveExternalImage = async (id) => (
  apiRequest(`/external-images/${encodeURIComponent(id)}/save`, { method: 'DELETE' })
)

export const getSavedExternalImages = async ({ limit = 30 } = {}) => (
  apiRequest(withQuery('/external-images/saved', { limit }))
)
