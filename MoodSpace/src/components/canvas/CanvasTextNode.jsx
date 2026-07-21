/**
 * CanvasTextNode.jsx
 * Konva Text node for canvas text items.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Group, Image, Rect, Shape, Text } from 'react-konva'
import { preloadFont, getShadowProps, applyBevelEmbossToNode, applyInnerShadowToNode } from '../../utils/konvaUtils'
import { getClampedCanvasPosition } from '../../utils/canvasPositionUtils'
import { clamp } from '../../utils/mathUtils'
import { effectManager } from '../../utils/konva-effects-engine'
import { getRuns, runsToText, addListPrefix } from '../../utils/textRuns'

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

function isolateChannel(data, ch, nw, nh) {
  const buf = new Uint8ClampedArray(data.length)
  for (let i = 0; i < data.length; i += 4) {
    buf[i]   = ch === 0 ? data[i]   : 0
    buf[i+1] = ch === 1 ? data[i+1] : 0
    buf[i+2] = ch === 2 ? data[i+2] : 0
    buf[i+3] = data[i+3]
  }
  return new ImageData(buf, nw, nh)
}
function dataToCanvas(imgData) {
  const c = document.createElement('canvas')
  c.width = imgData.width; c.height = imgData.height
  c.getContext('2d').putImageData(imgData, 0, 0)
  return c
}
function processTextRgbSplit(cleanCanvas, item, textHeight, pad = { y: 0 }, align = 'center') {
  const displayW = item.w
  const displayH = pad.y ? (textHeight + pad.y) : textHeight
  const nw = cleanCanvas.width
  const nh = cleanCanvas.height
  const extractH = Math.min(pad.y ? nh : nh, displayH)
  const halfDiff = Math.max(0, Math.floor((nw - displayW) / 2))
  let srcX = 0
  if (align === 'center') srcX = halfDiff
  else if (align === 'right') srcX = Math.max(0, nw - displayW)
  const offsetParam = item.effects?.rgbSplit
  if (!offsetParam) return null
  const pixelOffset = (offsetParam.offset ?? 0.01) * Math.max(displayW, displayH)
  const angleRad = (offsetParam.angle ?? 0) * Math.PI / 180
  const dxDisp = Math.cos(angleRad) * pixelOffset
  const dyDisp = Math.sin(angleRad) * pixelOffset

  const tmpC = document.createElement('canvas')
  tmpC.width = displayW; tmpC.height = displayH
  const tmpCtx = tmpC.getContext('2d')
  tmpCtx.drawImage(cleanCanvas, srcX, 0, displayW, extractH, 0, 0, displayW, extractH)
  const d = tmpCtx.getImageData(0, 0, displayW, displayH).data
  const rC = dataToCanvas(isolateChannel(d, 0, displayW, displayH))
  const gC = dataToCanvas(isolateChannel(d, 1, displayW, displayH))
  const bC = dataToCanvas(isolateChannel(d, 2, displayW, displayH))

  const m = offsetParam.mode ?? 'g'
  let center, left, right
  if (m === 'g') { center = gC; left = bC; right = rC }
  else if (m === 'r') { center = rC; left = bC; right = gC }
  else                { center = bC; left = gC; right = rC }

  return { center, left, right, dxDisp, dyDisp, padY: pad.y || 0 }
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

  const rgbLayersRef = useRef(null)
  const textRgbChannelCacheRef = useRef(null)
  const [textRgbSplitVer, setTextRgbSplitVer] = useState(0)
  const textRgbCenterRef = useRef(null)
  const textContentKeyRef = useRef('')
  const capturePadRef = useRef({ y: 0 })

  const hasEffects = item.effects && Object.keys(item.effects).some(k => !['letterSpacing', 'curve'].includes(k))
  const hasRgbSplit = !!item.effects?.rgbSplit

  const runs = useMemo(() => getRuns(item), [item.runs, item.text, item.isBold, item.isItalic, item.isUnderline])
  const displayRuns = useMemo(() => {
    return addListPrefix(runs)
  }, [runs])
  const text = runsToText(displayRuns)
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
    hasAutoExpandedRef.current = false
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
    const fx = { ...item.effects }
    delete fx.rgbSplit
    try { effectManager.applyAll(node, fx) } catch {}
    applyBevelEmbossToNode(node, item)
    applyInnerShadowToNode(node, item)
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
    item.bevelEmbossEnabled, item.bevelEmbossStyle, item.bevelEmbossDepth, item.bevelEmbossAngle, item.bevelEmbossSoftness,
    item.bevelEmbossHighlightColor, item.bevelEmbossHighlightOpacity, item.bevelEmbossShadowColor, item.bevelEmbossShadowOpacity, item.bevelEmbossHighlightBlendMode, item.bevelEmbossShadowBlendMode,
    item.innerShadowEnabled, item.innerShadowColor, item.innerShadowOpacity, item.innerShadowBlur, item.innerShadowDistance, item.innerShadowAngle,
    fontLoaded, item.w, hasCurve, onChange,
  ])

  // Synchronous effect application for curved text (separate from the non-curve layout effect above)
  useLayoutEffect(() => {
    if (!hasCurve) return
    const node = curveImageRef.current
    if (!node) return
    const fx = { ...item.effects }
    delete fx.rgbSplit
    try { effectManager.applyAll(node, fx) } catch {}
    applyBevelEmbossToNode(node, item)
    applyInnerShadowToNode(node, item)
    node.getLayer()?.draw()
  }, [item.effects, hasCurve, text, item.fontFamily, item.fontSize, runs, item.fill,
      item.bevelEmbossEnabled, item.bevelEmbossStyle, item.bevelEmbossDepth, item.bevelEmbossAngle, item.bevelEmbossSoftness,
      item.bevelEmbossHighlightColor, item.bevelEmbossHighlightOpacity, item.bevelEmbossShadowColor, item.bevelEmbossShadowOpacity, item.bevelEmbossHighlightBlendMode, item.bevelEmbossShadowBlendMode,
      item.innerShadowEnabled, item.innerShadowColor, item.innerShadowOpacity, item.innerShadowBlur, item.innerShadowDistance, item.innerShadowAngle])

  // Apply effects to multi-run group
  useLayoutEffect(() => {
    const node = multiRunGroupRef.current
    if (!node || !isMultiRun || hasCurve) return
    node.clearCache()
    const fx = { ...item.effects }
    delete fx.rgbSplit
    try { effectManager.applyAll(node, fx) } catch {}
    applyBevelEmbossToNode(node, item)
    applyInnerShadowToNode(node, item)
    node.getLayer()?.draw()
  }, [item.effects, isMultiRun, hasCurve, runs, item.fontSize, item.fontFamily, item.fill, letterSpacing,
      item.bevelEmbossEnabled, item.bevelEmbossStyle, item.bevelEmbossDepth, item.bevelEmbossAngle, item.bevelEmbossSoftness,
      item.bevelEmbossHighlightColor, item.bevelEmbossHighlightOpacity, item.bevelEmbossShadowColor, item.bevelEmbossShadowOpacity, item.bevelEmbossHighlightBlendMode, item.bevelEmbossShadowBlendMode,
      item.innerShadowEnabled, item.innerShadowColor, item.innerShadowOpacity, item.innerShadowBlur, item.innerShadowDistance, item.innerShadowAngle])

  // rgbSplit capture: build R/G/B channel canvases from clean text
  useLayoutEffect(() => {
    const rgbSplit = item.effects?.rgbSplit
    if (!rgbSplit) {
      if (rgbLayersRef.current) {
        rgbLayersRef.current = null
        textRgbChannelCacheRef.current = null
        capturePadRef.current = { y: 0 }
        setTextRgbSplitVer(v => v + 1)
      }
      return
    }

    if (!fontLoaded) return

    let node
    if (isMultiRun) {
      node = multiRunGroupRef.current
    } else {
      node = textNodeRef.current
    }
    if (!node) return

    // Compute content key — only re-capture when text content actually changes
    const contentKey = `${text}|${item.w}|${item.h}|${item.fontSize}|${isMultiRun}|${displayWidth}|${item.fontFamily}|${item.fill}|${item.align}|${letterSpacing}|${hasEffects}|${rgbSplit.offset}|${rgbSplit.angle}|${rgbSplit.mode}|${fontLoaded}|${item.stroke}|${item.strokeWidth}|${item.gradientType}|${item.gradientStops}|${item.strokeGradientType}|${item.strokeGradientStops}|${item.shadowEnabled}|${item.shadow}|${item.shadowColor}|${item.shadowOpacity}|${item.shadowOffsetX}|${item.shadowOffsetY}|${JSON.stringify(runs)}`

    // Check cache
    const cached = textRgbChannelCacheRef.current
    if (cached && cached.key === contentKey) {
      rgbLayersRef.current = cached.channels
      return
    }

    // Use clone to capture — avoids visible=false issues and doesn't modify the real node
    const clone = node.clone({ visible: true, opacity: 1 })

    let cleanCanvas
    if (isMultiRun) {
      const clipOff = Math.ceil((item.fontSize || 48) * 0.35)
      const children = clone.getChildren()
      const origXs = children.map(c => c.x())
      const origYs = children.map(c => c.y())
      const align = item.align || 'center'
      let xShift = 0
      if (align === 'center') xShift = Math.floor((displayWidth - item.w) / 2)
      else if (align === 'right') xShift = displayWidth - item.w
      children.forEach(c => { c.x(c.x() - xShift); c.y(c.y() + clipOff) })
      const origH = clone.height()
      const captureH = origH + clipOff
      clone.width(item.w)
      clone.height(captureH)
      clone.clipY(0)
      clone.clipHeight(captureH)
      clone.clipWidth(item.w)
      const tempCanvas = clone.toCanvas({ x: 0, y: 0, width: item.w, height: captureH, pixelRatio: 1 })
      children.forEach((c, i) => { c.x(origXs[i]); c.y(origYs[i]) })

      // Crop out topPad empty space
      const sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = item.w
      sourceCanvas.height = origH
      const sCtx = sourceCanvas.getContext('2d')
      sCtx.drawImage(tempCanvas, 0, clipOff, item.w, origH, 0, 0, item.w, origH)
      cleanCanvas = sourceCanvas
      capturePadRef.current = { y: 0 }
    } else {
      cleanCanvas = clone.toCanvas({ x: 0, y: 0, width: item.w, height: textHeight, pixelRatio: 1 })
      capturePadRef.current = { y: 0 }
    }
    clone.destroy()

    if (!cleanCanvas || cleanCanvas.width === 0 || cleanCanvas.height === 0) return

    const channels = processTextRgbSplit(cleanCanvas, item, textHeight, capturePadRef.current, item.align || 'center')
    if (channels) {
      textRgbChannelCacheRef.current = { key: contentKey, channels }
      rgbLayersRef.current = channels
      setTextRgbSplitVer(v => v + 1)
    }
  }, [
    item.effects?.rgbSplit, item.effects?.rgbSplit?.offset,
    item.effects?.rgbSplit?.angle, item.effects?.rgbSplit?.mode,
    isMultiRun, item.w, item.h, item.fontSize, text, item.fontFamily,
    item.fill, item.align, displayWidth, letterSpacing, hasEffects, fontLoaded,
    item.stroke, item.strokeWidth,
    item.gradientType, item.gradientStops,
    item.strokeGradientType, item.strokeGradientStops,
    item.shadowEnabled, item.shadow, item.shadowColor, item.shadowOpacity,
    item.shadowOffsetX, item.shadowOffsetY,
    runs,
  ])

  // Apply non-rgbSplit effects to center channel Image
  useLayoutEffect(() => {
    const img = textRgbCenterRef.current
    if (!img || !rgbLayersRef.current) return
    img.clearCache()
    const fx = { ...item.effects }
    delete fx.rgbSplit
    try { effectManager.applyAll(img, fx) } catch {}
    img.getLayer()?.batchDraw()
  }, [item.effects, textRgbSplitVer])

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
      const rafFx = { ...filterItemRef.current.effects }
      delete rafFx.rgbSplit
      try { effectManager.applyAll(node, rafFx) } catch {}
    })
    return () => {
      if (rAFRef.current) { cancelAnimationFrame(rAFRef.current); rAFRef.current = null }
    }
  }, [item, fontLoaded, hasCurve, isMultiRun])

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
  const shadowProps = getShadowProps(item)
  const hasShadow = Object.keys(shadowProps).length > 0

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

  if (!isMultiRun) {
    const ctx3 = document.createElement('canvas').getContext('2d')
    ctx3.font = `normal ${item.fontSize || 48}px ${item.fontFamily || 'Inter, Arial'}`
    const m3 = ctx3.measureText('M')
    const lineH = hasEffects ? 1.25 : 0.9
    const tY = ((m3.fontBoundingBoxAscent ?? m3.actualBoundingBoxAscent ?? (item.fontSize||48)*0.7) - (m3.fontBoundingBoxDescent ?? m3.actualBoundingBoxDescent ?? (item.fontSize||48)*0.2)) / 2 + (lineH * (item.fontSize||48)) / 2

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
    const translateYCache = {}
    const getTranslateY = (fontFamily, fontStyle) => {
      const key = `${fontStyle}|${fontFamily}`
      if (translateYCache[key] !== undefined) return translateYCache[key]
      ctx.font = `${fontStyle} ${fs}px ${fontFamily}`
      const m = ctx.measureText('M')
      const mAcc = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent ?? fs * 0.7
      const mDesc = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent ?? fs * 0.2
      const val = (mAcc - mDesc) / 2 + fs / 2
      translateYCache[key] = val
      return val
    }

    // Expand runs into single-character segments
    const expanded = []
    displayRuns.forEach((run, runIdx) => {
      for (let i = 0; i < run.text.length; i++) {
        const runFontStyle = [run.bold && 'bold', run.italic && 'italic'].filter(Boolean).join(' ') || 'normal'
        const charFontFamily = run.fontFamily || item.fontFamily || 'Inter, Arial'
        expanded.push({
          text: run.text[i],
          fontFamily: charFontFamily,
          fontStyle: runFontStyle,
          decoration: run.underline ? 'underline' : 'none',
          fill: run.fill || gradientProps.fill || item.fill || '#2b2830',
          key: `${runIdx}_${i}`,
          isPrefix: !!run.isPrefix,
          align: run.align || null,
          translateY: getTranslateY(charFontFamily, runFontStyle),
        })
      }
    })

    const baseFontFamily = item.fontFamily || 'Inter, Arial'
    const baseTranslateY = getTranslateY(baseFontFamily, 'normal')
    const ctx2 = document.createElement('canvas').getContext('2d')
    ctx2.font = `normal ${fs}px ${baseFontFamily}`
    const m2 = ctx2.measureText('M')
    const compareEmAsc = m2.emHeightAscent ?? baseTranslateY

    const isLeftAlign = (item.align || 'center') === 'left'
    const prefixWidth = (() => {
      if (!isLeftAlign) return 0
      const prefixRun = displayRuns.find(r => r.isPrefix)
      if (!prefixRun) return 0
      ctx.font = `normal ${fs}px ${item.fontFamily || 'Inter, Arial'}`
      return measureRun(prefixRun.text)
    })()

    const segments = []
    let x = 0
    let y = 0
    expanded.forEach((run) => {
      if (run.text === '\n') {
        y += lineHeight
        x = 0
        return
      }
      ctx.font = `${run.fontStyle} ${fs}px ${run.fontFamily}`
      const charW = measureRun(run.text)
      if (x + charW > maxW && x > 0) {
        y += lineHeight
        x = isLeftAlign ? prefixWidth : 0
      }
      segments.push({ x, y, text: run.text, w: charW, ...run, line: y })
      x += charW + lsp
    })
    const totalH = y + lineHeight
    const yOffsets = expanded.filter(e => e.text !== '\n').map(e => e.translateY != null ? Math.round(baseTranslateY - e.translateY) : 0)
    const minYOff = yOffsets.length ? Math.min(...yOffsets) : 0
    const maxYOff = yOffsets.length ? Math.max(...yOffsets) : 0
    runsLayoutRef.current = { height: totalH, minYOff, maxYOff }

    // Second pass: align each line — prefix anchors at 0, content moves within remaining space
    const lineMap = new Map()
    segments.forEach(s => {
      if (!lineMap.has(s.line)) lineMap.set(s.line, { items: [] })
      lineMap.get(s.line).items.push(s)
    })
    const nodes = []
    lineMap.forEach(line => {
      const prefixSegments = line.items.filter(s => s.isPrefix)
      const contentSegments = line.items.filter(s => !s.isPrefix)
      // Per-line alignment: from first content segment's align, else fall back to item.align
      const lineAlign = contentSegments.length > 0 && contentSegments[0].align
        ? contentSegments[0].align
        : (item.align || 'center')

      if (prefixSegments.length === 0 || contentSegments.length === 0) {
        // No list line — use full-line alignment
        const totalW = line.items.reduce((sum, s, i) => sum + s.w + (i < line.items.length - 1 ? lsp : 0), 0)
        let offset
        if (lineAlign === 'left') offset = 0
        else if (lineAlign === 'right') offset = Math.max(0, maxW - totalW)
        else offset = Math.max(0, (maxW - totalW) / 2)
        line.items.forEach(s => {
          nodes.push(renderText(s, s.x + offset, s.y))
        })
        return
      }

      // Compute content start position within remaining space after prefix
      const prefixTotalW = prefixSegments.reduce((sum, s, i) => sum + s.w + (i < prefixSegments.length - 1 ? lsp : 0), 0)
      const contentTotalW = contentSegments.reduce((sum, s, i) => sum + s.w + (i < contentSegments.length - 1 ? lsp : 0), 0)
      const availableW = maxW - prefixTotalW
      let contentStartX
      if (lineAlign === 'left') {
        contentStartX = prefixTotalW
      } else if (lineAlign === 'right') {
        contentStartX = Math.max(prefixTotalW, maxW - contentTotalW)
      } else {
        contentStartX = prefixTotalW + Math.max(0, (availableW - contentTotalW) / 2)
      }

      // Render prefix at original x (anchored left)
      prefixSegments.forEach(s => nodes.push(renderText(s, s.x, s.y)))
      // Render content offset within the remaining space
      const firstX = contentSegments[0].x
      contentSegments.forEach(s => nodes.push(renderText(s, contentStartX + (s.x - firstX), s.y)))
    })

    function renderText(s, x, y) {
      const yOff = s.translateY != null ? Math.round(baseTranslateY - s.translateY) : 0
      return (
        <Text key={s.key} x={x} y={y + yOff} text={s.text} width={s.w + 2}
          fontSize={fs} fontFamily={s.fontFamily} fontStyle={s.fontStyle}
          textDecoration={s.decoration} fill={s.fill}
          stroke={strokeGradientProps.stroke || item.stroke || null} strokeWidth={hasStroke ? (item.strokeWidth || 0) : 0}
          {...(hasShadow ? shadowProps : {})}
          wrap="none"
          lineJoin={hasStroke ? 'round' : 'miter'} miterLimit={hasStroke ? 2 : 10} perfectDrawEnabled={false} listening={false} />
      )
    }
    return nodes
  }, [displayRuns, isMultiRun, hasCurve, item.fontSize, item.fontFamily, item.fill, displayWidth, letterSpacing, hasEffects, gradientProps.fill, fontLoaded, item.align, hasStroke, item.stroke, item.strokeWidth, item.shadow, item.shadowColor, item.shadowOpacity, item.shadowOffsetX, item.shadowOffsetY, item.shadowEnabled])

  const textHeight = isMultiRun
    ? (runsLayoutRef.current.height || Math.max(item.h || 1, item.fontSize || 1))
    : Math.max(item.h || 1, item.fontSize || 1)

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
          const transformFx = { ...filterItemRef.current.effects }
          delete transformFx.rgbSplit
          try { effectManager.applyAll(node, transformFx) } catch {}
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
            rotation: groupNode.rotation(),
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
        const endFx = { ...filterItemRef.current.effects }
        delete endFx.rgbSplit
        try { effectManager.applyAll(node, endFx) } catch {}

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
          rotation: groupNode.rotation(),
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
      {hasRgbSplit ? (
        <>
          {/* Hidden source for capture */}
          {isMultiRun ? (
            <Group ref={multiRunGroupRef} listening={false} visible={false} clipX={0} clipY={-Math.ceil((item.fontSize || 48) * 0.35)} clipWidth={displayWidth} clipHeight={textHeight + Math.ceil((item.fontSize || 48) * 0.35)} width={displayWidth} height={textHeight}>
              {multiRunTexts}
            </Group>
          ) : (
            <>
              {hasStroke && (
                <Text {...textProps} {...strokeGradientProps} fillEnabled={false} strokeWidth={item.strokeWidth || 0} listening={false} visible={false} />
              )}
              <Text ref={textNodeRef} {...textProps} {...gradientProps} {...(hasShadow ? shadowProps : {})} fillEnabled={hasTextFill} strokeEnabled={false} listening={false} visible={false} />
            </>
          )}
          {/* Channel rendering */}
          {rgbLayersRef.current && (
            <>
              <Image ref={textRgbCenterRef} image={rgbLayersRef.current.center} x={0} y={-(rgbLayersRef.current.padY || 0)} width={item.w} height={textHeight + (rgbLayersRef.current.padY || 0)} listening={false} />
              <Shape
                sceneFunc={(ctx) => {
                  ctx.save()
                  ctx.globalCompositeOperation = 'screen'
                  const ref = rgbLayersRef.current
                  const h = textHeight + (ref.padY || 0)
                  ctx.drawImage(ref.left, -ref.dxDisp, -(ref.padY || 0), item.w, h)
                  ctx.drawImage(ref.right, ref.dxDisp, -(ref.padY || 0), item.w, h)
                  ctx.restore()
                }}
                listening={false}
                perfectDrawEnabled={false}
              />
            </>
          )}
        </>
      ) : hasCurve && curveCanvas ? (
        <Image
          ref={curveImageRef}
          image={curveCanvas}
          width={curveW}
          height={curveH}
          listening={false}
        />
      ) : isMultiRun ? (
        <Group ref={multiRunGroupRef} listening={false} clipX={0} clipY={Math.min(-Math.ceil((item.fontSize || 48) * 0.35), (runsLayoutRef.current.minYOff ?? 0) - 5)} clipWidth={displayWidth} clipHeight={textHeight + Math.max(Math.ceil((item.fontSize || 48) * 0.35), (runsLayoutRef.current.maxYOff ?? 0) + 5)} width={displayWidth} height={textHeight}>
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
