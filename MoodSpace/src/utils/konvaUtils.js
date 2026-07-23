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

  console.log('[BUG2-BEVEL] item.id:', item.id, 'kind:', item.kind, 'fill:', item.fill, 'bevelEnabled:', item.bevelEmbossEnabled, 'node.isCached:', !!node._getCanvasCache?.(), 'node.filters:', node.filters()?.map(f => f.name || 'fn'), 'node.width:', typeof node.width === 'function' ? node.width() : 'N/A')

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
    // For multi-run text (multiple <Text> children in a group), we need to
    // override fill on ALL children, not just the first one. Each child
    // represents a run with its own font/style/color.
    const allChildren = typeof node.getChildren === 'function' ? node.getChildren() : [node]
    const overridableChildren = allChildren.filter(c => typeof c.fill === 'function')
    const canOverride = overridableChildren.length > 0

    // Get content bounding box.
    // Priority: explicit node width/height (Image, Text) → item.w/item.h → getClientRect.
    // Dimensions must account for node's scaleX/scaleY because Konva's cache()
    // renders in LOCAL space — the cached content is then displayed at
    // scaleX/scaleY. Without scaling the cache size, content clips at non-1x scale.
    const scaleX = Math.abs(node.scaleX() || 1)
    const scaleY = Math.abs(node.scaleY() || 1)
    let cX = 0, cY = 0, cW = 0, cH = 0
    const explicitW = typeof node.width === 'function' ? (node.width() || 0) : (node.getAttr('width') || 0)
    const explicitH = typeof node.height === 'function' ? (node.height() || 0) : (node.getAttr('height') || 0)
    if (explicitW > 0 && explicitH > 0) {
      cX = 0; cY = 0
      cW = explicitW * scaleX; cH = explicitH * scaleY
    } else if ((item.w || 0) > 0 && (item.h || 0) > 0) {
      cX = 0; cY = 0
      cW = item.w * scaleX; cH = item.h * scaleY
    } else {
      const cr = node.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true })
      cX = cr.x || 0; cY = cr.y || 0
      cW = cr.width * scaleX;  cH = cr.height * scaleY
    }

    if (cW > 0 && cH > 0) {
      console.log('[BEVEL-DEBUG] hasTransparentFill:', hasTransparentFill, 'canOverride:', canOverride, 'cW:', cW, 'cH:', cH, 'pad:', pad)
      // --- Dual-buffer setup for transparent-fill items ---
      // To avoid running the filter on the transparent-fill cache (step 1),
      // temporarily clear filters. Restore before step 2 (white-mask cache).
      const savedFilters = (hasTransparentFill && canOverride) ? node.filters() : null
      console.log('[BEVEL-DEBUG] savedFilters:', savedFilters ? savedFilters.map(f => f.name || 'fn') : null)
      if (savedFilters) node.filters([])

      // Step 1: Cache with the actual fill (may be transparent). Filter-free
      // if dual-buffer path; this cache becomes the "real" render.
      node.clearCache()
      node.cache({ x: cX - pad, y: cY - pad, width: cW + pad * 2, height: cH + pad * 2, pixelRatio: pr })

      if (savedFilters) node.filters(savedFilters)
      console.log('[BEVEL-DEBUG] after cache1 — _getCanvasCache:', !!node._getCanvasCache?.(), 'filters:', node.filters()?.map(f => f.name || 'fn'))

      if (hasTransparentFill && canOverride) {
        // Read the real-fill cache's pixel data before we overwrite it.
        const cacheEntry = typeof node._getCanvasCache === 'function' && node._getCanvasCache()
        const sceneCanvas = cacheEntry && cacheEntry.scene
        const cacheCanvasEl = sceneCanvas && sceneCanvas._canvas
        console.log('[BEVEL-DEBUG] cacheEntry:', !!cacheEntry, 'scene:', !!sceneCanvas, '_canvas:', !!cacheCanvasEl, 'entryKeys:', cacheEntry ? Object.keys(cacheEntry).join(',') : 'none', 'sceneKeys:', sceneCanvas ? Object.keys(sceneCanvas).join(',') : 'none')
        if (cacheCanvasEl) {
          const ctx = cacheCanvasEl.getContext('2d')
          const realData = ctx.getImageData(0, 0, sceneCanvas.width, sceneCanvas.height)
          node.setAttr('_bevelRealImageData', realData)
        } else {
          node.setAttr('_bevelRealImageData', null)
        }

        // Step 2: Override fill to opaque white on ALL overridable children
        // (supports multi-run text where each run is a separate <Text> child).
        const savedStates = overridableChildren.map(child => ({
          child,
          fill: child.fill(),
          opacity: child.opacity(),
        }))
        overridableChildren.forEach(child => {
          child.fill('#ffffff')
          child.opacity(1)
        })
        node.clearCache()
        node.cache({ x: cX - pad, y: cY - pad, width: cW + pad * 2, height: cH + pad * 2, pixelRatio: pr })
        // Save white-mask pixel data for shared use by both filters.
        const maskCacheEntry = typeof node._getCanvasCache === 'function' && node._getCanvasCache()
        const maskSceneCanvas = maskCacheEntry && maskCacheEntry.scene
        const maskCanvasEl2 = maskSceneCanvas && maskSceneCanvas._canvas
        console.log('[BEVEL-DEBUG] maskCacheEntry:', !!maskCacheEntry, 'scene:', !!maskSceneCanvas, '_canvas:', !!maskCanvasEl2, 'entryKeys:', maskCacheEntry ? Object.keys(maskCacheEntry).join(',') : 'none', 'maskSceneKeys:', maskSceneCanvas ? Object.keys(maskSceneCanvas).join(',') : 'none')
        if (maskCanvasEl2) {
          const maskCtx = maskCanvasEl2.getContext('2d')
          node.setAttr('_maskImageData', maskCtx.getImageData(0, 0, maskSceneCanvas.width, maskSceneCanvas.height))
        } else {
          node.setAttr('_maskImageData', null)
        }
        savedStates.forEach(({ child, fill, opacity }) => {
          child.fill(fill)
          child.opacity(opacity)
        })
      } else {
        node.setAttr('_bevelRealImageData', null)
      }

      if (DEBUG_BEVEL_CACHE) {
        console.log('[BEVEL CACHE]', {
          pad, cX, cY, cW, cH,
          cacheX: cX - pad, cacheY: cY - pad,
          cacheW: cW + pad * 2, cacheH: cH + pad * 2,
          nodeWidth: typeof node.width === 'function' ? node.width() : undefined,
          nodeScaleX: node.scaleX?.(),
          nodeScaleY: node.scaleY?.(),
          itemScaleX: item.scaleX,
          itemScaleY: item.scaleY,
          itemW: item.w,
          itemH: item.h,
          explicitW, explicitH,
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
    const scaleX = Math.abs(node.scaleX() || 1)
    const scaleY = Math.abs(node.scaleY() || 1)
    let cW = 0, cH = 0
    const explicitW = typeof node.width === 'function' ? (node.width() || 0) : (node.getAttr('width') || 0)
    const explicitH = typeof node.height === 'function' ? (node.height() || 0) : (node.getAttr('height') || 0)
    if (explicitW > 0 && explicitH > 0) {
      cW = explicitW * scaleX; cH = explicitH * scaleY
    } else if ((item.w || 0) > 0 && (item.h || 0) > 0) {
      cW = item.w * scaleX; cH = item.h * scaleY
    } else {
      const cr = node.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true })
      cW = cr.width * scaleX;  cH = cr.height * scaleY
    }
    if (cW > 0 && cH > 0) {
      // Dual-buffer setup for transparent-fill: save transparent render,
      // then override fill to white for geometry-accurate mask.
      const hasTransparentFill = item.kind !== 'image' && (item.fill === undefined || item.fill === null || item.fill === '' || item.fill === 'transparent' || item.fill === 'none')
      const allChildren = typeof node.getChildren === 'function' ? node.getChildren() : [node]
      const overridableChildren = allChildren.filter(c => typeof c.fill === 'function')
      const canOverride = overridableChildren.length > 0

      // Avoid running filters on the transparent cache (step 1): temporarily
      // clear filters so the first cache() call is a fast scene-only render.
      // Filters are restored before step 2 (white-mask cache).
      const savedFilters = (hasTransparentFill && canOverride) ? node.filters() : null
      if (savedFilters) node.filters([])

      node.clearCache()
      node.cache({ x: -pad, y: -pad, width: cW + pad * 2, height: cH + pad * 2, pixelRatio: pr })

      if (savedFilters) node.filters(savedFilters)
      if (hasTransparentFill && canOverride) {
        // Step 1: Save transparent render from current cache
        const cacheEntry = typeof node._getCanvasCache === 'function' && node._getCanvasCache()
        const sceneCanvas = cacheEntry && cacheEntry.scene
        const cacheCanvasEl = sceneCanvas && sceneCanvas._canvas
        if (cacheCanvasEl) {
          const ctx = cacheCanvasEl.getContext('2d')
          const realData = ctx.getImageData(0, 0, sceneCanvas.width, sceneCanvas.height)
          node.setAttr('_innerShadowRealImageData', realData)
          if (bevelEnabled) node.setAttr('_bevelRealImageData', realData)
        } else {
          node.setAttr('_innerShadowRealImageData', null)
        }
        // Step 2: Override fill to white on ALL overridable children
        // (supports multi-run text where each run is a separate <Text> child).
        const savedStates = overridableChildren.map(child => ({
          child,
          fill: child.fill(),
          opacity: child.opacity(),
        }))
        overridableChildren.forEach(child => {
          child.fill('#ffffff')
          child.opacity(1)
        })
        node.clearCache()
        node.cache({ x: -pad, y: -pad, width: cW + pad * 2, height: cH + pad * 2, pixelRatio: pr })
        // Save mask pixel data for shared use by both filters
        const maskCacheEntry = typeof node._getCanvasCache === 'function' && node._getCanvasCache()
        const maskSceneCanvas = maskCacheEntry && maskCacheEntry.scene
        const maskCanvasEl2 = maskSceneCanvas && maskSceneCanvas._canvas
        if (maskCanvasEl2) {
          const maskCtx = maskCanvasEl2.getContext('2d')
          node.setAttr('_maskImageData', maskCtx.getImageData(0, 0, maskSceneCanvas.width, maskSceneCanvas.height))
        } else {
          node.setAttr('_maskImageData', null)
        }
        savedStates.forEach(({ child, fill, opacity }) => {
          child.fill(fill)
          child.opacity(opacity)
        })
      } else {
        node.setAttr('_innerShadowRealImageData', null)
      }
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
