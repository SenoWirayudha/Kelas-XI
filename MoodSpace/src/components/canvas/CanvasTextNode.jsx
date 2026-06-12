/**
 * CanvasTextNode.jsx
 * Konva Text node for canvas text items.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Group, Image, Rect, Text } from 'react-konva'
import { preloadFont, getShadowProps } from '../../utils/konvaUtils'
import { getClampedCanvasPosition } from '../../utils/canvasPositionUtils'
import { clamp } from '../../utils/mathUtils'
import { effectManager } from '../../utils/konva-effects-engine'

function renderCurvedText(text, fontFamily, fontSize, fontStyle, curveAmount, letterSpacing, fillColor) {
  const chars = Array.from(text || ' ')
  if (chars.length === 0 || Math.abs(curveAmount) < 0.001) return null
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`
  const charWidths = chars.map((c) => ctx.measureText(c).width)
  const totalWidth = charWidths.reduce((s, w, i) => s + w + (i < chars.length - 1 ? (letterSpacing || 0) : 0), 0)
  if (totalWidth <= 0) return null
  const maxHeight = Math.min(totalWidth * 0.3, fontSize * 3)
  const curveHeight = Math.abs(curveAmount) * maxHeight
  const pad = fontSize * 1.5
  canvas.width = Math.ceil(totalWidth + pad * 2)
  canvas.height = Math.ceil(curveHeight + fontSize * 2 + pad * 2)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`
  ctx.fillStyle = (typeof fillColor === 'string' && fillColor.startsWith('#')) ? fillColor : '#000'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const isUp = curveAmount >= 0
  const W = totalWidth
  const baseY = isUp ? canvas.height - pad - fontSize / 2 : pad + fontSize / 2
  let cx = pad
  for (let i = 0; i < chars.length; i++) {
    const cw = charWidths[i]
    const centerX = cx + cw / 2
    const nx = 2 * (centerX - pad) / W - 1
    const yOff = curveAmount * maxHeight * (1 - nx * nx)
    const y = baseY - yOff
    const slope = 4 * curveAmount * maxHeight * nx / W
    const rot = Math.atan(slope)
    ctx.save()
    ctx.translate(centerX, y)
    ctx.rotate(rot)
    ctx.fillText(chars[i], 0, 0)
    ctx.restore()
    cx += cw + (letterSpacing || 0)
  }
  return canvas
}

const getTextMinWidth = (node, text, fontSize) => {
  const widestGlyph = Array.from(text || '').reduce((maxWidth, character) => {
    if (character === '\n') return maxWidth
    return Math.max(maxWidth, node.measureSize?.(character)?.width || 0)
  }, 0)
  return Math.max(24, Math.ceil(widestGlyph + Math.max(4, fontSize * 0.08)))
}

export default function CanvasTextNode({ item, commonProps, isTextEditing, onTextEdit, onChange, canvasBounds, getActiveTransformAnchor }) {
  const textNodeRef = useRef(null)
  const curveImageRef = useRef(null)
  const [fontLoaded, setFontLoaded] = useState(false)
  const hasAutoExpandedRef = useRef(false)
  const transformStartRef = useRef(null)
  const transformAnchorRef = useRef(null)

  const letterSpacing = item.effects?.letterSpacing?.value ?? 0
  const curveAmount = item.effects?.curve?.amount ?? 0
  const hasCurve = Math.abs(curveAmount) > 0.001 && !(item.text || '').includes('\n')

  const fontStyle = [item.isBold && 'bold', item.isItalic && 'italic'].filter(Boolean).join(' ') || 'normal'
  const textDecoration = item.isUnderline ? 'underline' : 'none'

  const curveCanvas = useMemo(() => {
    if (!hasCurve) return null
    return renderCurvedText(
      item.text, item.fontFamily, item.fontSize, fontStyle,
      curveAmount, letterSpacing,
      (typeof item.fill === 'string' && item.fill.startsWith('#')) ? item.fill : '#000'
    )
  }, [hasCurve, item.text, item.fontFamily, item.fontSize, item.isBold, item.isItalic, curveAmount, letterSpacing, item.fill])

  useEffect(() => {
    preloadFont(item.fontFamily || 'Inter, Arial').then(() => setFontLoaded(true))
  }, [item.fontFamily])

  useLayoutEffect(() => {
    const node = textNodeRef.current
    if (!node || hasCurve) return

    if (fontLoaded && !hasAutoExpandedRef.current && item.text && !item.text.includes('\n') && node.textWidth > 0) {
      const neededWidth = Math.ceil(node.textWidth) + 30
      if (neededWidth > (item.w || 0)) {
        hasAutoExpandedRef.current = true
        node.width(neededWidth)
        onChange({ w: neededWidth })
      } else {
        hasAutoExpandedRef.current = true
      }
    }

    node.clearCache()
    if (typeof node._clearTextCache === 'function') node._clearTextCache()
    try { effectManager.applyAll(node, item.effects) } catch {}
    node.getLayer()?.draw()
  }, [
    item.strokeWidth, item.stroke, item.fill,
    item.gradientType, item.gradientStops, item.gradientAngle,
    item.strokeGradientType, item.strokeGradientStops, item.strokeGradientAngle,
    item.fontSize, item.fontFamily, letterSpacing, curveAmount,
    item.isBold, item.isItalic, item.isUnderline,
    item.align, item.text, item.opacity,
    item.shadowEnabled, item.shadow, item.shadowColor, item.shadowOpacity, item.shadowOffsetX, item.shadowOffsetY,
    fontLoaded, item.w, hasCurve, onChange,
  ])

  const filterItemRef = useRef(item)
  const rAFRef = useRef(null)

  useEffect(() => {
    filterItemRef.current = item
    if (rAFRef.current) return
    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null
      const node = hasCurve ? curveImageRef.current : textNodeRef.current
      if (!node) return
      try { effectManager.applyAll(node, filterItemRef.current.effects) } catch {}
    })
    return () => {
      if (rAFRef.current) { cancelAnimationFrame(rAFRef.current); rAFRef.current = null }
    }
  }, [item, fontLoaded, hasCurve])

  const textHeight = Math.max(item.h || 1, item.fontSize || 1)
  const hasEffects = item.effects && Object.keys(item.effects).some(k => !['letterSpacing', 'curve'].includes(k))
  const descenderPad = hasEffects ? Math.ceil((item.fontSize || 48) * 0.35) : 0
  const textBoxHeight = textHeight + descenderPad

  const hasTextFill = item.fill !== null && item.fill !== 'transparent'
  const hasFillGradient = hasTextFill && item.gradientType !== 'solid' && item.gradientStops?.length >= 2
  const gradientProps = {}
  if (item.gradientType === 'linear' && hasFillGradient) {
    const angle = (item.gradientAngle || 90) * (Math.PI / 180)
    gradientProps.fillLinearGradientStartPoint = { x: item.w / 2 - (Math.cos(angle) * item.w) / 2, y: item.h / 2 - (Math.sin(angle) * item.h) / 2 }
    gradientProps.fillLinearGradientEndPoint = { x: item.w / 2 + (Math.cos(angle) * item.w) / 2, y: item.h / 2 + (Math.sin(angle) * item.h) / 2 }
    gradientProps.fillLinearGradientColorStops = item.gradientStops.flatMap((s) => [s.offset, s.color])
    gradientProps.fill = undefined
  } else if (item.gradientType === 'radial' && hasFillGradient) {
    gradientProps.fillRadialGradientStartPoint = { x: item.w / 2, y: item.h / 2 }
    gradientProps.fillRadialGradientEndPoint = { x: item.w / 2, y: item.h / 2 }
    gradientProps.fillRadialGradientStartRadius = 0
    gradientProps.fillRadialGradientEndRadius = Math.max(item.w, item.h) / 2
    gradientProps.fillRadialGradientColorStops = item.gradientStops.flatMap((s) => [s.offset, s.color])
    gradientProps.fill = undefined
  } else {
    gradientProps.fill = hasTextFill ? item.fill : 'rgba(0,0,0,0)'
  }

  const strokeGradientProps = {}
  if (item.strokeGradientType === 'linear' && item.strokeGradientStops?.length >= 2) {
    const angle = (item.strokeGradientAngle || 90) * (Math.PI / 180)
    strokeGradientProps.strokeLinearGradientStartPoint = { x: item.w / 2 - (Math.cos(angle) * item.w) / 2, y: item.h / 2 - (Math.sin(angle) * item.h) / 2 }
    strokeGradientProps.strokeLinearGradientEndPoint = { x: item.w / 2 + (Math.cos(angle) * item.w) / 2, y: item.h / 2 + (Math.sin(angle) * item.h) / 2 }
    strokeGradientProps.strokeLinearGradientColorStops = item.strokeGradientStops.flatMap((s) => [s.offset, s.color])
    strokeGradientProps.stroke = undefined
  } else if (item.strokeGradientType === 'radial' && item.strokeGradientStops?.length >= 2) {
    strokeGradientProps.strokeRadialGradientStartPoint = { x: item.w / 2, y: item.h / 2 }
    strokeGradientProps.strokeRadialGradientEndPoint = { x: item.w / 2, y: item.h / 2 }
    strokeGradientProps.strokeRadialGradientStartRadius = 0
    strokeGradientProps.strokeRadialGradientEndRadius = Math.max(item.w, item.h) / 2
    strokeGradientProps.strokeRadialGradientColorStops = item.strokeGradientStops.flatMap((s) => [s.offset, s.color])
    strokeGradientProps.stroke = undefined
  } else {
    strokeGradientProps.stroke = item.stroke
  }

  const textProps = {
    text: item.text,
    width: item.w,
    fontSize: item.fontSize,
    fontFamily: item.fontFamily || 'Inter, Arial',
    fontStyle,
    textDecoration,
    letterSpacing,
    lineJoin: 'round',
    miterLimit: 2,
    lineHeight: 0.9,
    wrap: 'word',
    align: item.align || 'center',
    perfectDrawEnabled: true,
  }
  if (descenderPad > 0) {
    textProps.height = textBoxHeight
    textProps.verticalAlign = 'top'
  }
  const hasStroke = (item.strokeWidth || 0) > 0 && (item.stroke || item.strokeGradientType)
  const shadowProps = getShadowProps(item)
  const hasShadow = Object.keys(shadowProps).length > 0

  if (item.isAdjustmentLayer) {
    return (
      <Group
        key={item.id}
        {...commonProps}
        width={item.w}
        height={item.h}
      >
        <Rect width={item.w} height={item.h} fill="transparent" listening={false} />
      </Group>
    )
  }

  const curveW = curveCanvas?.width || item.w
  const curveH = curveCanvas?.height || textHeight

  return (
    <Group
      key={item.id}
      {...commonProps}
      width={item.w}
      height={textBoxHeight}
      opacity={isTextEditing ? 0 : (item.opacity ?? 1)}
      onDblClick={(e) => { e.cancelBubble = true; onTextEdit(item.id) }}
      onDblTap={(e) => { e.cancelBubble = true; onTextEdit(item.id) }}
      onTransformStart={(event) => {
        const node = textNodeRef.current
        if (!node || hasCurve) return
        transformAnchorRef.current = getActiveTransformAnchor?.()
        transformStartRef.current = {
          width: Math.max(getTextMinWidth(node, item.text, node.fontSize() || item.fontSize || 48), node.width() || item.w || 8),
          fontSize: clamp(node.fontSize() || item.fontSize || 48, 8, 1000),
        }
      }}
      onTransform={(event) => {
        const groupNode = event.target
        const node = textNodeRef.current
        if (!node || hasCurve) return
        const activeAnchor = transformAnchorRef.current || getActiveTransformAnchor?.()
        const isSideResize = activeAnchor === 'middle-left' || activeAnchor === 'middle-right'

        if (isSideResize) {
          const nextWidth = Math.max(
            getTextMinWidth(node, item.text, node.fontSize() || item.fontSize || 48),
            (node.width() || item.w || 8) * Math.abs(groupNode.scaleX() || 1),
          )
          node.width(nextWidth)
          groupNode.scaleX(1)
          groupNode.scaleY(1)
          node.clearCache()
          if (typeof node._clearTextCache === 'function') node._clearTextCache()
          try { effectManager.applyAll(node, filterItemRef.current.effects) } catch {}
          node.getLayer()?.batchDraw()
        }
      }}
      onTransformEnd={(event) => {
        const groupNode = event.target
        const node = textNodeRef.current
        if (!node || hasCurve) return
        const start = transformStartRef.current || {
          width: Math.max(getTextMinWidth(node, item.text, item.fontSize || node.fontSize() || 48), item.w || node.width() || 8),
          fontSize: clamp(item.fontSize || node.fontSize() || 48, 8, 1000),
        }
        const activeAnchor = transformAnchorRef.current
        const isSideResize = activeAnchor === 'middle-left' || activeAnchor === 'middle-right'
        const scaleX = Math.abs(groupNode.scaleX() || 1)
        const scaleY = Math.abs(groupNode.scaleY() || 1)
        const nextFontSize = isSideResize
          ? start.fontSize
          : clamp(start.fontSize * Math.max(scaleX, scaleY), 8, 1000)
        const nextWidth = isSideResize
          ? Math.max(getTextMinWidth(node, item.text, nextFontSize), node.width() || item.w || 8)
          : Math.max(getTextMinWidth(node, item.text, nextFontSize), start.width * scaleX)

        groupNode.scaleX(1)
        groupNode.scaleY(1)
        node.width(nextWidth)
        node.fontSize(nextFontSize)
        node.clearCache()
        if (typeof node._clearTextCache === 'function') node._clearTextCache()
        try { effectManager.applyAll(node, filterItemRef.current.effects) } catch {}

        const textRect = node.getClientRect({ skipTransform: true, skipShadow: true })
        const nextHeight = Math.max(8, Math.ceil(textRect.height || node.height() || nextFontSize))
        const nextPos = getClampedCanvasPosition(nextWidth, nextHeight, { x: groupNode.x(), y: groupNode.y() }, canvasBounds)

        groupNode.position(nextPos)
        onChange({
          x: nextPos.x,
          y: nextPos.y,
          w: nextWidth,
          h: nextHeight,
          fontSize: nextFontSize,
          rotation: node.rotation(),
        })
        transformStartRef.current = null
        transformAnchorRef.current = null
      }}
    >
      <Rect
        width={hasCurve ? curveW : item.w}
        height={hasCurve ? curveH : textBoxHeight}
        fill="rgba(0,0,0,0)"
        strokeWidth={0}
      />
      {hasCurve && curveCanvas ? (
        <Image
          ref={curveImageRef}
          image={curveCanvas}
          width={curveW}
          height={curveH}
          listening={false}
        />
      ) : (
        <>
          {hasStroke && (
            <Text
              {...textProps}
              {...strokeGradientProps}
              fillEnabled={false}
              strokeWidth={item.strokeWidth || 0}
              listening={false}
            />
          )}
          <Text
            ref={textNodeRef}
            {...textProps}
            {...gradientProps}
            {...(hasShadow ? shadowProps : {})}
            fillEnabled={hasTextFill}
            strokeEnabled={false}
            listening={false}
          />
        </>
      )}
    </Group>
  )
}
