const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

let accessToken = localStorage.getItem('moodspace_access_token') || null
let refreshPromise = null

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const setAccessToken = (token) => {
  accessToken = token || null
  if (accessToken) {
    localStorage.setItem('moodspace_access_token', accessToken)
  } else {
    localStorage.removeItem('moodspace_access_token')
  }
}

export const getAccessToken = () => accessToken

const parseResponse = async (response) => {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const normalizeError = (response, payload) => {
  const apiError = payload?.error
  return new ApiError(apiError?.message || `Request failed with ${response.status}`, {
    status: response.status,
    code: apiError?.code || 'REQUEST_FAILED',
    details: apiError?.details || null,
  })
}

const normalizeNetworkError = (error) => {
  if (error instanceof TypeError) {
    return new ApiError('Backend server tidak berjalan', {
      status: 0,
      code: 'BACKEND_OFFLINE',
      details: { cause: error.message },
    })
  }

  return error
}

export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then(async (response) => {
        const payload = await parseResponse(response)
        if (!response.ok) throw normalizeError(response, payload)
        setAccessToken(payload.accessToken)
        return payload.accessToken
      })
      .catch((error) => {
        throw normalizeNetworkError(error)
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const apiRequest = async (path, options = {}) => {
  const {
    method = 'GET',
    body,
    headers,
    auth = true,
    retry = true,
    keepalive = false,
  } = options

  const requestHeaders = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(headers || {}),
  }

  if (auth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      keepalive,
    })
  } catch (error) {
    throw normalizeNetworkError(error)
  }

  const payload = await parseResponse(response)

  if (response.status === 401 && auth && retry) {
    try {
      const nextToken = await refreshAccessToken()
      if (nextToken) {
        return apiRequest(path, { ...options, retry: false })
      }
    } catch {
      setAccessToken(null)
    }
  }

  if (!response.ok) throw normalizeError(response, payload)

  return payload
}

export { API_BASE_URL }
