import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Konva from 'konva'
import { Group, Image as KonvaImage, Rect } from 'react-konva'
import { getActiveAdjustmentLayers } from '../../utils/adjustmentLayerUtils'
import { applyImageFilters, applyMoodSpaceToImageData } from '../../utils/imageFilters'
import { hasAnyEffect } from '../../utils/effectUtils'
import { EffectManager } from '../../utils/konva-effects-engine'
import { applyBevelEmbossToNode, applyInnerShadowToNode } from '../../utils/konvaUtils'
import { applyBevelEmboss } from '../../utils/bevelEmboss'
import { applyInnerShadow } from '../../utils/innerShadow'

const effectManager = new EffectManager()

// Debug: set globalThis.__COMPOSITE_DEBUG__=true in browser console to trace
// composite group capture in adjustment layer pipeline
// e.g. in devtools: globalThis.__COMPOSITE_DEBUG__ = true

const cloneCanvasNode = (node) => {
  const clone = node.clone({ listening: false })
  clone.draggable?.(false)
  clone.find?.('*')?.forEach((child) => {
    child.listening?.(false)
    child.draggable?.(false)
  })
  return clone
}

const ADJUSTMENT_CONTROLS_CAPTURE = [
  { key: 'exposure' }, { key: 'temperature' }, { key: 'hue' },
  { key: 'highlights' }, { key: 'shadows' }, { key: 'whites' },
  { key: 'blacks' }, { key: 'brightness' }, { key: 'contrast' },
  { key: 'saturation' }, { key: 'sharpen' }, { key: 'vignette' },
  { key: 'blur' },
]

const hasCaptureAdjustment = (ite) => {
  if (ADJUSTMENT_CONTROLS_CAPTURE.some((c) => (ite[c.key] ?? 0) !== 0)) return true
  const hsl = ite.hsl ?? null
  if (hsl && (hsl.reds || hsl.yellows || hsl.greens || hsl.cyans || hsl.blues || hsl.magentas)) return true
  if (ite.curves) return true
  return false
}

const appendAdjustmentToNode = (node, ite) => {
  if (!hasCaptureAdjustment(ite)) return
  const existingFilters = node.filters() || []
  if (!existingFilters.includes(Konva.Filters.MoodSpaceCombined)) {
    node.filters([...existingFilters, Konva.Filters.MoodSpaceCombined])
  }
  for (const c of ADJUSTMENT_CONTROLS_CAPTURE) {
    node.setAttr(c.key, ite[c.key] ?? 0)
  }
  node.setAttr('hsl', ite.hsl || null)
  node.setAttr('curves', ite.curves || null)
  node.cache({ pixelRatio: Math.min(window.devicePixelRatio || 1, 2) })
}

const applyItemFiltersToClone = (clone, item) => {
  if (item.kind === 'image') {
    const imageNodes = clone.find?.('.canvas-image-main') || []
    imageNodes.forEach((node) => {
      try {
        console.log('[BUG1-ENTRY] item.id:', item.id, 'kind:', item.kind, 'hue:', item.hue, 'effects keys:', Object.keys(item.effects || {}), 'filters BEFORE:', node.filters()?.map(f => f.name || 'fn'))
        console.log('[BUG1-ENTRY] image node width:', node.width(), 'height:', node.height(), 'src:', node.getAttr?.('src')?.slice?.(0, 50))
        if (item.effects && Object.keys(item.effects).length > 0) {
          effectManager.applyAll(node, item.effects, item)
        }
        console.log('[BUG1-AFTER-APPLYALL] filters:', node.filters()?.map(f => f.name || 'fn'), 'cache:', !!node._getCanvasCache?.())
        // APPEND MoodSpaceCombined to existing filters (instead of replacing
        // via applyImageFilters which calls node.filters([MoodSpaceCombined]))
        appendAdjustmentToNode(node, item)
        console.log('[BUG1-AFTER-APPEND-ADJ] filters:', node.filters()?.map(f => f.name || 'fn'), 'cache:', !!node._getCanvasCache?.(), 'hueAttr:', node.getAttr('hue'), 'tempAttr:', node.getAttr('temperature'))
      } catch (e) {
        console.warn('[BUG1-ERROR]', e)
        node.clearCache?.()
        node.filters?.([])
      }
    })
  } else if (item.effects && Object.keys(item.effects).length > 0) {
    try {
      if (item.kind === 'frame') {
        clone.setAttr('width', item.w)
        clone.setAttr('height', item.h)
      }
      effectManager.applyAll(clone, item.effects, item)
    } catch {
      clone.clearCache?.()
      clone.filters?.([])
    }
  }

  console.log('[BUG2-BEVEL-CHECK] item.id:', item.id, 'kind:', item.kind, 'bevelEmbossEnabled:', item.bevelEmbossEnabled, 'innerShadowEnabled:', item.innerShadowEnabled, 'fill:', item.fill)
  if (item.bevelEmbossEnabled) {
    try { applyBevelEmbossToNode(clone, item) } catch { /* skip */ }
  }
  if (item.innerShadowEnabled) {
    try { applyInnerShadowToNode(clone, item) } catch { /* skip */ }
  }
}

// Clean up unused imports after this refactor —
// applyImageFilters is no longer called from this file.
// (retained the import in case other callers exist)

const getAdjustmentCapturePixelRatio = (width, height) => {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent || ''
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
  const cpuCores = typeof navigator === 'undefined' ? 8 : navigator.hardwareConcurrency || 8
  const isLowPower = isMobile || cpuCores <= 4
  const targetRatio = isLowPower
    ? Math.min(2, Math.max(1.25, dpr))
    : Math.min(4, Math.max(3, dpr * 2))
  const maxPixels = isLowPower ? 6000000 : 24000000
  const area = Math.max(1, width * height)
  const cappedRatio = Math.sqrt(maxPixels / area)
  return Math.max(1, Math.min(targetRatio, cappedRatio))
}

const getAdjustmentDebounceMs = () => {
  if (typeof navigator === 'undefined') return 150
  const userAgent = navigator.userAgent || ''
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
  const cpuCores = navigator.hardwareConcurrency || 8
  return isMobile || cpuCores <= 4 ? 320 : 150
}

const drawRoundedRectPath = (ctx, x, y, width, height, radius = 0) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const drawRegularPolygonPath = (ctx, item, points, innerRadius = null) => {
  const cx = item.w / 2
  const cy = item.h / 2
  const outerRadius = Math.min(item.w, item.h) / 2
  const total = innerRadius ? points * 2 : points
  ctx.beginPath()
  for (let index = 0; index < total; index += 1) {
    const radius = innerRadius && index % 2 === 1 ? innerRadius : outerRadius
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / total
    const px = cx + Math.cos(angle) * radius
    const py = cy + Math.sin(angle) * radius
    if (index === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

const createAdjustmentClipFunc = (layer) => (ctx) => {
  if (layer.shapeType === 'circle' || layer.shapeType === 'ellipse') {
    ctx.beginPath()
    ctx.ellipse(layer.w / 2, layer.h / 2, layer.w / 2, layer.h / 2, 0, 0, Math.PI * 2)
    ctx.closePath()
    return
  }

  if (layer.shapeType === 'polygon') {
    drawRegularPolygonPath(ctx, layer, layer.sides || 3)
    return
  }

  if (layer.shapeType === 'star') {
    drawRegularPolygonPath(ctx, layer, layer.numPoints || 5, Math.min(layer.w, layer.h) * (layer.starInnerRatio ?? 0.25))
    return
  }

  drawRoundedRectPath(ctx, 0, 0, layer.w, layer.h, layer.cornerRadius || 0)
}

async function renderItemsToCanvas({ stageRef, sourceItems, bounds, canvasWidth, canvasHeight, processedLayers = {}, includeBackground = false, compositeGroupMap }) {
  const { x, y, w, h } = bounds
  const stage = stageRef.current
  if (!stage || !w || !h) return null
  const pixelRatio = getAdjustmentCapturePixelRatio(w, h)

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '-10000px'
  container.style.width = `${canvasWidth}px`
  container.style.height = `${canvasHeight}px`
  document.body.appendChild(container)

  let exportStage = null
  try {
    exportStage = new Konva.Stage({
      container,
      width: canvasWidth,
      height: canvasHeight,
    })
    const exportLayer = new Konva.Layer()
    exportStage.add(exportLayer)

    // Render canvas background first so it's captured as part of adjustment pixel data
    if (includeBackground) {
      const bgNode = stage.findOne('.canvas-background') || stage.findOne('[name="canvas-background"]')
      if (bgNode) {
        const bgClone = cloneCanvasNode(bgNode)
        bgClone.width(canvasWidth)
        bgClone.height(canvasHeight)
        bgClone.x(0)
        bgClone.y(0)
        exportLayer.add(bgClone)
      }
    }

    // Build lookup for mask/exclude composite group members
    const compositeMembers = new Set()
    const compositeHandled = new Set()
    if (compositeGroupMap) {
      for (const [, entry] of compositeGroupMap) {
        if (entry.memberIds.size >= 2) {
          entry.memberIds.forEach(mid => compositeMembers.add(mid))
        }
      }
    }

    ;[...sourceItems].reverse().forEach((item) => {
      if (item.visible === false) return
      if (item.isAdjustmentLayer) {
        const processed = processedLayers[item.id]
        if (processed && processed.canvas) {
          const img = new Konva.Image({
            image: processed.canvas,
            x: processed.x,
            y: processed.y,
            width: processed.w,
            height: processed.h,
            listening: false,
            name: 'adj-chain-image',
          })
          exportLayer.add(img)
        }
        return
      }

      // Capture mask/exclude composite group via direct cached canvas access
      if (compositeMembers.has(item.id)) {
        if (compositeHandled.has(item.groupId)) return
        const groupNode = stage.findOne(`#composite-${item.groupId}`)
        if (groupNode) {
          if (typeof globalThis.__COMPOSITE_DEBUG__ !== 'undefined' && globalThis.__COMPOSITE_DEBUG__) {
            console.log('[AdjCapture] composite group found', item.groupId, 'children:', groupNode.children?.length)
          }
          // Access the cached canvas directly instead of going through
          // toCanvas() which clamps to the scene bounding box. The cache
          // covers (0,0) to (canvasWidth,canvasHeight) in local space.
          // _getCachedSceneCanvas() returns the internal Konva.Canvas object
          // that holds the raw cached pixel data at cache pixel ratio.
          let cachedCanvas = null
          try {
            cachedCanvas = groupNode._getCachedSceneCanvas()
          } catch { /* cache not yet initialized */ }
          if (cachedCanvas) {
            compositeHandled.add(item.groupId)
            const nativeCanvas = cachedCanvas._canvas
            // Sample cache to check if it has actual content
            const ctx2d = nativeCanvas?.getContext?.('2d')
            if (ctx2d && typeof globalThis.__ADJ_DEBUG__ !== 'undefined') {
              // Sample from center of cache (content is at groupMinX/Y, not at 0,0)
              const sx = Math.max(0, Math.floor(nativeCanvas.width / 2 - 4))
              const sy = Math.max(0, Math.floor(nativeCanvas.height / 2 - 4))
              const sample = ctx2d.getImageData(sx, sy, 4, 4)
              let opaque = 0
              for (let i = 3; i < sample.data.length; i += 4) {
                if (sample.data[i] > 0) opaque++
              }
              console.log('[AdjCapture] cache sample', item.groupId,
                'sample at:', sx, sy,
                'native:', nativeCanvas.width, 'x', nativeCanvas.height,
                'pixelRatio:', cachedCanvas.getPixelRatio(),
                'opaque pixels:', opaque, '/', sample.data.length / 4,
                'group children:', groupNode.children?.length,
                'has cache canvas:', !!groupNode._getCachedSceneCanvas())
            }
            const cachePR = cachedCanvas.getPixelRatio()
            const gx = groupNode.x()
            const gy = groupNode.y()
            const img = new Konva.Image({
              image: nativeCanvas,
              x: gx,
              y: gy,
              width: canvasWidth,
              height: canvasHeight,
              listening: false,
            })
            exportLayer.add(img)
            if (typeof globalThis.__COMPOSITE_DEBUG__ !== 'undefined' && globalThis.__COMPOSITE_DEBUG__) {
              console.log('[AdjCapture] composite group', item.groupId,
                'cachePR:', cachePR,
                'native canvas:', nativeCanvas.width, 'x', nativeCanvas.height,
                'stage units:', canvasWidth, 'x', canvasHeight,
                'group x/y:', gx, gy,
                'children:', groupNode.children?.length)
            }
            return  // used cache — skip individual rendering
          }
          // Cache not available — render children directly from group node
          const childImages = groupNode.find('Image')
          if (childImages && childImages.length > 0) {
            compositeHandled.add(item.groupId)
            for (const childImg of childImages) {
              const childClone = childImg.clone({ listening: false })
              childClone.draggable?.(false)
              exportLayer.add(childClone)
            }
            return
          }
        }
        // No cache and no child images — skip (item has no visible representation on stage)
        return
      }

      const itemNode = stage.findOne(`#${item.id}`) || stage.findOne(`[id="${item.id}"]`)
      if (!itemNode) {
        console.warn('[AdjCapture] MISSING node for item', item.id, 'kind:', item.kind, 'groupId:', item.groupId, 'compositeMode:', item.compositeMode)
        return
      }

      // CAPTURE via clone + toCanvas with only non-bevel/non-shadow filters.
      // BevelEmboss/InnerShadow use dual-buffer (white-mask cache scene) which
      // corrupts effect rendering in toCanvas. We capture effects-only content,
      // then apply bevel/innerShadow as pixel operations.
      try {
        const vw = item.w || (typeof itemNode.width === 'function' ? itemNode.width() : 100)
        const vh = item.h || (typeof itemNode.height === 'function' ? itemNode.height() : 100)
        if (vw > 0 && vh > 0) {
          const capPR = getAdjustmentCapturePixelRatio(vw, vh)
          const captureNode = cloneCanvasNode(itemNode)
          const allFilters = captureNode.filters() || []
          const hasProblematicFilter = allFilters.some(f => f === Konva.Filters.BevelEmboss || f === Konva.Filters.InnerShadow)
          if (hasProblematicFilter) {
            captureNode.filters(allFilters.filter(f => f !== Konva.Filters.BevelEmboss && f !== Konva.Filters.InnerShadow))
            captureNode.clearCache()
          }
          // If after removing bevel/innershadow there are still filters, cache.
          // Otherwise toCanvas renders children directly (no filter processing).
          const cleanFilters = captureNode.filters() || []
          if (cleanFilters.length > 0) {
            captureNode.cache({ pixelRatio: capPR })
          }
          const captured = captureNode.toCanvas({ width: vw, height: vh, pixelRatio: capPR })
          // Apply bevel/innerShadow as pixel post-process on captured canvas
          if (hasProblematicFilter && (item.bevelEmbossEnabled || item.innerShadowEnabled)) {
            try {
              const ctx = captured.getContext('2d')
              const imgData = ctx.getImageData(0, 0, captured.width, captured.height)
              // Get mask: clone with white fill, no filters
              const maskNode = cloneCanvasNode(itemNode)
              maskNode.find?.('*')?.forEach(child => {
                if (typeof child.fill === 'function') child.fill('#ffffff')
                if (typeof child.opacity === 'function') child.opacity(1)
              })
              maskNode.filters([])
              maskNode.clearCache()
              const maskCanvas = maskNode.toCanvas({ width: vw, height: vh, pixelRatio: capPR })
              const maskData = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height)
              if (item.bevelEmbossEnabled) {
                applyBevelEmboss(imgData, {
                  style: item.bevelEmbossStyle || 'inner',
                  technique: item.bevelEmbossTechnique || 'smooth',
                  depth: item.bevelEmbossDepth ?? 5,
                  direction: item.bevelEmbossDirection || 'light',
                  softness: item.bevelEmbossSoftness ?? 5,
                  angle: item.bevelEmbossAngle ?? 135,
                  altitude: item.bevelEmbossAltitude ?? 45,
                  gloss: item.bevelEmbossGloss ?? 0,
                  highlightColor: item.bevelEmbossHighlightColor || '#ffffff',
                  highlightOpacity: item.bevelEmbossHighlightOpacity ?? 0.7,
                  shadowColor: item.bevelEmbossShadowColor || '#000000',
                  shadowOpacity: item.bevelEmbossShadowOpacity ?? 0.5,
                  mapSource: item.bevelEmbossStyle === 'emboss' ? 'luminance' : 'alpha',
                }, maskData)
              }
              if (item.innerShadowEnabled) {
                applyInnerShadow(imgData, {
                  color: item.innerShadowColor || '#000000',
                  opacity: item.innerShadowOpacity ?? 0.5,
                  blur: item.innerShadowBlur ?? 5,
                  distance: item.innerShadowDistance ?? 5,
                  angle: item.innerShadowAngle ?? 135,
                }, maskData)
              }
              ctx.putImageData(imgData, 0, 0)
            } catch (bevErr) {
              console.warn('[AdjCapture] bevel/innershadow post-process failed', item.id, bevErr)
            }
          }
          const img = new Konva.Image({
            image: finalCanvas,
            x: itemNode.x(),
            y: itemNode.y(),
            width: vw,
            height: vh,
            listening: false,
          })
          exportLayer.add(img)
          console.log('[AdjCapture] toCanvas', item.id, 'kind:', item.kind, 'captured:', captured.width, 'x', captured.height, 'display:', vw, 'x', vh, 'PR:', capPR, 'beveled:', hasProblematicFilter, 'node.x:', itemNode.x(), 'node.y:', itemNode.y())
          return
        }
      } catch (e) {
        console.warn('[AdjCapture] toCanvas failed for', item.id, 'falling back to clone', e)
      }

      const clone = cloneCanvasNode(itemNode)
      console.log('[BUG1-CAPTURE] item.id:', item.id, 'kind:', item.kind, 'hue:', item.hue, 'temp:', item.temperature, 'effects:', Object.keys(item.effects || {}), 'node filters:', itemNode.filters()?.map(f => f.name || 'fn'), 'node cache:', !!itemNode._getCanvasCache?.())
      exportLayer.add(clone)
      applyItemFiltersToClone(clone, item)
    })

    exportLayer.batchDraw()
    exportLayer.draw()
    const resultCanvas = exportStage.toCanvas({
      x,
      y,
      width: w,
      height: h,
      pixelRatio,
    })
    // Pixel sample: check if hue adjustment is actually rendered
    if (resultCanvas) {
      try {
        const ctx = resultCanvas.getContext('2d')
        const cx = Math.floor(resultCanvas.width / 2)
        const cy = Math.floor(resultCanvas.height / 2)
        const sample = ctx.getImageData(cx, cy, 1, 1).data
        console.log('[BUG1-PIXEL] canvas:', resultCanvas.width, 'x', resultCanvas.height, 'center pixel RGBA:', sample[0], sample[1], sample[2], sample[3])
      } catch (e) { /* skip */ }
    }
    return resultCanvas
  } catch (error) {
    console.warn('Failed to render adjustment layer capture', error)
    return null
  } finally {
    exportStage?.destroy()
    container.remove()
  }
}

export default function GlobalAdjustmentLayer({ stageRef, items, canvasWidth, canvasHeight }) {
  const activeLayers = useMemo(
    () => getActiveAdjustmentLayers(items).filter((l) => l.visible !== false),
    [items],
  )

  const [layerCanvasMap, setLayerCanvasMap] = useState({})
  const debounceRef = useRef(null)
  const generationRef = useRef(0)
  const isProcessingRef = useRef(false)
  const pendingRerunRef = useRef(false)
  const renderKeyRef = useRef(0)
  const oldLayerCanvasRef = useRef({})

  const depsKey = useMemo(() => {
    const itemHashes = items
      .map((i, index) => `${index}:${i.id}:${i.kind}:${i.visible !== false}:${i.x},${i.y},${i.w},${i.h},${i.rotation || 0},${i.opacity ?? 1},${i.text || ''},${i.src || ''},${i.fill || ''},${i.stroke || ''}:be=${i.bevelEmbossEnabled ? 1 : 0},${i.bevelEmbossStyle||''},${i.bevelEmbossDepth||0},${i.bevelEmbossAngle||0},${i.bevelEmbossSoftness||0}:is=${i.innerShadowEnabled ? 1 : 0},${i.innerShadowColor||''},${i.innerShadowOpacity||0},${i.innerShadowBlur||0},${i.innerShadowDistance||0},${i.innerShadowAngle||0}`)
      .join('|')
    const layerHashes = activeLayers
      .map((l) =>
        `${l.id}:${l.x},${l.y},${l.w},${l.h}:${l.blendMode || 'source-over'}:${l.exposure},${l.temperature},${l.hue},${l.highlights},${l.shadows},${l.whites},${l.blacks},${l.brightness},${l.contrast},${l.saturation},${l.sharpen},${l.vignette},${l.blur}:hsl=${JSON.stringify(l.hsl || {})}:curves=${JSON.stringify(l.curves || {})}:fx=${JSON.stringify(l.effects || {})}`,
      )
      .join('|')
    return `${itemHashes}|${layerHashes}|${canvasWidth}x${canvasHeight}`
  }, [items, activeLayers, canvasWidth, canvasHeight])

  // Sortir activeLayers bottom-to-top agar output layer bawah bisa dipakai layer atas
  const sortedLayers = useMemo(() => {
    return [...activeLayers].sort((a, b) => {
      const ai = items.findIndex((item) => item.id === a.id)
      const bi = items.findIndex((item) => item.id === b.id)
      return bi - ai // higher index first = bottom layer first
    })
  }, [activeLayers, items])

  const processLayers = useCallback(async () => {
    if (isProcessingRef.current) {
      pendingRerunRef.current = true
      return
    }
    isProcessingRef.current = true
    const gen = ++generationRef.current
    let anySuccess = false

    try {
      if (activeLayers.length === 0) {
        if (gen === generationRef.current) setLayerCanvasMap({})
        return
      }

      const next = {}
      const prevMap = oldLayerCanvasRef.current

      // Build composite group map for mask/exclude group handling
      const groupsByGroupId = new Map()
      items.forEach((item) => {
        if (!item.groupId || item.isAdjustmentLayer) return
        const entry = groupsByGroupId.get(item.groupId) || {
          groupId: item.groupId,
          memberIds: new Set(),
          hasOperator: false,
          operatorId: null,
        }
        entry.memberIds.add(item.id)
        if (item.compositeMode === 'mask' || item.compositeMode === 'exclude') {
          entry.hasOperator = true
          entry.operatorId = item.id
        }
        groupsByGroupId.set(item.groupId, entry)
      })
      // Keep only mask/exclude groups with >= 2 members
      const compositeGroupMap = new Map()
      for (const [groupId, entry] of groupsByGroupId) {
        if (entry.memberIds.size >= 2 && entry.hasOperator) {
          compositeGroupMap.set(groupId, entry)
        }
      }

      for (const layer of sortedLayers) {
        try {
          const layerIndex = items.findIndex((item) => item.id === layer.id)
          const sourceItems = layerIndex >= 0 ? items.slice(layerIndex + 1) : items
          // Only include background for the bottom-most adjustment layer
          const hasLowerAdj = layerIndex >= 0
            ? items.slice(layerIndex + 1).some(i => i.isAdjustmentLayer && i.visible !== false)
            : false
          const includeBackground = !hasLowerAdj
          const { x, y, w, h } = layer
          if (!w || !h || w <= 0 || h <= 0) continue

          const offscreen = await renderItemsToCanvas({
            stageRef,
            sourceItems,
            bounds: { x, y, w, h },
            canvasWidth,
            canvasHeight,
            processedLayers: next,
            includeBackground,
            compositeGroupMap,
          })
          if (!offscreen) continue

          if (gen !== generationRef.current) return

          if (typeof globalThis.__ADJ_DEBUG__ !== 'undefined') {
            console.log('[AdjLayer] includeBackground=' + includeBackground + ' sourceItems=' + sourceItems.length + ' layerIdx=' + layerIndex + ' layerW=' + w + ' layerH=' + h + ' offW=' + offscreen.width + ' offH=' + offscreen.height + ' layerOpacity=' + (layer.opacity ?? 1) + ' layerVisible=' + (layer.visible !== false))
          }

          const ctx = offscreen.getContext('2d', { willReadFrequently: true })
          const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height)

          // Debug: sample pixel at center before adjustment
          if (typeof globalThis.__ADJ_DEBUG__ !== 'undefined') {
            const cx = Math.min(Math.floor(offscreen.width / 2), offscreen.width - 1)
            const cy = Math.min(Math.floor(offscreen.height / 2), offscreen.height - 1)
            const idx = (cy * offscreen.width + cx) * 4
            console.log('[AdjLayer] before ' + [
              'cx=' + cx, 'cy=' + cy,
              'r=' + imageData.data[idx],
              'g=' + imageData.data[idx + 1],
              'b=' + imageData.data[idx + 2],
              'a=' + imageData.data[idx + 3],
            ].join(' '))
          }

          if (typeof globalThis.__ADJ_DEBUG__ !== 'undefined') {
            const bx = Math.min(Math.floor(offscreen.width / 2), offscreen.width - 1)
            const by = Math.min(Math.floor(offscreen.height / 2), offscreen.height - 1)
            const bidx = (by * offscreen.width + bx) * 4
            console.log('[AdjLayer] BEFORE adjustment peak=' + [
              imageData.data[bidx], imageData.data[bidx+1], imageData.data[bidx+2], imageData.data[bidx+3]
            ].join(',') + ' exposure=' + layer.exposure + ' hue=' + layer.hue + ' hasHSL=' + (layer.hsl ? 'Y' : 'N'))
          }

          applyMoodSpaceToImageData(imageData, layer)

          if (typeof globalThis.__ADJ_DEBUG__ !== 'undefined') {
            const ax = Math.min(Math.floor(offscreen.width / 2), offscreen.width - 1)
            const ay = Math.min(Math.floor(offscreen.height / 2), offscreen.height - 1)
            const aidx = (ay * offscreen.width + ax) * 4
            console.log('[AdjLayer] AFTER adjustment peak=' + [
              imageData.data[aidx], imageData.data[aidx+1], imageData.data[aidx+2], imageData.data[aidx+3]
            ].join(','))
          }

          if (hasAnyEffect(layer)) {
            effectManager.applyEffectsToImageData(imageData, layer.effects)
          }

          // Write adjusted pixels to a FRESH canvas at offscreen size
          const freshCanvas = document.createElement('canvas')
          freshCanvas.width = offscreen.width
          freshCanvas.height = offscreen.height
          const freshCtx = freshCanvas.getContext('2d')
          freshCtx.putImageData(imageData, 0, 0)

          // Copy to display-sized canvas
          const displayCanvas = document.createElement('canvas')
          displayCanvas.width = w
          displayCanvas.height = h
          const dCtx = displayCanvas.getContext('2d')
          dCtx.drawImage(freshCanvas, 0, 0, w, h)

          // Convert to PNG data URL and load as Image for clean GPU texture
          const dataUrl = displayCanvas.toDataURL('image/png')
          const img = await new Promise((resolve, reject) => {
            const i = new window.Image()
            i.onload = () => resolve(i)
            i.onerror = reject
            i.src = dataUrl
          })

          if (typeof globalThis.__ADJ_DEBUG__ !== 'undefined') {
            const midX = Math.floor(canvasWidth / 2)
            const midY = Math.floor(canvasHeight / 2)
            const spx = dCtx.getImageData(midX, midY, 1, 1).data
            console.log('[AdjLayer] display center after=' +
              spx[0] + ',' + spx[1] + ',' + spx[2] + ',' + spx[3] +
              ' img=' + img.width + 'x' + img.height)
          }

          if (gen !== generationRef.current) return
          const renderKey = ++renderKeyRef.current
          next[layer.id] = { canvas: img, x, y, w, h, layer, renderKey }
          anySuccess = true
        } catch (err) {
          console.warn('[GlobalAdjustmentLayer] failed to process layer', layer.id, err)
          if (prevMap[layer.id]) {
            next[layer.id] = prevMap[layer.id]
          }
        }
      }

      if (gen === generationRef.current && anySuccess) {
        setLayerCanvasMap(next)
        oldLayerCanvasRef.current = next
        requestAnimationFrame(() => {
          stageRef.current?.findOne('Layer')?.batchDraw()
        })
      }
    } finally {
      isProcessingRef.current = false
      if (pendingRerunRef.current) {
        pendingRerunRef.current = false
        window.setTimeout(processLayers, getAdjustmentDebounceMs())
      }
    }
  }, [activeLayers, canvasHeight, canvasWidth, items, stageRef])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(processLayers, getAdjustmentDebounceMs())
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [depsKey, processLayers])

  const itemsById = useMemo(() => {
    const map = {}
    for (const item of items) map[item.id] = item
    return map
  }, [items])

  if (activeLayers.length === 0) return null
  const entries = Object.entries(layerCanvasMap)
  if (entries.length === 0) return null

  return (
    <>
      {entries.map(([id, data]) => {
        const liveLayer = itemsById[id] || data.layer
        const lx = liveLayer.x ?? data.x
        const ly = liveLayer.y ?? data.y
        const lw = liveLayer.w ?? data.w
        const lh = liveLayer.h ?? data.h
        return (
          <Group
            key={id}
            name="adjustment-overlay"
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            listening={false}
          >
            <KonvaImage
              key={`img-${data.renderKey ?? 0}`}
              image={data.canvas}
              x={lx}
              y={ly}
              width={lw}
              height={lh}
              opacity={liveLayer?.opacity ?? 1}
              listening={false}
              {...(liveLayer?.blendMode && liveLayer.blendMode !== 'source-over' ? { globalCompositeOperation: liveLayer.blendMode } : {})}
              ref={(node) => {
                if (node) node.getLayer()?.batchDraw()
              }}
            />
          </Group>
        )
      })}
    </>
  )
}
