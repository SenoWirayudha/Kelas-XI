import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAspectRatio } from '../utils/aspectRatioMap'
import { getImageSource } from '../utils/imageSources'

function MasonryImage({
  imageKey,
  alt,
  className = '',
  fallbackRatio,
  children,
  onMeasure,
}) {
  const frameRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [naturalRatio, setNaturalRatio] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const source = useMemo(() => getImageSource(imageKey), [imageKey])
  const initialRatio = fallbackRatio || getAspectRatio(imageKey, 1)
  const heightRatio = naturalRatio || 1 / initialRatio
  const calculatedHeight = containerWidth > 0 ? containerWidth * heightRatio : undefined

  useEffect(() => {
    if (!frameRef.current) return undefined

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })

    observer.observe(frameRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (calculatedHeight && onMeasure) {
      onMeasure(calculatedHeight)
    }
  }, [calculatedHeight, onMeasure])

  const handleLoad = useCallback((event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget

    if (naturalWidth > 0 && naturalHeight > 0) {
      setNaturalRatio(naturalHeight / naturalWidth)
    }

    setIsLoaded(true)
  }, [])

  return (
    <div
      ref={frameRef}
      className={`masonry-image-frame ${isLoaded ? 'is-loaded' : 'is-loading'} ${className}`}
      style={{
        '--masonry-fallback-ratio': `${initialRatio}`,
        height: calculatedHeight ? `${calculatedHeight}px` : undefined,
      }}
    >
      {!isLoaded && <div className="masonry-image-skeleton" aria-hidden="true" />}
      <img
        className="masonry-image"
        src={source}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
      />
      {children}
    </div>
  )
}

export default MasonryImage
