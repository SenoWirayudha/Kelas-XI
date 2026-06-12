/**
 * CanvasConnector.jsx
 * Renders a connector line (straight / elbow / curve) between two canvas items.
 */
import React from 'react'
import { Group, Line, Arrow, Path, Circle } from 'react-konva'
import {
  resolveConnectorEndpointPoint,
  getConnectorLinePoints,
  getConnectorCurvePath,
  getConnectorArrowTail,
} from '../../utils/connectorUtils'

export default function CanvasConnector({ item, items, selectedId, onSelect }) {
  const start       = resolveConnectorEndpointPoint(item, 'from', items)
  const end         = resolveConnectorEndpointPoint(item, 'to',   items)
  const isSelected  = selectedId === item.id
  const stroke      = item.stroke      || '#7c6df2'
  const strokeWidth = item.strokeWidth || 3
  const pathType    = item.pathType    || 'straight'

  return (
    <Group
      id={item.id}
      visible={item.visible !== false}
      onClick={(e) => onSelect(e, item.id)}
      onTap={(e)   => onSelect(e, item.id)}
    >
      {pathType === 'curve' ? (
        <>
          <Path
            data={getConnectorCurvePath(start, end)}
            stroke={stroke} strokeWidth={strokeWidth}
            lineCap="round" lineJoin="round"
            fillEnabled={false} listening={false}
          />
          {/* Wide invisible hit target */}
          <Path
            data={getConnectorCurvePath(start, end)}
            stroke="rgba(0,0,0,0)"
            strokeWidth={Math.max(14, strokeWidth + 10)}
            lineCap="round" lineJoin="round"
            fillEnabled={false}
          />
          {item.arrowHead && (
            <Arrow
              points={getConnectorArrowTail(start, end)}
              stroke={stroke} fill={stroke} strokeWidth={strokeWidth}
              pointerLength={12} pointerWidth={12}
              lineCap="round" listening={false}
            />
          )}
        </>
      ) : item.arrowHead ? (
        <Arrow
          points={getConnectorLinePoints(start, end, pathType)}
          stroke={stroke} fill={stroke} strokeWidth={strokeWidth}
          pointerLength={14} pointerWidth={14}
          lineCap="round" lineJoin="round"
        />
      ) : (
        <Line
          points={getConnectorLinePoints(start, end, pathType)}
          stroke={stroke} strokeWidth={strokeWidth}
          lineCap="round" lineJoin="round"
          hitStrokeWidth={16}
        />
      )}

      {isSelected && ['from', 'to'].map((endpoint) => {
        const point = resolveConnectorEndpointPoint(item, endpoint, items)
        return (
          <Circle
            key={`${item.id}-${endpoint}`}
            x={point.x} y={point.y} radius={4}
            fill="#ffffff" stroke="#3b82f6" strokeWidth={1.5}
            listening={false}
          />
        )
      })}
    </Group>
  )
}