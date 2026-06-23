import { API_BASE_URL, apiRequest, getAccessToken, refreshAccessToken, setAccessToken } from './client'

export const listFonts = async () => (
  apiRequest('/fonts')
)

export const deleteFont = async (fontId) => (
  apiRequest(`/fonts/${fontId}`, { method: 'DELETE' })
)

export const getFavorites = async () => (
  apiRequest('/fonts/favorites')
)

export const addFavorite = async (fontFamily) => (
  apiRequest('/fonts/favorites', { method: 'POST', body: { fontFamily } })
)

export const removeFavorite = async (fontFamily) => (
  apiRequest(`/fonts/favorites/${encodeURIComponent(fontFamily)}`, { method: 'DELETE' })
)

const uploadFontRequest = ({ file, name, onProgress, retry = true }) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', `${API_BASE_URL}/fonts`)
  xhr.withCredentials = true
  const token = getAccessToken()
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

  xhr.upload.onprogress = (event) => {
    if (!event.lengthComputable) return
    onProgress?.(Math.round((event.loaded / event.total) * 95))
  }

  xhr.onload = async () => {
    let payload
    try {
      payload = xhr.responseText ? JSON.parse(xhr.responseText) : null
    } catch {
      payload = null
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      onProgress?.(100)
      resolve(payload)
      return
    }

    if (xhr.status === 401 && retry) {
      try {
        await refreshAccessToken()
        resolve(uploadFontRequest({ file, name, onProgress, retry: false }))
      } catch {
        setAccessToken(null)
        reject(new Error('Sesi login berakhir. Silakan login kembali.'))
      }
      return
    }

    reject(new Error(payload?.error?.message || `Upload gagal (${xhr.status})`))
  }

  xhr.onerror = () => reject(new Error('Backend server tidak berjalan'))

  const formData = new FormData()
  formData.append('file', file)
  if (name) formData.append('name', name)
  xhr.send(formData)
})

export const uploadFont = ({ file, name, onProgress }) => (
  uploadFontRequest({ file, name, onProgress })
)
