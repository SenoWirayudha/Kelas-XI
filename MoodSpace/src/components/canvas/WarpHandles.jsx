import { useCallback, useRef, useEffect } from 'react'
import { Circle, Line, Group } from 'react-konva'

const HANDLE_RADIUS = 8
const HANDLE_FILL = '#ffffff'
const HANDLE_STROKE = '#7C3AED'
const HANDLE_STROKE_WIDTH = 2
const HANDLE_DRAG_FILL = '#A78BFA'
const LINE_STROKE = 'rgba(124, 58, 237, 0.35)'
const LINE_STROKE_WIDTH = 1.5

export default function WarpHandles({ grid, mode, onDrag, onDragEnd }) {
  const handleRefs = useRef({})

  const handleDragStart = useCallback((e, row, col) => {
    e.cancelBubble = true
    const node = e.target
    node.fill(HANDLE_DRAG_FILL)
    node.getLayer()?.batchDraw()
  }, [])

  const handleDragMove = useCallback((e, row, col) => {
    e.cancelBubble = true
    const pos = e.target.position()
    onDrag(row, col, pos.x, pos.y)
  }, [onDrag])

  const handleDragEnd = useCallback((e, row, col) => {
    const node = e.target
    node.fill(HANDLE_FILL)
    node.getLayer()?.batchDraw()
    onDragEnd?.()
  }, [onDragEnd])

  useEffect(() => {
    handleRefs.current = {}
  }, [grid])

  if (!grid || grid.length < 2) return null

  const rows = grid.length
  const cols = grid[0].length
  const isPerspective = mode === 'perspective'

  const lines = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (col < cols - 1) {
        lines.push([grid[row][col].x, grid[row][col].y, grid[row][col + 1].x, grid[row][col + 1].y])
      }
      if (row < rows - 1) {
        lines.push([grid[row][col].x, grid[row][col].y, grid[row + 1][col].x, grid[row + 1][col].y])
      }
    }
  }

  return (
    <Group>
      {lines.map((points, i) => (
        <Line
          key={`line-${i}`}
          points={points}
          stroke={LINE_STROKE}
          strokeWidth={LINE_STROKE_WIDTH}
          listening={false}
        />
      ))}
      {grid.map((row, rowIdx) =>
        row.map((point, colIdx) => {
          const isCorner = isPerspective && (
            (rowIdx === 0 || rowIdx === rows - 1) &&
            (colIdx === 0 || colIdx === cols - 1)
          )
          if (isPerspective && !isCorner) return null

          return (
            <Circle
              key={`handle-${rowIdx}-${colIdx}`}
              x={point.x}
              y={point.y}
              radius={HANDLE_RADIUS}
              fill={HANDLE_FILL}
              stroke={HANDLE_STROKE}
              strokeWidth={HANDLE_STROKE_WIDTH}
              draggable
              onDragStart={(e) => handleDragStart(e, rowIdx, colIdx)}
              onDragEnd={(e) => handleDragEnd(e, rowIdx, colIdx)}
              onDragMove={(e) => handleDragMove(e, rowIdx, colIdx)}
              hitStrokeWidth={14}
              ref={(node) => {
                if (node) {
                  handleRefs.current[`${rowIdx}-${colIdx}`] = node
                }
              }}
            />
          )
        })
      )}
    </Group>
  )
}
