import { apiRequest, setAccessToken } from './client'

const storeAuth = (payload) => {
  if (payload?.accessToken) setAccessToken(payload.accessToken)
  return payload
}

export const registerUser = async ({ email, username, password, displayName }) => (
  storeAuth(await apiRequest('/auth/register', {
    method: 'POST',
    auth: false,
    body: { email, username, password, displayName },
  }))
)

export const loginUser = async ({ identifier, password }) => (
  storeAuth(await apiRequest('/auth/login', {
    method: 'POST',
    auth: false,
    body: { identifier, password },
  }))
)

export const refreshSession = async () => (
  storeAuth(await apiRequest('/auth/refresh', {
    method: 'POST',
    auth: false,
    body: {},
  }))
)

export const fetchCurrentUser = async () => (
  apiRequest('/auth/me')
)

export const updateCurrentProfile = async (body) => (
  apiRequest('/auth/me/profile', {
    method: 'PATCH',
    body,
  })
)

export const logoutUser = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST', auth: false, body: {} })
  } finally {
    setAccessToken(null)
  }
}
