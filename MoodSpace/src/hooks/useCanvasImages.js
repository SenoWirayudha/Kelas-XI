/**
 * useCanvasImages.js
 * Custom hooks that load Image elements for use in Konva KonvaImage nodes.
 */
import { useEffect, useState } from 'react'

/**
 * Load a single image by src.
 * Returns the HTMLImageElement once loaded, or null while loading / on error.
 */
export function useCanvasImage(src) {
  const [image, setImage] = useState(null)

  useEffect(() => {
    let cancelled = false

    if (!src) {
      Promise.resolve().then(() => { if (!cancelled) setImage(null) })
      return undefined
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img._moodspaceSrc = src
    img.onload  = () => { if (!cancelled) setImage(img) }
    img.onerror = () => { if (!cancelled) setImage(null) }
    img.src     = src

    return () => { cancelled = true }
  }, [src])

  return image
}

/**
 * Load multiple images in parallel.
 * @param {string[]} srcArray  array of image src strings (may contain null/undefined)
 * @returns {Object} map of { [index]: HTMLImageElement | null }
 */
export function useCanvasImages(srcArray) {
  const [images, setImages] = useState({})
  // Use a stable string key so the effect only re-runs when the list actually changes
  const srcKey = srcArray?.join('|') || ''

  useEffect(() => {
    let cancelled = false

    if (!srcArray || srcArray.length === 0) {
      Promise.resolve().then(() => { if (!cancelled) setImages({}) })
      return () => { cancelled = true }
    }

    // Reset any slot whose src has changed so stale images don't flash
    Promise.resolve().then(() => {
      if (cancelled) return
      setImages((prev) => {
        const next = {}
        srcArray.forEach((src, idx) => {
          next[idx] = src && prev[idx]?._moodspaceSrc === src ? prev[idx] : null
        })
        return next
      })
    })

    srcArray.forEach((src, idx) => {
      if (!src) return
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img._moodspaceSrc = src
      img.onload  = () => { if (!cancelled) setImages((prev) => ({ ...prev, [idx]: img })) }
      img.onerror = () => { if (!cancelled) setImages((prev) => ({ ...prev, [idx]: null })) }
      img.src  = src
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcKey])

  return images
}
