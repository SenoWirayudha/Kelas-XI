import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const initialZoom = 1.08

const getCropMetrics = ({ frameSize, imageSize, zoom }) => {
  if (!frameSize.width || !frameSize.height || !imageSize.width || !imageSize.height) {
    return { baseScale: 1, renderWidth: 0, renderHeight: 0, limitX: 0, limitY: 0 }
  }

  const baseScale = Math.max(frameSize.width / imageSize.width, frameSize.height / imageSize.height)
  const renderWidth = imageSize.width * baseScale * zoom
  const renderHeight = imageSize.height * baseScale * zoom
  return {
    baseScale,
    renderWidth,
    renderHeight,
    limitX: Math.max(0, (renderWidth - frameSize.width) / 2),
    limitY: Math.max(0, (renderHeight - frameSize.height) / 2),
  }
}

const clampOffsetToImage = (offset, metrics) => ({
  x: clamp(offset.x, -metrics.limitX, metrics.limitX),
  y: clamp(offset.y, -metrics.limitY, metrics.limitY),
})

const loadImage = (url) => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = reject
  image.src = url
})

function CropImageModal({
  isOpen,
  file,
  mode = 'banner',
  aspectRatio = 16 / 5,
  onCancel,
  onSave,
}) {
  const frameRef = useRef(null)
  const pointersRef = useRef(new Map())
  const gestureRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const [imageUrl, setImageUrl] = useState(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!file || !isOpen) {
      console.warn('[CropImageModal] waiting for open file', {
        isOpen,
        hasFile: !!file,
        mode,
      })
      return undefined
    }
    console.warn('[CropImageModal] creating image URL', {
      mode,
      name: file.name,
      type: file.type,
      size: file.size,
    })
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    offsetRef.current = { x: 0, y: 0 }
    zoomRef.current = initialZoom
    setOffset({ x: 0, y: 0 })
    setZoom(initialZoom)
    loadImage(url).then((image) => {
      console.warn('[CropImageModal] image loaded', {
        mode,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      })
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight })
    }).catch((error) => {
      console.error('[CropImageModal] failed to load image', error)
      setImageSize({ width: 0, height: 0 })
    })
    return () => {
      console.warn('[CropImageModal] revoke image URL', { mode })
      URL.revokeObjectURL(url)
    }
  }, [file, isOpen, mode])

  useEffect(() => {
    if (!frameRef.current || !isOpen) return undefined
    const frame = frameRef.current
    const updateFrameSize = () => {
      const rect = frame.getBoundingClientRect()
      console.warn('[CropImageModal] frame size measured', {
        width: rect.width,
        height: rect.height,
        mode,
      })
      setFrameSize({
        width: rect.width,
        height: rect.height,
      })
    }

    updateFrameSize()
    const observer = new ResizeObserver(([entry]) => {
      console.warn('[CropImageModal] frame resize observed', {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
        mode,
      })
      setFrameSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [imageUrl, isOpen, mode, aspectRatio])

  const cropRatio = mode === 'avatar' ? 1 : aspectRatio
  const metrics = useMemo(() => (
    getCropMetrics({ frameSize, imageSize, zoom })
  ), [frameSize, imageSize, zoom])

  const clampOffset = useCallback((nextOffset, nextZoom = zoom) => {
    const nextMetrics = getCropMetrics({ frameSize, imageSize, zoom: nextZoom })
    return clampOffsetToImage(nextOffset, nextMetrics)
  }, [frameSize, imageSize, zoom])

  const renderedOffset = useMemo(() => (
    clampOffsetToImage(offset, metrics)
  ), [metrics, offset])

  const setClampedOffset = useCallback((nextOffset, nextZoom = zoomRef.current) => {
    const next = clampOffset(nextOffset, nextZoom)
    offsetRef.current = next
    setOffset(next)
    return next
  }, [clampOffset])

  useEffect(() => {
    const next = clampOffset(offsetRef.current, zoomRef.current)
    offsetRef.current = next
    setOffset((current) => (
      next.x === current.x && next.y === current.y ? current : next
    ))
  }, [clampOffset, frameSize, imageSize, zoom])

  const getRelativePoint = useCallback((point) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: point.x - rect.left - (rect.width / 2),
      y: point.y - rect.top - (rect.height / 2),
    }
  }, [])

  const applyZoom = useCallback(({
    nextZoom,
    originZoom = zoomRef.current,
    originOffset = offsetRef.current,
    focalPoint = { x: 0, y: 0 },
    translation = { x: 0, y: 0 },
  }) => {
    const clampedZoom = clamp(nextZoom, 1, 5)
    const ratio = clampedZoom / originZoom
    const nextOffset = {
      x: focalPoint.x + ((originOffset.x - focalPoint.x) * ratio) + translation.x,
      y: focalPoint.y + ((originOffset.y - focalPoint.y) * ratio) + translation.y,
    }
    zoomRef.current = clampedZoom
    setZoom(clampedZoom)
    setClampedOffset(nextOffset, clampedZoom)
  }, [setClampedOffset])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !isOpen) return undefined

    const handleWheel = (event) => {
      event.preventDefault()
      const intensity = event.ctrlKey ? 0.006 : 0.0035
      applyZoom({
        nextZoom: zoomRef.current - (event.deltaY * intensity),
        focalPoint: getRelativePoint({ x: event.clientX, y: event.clientY }),
      })
    }

    frame.addEventListener('wheel', handleWheel, { passive: false })
    return () => frame.removeEventListener('wheel', handleWheel)
  }, [applyZoom, getRelativePoint, isOpen, imageUrl])

  if (!isOpen || !file || !imageUrl) {
    console.warn('[CropImageModal] render blocked', {
      isOpen,
      hasFile: !!file,
      hasImageUrl: !!imageUrl,
      mode,
    })
    return null
  }

  const getPinchState = () => {
    const [first, second] = [...pointersRef.current.values()]
    if (!first || !second) return null
    return {
      center: {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      },
      distance: Math.hypot(second.x - first.x, second.y - first.y),
    }
  }

  const startGesture = () => {
    if (pointersRef.current.size >= 2) {
      const pinch = getPinchState()
      if (!pinch) return
      gestureRef.current = {
        type: 'pinch',
        center: pinch.center,
        distance: Math.max(1, pinch.distance),
        offset: offsetRef.current,
        zoom: zoomRef.current,
      }
      return
    }

    const [pointer] = pointersRef.current.values()
    gestureRef.current = pointer ? {
      type: 'drag',
      pointerId: pointer.id,
      point: pointer,
      offset: offsetRef.current,
    } : null
  }

  const handlePointerDown = (event) => {
    event.preventDefault()
    pointersRef.current.set(event.pointerId, {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    })
    event.currentTarget.setPointerCapture?.(event.pointerId)
    startGesture()
  }

  const handlePointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return
    event.preventDefault()
    pointersRef.current.set(event.pointerId, {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    })

    if (pointersRef.current.size >= 2) {
      if (gestureRef.current?.type !== 'pinch') startGesture()
      const gesture = gestureRef.current
      const pinch = getPinchState()
      if (!gesture || !pinch) return
      const nextZoom = gesture.zoom * (pinch.distance / gesture.distance)
      applyZoom({
        nextZoom,
        originZoom: gesture.zoom,
        originOffset: gesture.offset,
        focalPoint: getRelativePoint(gesture.center),
        translation: {
          x: pinch.center.x - gesture.center.x,
          y: pinch.center.y - gesture.center.y,
        },
      })
      return
    }

    const gesture = gestureRef.current
    if (gesture?.type !== 'drag' || gesture.pointerId !== event.pointerId) {
      startGesture()
      return
    }
    setClampedOffset({
      x: gesture.offset.x + event.clientX - gesture.point.x,
      y: gesture.offset.y + event.clientY - gesture.point.y,
    })
  }

  const handlePointerUp = (event) => {
    event.preventDefault()
    pointersRef.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    startGesture()
  }

  const saveCrop = async () => {
    setIsSaving(true)
    onSave({
      file,
      crop: {
        cropX: frameSize.width ? renderedOffset.x / frameSize.width : 0,
        cropY: frameSize.height ? renderedOffset.y / frameSize.height : 0,
        zoom,
        aspectRatio: cropRatio,
        naturalWidth: imageSize.width,
        naturalHeight: imageSize.height,
      },
    })
    setIsSaving(false)
  }

  return (
    <div className="mood-modal-backdrop crop-image-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="mood-modal crop-image-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={onCancel}>
          <X size={18} />
        </button>
        <h2>{mode === 'avatar' ? 'Crop Foto Profil' : 'Crop Backdrop'}</h2>
        <div
          ref={frameRef}
          className={`crop-image-frame ${mode === 'avatar' ? 'circle' : ''}`}
          style={{ aspectRatio: cropRatio }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            style={{
              width: `${imageSize.width * metrics.baseScale}px`,
              height: `${imageSize.height * metrics.baseScale}px`,
              transform: `translate(-50%, -50%) translate(${renderedOffset.x}px, ${renderedOffset.y}px) scale(${zoom})`,
            }}
          />
          <div className={`crop-image-focus ${mode === 'avatar' ? 'circle' : ''}`} aria-hidden="true" />
        </div>
        <p className="crop-image-hint">Drag image untuk mengatur posisi. Gunakan mouse wheel atau trackpad pinch untuk zoom.</p>
        <footer className="mood-modal-actions">
          <button type="button" className="mood-modal-cancel" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button type="button" className="mood-modal-confirm" onClick={saveCrop} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
        </footer>
      </section>
    </div>
  )
}

export default CropImageModal
