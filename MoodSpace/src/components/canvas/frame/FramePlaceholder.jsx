import { Group, Rect, Circle, Line } from 'react-konva'

export default function FramePlaceholder({ frameSlot, isDropTarget }) {
  return (
    <Group listening={false}>
      <Rect
        x={frameSlot.x}
        y={frameSlot.y}
        width={frameSlot.width}
        height={frameSlot.height}
        cornerRadius={frameSlot.cornerRadius || 0}
        fill={isDropTarget ? '#f1e5ff' : '#f2f2f2'}
        opacity={0.82}
      />
      <Rect
        x={frameSlot.x + 0.5}
        y={frameSlot.y + 0.5}
        width={Math.max(0, frameSlot.width - 1)}
        height={Math.max(0, frameSlot.height - 1)}
        cornerRadius={frameSlot.cornerRadius || 0}
        stroke={isDropTarget ? '#a970ff' : '#c7c7c7'}
        strokeWidth={isDropTarget ? 2 : 1.5}
        dash={[7, 6]}
        opacity={0.9}
      />
      <Rect
        x={frameSlot.x + frameSlot.width / 2 - 22}
        y={frameSlot.y + frameSlot.height / 2 - 20}
        width={44}
        height={38}
        cornerRadius={7}
        stroke={isDropTarget ? '#8d5cf5' : '#9b9b9b'}
        strokeWidth={2}
        opacity={0.92}
      />
      <Circle
        x={frameSlot.x + frameSlot.width / 2 - 9}
        y={frameSlot.y + frameSlot.height / 2 - 9}
        radius={4}
        fill={isDropTarget ? '#8d5cf5' : '#9b9b9b'}
        opacity={0.92}
      />
      <Line
        points={[
          frameSlot.x + frameSlot.width / 2 - 17,
          frameSlot.y + frameSlot.height / 2 + 9,
          frameSlot.x + frameSlot.width / 2 - 4,
          frameSlot.y + frameSlot.height / 2 - 3,
          frameSlot.x + frameSlot.width / 2 + 17,
          frameSlot.y + frameSlot.height / 2 + 11,
        ]}
        stroke={isDropTarget ? '#8d5cf5' : '#9b9b9b'}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        opacity={0.92}
      />
    </Group>
  )
}
