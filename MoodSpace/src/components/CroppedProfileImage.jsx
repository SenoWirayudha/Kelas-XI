import { useEffect, useMemo, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function CroppedProfileImage({
  src,
  crop,
  className = '',
  fallback,
  circle = false,
}) {
  const frameRef = useRef(null)
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [imageSize, setImageSize] = useState({
    width: crop?.naturalWidth || 0,
    height: crop?.naturalHeight || 0,
  })

  useEffect(() => {
    if (!frameRef.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setFrameSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(frameRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!src) return undefined
    const image = new Image()
    image.onload = () => {
      setImageSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }
    image.src = src
    return undefined
  }, [src])

  const imageStyle = useMemo(() => {
    if (!src || !frameSize.width || !frameSize.height || !imageSize.width || !imageSize.height) return null
    const zoom = crop?.zoom || 1
    const baseScale = Math.max(frameSize.width / imageSize.width, frameSize.height / imageSize.height)
    const renderW = imageSize.width * baseScale
    const renderH = imageSize.height * baseScale
    const rawX = (crop?.cropX || 0) * frameSize.width
    const rawY = (crop?.cropY || 0) * frameSize.height
    const limitX = Math.max(0, ((renderW * zoom) - frameSize.width) / 2)
    const limitY = Math.max(0, ((renderH * zoom) - frameSize.height) / 2)

    return {
      width: `${renderW}px`,
      height: `${renderH}px`,
      transform: `translate(-50%, -50%) translate(${clamp(rawX, -limitX, limitX)}px, ${clamp(rawY, -limitY, limitY)}px) scale(${zoom})`,
    }
  }, [
    crop?.cropX,
    crop?.cropY,
    crop?.zoom,
    frameSize.height,
    frameSize.width,
    imageSize.height,
    imageSize.width,
    src,
  ])

  return (
    <div ref={frameRef} className={`cropped-profile-image ${circle ? 'circle' : ''} ${className}`}>
      {src && imageStyle ? (
        <img src={src} alt="" draggable={false} style={imageStyle} />
      ) : (
        fallback
      )}
    </div>
  )
}

export default CroppedProfileImage
