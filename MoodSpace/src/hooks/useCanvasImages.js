/**
 * useCanvasImages.js
 * Custom hooks that load Image elements for use in Konva KonvaImage nodes.
 */
import { useEffect, useRef, useState } from 'react'

const imageCache = new Map()
const subscribers = new Map()

function subscribe(src, cb) {
  if (!subscribers.has(src)) subscribers.set(src, new Set())
  subscribers.get(src).add(cb)
  return () => {
    const set = subscribers.get(src)
    if (set) { set.delete(cb); if (set.size === 0) subscribers.delete(src) }
  }
}

function notify(src) {
  const set = subscribers.get(src)
  if (set) set.forEach((cb) => cb())
}

function ensureImage(src) {
  if (!src || imageCache.has(src)) return
  const img = new window.Image()
  img.crossOrigin = 'anonymous'
  img._moodspaceSrc = src
  imageCache.set(src, null) // placeholder
  img.onload = () => {
    imageCache.set(src, img)
    notify(src)
  }
  img.onerror = () => {
    imageCache.set(src, null)
    notify(src)
  }
  img.src = src
}

function getCached(src) {
  if (!src) return null
  const cached = imageCache.get(src)
  if (cached && (cached.complete || cached.naturalWidth || cached.width)) return cached
  return null
}

/**
 * Load a single image by src.
 * Returns the HTMLImageElement once loaded, or null while loading / on error.
 * Uses a module-level cache so the same src across components doesn't create duplicate Image elements.
 */
export function useCanvasImage(src) {
  const [image, setImage] = useState(() => getCached(src))

  useEffect(() => {
    if (!src) { setImage(null); return }
    const cached = getCached(src)
    if (cached) { setImage(cached); return }
    ensureImage(src)

    // Subscribe to onload/onerror for this src
    const unsub = subscribe(src, () => {
      setImage(getCached(src))
    })

    // Also check once more in case the image loaded between our getCached and subscribe calls
    const cached2 = getCached(src)
    if (cached2) setImage(cached2)

    return unsub
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
  const srcKey = srcArray?.join('|') || ''
  const subsRef = useRef([])

  useEffect(() => {
    if (!srcArray || srcArray.length === 0) { setImages({}); return }

    // Ensure all images start loading
    srcArray.forEach((src) => { if (src) ensureImage(src) })

    const buildMap = () => {
      const next = {}
      let allReady = true
      srcArray.forEach((src, idx) => {
        if (!src) { next[idx] = null; return }
        const cached = getCached(src)
        next[idx] = cached
        if (!cached) allReady = false
      })
      setImages(next)
      return allReady
    }

    // Initial check
    const allDone = buildMap()
    if (allDone) return

    // Subscribe to each src
    const unsubs = []
    srcArray.forEach((src) => {
      if (!src) return
      unsubs.push(subscribe(src, () => {
        const m = buildMap()
        if (m) unsubs.forEach((fn) => fn())
      }))
    })

    return () => { unsubs.forEach((fn) => fn()) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcKey])

  return images
}
