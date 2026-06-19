import { useRef, useEffect, useState } from 'react'
import { Group, Circle, Image as KonvaImage } from 'react-konva'

const BALL_RADIUS = 26

// Pre-rendered lighting overlay masked to the image's alpha channel
export function LightOverlay({ target, state }) {
  const [shadowCanvas, setShadowCanvas] = useState(null)
  const [lightCanvas, setLightCanvas] = useState(null)
  const darken = state?.darken ?? 0

  useEffect(() => {
    if (!target || !state) { setShadowCanvas(null); setLightCanvas(null); return }
    let cancelled = false

    const w = target.w
    const h = target.h
    if (w <= 0 || h <= 0) { setShadowCanvas(null); setLightCanvas(null); return }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return

      const cx = w / 2
      const cy = h / 2
      const maxR = Math.max(w, h) * 0.7

      // Light overlay canvas (colored gradients)
      const lCanvas = document.createElement('canvas')
      lCanvas.width = Math.round(w)
      lCanvas.height = Math.round(h)
      const lctx = lCanvas.getContext('2d')

      for (const key of ['lightA', 'lightB']) {
        const light = state[key]
        const localX = cx + light.offsetX
        const localY = cy + light.offsetY
        const gradient = lctx.createRadialGradient(localX, localY, 0, localX, localY, maxR)
        gradient.addColorStop(0, light.color)
        gradient.addColorStop(0.5, light.color + '99')
        gradient.addColorStop(1, 'transparent')
        lctx.globalAlpha = light.intensity ?? 1
        lctx.fillStyle = gradient
        lctx.fillRect(0, 0, w, h)
      }
      lctx.globalCompositeOperation = 'destination-in'
      lctx.globalAlpha = 1
      lctx.drawImage(img, 0, 0, w, h)

      // Shadow mask canvas (darken non-lit areas)
      let sCanvas = null
      if (darken > 0) {
        sCanvas = document.createElement('canvas')
        sCanvas.width = Math.round(w)
        sCanvas.height = Math.round(h)
        const sctx = sCanvas.getContext('2d')
        sctx.fillStyle = 'black'
        sctx.fillRect(0, 0, w, h)
        sctx.globalCompositeOperation = 'destination-out'
        for (const key of ['lightA', 'lightB']) {
          const light = state[key]
          const localX = cx + light.offsetX
          const localY = cy + light.offsetY
          const gradient = sctx.createRadialGradient(localX, localY, 0, localX, localY, maxR)
          gradient.addColorStop(0, 'white')
          gradient.addColorStop(0.5, 'white')
          gradient.addColorStop(1, 'transparent')
          sctx.globalAlpha = light.intensity ?? 1
          sctx.fillStyle = gradient
          sctx.fillRect(0, 0, w, h)
        }
        sctx.globalCompositeOperation = 'destination-in'
        sctx.globalAlpha = 1
        sctx.drawImage(img, 0, 0, w, h)
      }

      if (!cancelled) {
        setLightCanvas(lCanvas)
        setShadowCanvas(sCanvas)
      }
    }
    img.src = target.src

    return () => { cancelled = true }
  }, [
    target?.src, target?.x, target?.y, target?.w, target?.h,
    state?.lightA?.offsetX, state?.lightA?.offsetY, state?.lightA?.color, state?.lightA?.intensity,
    state?.lightB?.offsetX, state?.lightB?.offsetY, state?.lightB?.color, state?.lightB?.intensity,
    state?.darken,
  ])

  if (!target || !lightCanvas) return null

  return (
    <>
      {shadowCanvas && (
        <KonvaImage
          image={shadowCanvas}
          x={target.x} y={target.y} width={target.w} height={target.h}
          opacity={darken}
          listening={false}
        />
      )}
      <KonvaImage
        image={lightCanvas}
        x={target.x} y={target.y} width={target.w} height={target.h}
        globalCompositeOperation="overlay"
        listening={false}
      />
    </>
  )
}

// Draggable overlay + editing UI
export default function RelightBalls({ target, state, onDragLight }) {
  if (!target) return null
  const cx = target.x + target.w / 2
  const cy = target.y + target.h / 2

  return (
    <>
      <LightOverlay target={target} state={state} />
      {['lightA', 'lightB'].map((key) => {
        const light = state[key]
        return (
          <RelightBall
            key={key}
            cx={cx}
            cy={cy}
            ox={light.offsetX}
            oy={light.offsetY}
            color={light.color}
            onDragEnd={(dx, dy) => onDragLight(key, dx, dy)}
          />
        )
      })}
    </>
  )
}

function RelightBall({ cx, cy, ox, oy, color, onDragEnd }) {
  const groupRef = useRef(null)

  useEffect(() => {
    const node = groupRef.current
    if (node) {
      node.x(cx + ox)
      node.y(cy + oy)
      node.getLayer()?.batchDraw()
    }
  }, [cx, cy, ox, oy])

  return (
    <Group
      ref={groupRef}
      x={cx + ox}
      y={cy + oy}
      draggable
      onDragEnd={(e) => {
        const node = e.target
        onDragEnd(node.x() - cx, node.y() - cy)
        node.getLayer()?.batchDraw()
      }}
    >
      <Circle radius={BALL_RADIUS + 6} fill="transparent" listening />
      <Circle
        radius={BALL_RADIUS}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={BALL_RADIUS}
        fillRadialGradientColorStops={[0, color, 0.3, color + '80', 1, 'transparent']}
        listening={false}
      />
      <Circle radius={BALL_RADIUS * 0.3} fill={color} listening={false} />
      <Circle radius={BALL_RADIUS} stroke={color} strokeWidth={2} opacity={0.5} listening={false} />
      <Circle radius={BALL_RADIUS * 0.42} fill="rgba(0,0,0,0.45)" listening={false} />
    </Group>
  )
}
