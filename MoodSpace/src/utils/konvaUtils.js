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
    bevelEmbossHighlightBlendMode: item.bevelEmbossHighlightBlendMode || 'linear-dodge',
    bevelEmbossShadowBlendMode: item.bevelEmbossShadowBlendMode || 'linear-burn',
  }
}

/**
 * Apply bevel & emboss effect to a Konva node.
 * Wires Konva.Filters.BevelEmboss into the node's filter chain and re-caches
 * with appropriate padding so the height-map effect is not clipped.
 * Call this AFTER effectManager.applyAll().
 */
const DEBUG_BEVEL_CACHE = true

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
    const pad = Math.max(10, Math.ceil(soft * 2 + depth))
    const pr = Math.min(window.devicePixelRatio || 1, 3)

    // Detect transparent fill for non-image items — these need the
    // dual-buffer approach (real-fill cache + solid-fill mask cache).
    const hasTransparentFill = item.kind !== 'image' && (item.fill === undefined || item.fill === null || item.fill === '' || item.fill === 'transparent' || item.fill === 'none')
    const visChild = typeof node.getChildren === 'function' ? node.getChildren()[0] : node
    const canOverride = visChild && typeof visChild.fill === 'function'

    // Get content bounding box.
    // Priority: explicit node width/height (Image, Text) → item.w/item.h → getClientRect.
    let cX = 0, cY = 0, cW = 0, cH = 0
    const explicitW = typeof node.width === 'function' ? (node.width() || 0) : (node.getAttr('width') || 0)
    const explicitH = typeof node.height === 'function' ? (node.height() || 0) : (node.getAttr('height') || 0)
    if (explicitW > 0 && explicitH > 0) {
      cX = 0; cY = 0
      cW = explicitW; cH = explicitH
    } else if ((item.w || 0) > 0 && (item.h || 0) > 0) {
      cX = 0; cY = 0
      cW = item.w; cH = item.h
    } else {
      const cr = node.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true })
      cX = cr.x || 0; cY = cr.y || 0
      cW = cr.width;  cH = cr.height
    }

    if (cW > 0 && cH > 0) {
      // --- Dual-buffer setup for transparent-fill items ---
      // Step 1: Cache with the actual fill (may be transparent). This
      // becomes the "real" render used for base colour/alpha.
      node.clearCache()
      node.cache({ x: cX - pad, y: cY - pad, width: cW + pad * 2, height: cH + pad * 2, pixelRatio: pr })

      if (hasTransparentFill && canOverride) {
        // Read the real-fill cache's pixel data before we overwrite it.
        const cacheCanvas = typeof node._getCacheCanvas === 'function' && node._getCacheCanvas()
        if (cacheCanvas) {
          const ctx = cacheCanvas.getContext('2d')
          const realData = ctx.getImageData(0, 0, cacheCanvas.width, cacheCanvas.height)
          node.setAttr('_bevelRealImageData', realData)
        } else {
          node.setAttr('_bevelRealImageData', null)
        }

        // Step 2: Override fill to opaque white and re-cache so the cache
        // now holds a geometry-accurate alpha mask (glyph contours, shape
        // outlines, etc.). The filter will use this cache as the height
        // source and read the stored real data for the base image.
        const origFill = visChild.fill()
        const origOpacity = visChild.opacity()
        visChild.fill('#ffffff')
        visChild.opacity(1)
        node.clearCache()
        node.cache({ x: cX - pad, y: cY - pad, width: cW + pad * 2, height: cH + pad * 2, pixelRatio: pr })
        visChild.fill(origFill)
        visChild.opacity(origOpacity)
      } else {
        node.setAttr('_bevelRealImageData', null)
      }

      if (DEBUG_BEVEL_CACHE) {
        console.log('[BEVEL CACHE]', {
          pad, cX, cY, cW, cH,
          cacheX: cX - pad, cacheY: cY - pad,
          cacheW: cW + pad * 2, cacheH: cH + pad * 2,
          nodeType: typeof node.width === 'function' ? (node.width() ? 'explicit' : 'group') : 'other',
          nodeId: item.id,
          hasBevelFilter,
          style: item.bevelEmbossStyle,
          dualBuffer: hasTransparentFill && canOverride,
        })
      }
    }
  } else if (hasBevelFilter) {
    const filtered = existingFilters.filter(f => f !== Konva.Filters.BevelEmboss)
    node.filters(filtered)
    if (filtered.length === 0) {
      node.clearCache()
    }
  }
}

// ─── Inner Shadow ───────────────────────────────────────────────────────────

export const getInnerShadowProps = (item) => {
  if (!item.innerShadowEnabled) return {}
  return {
    innerShadowColor: item.innerShadowColor || '#000000',
    innerShadowOpacity: item.innerShadowOpacity ?? 0.5,
    innerShadowBlur: item.innerShadowBlur ?? 5,
    innerShadowDistance: item.innerShadowDistance ?? 5,
    innerShadowAngle: item.innerShadowAngle ?? 135,
  }
}

export const applyInnerShadowToNode = (node, item) => {
  if (!node) return
  if (item.isAdjustmentLayer) return

  const existingFilters = node.filters() || []
  const hasFilter = existingFilters.includes(Konva.Filters.InnerShadow)
  const bevelEnabled = item.bevelEmbossEnabled

  if (item.innerShadowEnabled) {
    if (!hasFilter) {
      node.filters([...existingFilters, Konva.Filters.InnerShadow])
    }
    const props = getInnerShadowProps(item)
    for (const [k, v] of Object.entries(props)) {
      node.setAttr(k, v)
    }
    const blur = item.innerShadowBlur ?? 5
    const distance = item.innerShadowDistance ?? 5
    const innerPad = Math.max(5, Math.ceil(distance + blur * 2))
    const bevelPad = bevelEnabled
      ? Math.max(10, Math.ceil((item.bevelEmbossSoftness ?? 5) * 2 + (item.bevelEmbossDepth ?? 5)))
      : 0
    const pad = Math.max(innerPad, bevelPad)
    const pr = Math.min(window.devicePixelRatio || 1, 3)
    // Get content bounds (same pattern as bevel)
    let cW = 0, cH = 0
    const explicitW = typeof node.width === 'function' ? (node.width() || 0) : (node.getAttr('width') || 0)
    const explicitH = typeof node.height === 'function' ? (node.height() || 0) : (node.getAttr('height') || 0)
    if (explicitW > 0 && explicitH > 0) {
      cW = explicitW; cH = explicitH
    } else if ((item.w || 0) > 0 && (item.h || 0) > 0) {
      cW = item.w; cH = item.h
    } else {
      const cr = node.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true })
      cW = cr.width; cH = cr.height
    }
    if (cW > 0 && cH > 0) {
      node.clearCache()
      node.cache({ x: -pad, y: -pad, width: cW + pad * 2, height: cH + pad * 2, pixelRatio: pr })
    }
  } else if (hasFilter) {
    const filtered = existingFilters.filter(f => f !== Konva.Filters.InnerShadow)
    node.filters(filtered)
    if (filtered.length === 0) {
      node.clearCache()
    }
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
