import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Konva from 'konva'
import { Group, Image as KonvaImage } from 'react-konva'
import { getActiveAdjustmentLayers, hasAnyAdjustment } from '../../utils/adjustmentLayerUtils'
import { applyImageFilters, applyMoodSpaceToImageData } from '../../utils/imageFilters'
import { hasAnyEffect } from '../../utils/effectUtils'
import { EffectManager } from '../../utils/konva-effects-engine'

const effectManager = new EffectManager()

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

async function renderItemsToCanvas({ stageRef, sourceItems, bounds, canvasWidth, canvasHeight, processedLayers = {}, includeBackground = false }) {
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
      const itemNode = stage.findOne(`#${item.id}`) || stage.findOne(`[id="${item.id}"]`)
      if (!itemNode) return
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
    () => getActiveAdjustmentLayers(items).filter((l) => l.visible !== false && (hasAnyAdjustment(l) || hasAnyEffect(l))),
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
          })
          if (!offscreen) continue

          if (gen !== generationRef.current) return

          const ctx = offscreen.getContext('2d', { willReadFrequently: true })
          const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height)
          applyMoodSpaceToImageData(imageData, layer)

          if (hasAnyEffect(layer)) {
            effectManager.applyEffectsToImageData(imageData, layer.effects)
          }

          ctx.putImageData(imageData, 0, 0)

          if (gen !== generationRef.current) return
          const renderKey = ++renderKeyRef.current
          next[layer.id] = { canvas: offscreen, x, y, w, h, layer, renderKey }
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
            x={lx}
            y={ly}
            width={lw}
            height={lh}
            clipFunc={createAdjustmentClipFunc(liveLayer)}
            listening={false}
          >
            <KonvaImage
              key={`img-${data.renderKey ?? 0}`}
              image={data.canvas}
              x={0}
              y={0}
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
