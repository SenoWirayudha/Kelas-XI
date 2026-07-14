import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Group, Rect, Text, Ellipse, RegularPolygon, Star, Arrow, Line, Path } from 'react-konva'
import { Image as KonvaImage } from 'react-konva'

import { getShadowProps, preloadFont } from '../../../utils/konvaUtils'
import { getArrowShapePath, getShapeFillProps, getShapeTextBounds } from '../../../utils/shapeUtils'
import { effectManager } from '../../../utils/konva-effects-engine'

const isolateChannel = (data, ch, nw, nh) => {
  const buf = new Uint8ClampedArray(data.length)
  for (let i = 0; i < data.length; i += 4) {
    buf[i]   = ch === 0 ? data[i]   : 0
    buf[i+1] = ch === 1 ? data[i+1] : 0
    buf[i+2] = ch === 2 ? data[i+2] : 0
    buf[i+3] = data[i+3]
  }
  return new ImageData(buf, nw, nh)
}

const dataToCanvas = (imgData) => {
  const c = document.createElement('canvas')
  c.width = imgData.width; c.height = imgData.height
  c.getContext('2d').putImageData(imgData, 0, 0)
  return c
}

const buildBezierDisplayPath = (item) => {
  const pts = []
  const parts = item.path?.match(/[ML]\s+([\d.]+)\s*,\s*([\d.]+)/g)
  if (!parts || parts.length < 2) return item.path || ''
  for (const p of parts) {
    const m = p.match(/[ML]\s+([\d.]+)\s*,\s*([\d.]+)/)
    if (m) pts.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) })
  }
  const cp = item.bezierData
  const n = pts.length
  let result = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < n; i++) {
    const curr = pts[i]; const next = pts[(i + 1) % n]
    const cpo = cp?.[i]; const cpi = cp?.[(i + 1) % n]
    const hasCurve = cpo && cpi && (cpo.cpOutX || cpo.cpOutY || cpi.cpInX || cpi.cpInY)
    if (hasCurve) {
      result += ` C ${curr.x + cpo.cpOutX},${curr.y + cpo.cpOutY} ${next.x + cpi.cpInX},${next.y + cpi.cpInY} ${next.x},${next.y}`
    } else {
      result += ` L ${next.x},${next.y}`
    }
  }
  return result + ' Z'
}

const adjustmentHitProps = {
  fill: 'rgba(0,0,0,0)',
  strokeEnabled: false,
  shadowEnabled: false,
}

const renderAdjustmentHitArea = (item) => {
  if (item.shapeType === 'circle' || item.shapeType === 'ellipse') {
    return (
      <Ellipse
        x={item.w / 2}
        y={item.h / 2}
        radiusX={item.w / 2}
        radiusY={item.h / 2}
        {...adjustmentHitProps}
      />
    )
  }

  if (item.shapeType === 'polygon') {
    return (
      <RegularPolygon
        x={item.w / 2}
        y={item.h / 2}
        sides={item.sides || 3}
        radius={Math.min(item.w, item.h) / 2}
        {...adjustmentHitProps}
      />
    )
  }

  if (item.shapeType === 'star') {
    return (
      <Star
        x={item.w / 2}
        y={item.h / 2}
        numPoints={item.numPoints || 5}
        innerRadius={Math.min(item.w, item.h) * (item.starInnerRatio ?? 0.25)}
        outerRadius={Math.min(item.w, item.h) / 2}
        {...adjustmentHitProps}
      />
    )
  }

  if (item.shapeType === 'arrow-shape') {
    return <Path data={getArrowShapePath({ w: item.w, h: item.h, arrowVariant: item.arrowVariant })} {...adjustmentHitProps} />
  }

  if (item.shapeType === 'arrow') {
    return (
      <Arrow
        points={item.points || [0, item.h / 2, item.w, item.h / 2]}
        pointerLength={item.pointerLength || 20}
        pointerWidth={item.pointerWidth || 20}
        stroke="rgba(0,0,0,0)"
        fill="rgba(0,0,0,0)"
        strokeWidth={Math.max(12, item.strokeWidth || 3)}
        shadowEnabled={false}
      />
    )
  }

  if (item.shapeType === 'line') {
    return (
      <Line
        points={item.points || [0, item.h / 2, item.w, item.h / 2]}
        stroke="rgba(0,0,0,0)"
        strokeWidth={Math.max(12, item.strokeWidth || 3)}
        lineCap="round"
        shadowEnabled={false}
      />
    )
  }

  return (
    <Rect
      width={item.w}
      height={item.h}
      cornerRadius={item.cornerRadius || 0}
      {...adjustmentHitProps}
    />
  )
}

export default function ShapeRenderer({
  item,
  commonProps,
  selectedId,
  selectedIds,
  onTextEdit,
}) {
  const isSelected = selectedIds?.includes(item.id) || selectedId === item.id
  const shadowProps = getShadowProps(item)
  const shapeTextFontSize = item.shapeTextFontSize || 16
  const shapeTextValue = item.shapeText || ''
  const shapePaintProps = {
    ...getShapeFillProps(item),
    stroke: item.stroke || '#3f3a46',
    strokeEnabled: item.stroke !== null && (item.strokeWidth ?? 0) > 0,
    strokeWidth: item.stroke !== null ? (item.strokeWidth ?? 0) : 0,
    strokeScaleEnabled: false,
    lineJoin: 'round',
  }

  const groupRef = useRef(null)
  const filterItemRef = useRef(item)
  const rAFRef = useRef(null)

  const hasRgbSplit = !!item.effects?.rgbSplit
  const [shapeCapture, setShapeCapture] = useState(null)
  const channelGenerationRef = useRef(0)
  const centerRef = useRef(null)

  const nonRgbEffects = useMemo(() => {
    const fx = item.effects || {}
    if (!hasRgbSplit) return fx
    const { rgbSplit, ...rest } = fx
    return Object.keys(rest).length > 0 ? rest : {}
  }, [item.effects, hasRgbSplit])

  // Derive display channels from captured pixel data + current rgbSplit params
  const shapeChannels = useMemo(() => {
    if (!shapeCapture || !hasRgbSplit) return null
    const { rC, gC, bC } = shapeCapture
    const nw = item.w; const nh = item.h
    const m = item.effects?.rgbSplit?.mode ?? 'g'
    let center, left, right
    if (m === 'g') { center = gC; left = bC; right = rC }
    else if (m === 'r') { center = rC; left = bC; right = gC }
    else { center = bC; left = gC; right = rC }

    const pixelOffset = (item.effects?.rgbSplit?.offset ?? 0.01) * Math.max(nw, nh)
    const angleRad = (item.effects?.rgbSplit?.angle ?? 0) * Math.PI / 180
    const dxDisp = Math.cos(angleRad) * pixelOffset
    const dyDisp = Math.sin(angleRad) * pixelOffset

    return { center, left, right, dxDisp, dyDisp }
  }, [shapeCapture, hasRgbSplit,
      item.effects?.rgbSplit?.mode, item.effects?.rgbSplit?.offset, item.effects?.rgbSplit?.angle,
      item.w, item.h])

  // Apply non-rgbSplit effects on the center channel Image (same pattern as CanvasTextNode)
  useLayoutEffect(() => {
    const img = centerRef.current
    if (!img || !shapeChannels) return
    img.clearCache()
    try { effectManager.applyAll(img, nonRgbEffects) } catch {}
    img.getLayer()?.batchDraw()
  }, [nonRgbEffects, shapeChannels])

  // Synchronous effect application for when rgbSplit is NOT active
  useLayoutEffect(() => {
    const node = groupRef.current
    if (!node) return
    if (hasRgbSplit && shapeChannels) return
    effectManager.applyAll(node, nonRgbEffects)
    node.getLayer()?.draw()
    return () => {
      effectManager._clearRepeater(node)
    }
  }, [nonRgbEffects, item.x, item.y, item.rotation, item.w, item.h, hasRgbSplit, shapeChannels])

  useEffect(() => {
    filterItemRef.current = item
    if (rAFRef.current) return
    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null
      const node = groupRef.current
      if (!node) return
      if (hasRgbSplit && shapeChannels) return
      const rafFx = { ...(filterItemRef.current.effects || {}) }
      if (hasRgbSplit) delete rafFx.rgbSplit
      if (Object.keys(rafFx).length > 0) {
        effectManager.applyAll(node, rafFx)
      }
    })
    return () => {
      if (rAFRef.current) { cancelAnimationFrame(rAFRef.current); rAFRef.current = null }
    }
  }, [item.effects, hasRgbSplit, shapeChannels])

  useEffect(() => {
    if (item.fontFamily) preloadFont(item.fontFamily)
  }, [item.fontFamily])

  // Capture raw shape pixel data for RGB Split (no effects).
  // Non-rgb effects are applied separately on the center channel Image via useLayoutEffect.
  useEffect(() => {
    if (!hasRgbSplit) {
      setShapeCapture(null)
      return
    }
    if (!groupRef.current) return

    const gen = ++channelGenerationRef.current

    const capture = async () => {
      await new Promise(resolve => requestAnimationFrame(resolve))
      if (gen !== channelGenerationRef.current) return

      const node = groupRef.current
      if (!node) return

      const clone = node.clone({ visible: true, opacity: 1 })
      clone.position({ x: 0, y: 0 })
      clone.rotation(0)

      let cleanCanvas
      try {
        cleanCanvas = clone.toCanvas({ width: item.w, height: item.h, pixelRatio: 1 })
      } catch {
        clone.destroy()
        return
      }
      clone.destroy()

      if (!cleanCanvas || cleanCanvas.width === 0 || cleanCanvas.height === 0) return
      if (gen !== channelGenerationRef.current) return

      const tmpC = document.createElement('canvas')
      tmpC.width = item.w; tmpC.height = item.h
      const tmpCtx = tmpC.getContext('2d')
      if (!tmpCtx) return
      tmpCtx.drawImage(cleanCanvas, 0, 0, item.w, item.h)
      const d = tmpCtx.getImageData(0, 0, item.w, item.h).data

      let hasAlpha = false
      for (let i = 3; i < d.length; i += 4) { if (d[i] > 0) { hasAlpha = true; break } }
      if (!hasAlpha) return
      if (gen !== channelGenerationRef.current) return

      const nw = item.w; const nh = item.h
      const rC = dataToCanvas(isolateChannel(d, 0, nw, nh))
      const gC = dataToCanvas(isolateChannel(d, 1, nw, nh))
      const bC = dataToCanvas(isolateChannel(d, 2, nw, nh))

      if (gen !== channelGenerationRef.current) return
      setShapeCapture({ rC, gC, bC })
    }

    const timer = setTimeout(capture, 0)
    return () => { clearTimeout(timer) }
  }, [hasRgbSplit, item.w, item.h])

  return (
    <Group
      ref={groupRef}
      {...commonProps}
      onDblClick={(event) => {
        if (item.shapeType === 'bezier-path') return
        event.cancelBubble = true
        onTextEdit(item.id)
      }}
      onDblTap={(event) => {
        if (item.shapeType === 'bezier-path') return
        event.cancelBubble = true
        onTextEdit(item.id)
      }}
    >
      {renderAdjustmentHitArea(item)}

      {/* Shape visual — hidden when rgbSplit channels are active */}
      <Group opacity={hasRgbSplit && shapeChannels ? 0 : 1} listening={false}>

      {item.shapeType === 'rect' && (
        <Rect
          width={item.w}
          height={item.h}
          cornerRadius={item.cornerRadius || 0}
          {...shapePaintProps}
          {...shadowProps}
        />
      )}

      {item.shapeType === 'circle' && (
        <Ellipse
          x={item.w / 2}
          y={item.h / 2}
          radiusX={item.w / 2}
          radiusY={item.h / 2}
          {...shapePaintProps}
          {...shadowProps}
        />
      )}

      {item.shapeType === 'ellipse' && (
        <Ellipse
          x={item.w / 2}
          y={item.h / 2}
          radiusX={item.w / 2}
          radiusY={item.h / 2}
          {...shapePaintProps}
          {...shadowProps}
        />
      )}

      {item.shapeType === 'polygon' && (
        <RegularPolygon
          x={item.w / 2}
          y={item.h / 2}
          sides={item.sides || 3}
          radius={Math.min(item.w, item.h) / 2}
          {...shapePaintProps}
          {...shadowProps}
        />
      )}

      {item.shapeType === 'star' && (
        <Star
          x={item.w / 2}
          y={item.h / 2}
          numPoints={item.numPoints || 5}
          innerRadius={Math.min(item.w, item.h) * (item.starInnerRatio ?? 0.25)}
          outerRadius={Math.min(item.w, item.h) / 2}
          {...shapePaintProps}
          {...shadowProps}
        />
      )}

      {item.shapeType === 'arrow-shape' && (
        <Path
          data={getArrowShapePath({ w: item.w, h: item.h, arrowVariant: item.arrowVariant })}
          {...shapePaintProps}
          {...shadowProps}
        />
      )}

      {item.shapeType === 'arrow' && (
        <Arrow
          points={item.points || [0, item.h / 2, item.w, item.h / 2]}
          pointerLength={item.pointerLength || 20}
          pointerWidth={item.pointerWidth || 20}
          fill={item.fill}
          stroke={item.stroke || item.fill}
          strokeWidth={item.strokeWidth || 3}
          {...shadowProps}
        />
      )}

      {item.shapeType === 'line' && (
        <Line
          points={item.points || [0, item.h / 2, item.w, item.h / 2]}
          stroke={item.stroke || item.fill}
          strokeWidth={item.strokeWidth || 3}
          lineCap="round"
          {...shadowProps}
        />
      )}

      {item.shapeType === 'freehand' && (
        item.strokes ? (
          <Group listening={false} {...shadowProps}>
            {item.strokes.map((strokePoints, si) => (
              <Line
                key={si}
                points={strokePoints || []}
                stroke={item.stroke || '#000000'}
                strokeWidth={item.strokeWidth || 3}
                opacity={item.opacity ?? 1}
                lineCap="round"
                lineJoin="round"
                tension={0.3}
                listening={false}
              />
            ))}
          </Group>
        ) : (
          <Line
            points={item.points || []}
            stroke={item.stroke || '#000000'}
            strokeWidth={item.strokeWidth || 3}
            opacity={item.opacity ?? 1}
            lineCap="round"
            lineJoin="round"
            tension={0.3}
            listening={false}
            {...shadowProps}
          />
        )
      )}

      {item.shapeType === 'bezier-path' && (
        <Path
          data={item.bezierData ? buildBezierDisplayPath(item) : (item.path || '')}
          stroke={item.stroke || '#000000'}
          strokeWidth={item.strokeWidth || 3}
          fill={item.fill || 'transparent'}
          listening={true}
          {...shadowProps}
        />
      )}

      {shapeTextValue && (() => {
        const textBounds = getShapeTextBounds(item)
        return (
          <Group
            clipX={textBounds.x}
            clipY={textBounds.y}
            clipWidth={textBounds.width}
            clipHeight={textBounds.height}
            listening={false}
          >
            <Text
              x={textBounds.x}
              y={textBounds.y}
              width={textBounds.width}
              height={textBounds.height}
              text={shapeTextValue}
              fill={item.shapeTextFill || '#231c2f'}
              fontSize={shapeTextFontSize}
              fontFamily={item.fontFamily || 'Inter, Arial'}
              fontStyle={item.isBold ? 'bold' : 'normal'}
              align={item.shapeTextAlign || 'center'}
              verticalAlign="middle"
              lineHeight={1.25}
              wrap="word"
              listening={false}
            />
          </Group>
        )
      })()}
      </Group>

      {/* RGB Split channel rendering */}
      {hasRgbSplit && shapeChannels && (
        <>
          <KonvaImage
            ref={centerRef}
            image={shapeChannels.center}
            x={0}
            y={0}
            width={item.w}
            height={item.h}
            listening={false}
          />
          <KonvaImage
            image={shapeChannels.left}
            x={-shapeChannels.dxDisp}
            y={-shapeChannels.dyDisp}
            width={item.w}
            height={item.h}
            globalCompositeOperation={'screen'}
            listening={false}
          />
          <KonvaImage
            image={shapeChannels.right}
            x={shapeChannels.dxDisp}
            y={shapeChannels.dyDisp}
            width={item.w}
            height={item.h}
            globalCompositeOperation={'screen'}
            listening={false}
          />
        </>
      )}
    </Group>
  )
}
