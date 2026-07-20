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

// ─── Bevel & Emboss ──────────────────────────────────────────────────────────

export const getBevelEmbossProps = (item) => {
  if (!item.bevelEmbossEnabled) return {}
  return {
    bevelEmbossStyle: item.bevelEmbossStyle || 'inner',
    bevelEmbossDepth: item.bevelEmbossDepth ?? 5,
    bevelEmbossAngle: item.bevelEmbossAngle ?? 120,
    bevelEmbossSoftness: item.bevelEmbossSoftness ?? 5,
    bevelEmbossHighlightColor: item.bevelEmbossHighlightColor || '#ffffff',
    bevelEmbossHighlightOpacity: item.bevelEmbossHighlightOpacity ?? 1,
    bevelEmbossShadowColor: item.bevelEmbossShadowColor || '#000000',
    bevelEmbossShadowOpacity: item.bevelEmbossShadowOpacity ?? 1,
  }
}

/**
 * Apply bevel & emboss effect to a Konva node.
 * Wires Konva.Filters.BevelEmboss into the node's filter chain and re-caches
 * with appropriate padding so the height-map effect is not clipped.
 * Call this AFTER effectManager.applyAll().
 */
export const applyBevelEmbossToNode = (node, item) => {
  if (!node) return
  if (item.isAdjustmentLayer) return

  const existingFilters = node.filters() || []
  const hasBevelFilter = existingFilters.includes(Konva.Filters.BevelEmboss)

  if (item.bevelEmbossEnabled) {
    if (!hasBevelFilter) {
      node.filters([...existingFilters, Konva.Filters.BevelEmboss])
    }
    const bevelProps = getBevelEmbossProps(item)
    for (const [k, v] of Object.entries(bevelProps)) {
      node.setAttr(k, v)
    }
    const depth = item.bevelEmbossDepth ?? 5
    const soft = item.bevelEmbossSoftness ?? 5
    const pad = Math.max(10, Math.ceil(depth * 3 + soft * 2))
    const pr = Math.min(window.devicePixelRatio || 1, 2)
    const w = typeof node.width === 'function' ? (node.width() || 0) : (node.getAttr('width') || 0)
    const h = typeof node.height === 'function' ? (node.height() || 0) : (node.getAttr('height') || 0)
    if (w > 0 && h > 0) {
      node.cache({ x: -pad, y: -pad, width: w + pad * 2, height: h + pad * 2, pixelRatio: pr })
    }
  } else if (hasBevelFilter) {
    const filtered = existingFilters.filter(f => f !== Konva.Filters.BevelEmboss)
    node.filters(filtered)
    node.clearCache()
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

const isFontAvailable = (fontName) => {
  try {
    return document.fonts?.check(`16px "${fontName}"`)
  } catch {
    return false
  }
}

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
  const isAlreadyLoaded = isFontAvailable(primaryFont)
  const promise = isSystemFont || isAlreadyLoaded
    ? document.fonts.load(`16px "${primaryFont}"`).catch(() => {})
    : injectGoogleFontLink(primaryFont)

  fontLoadCache.set(primaryFont, promise)
  return promise
}

export const clearFontCache = (fontName) => {
  const primaryFont = fontName.split(',')[0].trim()
  fontLoadCache.delete(primaryFont)
}

export const clearAllFontCache = () => {
  fontLoadCache.clear()
}
