import { useRef, useEffect } from 'react'
import { Group, Rect, Circle } from 'react-konva'

export default function RemoveBgOverlay({ item }) {
  const spinnerRef = useRef(null)

  useEffect(() => {
    const node = spinnerRef.current
    if (!node) return
    let frame
    const animate = () => {
      node.rotation(node.rotation() + 8)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!item) return null
  const cx = item.x + item.w / 2
  const cy = item.y + item.h / 2
  const r = Math.min(item.w, item.h) * 0.15

  return (
    <Group>
      <Rect
        x={item.x} y={item.y}
        width={item.w} height={item.h}
        fill="rgba(0,0,0,0.3)"
        listening={false}
      />
      <Circle
        ref={spinnerRef}
        x={cx} y={cy}
        radius={r}
        stroke="#ffffff"
        strokeWidth={3}
        dash={[r * 1.5, r * 4]}
        lineCap="round"
        listening={false}
      />
    </Group>
  )
}
