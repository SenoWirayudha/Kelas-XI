/**
 * CanvasImage.jsx
 * Renders a raster image on the canvas with Konva filters (brightness, contrast,
 * saturation, blur) applied imperatively to avoid stale cache issues.
 */
/* eslint-disable react-hooks/refs */
import React, { useEffect, useRef, useState } from 'react'
import { Group, Rect, Image as KonvaImage, Shape } from 'react-konva'
import { useCanvasImage } from '../../hooks/useCanvasImages'
import { getShadowProps } from '../../utils/konvaUtils'
import { effectManager } from '../../utils/konva-effects-engine'
import { getClampedCanvasPosition, getCanvasContainedSize } from '../../utils/canvasPositionUtils'

const getCropFit = (item, image) => {
  const naturalWidth = image?.naturalWidth || image?.width || item.w || 1
  const naturalHeight = image?.naturalHeight || image?.height || item.h || 1
  const zoom = Math.max(1, item.imageCropZoom || 1)
  const scale = Math.max(item.w / naturalWidth, item.h / naturalHeight) * zoom
  const width = naturalWidth * scale
  const height = naturalHeight * scale
  const centerX = (item.w - width) / 2
  const centerY = (item.h - height) / 2
  const bounds = {
    minX: Math.min(0, item.w - width),
    maxX: Math.max(0, item.w - width),
    minY: Math.min(0, item.h - height),
    maxY: Math.max(0, item.h - height),
  }
  const cropX = Math.min(bounds.maxX, Math.max(bounds.minX, centerX + (item.imageCrop?.x || 0)))
  const cropY = Math.min(bounds.maxY, Math.max(bounds.minY, centerY + (item.imageCrop?.y || 0)))
  return { x: cropX, y: cropY, width, height, centerX, centerY, bounds }
}

const getImageCropProps = (item, image) => {
  if (!item.imageCropRect) return {}
  const naturalWidth = image?.naturalWidth || image?.width || item.cropSourceWidth || item.w || 1
  const naturalHeight = image?.naturalHeight || image?.height || item.cropSourceHeight || item.h || 1
  return {
    crop: {
      x: Math.max(0, Math.min(naturalWidth, item.imageCropRect.x || 0)),
      y: Math.max(0, Math.min(naturalHeight, item.imageCropRect.y || 0)),
      width: Math.max(1, Math.min(naturalWidth, item.imageCropRect.width || naturalWidth)),
      height: Math.max(1, Math.min(naturalHeight, item.imageCropRect.height || naturalHeight)),
    },
  }
}

const getImageStrokeProps = (item) => {
  const width = Math.max(0, Number(item.imageStrokeWidth || 0))
  const stops = item.imageStrokeGradientStops || [{ offset: 0, color: item.imageStrokeColor || '#ffffff' }, { offset: 1, color: item.imageStrokeColor || '#ffffff' }]
  return {
    enabled: !!item.imageStrokeEnabled && width > 0,
    width,
    color: item.imageStrokeColor || '#ffffff',
    gradientType: item.imageStrokeGradientType || 'solid',
    gradientStops: stops,
    gradientAngle: item.imageStrokeGradientAngle || 90,
    mask: !!item.imageStrokeMaskEnabled,
  }
}

const getLinearGradientPoints = (width, height, angle = 90) => {
  const radians = ((angle - 90) * Math.PI) / 180
  const radius = Math.sqrt(width * width + height * height) / 2
  const centerX = width / 2
  const centerY = height / 2
  const dx = Math.cos(radians) * radius
  const dy = Math.sin(radians) * radius
  return {
    start: { x: centerX - dx, y: centerY - dy },
    end: { x: centerX + dx, y: centerY + dy },
  }
}

const addGradientStops = (gradient, stops) => {
  stops.forEach((stop) => gradient.addColorStop(stop.offset, stop.color))
  return gradient
}

const createCanvasStrokeStyle = (ctx, width, height, stroke) => {
  if (stroke.gradientType === 'linear') {
    const points = getLinearGradientPoints(width, height, stroke.gradientAngle)
    return addGradientStops(
      ctx.createLinearGradient(points.start.x, points.start.y, points.end.x, points.end.y),
      stroke.gradientStops,
    )
  }
  if (stroke.gradientType === 'radial') {
    return addGradientStops(
      ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2),
      stroke.gradientStops,
    )
  }
  return stroke.color
}

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius || 0, width / 2, height / 2))
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, r)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
}

const drawImageAlpha = (ctx, image, imageProps, dx, dy) => {
  const targetWidth = Math.max(1, Math.round(imageProps.width || 1))
  const targetHeight = Math.max(1, Math.round(imageProps.height || 1))
  const crop = imageProps.crop
  if (crop) {
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, dx, dy, targetWidth, targetHeight)
    return
  }
  ctx.drawImage(image, dx, dy, targetWidth, targetHeight)
}

const createAlphaStrokeCanvas = (image, imageProps, stroke) => {
  if (typeof document === 'undefined' || !image) return null
  const strokeWidth = Math.max(1, Math.round(stroke.width))
  const targetWidth = Math.max(1, Math.round(imageProps.width || 1))
  const targetHeight = Math.max(1, Math.round(imageProps.height || 1))
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth + strokeWidth * 2
  canvas.height = targetHeight + strokeWidth * 2
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const steps = Math.max(16, Math.min(40, strokeWidth * 4))
  for (let index = 0; index < steps; index += 1) {
    const angle = (Math.PI * 2 * index) / steps
    drawImageAlpha(
      ctx,
      image,
      imageProps,
      strokeWidth + Math.cos(angle) * strokeWidth,
      strokeWidth + Math.sin(angle) * strokeWidth,
    )
  }

  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = createCanvasStrokeStyle(ctx, canvas.width, canvas.height, stroke)
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = 'source-over'
  return canvas
}

const createBoxStrokeCanvas = (item, stroke) => {
  if (typeof document === 'undefined') return null
  const strokeWidth = Math.max(1, Math.round(stroke.width))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(item.w + strokeWidth * 2))
  canvas.height = Math.max(1, Math.round(item.h + strokeWidth * 2))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = createCanvasStrokeStyle(ctx, canvas.width, canvas.height, stroke)
  drawRoundedRect(ctx, strokeWidth, strokeWidth, item.w, item.h, item.radius ?? 0)
  ctx.stroke()
  return canvas
}

function CanvasImage({
  item,
  canvasBounds,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  onCursor,
  onItemHover,
  disableDrag,
  onCropStart,
  isCropTarget,
}) {
  const image          = useCanvasImage(item.src)
  const imageNodeRef   = useRef(null)
  const shadowNodeRef  = useRef(null)
  const sizeRef        = useRef({ w: item.w, h: item.h })
  const processedImageRef = useRef(null)
  const originalImageRef  = useRef(null)
  const rgbPadXRef        = useRef(0)
  const rgbPadYRef        = useRef(0)
  const rgbLayersRef      = useRef(null)
  const processTimerRef   = useRef(null)
  // eslint-disable-next-line no-unused-vars
  const [rgbSplitVer, setRgbSplitVer] = useState(0)

  useEffect(() => { sizeRef.current = { w: item.w, h: item.h } }, [item.w, item.h])

  // Simpan reference ke original image (dari useCanvasImage, bukan hasil proses)
  useEffect(() => { originalImageRef.current = image }, [image])

  // rgbSplit: pre-composite shifted layers (Screen) into one canvas,
  // clear center area (destination-out), render behind full-RGB center.
  useEffect(() => {
    const p = item.effects?.rgbSplit
    if (!p || !image) {
      if (!p) {
        rgbLayersRef.current = null
        processedImageRef.current = null
        rgbPadXRef.current = 0
        rgbPadYRef.current = 0
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRgbSplitVer(v => v + 1)
      }
      return
    }

    if (processTimerRef.current) clearTimeout(processTimerRef.current)
    processTimerRef.current = setTimeout(() => {
      const img = originalImageRef.current
      if (!img || !img.complete || !img.naturalWidth) return

      const nw = img.naturalWidth, nh = img.naturalHeight

      // Source-space offset
      const pixelOffset = (p.offset ?? 0.01) * Math.max(nw, nh)
      const angleRad = (p.angle ?? 0) * Math.PI / 180
      const dxSrc = Math.cos(angleRad) * pixelOffset
      const dySrc = Math.sin(angleRad) * pixelOffset

      // Symmetrical source padding
      const pad = Math.ceil(Math.max(Math.abs(dxSrc), Math.abs(dySrc))) + 20

      // Display-space offset & padding
      const scX = item.w / nw, scY = item.h / nh
      const dxDisp = dxSrc * scX
      const dyDisp = dySrc * scY
      const padDisp = Math.ceil(Math.max(Math.abs(dxDisp), Math.abs(dyDisp))) + 20

      // Draw original to temp canvas → get pixel data for isolation
      const srcCanvas = document.createElement('canvas')
      srcCanvas.width = nw; srcCanvas.height = nh
      const srcCtx = srcCanvas.getContext('2d')
      if (!srcCtx) return
      srcCtx.drawImage(img, 0, 0, nw, nh)
      const srcData = srcCtx.getImageData(0, 0, nw, nh)
      const d = srcData.data

      function isolate(ch) {
        const buf = new Uint8ClampedArray(d.length)
        for (let i = 0; i < d.length; i += 4) {
          buf[i]   = ch === 0 ? d[i]   : 0
          buf[i+1] = ch === 1 ? d[i+1] : 0
          buf[i+2] = ch === 2 ? d[i+2] : 0
          buf[i+3] = d[i+3]
        }
        return new ImageData(buf, nw, nh)
      }

      function dataToCanvas(imgData) {
        const c = document.createElement('canvas')
        c.width = nw; c.height = nh
        c.getContext('2d').putImageData(imgData, 0, 0)
        return c
      }

      const rCanvas = dataToCanvas(isolate(0))
      const gCanvas = dataToCanvas(isolate(1))
      const bCanvas = dataToCanvas(isolate(2))

      // Assign center / left / right per mode
      // Center = channel-isolated (primary color), left+right = shifted channels
      const m = p.mode ?? 'g'
      let centerCanvas, leftCanvas, rightCanvas
      if (m === 'g') { centerCanvas = gCanvas; leftCanvas = bCanvas; rightCanvas = rCanvas }
      else if (m === 'r') { centerCanvas = rCanvas; leftCanvas = bCanvas; rightCanvas = gCanvas }
      else                { centerCanvas = bCanvas; leftCanvas = gCanvas; rightCanvas = rCanvas }

      // Pre-composite shifted layers into one canvas
      const shiftCanvas = document.createElement('canvas')
      shiftCanvas.width = nw + pad * 2
      shiftCanvas.height = nh + pad * 2
      const shiftCtx = shiftCanvas.getContext('2d')
      if (!shiftCtx) return

      // Screen blend each shifted layer at its offset
      shiftCtx.globalCompositeOperation = 'screen'
      shiftCtx.drawImage(leftCanvas, pad - Math.round(dxSrc), pad - Math.round(dySrc))
      shiftCtx.drawImage(rightCanvas, pad + Math.round(dxSrc), pad + Math.round(dySrc))
      shiftCtx.globalCompositeOperation = 'source-over'
      // Shift canvas now has left+right screened together (overlaps center area too).
      // At render time it's drawn ON TOP with Screen blend via Shape sceneFunc.

      rgbLayersRef.current = { shift: shiftCanvas, center: centerCanvas, dxDisp, dyDisp, padDisp }
      processedImageRef.current = null
      rgbPadXRef.current = 0
      rgbPadYRef.current = 0
      setRgbSplitVer(v => v + 1)
    }, 150)

    return () => {
      if (processTimerRef.current) clearTimeout(processTimerRef.current)
    }
  }, [image, item.effects?.rgbSplit, item.w, item.h])
  const cropFit = image ? getCropFit(item, image) : null
  const cropProps = image ? getImageCropProps(item, image) : {}

  // Terapkan efek — via RAF agar Konva sempat render node dulu sebelum cache
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const node = imageNodeRef.current
      if (!node || !image) return

      const imageIsReady = image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
      if (!imageIsReady) return

      try {
        if (!item.isAdjustmentLayer) {
          effectManager.applyAll(node, item.effects, item)
        }
      } catch (error) {
        console.warn('[canvas image] failed to apply effects', {
          src: item.src,
          message: error?.message,
        })
        effectManager.removeAll(node)
      }

      // Guard: hanya edge glow yang punya combo spesial dengan drop shadow
      const shadowNode = shadowNodeRef.current
      const hasEdgeGlow = item.effects?.edgeGlow
      const hasShadow = item.shadowEnabled && (item.shadow ?? 0) > 0
      if (hasEdgeGlow && hasShadow && shadowNode) {
        try {
          effectManager.applyAll(shadowNode, { edgeGlow: item.effects.edgeGlow })
        } catch {
          effectManager.removeAll(shadowNode)
        }
      } else if (shadowNode) {
        effectManager.removeAll(shadowNode)
      }

      node.getLayer()?.batchDraw()
    })
    return () => cancelAnimationFrame(raf)
  }, [image, item])

  if (isCropTarget) return null
  const imageStroke = getImageStrokeProps(item)
  const shadowProps = getShadowProps(item)
  const hasShadow = Object.keys(shadowProps).length > 0
  const renderMaskedImageStroke = (props = {}) => {
    if (!image || !imageStroke.enabled || !imageStroke.mask) return null
    const strokeCanvas = createAlphaStrokeCanvas(image, props, imageStroke)
    if (!strokeCanvas) return null
    return (
      <KonvaImage
        image={strokeCanvas}
        x={(props.x || 0) - imageStroke.width}
        y={(props.y || 0) - imageStroke.width}
        width={strokeCanvas.width}
        height={strokeCanvas.height}
        listening={false}
        perfectDrawEnabled={false}
      />
    )
  }
  const renderBoxImageStroke = () => {
    if (!imageStroke.enabled || imageStroke.mask) return null
    const strokeCanvas = createBoxStrokeCanvas(item, imageStroke)
    if (!strokeCanvas) return null
    return (
      <KonvaImage
        image={strokeCanvas}
        x={-imageStroke.width}
        y={-imageStroke.width}
        width={strokeCanvas.width}
        height={strokeCanvas.height}
        listening={false}
        perfectDrawEnabled={false}
      />
    )
  }

  if (item.isAdjustmentLayer) {
    return (
      <Group
        id={item.id}
        x={item.x} y={item.y}
        rotation={item.rotation || 0}
        draggable={!item.locked && !disableDrag}
        visible={item.visible !== false}
        dragBoundFunc={(pos) => getClampedCanvasPosition(sizeRef.current.w, sizeRef.current.h, pos, canvasBounds)}
        onClick={(e)  => onSelect(e, item.id)}
        onTap={(e)    => onSelect(e, item.id)}
        onMouseEnter={() => { onItemHover(item.id); onCursor(item.locked ? 'default' : 'move') }}
        onMouseLeave={() => { onItemHover(null);    onCursor('default') }}
        onDragStart={(e)  => onDragStart(e, item.id)}
        onDragMove={(e)   => onDragMove?.(e, item.id)}
        onDragEnd={(e)    => onDragEnd(e, item.id)}
      >
        <Rect width={item.w} height={item.h} fill="transparent" listening={false} />
      </Group>
    )
  }

  return (
    <Group
      id={item.id}
      x={item.x} y={item.y}
      rotation={item.rotation || 0}
      draggable={!item.cropEnabled && !item.locked && !disableDrag}
      opacity={item.opacity ?? 1}
      visible={item.visible !== false}
      dragBoundFunc={(pos) => getClampedCanvasPosition(sizeRef.current.w, sizeRef.current.h, pos, canvasBounds)}
      onClick={(e)  => onSelect(e, item.id)}
      onTap={(e)    => onSelect(e, item.id)}
      onDblClick={(e) => { e.cancelBubble = true; onCropStart?.(item.id) }}
      onDblTap={(e) => { e.cancelBubble = true; onCropStart?.(item.id) }}
      onMouseEnter={() => { onItemHover(item.id); onCursor(item.locked ? 'default' : 'move') }}
      onMouseLeave={() => { onItemHover(null);    onCursor('default') }}
      onDragStart={(e)  => onDragStart(e, item.id)}
      onDragMove={(e)   => onDragMove?.(e, item.id)}
      onDragEnd={(e)    => onDragEnd(e, item.id)}
      onTransformEnd={(e) => {
        const node   = e.target
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        let reqW, reqH
        if (item.lockAspectRatio) {
          const ratio = item.w / item.h || 1
          const maxScale = Math.max(scaleX, scaleY)
          reqW = Math.max(80, item.w * maxScale)
          reqH = Math.max(80, reqW / ratio)
        } else {
          reqW = Math.max(80, item.w * Math.abs(scaleX))
          reqH = Math.max(80, item.h * Math.abs(scaleY))
        }
        const next   = getCanvasContainedSize(reqW, reqH)
        node.scaleX(1); node.scaleY(1)
        const nextPos = getClampedCanvasPosition(next.w, next.h, { x: node.x(), y: node.y() }, canvasBounds)
        onChange({ x: nextPos.x, y: nextPos.y, w: next.w, h: next.h, rotation: node.rotation() })
      }}
    >
      <Rect
        width={item.w} height={item.h}
        cornerRadius={item.radius ?? 0}
        fill="transparent"
      />
      {image && !isCropTarget && (
        item.cropEnabled ? (
          <Group
            clipX={0}
            clipY={0}
            clipWidth={item.w}
            clipHeight={item.h}
          >
            {hasShadow && (
              <KonvaImage
                name="canvas-image-shadow"
                ref={shadowNodeRef}
                image={image}
                x={cropFit.x}
                y={cropFit.y}
                width={cropFit.width}
                height={cropFit.height}
                {...shadowProps}
                cornerRadius={item.radius ?? 0}
                listening={false}
                perfectDrawEnabled={false}
              />
            )}
            {renderMaskedImageStroke({
              x: cropFit.x,
              y: cropFit.y,
              width: cropFit.width,
              height: cropFit.height,
            })}
            <KonvaImage
              name="canvas-image-main"
              ref={imageNodeRef}
              image={processedImageRef.current || image}
              x={(processedImageRef.current ? -rgbPadXRef.current : 0) + cropFit.x}
              y={(processedImageRef.current ? -rgbPadYRef.current : 0) + cropFit.y}
              width={processedImageRef.current ? cropFit.width + rgbPadXRef.current * 2 : cropFit.width}
              height={processedImageRef.current ? cropFit.height + rgbPadYRef.current * 2 : cropFit.height}
              draggable={!item.locked}
              listening
              dragBoundFunc={(position) => ({
                x: Math.min(cropFit.bounds.maxX, Math.max(cropFit.bounds.minX, position.x)),
                y: Math.min(cropFit.bounds.maxY, Math.max(cropFit.bounds.minY, position.y)),
              })}
              onDragMove={(event) => {
                event.cancelBubble = true
                const node = event.target
                node.x(Math.min(cropFit.bounds.maxX, Math.max(cropFit.bounds.minX, node.x())))
                node.y(Math.min(cropFit.bounds.maxY, Math.max(cropFit.bounds.minY, node.y())))
              }}
              onDragEnd={(event) => {
                event.cancelBubble = true
                const node = event.target
                onChange({
                  imageCrop: {
                    x: node.x() - cropFit.centerX,
                    y: node.y() - cropFit.centerY,
                  },
                })
              }}
              cornerRadius={item.radius ?? 0}
            />
            {renderBoxImageStroke()}
          </Group>
        ) : (
          <>
            {hasShadow && (
              <KonvaImage
                name="canvas-image-shadow"
                ref={shadowNodeRef}
                image={image}
                width={item.w} height={item.h}
                {...cropProps}
                {...shadowProps}
                cornerRadius={item.radius ?? 0}
                listening={false}
                perfectDrawEnabled={false}
              />
            )}
            {renderMaskedImageStroke({
              width: item.w,
              height: item.h,
              ...cropProps,
            })}
            {(rgbLayersRef.current) ? (
              <>
                <KonvaImage
                  name="canvas-image-main"
                  ref={imageNodeRef}
                  image={rgbLayersRef.current.center}
                  width={item.w}
                  height={item.h}
                  {...cropProps}
                  cornerRadius={item.radius ?? 0}
                  listening={false}
                />
                <Shape
                  name="canvas-image-rgb-shift"
                  x={-rgbLayersRef.current.padDisp}
                  y={-rgbLayersRef.current.padDisp}
                  sceneFunc={(ctx) => {
                    ctx.save()
                    ctx.globalCompositeOperation = 'screen'
                    const ref = rgbLayersRef.current
                    ctx.drawImage(ref.shift, 0, 0, item.w + ref.padDisp * 2, item.h + ref.padDisp * 2)
                    ctx.restore()
                  }}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              </>
            ) : (
              <KonvaImage
                name="canvas-image-main"
                ref={imageNodeRef}
                image={processedImageRef.current || image}
                x={processedImageRef.current ? -rgbPadXRef.current : 0}
                y={processedImageRef.current ? -rgbPadYRef.current : 0}
                width={processedImageRef.current ? item.w + rgbPadXRef.current * 2 : item.w}
                height={processedImageRef.current ? item.h + rgbPadYRef.current * 2 : item.h}
                {...cropProps}
                cornerRadius={item.radius ?? 0}
                listening={false}
              />
            )}
            {renderBoxImageStroke()}
          </>
        )
      )}
    </Group>
  )
}

export default React.memo(CanvasImage, (prev, next) => {
  return prev.item.id === next.item.id
    && prev.item.x === next.item.x && prev.item.y === next.item.y
    && prev.item.w === next.item.w && prev.item.h === next.item.h
    && prev.item.rotation === next.item.rotation
    && prev.item.opacity === next.item.opacity
    && prev.item.visible === next.item.visible
    && prev.item.locked === next.item.locked
    && prev.item.radius === next.item.radius
    && prev.item.src === next.item.src
    && prev.item.brightness === next.item.brightness
    && prev.item.contrast === next.item.contrast
    && prev.item.saturation === next.item.saturation
    && prev.item.blur === next.item.blur
    && prev.item.shadowEnabled === next.item.shadowEnabled
    && prev.item.shadow === next.item.shadow
    && prev.item.shadowColor === next.item.shadowColor
    && prev.item.shadowOpacity === next.item.shadowOpacity
    && prev.item.shadowOffsetX === next.item.shadowOffsetX
    && prev.item.shadowOffsetY === next.item.shadowOffsetY
    && prev.item.imageStrokeEnabled === next.item.imageStrokeEnabled
    && prev.item.imageStrokeColor === next.item.imageStrokeColor
    && prev.item.imageStrokeWidth === next.item.imageStrokeWidth
    && prev.item.imageStrokeMaskEnabled === next.item.imageStrokeMaskEnabled
    && prev.item.imageStrokeGradientType === next.item.imageStrokeGradientType
    && prev.item.imageStrokeGradientAngle === next.item.imageStrokeGradientAngle
    && JSON.stringify(prev.item.imageStrokeGradientStops) === JSON.stringify(next.item.imageStrokeGradientStops)
    && prev.item.exposure === next.item.exposure
    && prev.item.temperature === next.item.temperature
    && prev.item.hue === next.item.hue
    && prev.item.highlights === next.item.highlights
    && prev.item.shadows === next.item.shadows
    && prev.item.whites === next.item.whites
    && prev.item.blacks === next.item.blacks
    && prev.item.sharpen === next.item.sharpen
    && prev.item.vignette === next.item.vignette
    && prev.item.cropEnabled === next.item.cropEnabled
    && prev.item.imageCropZoom === next.item.imageCropZoom
    && JSON.stringify(prev.item.effects) === JSON.stringify(next.item.effects)
    && prev.item.imageCrop?.x === next.item.imageCrop?.x
    && prev.item.imageCrop?.y === next.item.imageCrop?.y
    && prev.item.imageCropRect?.x === next.item.imageCropRect?.x
    && prev.item.imageCropRect?.y === next.item.imageCropRect?.y
    && prev.item.imageCropRect?.width === next.item.imageCropRect?.width
    && prev.item.imageCropRect?.height === next.item.imageCropRect?.height
    && prev.item.cropSourceWidth === next.item.cropSourceWidth
    && prev.item.cropSourceHeight === next.item.cropSourceHeight
    && prev.canvasBounds === next.canvasBounds
    && prev.disableDrag === next.disableDrag
    && prev.onCropStart === next.onCropStart
    && prev.isCropTarget === next.isCropTarget
})
