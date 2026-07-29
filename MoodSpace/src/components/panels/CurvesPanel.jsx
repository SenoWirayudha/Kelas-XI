import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { sampleCurveForDisplay } from '../../utils/curveUtils'

const CURVE_CHANNELS = [
  { key: 'rgb', label: 'RGB', color: '#ffffff' },
  { key: 'red', label: 'Red', color: '#ff4444' },
  { key: 'green', label: 'Green', color: '#44ff44' },
  { key: 'blue', label: 'Blue', color: '#4488ff' },
]

const GRID_W = 200
const GRID_H = 200
const GRID_PAD = 20
const HIT_RADIUS = 22

function drawCurveCanvas(canvas, activePts, curveChannel, referenceCurves, toCanvas) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = '#2b2830'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const x = GRID_PAD + (i / 4) * GRID_W
    const y = GRID_PAD + (i / 4) * GRID_H
    ctx.beginPath(); ctx.moveTo(x, GRID_PAD); ctx.lineTo(x, GRID_PAD + GRID_H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(GRID_PAD, y); ctx.lineTo(GRID_PAD + GRID_W, y); ctx.stroke()
  }

  ctx.strokeStyle = '#3b3843'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(GRID_PAD, GRID_PAD + GRID_H); ctx.lineTo(GRID_PAD + GRID_W, GRID_PAD); ctx.stroke()

  if (referenceCurves && referenceCurves.length > 0) {
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1.5
    for (const ref of referenceCurves) {
      const samples = sampleCurveForDisplay(ref.points, 256)
      ctx.strokeStyle = ref.color
      ctx.beginPath()
      for (let j = 0; j < samples.length; j++) {
        const [cx, cy] = toCanvas(samples[j].x, samples[j].y)
        if (j === 0) ctx.moveTo(cx, cy)
        else ctx.lineTo(cx, cy)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  const samples = sampleCurveForDisplay(activePts, 256)
  const curveColor = CURVE_CHANNELS.find(c => c.key === curveChannel)?.color || '#7c6df2'
  ctx.strokeStyle = curveColor
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let j = 0; j < samples.length; j++) {
    const [cx, cy] = toCanvas(samples[j].x, samples[j].y)
    if (j === 0) ctx.moveTo(cx, cy)
    else ctx.lineTo(cx, cy)
  }
  ctx.stroke()

  for (const p of activePts) {
    const [cx, cy] = toCanvas(p.x, p.y)
    ctx.fillStyle = '#7c6df2'
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#e6e1ed'
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill()
  }
}

function CurveEditor({ curves, curveChannel, referenceCurves, onChange, onCommit, itemId }) {
  const canvasRef = useRef(null)
  const dragIdxRef = useRef(null)
  const dragDataRef = useRef(null)
  const nextIdRef = useRef(100)
  const rafRef = useRef(null)
  const pendingTapRef = useRef(null)

  const pts = useMemo(() => {
    const raw = curves?.[curveChannel]
    if (!raw || raw.length === 0) {
      return [
        { id: 'start', x: 0, y: 0 },
        { id: 'end', x: 255, y: 255 },
      ]
    }
    return raw
  }, [curves, curveChannel])

  const toCanvas = useCallback((x, y) => [
    GRID_PAD + (x / 255) * GRID_W,
    GRID_PAD + (1 - y / 255) * GRID_H,
  ], [])

  const toValue = useCallback((cx, cy) => [
    Math.round(((cx - GRID_PAD) / GRID_W) * 255),
    Math.round(255 - ((cy - GRID_PAD) / GRID_H) * 255),
  ], [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCurveCanvas(canvas, dragDataRef.current || pts, curveChannel, referenceCurves, toCanvas)
  }, [curves, curveChannel, referenceCurves, pts, toCanvas])

  const scheduleDraw = useCallback((nextPts) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const canvas = canvasRef.current
      if (!canvas) return
      drawCurveCanvas(canvas, nextPts, curveChannel, referenceCurves, toCanvas)
    })
  }, [curveChannel, referenceCurves, toCanvas])

  const clamp = useCallback((v) => Math.max(GRID_PAD, Math.min(GRID_PAD + GRID_W, v)), [])

  const hitTest = useCallback((mx, my, activePts) => {
    for (let i = 0; i < activePts.length; i++) {
      const [cx, cy] = toCanvas(activePts[i].x, activePts[i].y)
      if (Math.abs(mx - cx) < HIT_RADIUS && Math.abs(my - cy) < HIT_RADIUS) return i
    }
    return -1
  }, [toCanvas])

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const rawMx = e.clientX - rect.left
    const rawMy = e.clientY - rect.top
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const mx = rawMx * scaleX
    const my = rawMy * scaleY

    const activePts = dragDataRef.current || pts
    const hit = hitTest(mx, my, activePts)
    if (hit >= 0) {
      canvas.style.touchAction = 'none'
      e.preventDefault()
      try { canvas.setPointerCapture(e.pointerId) } catch (_) {}
      dragIdxRef.current = hit
      return
    }

    if (mx >= GRID_PAD && mx <= GRID_PAD + GRID_W && my >= GRID_PAD && my <= GRID_PAD + GRID_H) {
      pendingTapRef.current = { startX: e.clientX, startY: e.clientY, canvasX: mx, canvasY: my, startTime: Date.now() }
    }
  }

  const handlePointerMove = (e) => {
    if (pendingTapRef.current && dragIdxRef.current == null) {
      const dx = Math.abs(e.clientX - pendingTapRef.current.startX)
      const dy = Math.abs(e.clientY - pendingTapRef.current.startY)
      if (dx > 10 || dy > 10) {
        pendingTapRef.current = null
      }
    }
    if (dragIdxRef.current == null) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const [vx, vy] = toValue(clamp(mx), clamp(my))

    const activePts = dragDataRef.current || pts
    const next = activePts.map((p, i) =>
      i === dragIdxRef.current ? { ...p, x: vx, y: vy } : p
    )
    dragDataRef.current = next
    scheduleDraw(next)
  }

  const handlePointerUp = (e) => {
    const canvas = canvasRef.current
    if (canvas) canvas.style.touchAction = 'auto'

    if (pendingTapRef.current) {
      const { startX, startY, canvasX, canvasY, startTime } = pendingTapRef.current
      pendingTapRef.current = null
      const dx = Math.abs(e.clientX - startX)
      const dy = Math.abs(e.clientY - startY)
      const duration = Date.now() - startTime
      const isTap = dx < 10 && dy < 10 && duration < 300
      if (isTap) {
        const vx = Math.round(((canvasX - GRID_PAD) / GRID_W) * 255)
        const vy = Math.round(255 - ((canvasY - GRID_PAD) / GRID_H) * 255)
        const activePts = dragDataRef.current || pts
        let insertAt = activePts.length
        for (let i = 0; i < activePts.length; i++) {
          if (activePts[i].x > vx) { insertAt = i; break }
        }
        const newId = 'pt_' + (nextIdRef.current++)
        const next = [...activePts]
        next.splice(insertAt, 0, { id: newId, x: vx, y: vy })
        dragDataRef.current = null
        const patch = { curves: { ...(curves || {}), [curveChannel]: next } }
        onChange(itemId, patch)
        onCommit(itemId, patch)
      }
    }

    if (dragIdxRef.current == null) return
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    dragIdxRef.current = null
    const finalPts = dragDataRef.current || pts
    dragDataRef.current = null
    const patch = { curves: { ...(curves || {}), [curveChannel]: finalPts } }
    onCommit(itemId, patch)
  }

  const handlePointerCancel = () => {
    const canvas = canvasRef.current
    if (canvas) canvas.style.touchAction = 'auto'
    dragIdxRef.current = null
  }

  const handleDoubleClick = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const activePts = dragDataRef.current || pts
    const hit = hitTest(mx, my, activePts)
    if (hit >= 0) {
      const p = activePts[hit]
      if (p.id === 'start' || p.id === 'end') return
      if (activePts.length <= 2) return
      const next = activePts.filter((_, idx) => idx !== hit)
      dragDataRef.current = null
      const patch = { curves: { ...(curves || {}), [curveChannel]: next } }
      onChange(itemId, patch)
      onCommit(itemId, patch)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={GRID_PAD * 2 + GRID_W}
      height={GRID_PAD * 2 + GRID_H}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDoubleClick={handleDoubleClick}
      style={{ width: '100%', height: 'auto', borderRadius: '8px', cursor: 'crosshair', background: '#1a1721', display: 'block', touchAction: 'auto' }}
    />
  )
}

export default function CurvesPanel({ item, onChange, onCommit, onBack }) {
  const [curveChannel, setCurveChannel] = useState('rgb')
  const curvesData = item.curves ?? {}

  const referenceCurves = useMemo(() =>
    CURVE_CHANNELS
      .filter(ch => ch.key !== curveChannel && curvesData[ch.key])
      .map(ch => ({
        channel: ch.key,
        points: curvesData[ch.key],
        color: ch.color,
      })),
  [curvesData, curveChannel])

  const handleReset = () => onCommit(item.id, { curves: null })

  return (
    <div className="workspace-fx-panel">
      <div className="workspace-font-picker-header">
        <button type="button" className="workspace-back-button" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div className="workspace-color-picker-title">Curves</div>
        <button type="button" onClick={handleReset} style={{ background: 'transparent', border: 'none', color: '#a09ca6', cursor: 'pointer', padding: '4px' }}>
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="workspace-slider-list">
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c6df2', marginBottom: '8px' }}>
          Channel
        </div>
        <div style={{ display: 'flex', gap: '6px', padding: '4px 0 8px', justifyContent: 'center' }}>
          {CURVE_CHANNELS.map((ch) => {
            const isActive = curveChannel === ch.key
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => setCurveChannel(ch.key)}
                title={ch.label}
                style={{
                  width: isActive ? '22px' : '18px',
                  height: isActive ? '22px' : '18px',
                  borderRadius: '50%',
                  border: 'none',
                  background: ch.color,
                  cursor: 'pointer',
                  padding: 0,
                  opacity: isActive ? 1 : 0.6,
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  ...(ch.key === 'rgb'
                    ? { border: isActive ? '2.5px solid #7c6df2' : '1.5px solid #6b6372', boxShadow: 'none' }
                    : { border: 'none', boxShadow: isActive ? '0 0 0 2.5px #fff' : 'none' }),
                }}
              />
            )
          })}
        </div>
        <CurveEditor
          curves={curvesData}
          curveChannel={curveChannel}
          referenceCurves={referenceCurves}
          onChange={onChange}
          onCommit={onCommit}
          itemId={item.id}
        />
        <div style={{ fontSize: '10px', color: '#6b6372', marginTop: '6px', lineHeight: '1.3' }}>
          Click to add point · Drag to move · Double-click to remove
        </div>
      </div>
    </div>
  )
}
