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
import { getRuns, runsToText } from '../../utils/textRuns'

function renderCurvedText(text, fontFamily, fontSize, fontStyle, curveAmount, letterSpacing, fillColor, runs) {
  const chars = Array.from(text || ' ')
  if (chars.length === 0 || Math.abs(curveAmount) < 0.001) return null
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const charRuns = []
  if (runs) {
    runs.forEach(r => { for (let i = 0; i < r.text.length; i++) charRuns.push(r) })
  }

  const charWidths = chars.map((c, i) => {
    const r = charRuns[i]
    if (r) {
      const rf = [r.bold && 'bold', r.italic && 'italic'].filter(Boolean).join(' ') || 'normal'
      ctx.font = `${rf} ${fontSize}px ${r.fontFamily || fontFamily}`
    } else {
      ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`
    }
    return ctx.measureText(c).width
  })
  const totalWidth = charWidths.reduce((s, w, i) => s + w + (i < chars.length - 1 ? (letterSpacing || 0) : 0), 0)
  if (totalWidth <= 0) return null
  const maxHeight = Math.min(totalWidth * 0.3, fontSize * 3)
  const curveHeight = Math.abs(curveAmount) * maxHeight
  const pad = fontSize * 1.5
  canvas.width = Math.ceil(totalWidth + pad * 2)
  canvas.height = Math.ceil(curveHeight + fontSize * 2 + pad * 2)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const isUp = curveAmount >= 0
  const W = totalWidth
  const baseY = isUp ? canvas.height - pad - fontSize / 2 : pad + fontSize / 2
  let cx = pad
  for (let i = 0; i < chars.length; i++) {
    const cw = charWidths[i]
    const r = charRuns[i]
    const rFamily = r?.fontFamily || fontFamily
    const rStyle = [r?.bold && 'bold', r?.italic && 'italic'].filter(Boolean).join(' ') || 'normal'
    ctx.font = `${rStyle} ${fontSize}px ${rFamily}`
    ctx.fillStyle = (typeof r?.fill === 'string' && r.fill.startsWith('#')) ? r.fill : (typeof fillColor === 'string' && fillColor.startsWith('#')) ? fillColor : '#000'
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

export default function CanvasTextNode({ item, commonProps, isTextEditing, onTextEdit, onChange, canvasBounds, getActiveTransformAnchor, fontInjectVersion }) {
  const textNodeRef = useRef(null)
  const curveImageRef = useRef(null)
  const multiRunGroupRef = useRef(null)
  const runsLayoutRef = useRef({ height: 0 })
  const [fontLoaded, setFontLoaded] = useState(false)
  const hasAutoExpandedRef = useRef(false)
  const transformStartRef = useRef(null)
  const transformAnchorRef = useRef(null)
  const multiRunLastWidthRef = useRef(null)
  const [dragWidth, setDragWidth] = useState(null)
  const displayWidth = dragWidth !== null ? dragWidth : item.w

  const runs = useMemo(() => getRuns(item), [item.runs, item.text, item.isBold, item.isItalic, item.isUnderline])
  const text = runsToText(runs)
  const isMultiRun = runs.length > 1

  const letterSpacing = item.effects?.letterSpacing?.value ?? 0
  const curveAmount = item.effects?.curve?.amount ?? 0
  const hasCurve = Math.abs(curveAmount) > 0.001 && !text.includes('\n')

  const fontStyle = isMultiRun ? 'normal' : ([runs[0]?.bold && 'bold', runs[0]?.italic && 'italic'].filter(Boolean).join(' ') || 'normal')
  const textDecoration = isMultiRun ? 'none' : (runs[0]?.underline ? 'underline' : 'none')

  const curveCanvas = useMemo(() => {
    if (!hasCurve) return null
    return renderCurvedText(
      text, item.fontFamily, item.fontSize, fontStyle,
      curveAmount, letterSpacing,
      (typeof item.fill === 'string' && item.fill.startsWith('#')) ? item.fill : '#000',
      isMultiRun ? runs : undefined
    )
  }, [hasCurve, text, item.fontFamily, item.fontSize, runs, curveAmount, letterSpacing, item.fill])

  useEffect(() => {
    setFontLoaded(false)
    const families = new Set([item.fontFamily || 'Inter, Arial'])
    runs.forEach(r => { if (r.fontFamily) families.add(r.fontFamily) })
    let cancelled = false
    Promise.all([...families].map(f => preloadFont(f))).then(() => {
      if (!cancelled) setFontLoaded(true)
    })
    return () => { cancelled = true }
  }, [item.fontFamily, runs, fontInjectVersion])

  useLayoutEffect(() => {
    const node = textNodeRef.current
    if (!node || hasCurve) return

    if (fontLoaded && !hasAutoExpandedRef.current && text && !text.includes('\n') && node.textWidth > 0) {
      const neededWidth = Math.ceil(node.textWidth) + 30
      if (neededWidth > (item.w || 0)) {
        hasAutoExpandedRef.current = true
        node.width(neededWidth)
        onChange({ w: neededWidth })
      } else {
        hasAutoExpandedRef.current = true
      }
    }

    // Auto-expand height for multi-line single-run text
    if (!isMultiRun && fontLoaded && text && text.includes('\n')) {
      const h = Math.ceil(node.height() || (item.fontSize || 48))
      if (h > (item.h || 0)) {
        onChange({ h })
      }
    }

    // Sync height for multi-run text when runs change
    if (isMultiRun && fontLoaded) {
      const rh = runsLayoutRef.current.height
      if (rh && Math.abs(rh - (item.h || 0)) > 2) {
        onChange({ h: rh })
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
    runs,
    item.align, text, item.opacity,
    item.effects,
    item.shadowEnabled, item.shadow, item.shadowColor, item.shadowOpacity, item.shadowOffsetX, item.shadowOffsetY,
    fontLoaded, item.w, hasCurve, onChange,
  ])

  // Synchronous effect application for curved text (separate from the non-curve layout effect above)
  useLayoutEffect(() => {
    if (!hasCurve) return
    const node = curveImageRef.current
    if (!node) return
    try { effectManager.applyAll(node, item.effects) } catch {}
    node.getLayer()?.draw()
  }, [item.effects, hasCurve, text, item.fontFamily, item.fontSize, runs, item.fill])

  // Apply effects to multi-run group
  useLayoutEffect(() => {
    const node = multiRunGroupRef.current
    if (!node || !isMultiRun || hasCurve) return
    node.clearCache()
    try { effectManager.applyAll(node, item.effects) } catch {}
    node.getLayer()?.draw()
  }, [item.effects, isMultiRun, hasCurve, runs, item.fontSize, item.fontFamily, item.fill, letterSpacing])

  const filterItemRef = useRef(item)
  const rAFRef = useRef(null)

  useEffect(() => {
    filterItemRef.current = item
    if (rAFRef.current) return
    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null
      let node
      if (hasCurve) {
        node = curveImageRef.current
      } else if (isMultiRun) {
        node = multiRunGroupRef.current
      } else {
        node = textNodeRef.current
      }
      if (!node) return
      try { effectManager.applyAll(node, filterItemRef.current.effects) } catch {}
    })
    return () => {
      if (rAFRef.current) { cancelAnimationFrame(rAFRef.current); rAFRef.current = null }
    }
  }, [item, fontLoaded, hasCurve, isMultiRun])

  const hasEffects = item.effects && Object.keys(item.effects).some(k => !['letterSpacing', 'curve'].includes(k))

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

  const hasStroke = (item.strokeWidth || 0) > 0 && (item.stroke || item.strokeGradientType)

  const textProps = {
    text,
    width: item.w,
    fontSize: item.fontSize,
    fontFamily: item.fontFamily || 'Inter, Arial',
    fontStyle,
    textDecoration,
    letterSpacing,
    lineJoin: hasStroke ? 'round' : 'miter',
    miterLimit: hasStroke ? 2 : 10,
    lineHeight: hasEffects ? 1.25 : 0.9,
    wrap: 'word',
    align: item.align || 'center',
    perfectDrawEnabled: true,
  }

  // Multi-run text rendering
  const multiRunTexts = useMemo(() => {
    if (!isMultiRun || hasCurve || !fontLoaded) {
      runsLayoutRef.current = { height: 0 }
      return null
    }
    const ctx = document.createElement('canvas').getContext('2d')
    const fs = item.fontSize || 48
    const lineHeight = fs * (hasEffects ? 1.25 : 1.2)
    const maxW = Math.max(1, displayWidth || 300)
    const lsp = letterSpacing || 0
    const measureRun = (t) => Math.max(1, ctx.measureText(t).width)

    // Expand runs into single-character segments
    const expanded = []
    runs.forEach((run, runIdx) => {
      for (let i = 0; i < run.text.length; i++) {
        const runFontStyle = [run.bold && 'bold', run.italic && 'italic'].filter(Boolean).join(' ') || 'normal'
        expanded.push({
          text: run.text[i],
          fontFamily: run.fontFamily || item.fontFamily || 'Inter, Arial',
          fontStyle: runFontStyle,
          decoration: run.underline ? 'underline' : 'none',
          fill: run.fill || gradientProps.fill || item.fill || '#2b2830',
          key: `${runIdx}_${i}`,
        })
      }
    })

    const segments = []
    let x = 0
    let y = 0
    expanded.forEach((run) => {
      ctx.font = `${run.fontStyle} ${fs}px ${run.fontFamily}`
      const charW = measureRun(run.text)
      if (x + charW > maxW && x > 0) {
        y += lineHeight
        x = 0
      }
      segments.push({ x, y, text: run.text, w: charW, ...run, line: y })
      x += charW + lsp
    })
    const totalH = y + lineHeight
    runsLayoutRef.current = { height: totalH }

    // Second pass: align each line
    const align = item.align || 'center'
    const lineMap = new Map()
    segments.forEach(s => {
      if (!lineMap.has(s.line)) lineMap.set(s.line, { items: [], totalW: 0 })
      const entry = lineMap.get(s.line)
      entry.items.push(s)
      entry.totalW += s.w
    })
    const nodes = []
    lineMap.forEach(line => {
      const totalW = line.items.reduce((sum, s, i) => sum + s.w + (i < line.items.length - 1 ? lsp : 0), 0)
      let offset
      if (align === 'left') {
        offset = 0
      } else if (align === 'right') {
        offset = Math.max(0, maxW - totalW)
      } else {
        offset = Math.max(0, (maxW - totalW) / 2)
      }
      line.items.forEach(s => {
        nodes.push(
          <Text key={s.key} x={s.x + offset} y={s.y} text={s.text} width={s.w + 2}
            fontSize={fs} fontFamily={s.fontFamily} fontStyle={s.fontStyle}
            textDecoration={s.decoration} fill={s.fill}
            wrap="none"
            lineJoin={hasStroke ? 'round' : 'miter'} miterLimit={hasStroke ? 2 : 10} perfectDrawEnabled={false} listening={false} />
        )
      })
    })
    return nodes
  }, [runs, isMultiRun, hasCurve, item.fontSize, item.fontFamily, item.fill, displayWidth, letterSpacing, hasEffects, gradientProps.fill, fontLoaded, item.align])

  const textHeight = isMultiRun
    ? (runsLayoutRef.current.height || Math.max(item.h || 1, item.fontSize || 1))
    : Math.max(item.h || 1, item.fontSize || 1)
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
      height={textHeight}
      opacity={isTextEditing ? 0 : (item.opacity ?? 1)}
      onDblClick={(e) => { e.cancelBubble = true; onTextEdit(item.id) }}
      onDblTap={(e) => { e.cancelBubble = true; onTextEdit(item.id) }}
      onTransformStart={(event) => {
        const node = textNodeRef.current
        transformAnchorRef.current = getActiveTransformAnchor?.()
        if (isMultiRun) {
          transformStartRef.current = {
            width: item.w || 8,
            fontSize: clamp(item.fontSize || 48, 8, 1000),
          }
          return
        }
        if (!node || hasCurve) return
        transformStartRef.current = {
          width: Math.max(getTextMinWidth(node, text, node.fontSize() || item.fontSize || 48), node.width() || item.w || 8),
          fontSize: clamp(node.fontSize() || item.fontSize || 48, 8, 1000),
        }
      }}
      onTransform={(event) => {
        const groupNode = event.target
        const activeAnchor = transformAnchorRef.current || getActiveTransformAnchor?.()
        const isSideResize = activeAnchor === 'middle-left' || activeAnchor === 'middle-right'

        if (isMultiRun) {
          if (isSideResize) {
            const start = transformStartRef.current
            const curWidth = displayWidth || item.w
            const nextWidth = Math.max(24, (start?.width || item.w) * Math.abs(groupNode.scaleX() || 1))
            multiRunLastWidthRef.current = nextWidth
            if (nextWidth < curWidth) {
              setDragWidth(nextWidth)
            } else {
              const g = multiRunGroupRef.current
              if (g) {
                g.clipWidth(nextWidth)
                g.getLayer()?.batchDraw()
              }
            }
            groupNode.scaleX(1)
            groupNode.scaleY(1)
          } else {
            const start = transformStartRef.current
            const nextWidth = Math.max(24, (start?.width || item.w) * Math.max(Math.abs(groupNode.scaleX() || 1), Math.abs(groupNode.scaleY() || 1)))
            multiRunLastWidthRef.current = nextWidth
            setDragWidth(nextWidth)
          }
          return
        }

        const node = textNodeRef.current
        if (!node || hasCurve) return
        if (isSideResize) {
          const nextWidth = Math.max(
            getTextMinWidth(node, text, node.fontSize() || item.fontSize || 48),
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
        const activeAnchor = transformAnchorRef.current
        const isSideResize = activeAnchor === 'middle-left' || activeAnchor === 'middle-right'
        const scaleX = Math.abs(groupNode.scaleX() || 1)
        const scaleY = Math.abs(groupNode.scaleY() || 1)

        if (isMultiRun) {
          const start = transformStartRef.current || { width: item.w || 8, fontSize: item.fontSize || 48 }
          const nextFontSize = isSideResize ? start.fontSize : clamp(start.fontSize * Math.max(scaleX, scaleY), 8, 1000)
          const nextWidth = isSideResize && multiRunLastWidthRef.current
            ? multiRunLastWidthRef.current
            : Math.max(24, start.width * Math.max(scaleX, scaleY))
          multiRunLastWidthRef.current = null
          groupNode.scaleX(1)
          groupNode.scaleY(1)
          onChange({
            w: nextWidth,
            h: runsLayoutRef.current.height || item.h || Math.max(32, nextFontSize * 1.5),
            fontSize: nextFontSize,
          })
          setDragWidth(null)
          transformStartRef.current = null
          transformAnchorRef.current = null
          requestAnimationFrame(() => {
            const newH = runsLayoutRef.current.height
            if (newH && Math.abs(newH - (item.h || 0)) > 4) {
              onChange({ h: newH })
            }
          })
          return
        }

        const node = textNodeRef.current
        if (!node || hasCurve) return
        const start = transformStartRef.current || {
          width: Math.max(getTextMinWidth(node, text, item.fontSize || node.fontSize() || 48), item.w || node.width() || 8),
          fontSize: clamp(item.fontSize || node.fontSize() || 48, 8, 1000),
        }
        const nextFontSize = isSideResize
          ? start.fontSize
          : clamp(start.fontSize * Math.max(scaleX, scaleY), 8, 1000)
        const nextWidth = isSideResize
          ? Math.max(getTextMinWidth(node, text, nextFontSize), node.width() || item.w || 8)
          : Math.max(getTextMinWidth(node, text, nextFontSize), start.width * scaleX)

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
        height={hasCurve ? curveH : textHeight}
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
      ) : isMultiRun ? (
        <Group ref={multiRunGroupRef} listening={false} clipX={0} clipY={-Math.ceil((item.fontSize || 48) * 0.35)} clipWidth={displayWidth} clipHeight={textHeight + Math.ceil((item.fontSize || 48) * 0.35)} width={displayWidth} height={textHeight}>
          {multiRunTexts}
        </Group>
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
