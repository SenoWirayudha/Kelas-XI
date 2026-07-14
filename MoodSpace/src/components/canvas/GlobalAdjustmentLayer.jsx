import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Konva from 'konva'
import { Group, Image as KonvaImage, Rect } from 'react-konva'
import { getActiveAdjustmentLayers } from '../../utils/adjustmentLayerUtils'
import { applyImageFilters, applyMoodSpaceToImageData } from '../../utils/imageFilters'
import { hasAnyEffect } from '../../utils/effectUtils'
import { EffectManager } from '../../utils/konva-effects-engine'

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

const applyItemFiltersToClone = (clone, item) => {
  if (item.kind === 'image') {
    const imageNodes = clone.find?.('.canvas-image-main') || []
    imageNodes.forEach((node) => {
      try {
        applyImageFilters(node, item)
        if (item.effects && Object.keys(item.effects).length > 0) {
          effectManager.applyAll(node, item.effects, item)
        }
      } catch {
        node.clearCache?.()
        node.filters?.([])
      }
    })
  } else if (item.effects && Object.keys(item.effects).length > 0) {
    try {
      // Frame Groups in Konva don't have explicit width/height attrs
      // (they rely on monkey-patched getSelfRect/getClientRect in FrameWithImage).
      // When cloned for the offscreen capture stage, those patches are lost,
      // causing effectManager.applyAll to compute wrong cache dimensions.
      // Set explicit attrs so cache() uses the correct size.
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
}

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
        if (!compositeHandled.has(item.groupId)) {
          compositeHandled.add(item.groupId)
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
            const cachedCanvas = groupNode._getCachedSceneCanvas()
            if (cachedCanvas) {
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
            }
          }
        }
        return
      }

      const itemNode = stage.findOne(`#${item.id}`) || stage.findOne(`[id="${item.id}"]`)
      if (!itemNode) {
        console.warn('[AdjCapture] MISSING node for item', item.id, 'kind:', item.kind, 'groupId:', item.groupId, 'compositeMode:', item.compositeMode)
        return
      }
      const clone = cloneCanvasNode(itemNode)
      exportLayer.add(clone)
      applyItemFiltersToClone(clone, item)
    })

    exportLayer.batchDraw()
    exportLayer.draw()
    return exportStage.toCanvas({
      x,
      y,
      width: w,
      height: h,
      pixelRatio,
    })
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
      .map((i, index) => `${index}:${i.id}:${i.kind}:${i.visible !== false}:${i.x},${i.y},${i.w},${i.h},${i.rotation || 0},${i.opacity ?? 1},${i.text || ''},${i.src || ''},${i.fill || ''},${i.stroke || ''}`)
      .join('|')
    const layerHashes = activeLayers
      .map((l) =>
        `${l.id}:${l.x},${l.y},${l.w},${l.h}:${l.blendMode || 'source-over'}:${l.exposure},${l.temperature},${l.hue},${l.highlights},${l.shadows},${l.whites},${l.blacks},${l.brightness},${l.contrast},${l.saturation},${l.sharpen},${l.vignette},${l.blur}:fx=${JSON.stringify(l.effects || {})}`,
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

          applyMoodSpaceToImageData(imageData, layer)

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
