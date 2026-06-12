import { API_BASE_URL, apiRequest, getAccessToken, refreshAccessToken, setAccessToken } from './client'

export const signMediaUpload = async ({ filename, mimeType, sizeBytes, sourceType = 'upload' }) => (
  apiRequest('/media/uploads/sign', {
    method: 'POST',
    body: { filename, mimeType, sizeBytes, sourceType },
  })
)

export const completeMediaUpload = async ({ mediaId, title, description, visibility, width, height, sizeBytes, metadata }) => (
  apiRequest('/media/uploads/complete', {
    method: 'POST',
    body: {
      mediaId,
      title,
      description,
      visibility,
      width,
      height,
      sizeBytes,
      metadata,
    },
  })
)

export const listUploadedMedia = async () => (
  apiRequest('/media/uploads')
)

export const deleteMediaAsset = async (mediaId) => (
  apiRequest(`/media/${mediaId}`, { method: 'DELETE' })
)

const uploadMediaFileRequest = ({ file, width, height, sourceType = 'upload', addToUploads = true, onProgress, retry = true }) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', `${API_BASE_URL}/media/uploads/file`)
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
        resolve(uploadMediaFileRequest({ file, width, height, sourceType, addToUploads, onProgress, retry: false }))
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
  if (width) formData.append('width', String(width))
  if (height) formData.append('height', String(height))
  if (sourceType) formData.append('sourceType', sourceType)
  formData.append('addToUploads', addToUploads ? 'true' : 'false')
  xhr.send(formData)
})

export const uploadMediaFile = ({ file, width, height, sourceType, addToUploads, onProgress }) => (
  uploadMediaFileRequest({ file, width, height, sourceType, addToUploads, onProgress })
)
