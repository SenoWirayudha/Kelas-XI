/**
 * konvaUtils.js
 * Helpers for Konva filter props, shadow props, canvas background,
 * image metadata loading, and font preloading.
 */
import Konva from 'konva'
import { imageMaxSize } from '../constants/canvasConstants'
import { SYSTEM_FONTS } from '../constants/uiConstants'

// ─── Image filters ────────────────────────────────────────────────────────────

export const getImageFilterProps = (item) => ({
  filters: [
    Konva.Filters.Brighten,
    Konva.Filters.Contrast,
    Konva.Filters.HSL,
    Konva.Filters.Blur,
  ],
  brightness: (item.brightness ?? 0) / 100,
  contrast:    item.contrast   ?? 0,
  saturation: (item.saturation ?? 0) / 100,
  blurRadius:  item.blur       ?? 0,
})

// ─── Drop shadow ──────────────────────────────────────────────────────────────

export const getShadowProps = (item, fallback = {}) => {
  if (!item.shadowEnabled || (item.shadow ?? 0) <= 0) return {}
  return {
    shadowColor:   item.shadowColor   || fallback.shadowColor   || '#050505',
    shadowBlur:    item.shadow ?? 0,
    shadowOpacity: item.shadowOpacity ?? fallback.shadowOpacity ?? 0.35,
    shadowOffsetX: item.shadowOffsetX ?? fallback.shadowOffsetX ?? 0,
    shadowOffsetY: item.shadowOffsetY ?? fallback.shadowOffsetY ?? 4,
  }
}

// ─── Canvas background fill props ────────────────────────────────────────────

export const getCanvasBackgroundProps = (background, canvasSize) => {
  if (!background || background.type === 'transparent') return { fill: 'transparent' }
  if (background.type === 'gradient') {
    const angle  = ((background.angle ?? 90) * Math.PI) / 180
    const radius = Math.max(canvasSize.width, canvasSize.height)
    const cx     = canvasSize.width  / 2
    const cy     = canvasSize.height / 2
    return {
      fillLinearGradientStartPoint:      { x: cx - Math.cos(angle) * radius / 2, y: cy - Math.sin(angle) * radius / 2 },
      fillLinearGradientEndPoint:        { x: cx + Math.cos(angle) * radius / 2, y: cy + Math.sin(angle) * radius / 2 },
      fillLinearGradientColorStops: [0, background.from || '#f4f1e8', 1, background.to || '#d8d2ff'],
    }
  }
  return { fill: background.color || '#f4f1e8' }
}

// ─── Image metadata loading ───────────────────────────────────────────────────

const getContainedImageSize = ({ naturalWidth, naturalHeight }, maxSize = imageMaxSize) => {
  const safeWidth  = naturalWidth  || maxSize
  const safeHeight = naturalHeight || maxSize
  const scale      = Math.min(maxSize / safeWidth, maxSize / safeHeight, 1)
  return {
    w:           Math.round(safeWidth  * scale),
    h:           Math.round(safeHeight * scale),
    aspectRatio: safeWidth / safeHeight,
  }
}

export const loadImageMetadata = (src) => new Promise((resolve) => {
  const img = new window.Image()
  img.crossOrigin = 'anonymous'
  img.onload  = () => resolve(getContainedImageSize(img))
  img.onerror = () => resolve(getContainedImageSize({ naturalWidth: imageMaxSize, naturalHeight: imageMaxSize }))
  img.src = src
})

// ─── Font preloading (lazy-loads Google Fonts on demand) ──────────────────────

const fontLoadCache = new Map()

const injectGoogleFontLink = (fontName) => {
  const family = fontName.replace(/ /g, '+')
  const href   = `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700;800&display=swap`
  const link   = document.createElement('link')
  link.rel  = 'stylesheet'
  link.href = href
  link.onerror = () => {} // swallow
  document.head.appendChild(link)

  return new Promise((resolve) => {
    link.onload = () => {
      document.fonts.load(`16px "${fontName}"`).then(() => resolve()).catch(() => resolve())
    }
    // fallback: resolve anyway after a timeout so canvas never hangs
    setTimeout(resolve, 3000)
  })
}

export const preloadFont = (fontFamily) => {
  if (!fontFamily) return Promise.resolve()
  const primaryFont = fontFamily.split(',')[0].trim()
  if (fontLoadCache.has(primaryFont)) return fontLoadCache.get(primaryFont)

  const isSystemFont = SYSTEM_FONTS.has(primaryFont)
  const promise = isSystemFont
    ? document.fonts.load(`16px "${primaryFont}"`).catch(() => {})
    : injectGoogleFontLink(primaryFont)

  fontLoadCache.set(primaryFont, promise)
  return promise
}
