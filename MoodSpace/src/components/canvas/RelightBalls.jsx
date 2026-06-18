import { useRef, useEffect } from 'react'
import { Group, Circle, Rect } from 'react-konva'

const BALL_RADIUS = 26

// Pure lighting overlay — no interaction, always visible
export function LightOverlay({ target, state }) {
  if (!target) return null
  const cx = target.x + target.w / 2
  const cy = target.y + target.h / 2

  return (
    <>
      {['lightA', 'lightB'].map((key) => {
        const light = state[key]
        const localX = cx + light.offsetX - target.x
        const localY = cy + light.offsetY - target.y
        return (
          <Rect
            key={`fx-${key}`}
            x={target.x}
            y={target.y}
            width={target.w}
            height={target.h}
            globalCompositeOperation="overlay"
            fillRadialGradientStartPoint={{ x: localX, y: localY }}
            fillRadialGradientEndPoint={{ x: localX, y: localY }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndRadius={Math.max(target.w, target.h) * 0.7}
            fillRadialGradientColorStops={[
              0, light.color,
              0.5, light.color + '99',
              1, 'transparent',
            ]}
            listening={false}
          />
        )
      })}
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
