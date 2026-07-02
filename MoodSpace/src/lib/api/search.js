import { apiRequest } from './client'

const withQuery = (path, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  const suffix = params.toString()
  return suffix ? `${path}?${suffix}` : path
}

export const searchPosts = async ({ q = '', tags = '', sort = 'relevance', limit = 30, offset = 0, semantic = false } = {}) => (
  apiRequest(withQuery('/search', { q, tags, sort, limit, offset, semantic }))
)

export const getSearchSuggestions = async ({ q = '', limit = 8 } = {}) => (
  apiRequest(withQuery('/search-suggestions', { q, limit }))
)

export const getSearchHistory = async ({ limit = 8 } = {}) => (
  apiRequest(withQuery('/search/history', { limit }))
)

export const recordSearchHistory = async (query) => (
  apiRequest('/search/history', { method: 'POST', body: { query } })
)

export const clearSearchHistory = async () => (
  apiRequest('/search/history', { method: 'DELETE' })
)
