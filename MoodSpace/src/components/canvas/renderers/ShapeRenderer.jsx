import { useEffect, useLayoutEffect, useRef } from 'react'
import { Group, Rect, Text, Ellipse, RegularPolygon, Star, Arrow, Line, Path } from 'react-konva'
import { getShadowProps, preloadFont } from '../../../utils/konvaUtils'
import { getArrowShapePath, getShapeFillProps, getShapeTextBounds } from '../../../utils/shapeUtils'
import { effectManager } from '../../../utils/konva-effects-engine'

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

  // Synchronous effect application so transform effects (repeater etc.) render immediately.
  // Includes position deps so repeater clones follow the original on move/resize.
  useLayoutEffect(() => {
    const node = groupRef.current
    if (!node) return
    effectManager.applyAll(node, item.effects)
    node.getLayer()?.draw()
    return () => {
      // Clean up repeater clones on unmount (delete) so they don't linger on the layer
      effectManager._clearRepeater(node)
    }
  }, [item.effects, item.x, item.y, item.rotation, item.w, item.h])

  useEffect(() => {
    filterItemRef.current = item
    if (rAFRef.current) return
    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null
      const node = groupRef.current
      if (!node) return
      effectManager.applyAll(node, filterItemRef.current.effects)
    })
    return () => {
      if (rAFRef.current) { cancelAnimationFrame(rAFRef.current); rAFRef.current = null }
    }
  }, [item.effects])

  useEffect(() => {
    if (item.fontFamily) preloadFont(item.fontFamily)
  }, [item.fontFamily])

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
  )
}
