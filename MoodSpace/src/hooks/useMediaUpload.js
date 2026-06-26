import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteMediaAsset,
  listUploadedMedia,
  uploadMediaFile,
} from '../lib/api/media'

const maxImageSize = 20 * 1024 * 1024
const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
const bytesToMB = (bytes) => Number((Number(bytes || 0) / (1024 * 1024)).toFixed(3))
const formatBytesMB = (bytes) => `${bytesToMB(bytes)}MB`

const getImageDimensions = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => {
    URL.revokeObjectURL(url)
    resolve({
      width: image.naturalWidth,
      height: image.naturalHeight,
    })
  }
  image.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error('Gagal membaca dimensi gambar'))
  }
  image.src = url
})

const uploadedAssetToCanvasAsset = (asset) => ({
  title: asset.title || 'Uploaded image',
  type: 'image',
  source: asset.media.url,
  imageKey: asset.media.id,
  mediaId: asset.media.id,
  sourceType: asset.media.sourceType || 'upload',
  uploadedAssetId: asset.id,
  isPending: asset.isPending,
  boardName: 'Unggahan',
  description: asset.description || '',
  originalFilename: asset.media.metadata?.originalFilename || asset.title || '',
  w: asset.media.width && asset.media.height && asset.media.width >= asset.media.height ? 230 : 170,
  h: asset.media.width && asset.media.height && asset.media.width >= asset.media.height
    ? Math.round(230 / (asset.media.width / asset.media.height))
    : 230,
  aspectRatio: asset.media.width && asset.media.height ? asset.media.width / asset.media.height : undefined,
})

export function useMediaUpload({ enabled = true } = {}) {
  const [assets, setAssets] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingMediaIds, setDeletingMediaIds] = useState(() => new Set())
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const lastFilesRef = useRef([])

  const refresh = useCallback(async () => {
    if (!enabled) {
      setAssets([])
      return []
    }
    setIsLoading(true)
    setError('')
    try {
      const payload = await listUploadedMedia()
      const uploadAssets = (payload.assets || []).filter((asset) => (
        !asset.media?.sourceType || asset.media.sourceType === 'upload' || asset.media.sourceType === 'project_seed'
      ))
      setAssets(uploadAssets)
      return uploadAssets
    } catch (err) {
      setError(err.message || 'Gagal memuat unggahan')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    // Upload library bootstrap loads persisted user assets after auth state is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  const uploadFiles = useCallback(async (fileList) => {
    if (!enabled) return []
    const files = Array.from(fileList || [])
    lastFilesRef.current = files
    if (!files.length) return []

    setIsUploading(true)
    setProgress(0)
    setError('')
    const uploaded = []

    try {
      for (const file of files) {
        if (!allowedTypes.has(file.type)) throw new Error('File harus berupa gambar PNG, JPG, WEBP, atau GIF')
        if (file.size > maxImageSize) {
          throw new Error(`Ukuran file ${formatBytesMB(file.size)} melebihi limit ${formatBytesMB(maxImageSize)}`)
        }

        const optimisticUrl = URL.createObjectURL(file)
        const optimistic = {
          id: `optimistic-${file.name}-${Date.now()}`,
          title: file.name,
          visibility: 'private',
          media: {
            id: `pending-${file.name}`,
            url: optimisticUrl,
            mimeType: file.type,
            sizeBytes: file.size,
          },
          isPending: true,
        }
        setAssets((current) => [optimistic, ...current])

        const dimensions = await getImageDimensions(file)
        const completed = await uploadMediaFile({
          file,
          width: dimensions.width,
          height: dimensions.height,
          onProgress: setProgress,
        })

        URL.revokeObjectURL(optimisticUrl)
        setAssets((current) => current.filter((asset) => asset.id !== optimistic.id))
        uploaded.push(completed.asset)
        setProgress(100)
      }

      await refresh()
      return uploaded
    } catch (err) {
      setError(err.message || 'Upload gagal')
      setAssets((current) => current.filter((asset) => !asset.isPending))
      return uploaded
    } finally {
      setIsUploading(false)
    }
  }, [enabled, refresh])

  const retryUpload = useCallback(() => uploadFiles(lastFilesRef.current), [uploadFiles])

  const removeAsset = useCallback(async (mediaId) => {
    if (!enabled || !mediaId) return
    setError('')
    const previous = assets
    setDeletingMediaIds((current) => new Set(current).add(mediaId))
    setAssets((current) => current.filter((asset) => asset.media.id !== mediaId))
    try {
      await deleteMediaAsset(mediaId)
      await refresh()
    } catch (err) {
      setAssets(previous)
      setError(err.message || 'Gagal menghapus unggahan')
    } finally {
      setDeletingMediaIds((current) => {
        const next = new Set(current)
        next.delete(mediaId)
        return next
      })
    }
  }, [assets, enabled, refresh])

  const canvasAssets = useMemo(() => assets
    .filter((asset) => asset.media?.url)
    .map(uploadedAssetToCanvasAsset), [assets])

  return {
    assets,
    canvasAssets,
    isLoading,
    isUploading,
    deletingMediaIds,
    progress,
    error,
    refresh,
    uploadFiles,
    retryUpload,
    removeAsset,
  }
}
