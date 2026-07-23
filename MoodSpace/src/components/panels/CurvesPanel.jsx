import { useState, useRef, useEffect, useMemo } from 'react'
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

function CurveEditor({ curves, curveChannel, referenceCurves, onChange, onCommit, itemId }) {
  const canvasRef = useRef(null)
  const dragIdxRef = useRef(null)
  const dragDataRef = useRef(null)
  const nextIdRef = useRef(100)

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

  const toCanvas = (x, y) => [
    GRID_PAD + (x / 255) * GRID_W,
    GRID_PAD + (1 - y / 255) * GRID_H,
  ]

  const toValue = (cx, cy) => [
    Math.round(((cx - GRID_PAD) / GRID_W) * 255),
    Math.round(255 - ((cy - GRID_PAD) / GRID_H) * 255),
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
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

    const activePts = dragDataRef.current || pts
    const samples = sampleCurveForDisplay(activePts, 256)
    console.log(`[CurveEditor] channel=${curveChannel} controlPoints=${activePts.length} samples=${samples.length}`)
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
  }, [curves, curveChannel, referenceCurves, pts])

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const activePts = dragDataRef.current || pts
    for (let i = 0; i < activePts.length; i++) {
      const [cx, cy] = toCanvas(activePts[i].x, activePts[i].y)
      if (Math.abs(mx - cx) < 8 && Math.abs(my - cy) < 8) {
        dragIdxRef.current = i
        return
      }
    }

    if (mx >= GRID_PAD && mx <= GRID_PAD + GRID_W && my >= GRID_PAD && my <= GRID_PAD + GRID_H) {
      const [vx, vy] = toValue(mx, my)
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

  const handleMouseMove = (e) => {
    if (dragIdxRef.current == null) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const [vx, vy] = toValue(
      Math.max(GRID_PAD, Math.min(GRID_PAD + GRID_W, mx)),
      Math.max(GRID_PAD, Math.min(GRID_PAD + GRID_H, my))
    )

    const activePts = dragDataRef.current || pts
    const next = activePts.map((p, i) =>
      i === dragIdxRef.current ? { ...p, x: vx, y: vy } : p
    )
    dragDataRef.current = next
    const patch = { curves: { ...(curves || {}), [curveChannel]: next } }
    onChange(itemId, patch)
  }

  const handleMouseUp = () => {
    if (dragIdxRef.current == null) return
    dragIdxRef.current = null
    const finalPts = dragDataRef.current || pts
    dragDataRef.current = null
    const patch = { curves: { ...(curves || {}), [curveChannel]: finalPts } }
    onCommit(itemId, patch)
  }

  const handleDoubleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const activePts = dragDataRef.current || pts
    for (let i = 0; i < activePts.length; i++) {
      const [cx, cy] = toCanvas(activePts[i].x, activePts[i].y)
      if (Math.abs(mx - cx) < 8 && Math.abs(my - cy) < 8) {
        const p = activePts[i]
        if (p.id === 'start' || p.id === 'end') return
        if (activePts.length <= 2) return
        const next = activePts.filter((_, idx) => idx !== i)
        dragDataRef.current = null
        const patch = { curves: { ...(curves || {}), [curveChannel]: next } }
        onChange(itemId, patch)
        onCommit(itemId, patch)
        return
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={GRID_PAD * 2 + GRID_W}
      height={GRID_PAD * 2 + GRID_H}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      style={{ width: '100%', height: 'auto', borderRadius: '8px', cursor: 'crosshair', background: '#1a1721', display: 'block' }}
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
