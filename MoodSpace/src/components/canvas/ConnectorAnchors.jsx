/**
 * ConnectorAnchors.jsx
 * Two small components that render the connection anchor dots on items/connectors.
 */
import React from 'react'
import { Group, Circle } from 'react-konva'
import { connectorAnchorSides } from '../../constants/uiConstants'
import { getItemAnchorPoint, resolveConnectorEndpointPoint } from '../../utils/connectorUtils'

// ─── Anchor dots on a regular canvas item ────────────────────────────────────

export function ObjectAnchors({ item, visible, onConnectorStart, onConnectorEnd }) {
  if (!visible || item.kind === 'connector' || item.visible === false || item.locked) return null

  return (
    <Group listening>
      {connectorAnchorSides.map((side) => {
        const point = getItemAnchorPoint(item, side)
        return (
          <Circle
            key={`${item.id}-${side}`}
            x={point.x} y={point.y} radius={5}
            fill="#ffffff" stroke="#3b82f6" strokeWidth={1.5}
            shadowColor="#3b82f6" shadowBlur={6} shadowOpacity={0.3}
            onMouseDown={(e) => onConnectorStart(e, item.id, side)}
            onTouchStart={(e) => onConnectorStart(e, item.id, side)}
            onMouseUp={(e)   => onConnectorEnd(e, item.id, side)}
            onTouchEnd={(e)  => onConnectorEnd(e, item.id, side)}
            onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'crosshair' }}
            onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default' }}
          />
        )
      })}
    </Group>
  )
}

// ─── Endpoint dots on a connector (allow re-wiring) ──────────────────────────

export function ConnectorEndpointAnchors({ connector, items, visible, onConnectorStart, onConnectorEnd }) {
  if (!visible || connector.visible === false || connector.locked) return null

  return (
    <Group listening>
      {['from', 'to'].map((endpoint) => {
        const point = resolveConnectorEndpointPoint(connector, endpoint, items)
        return (
          <Circle
            key={`${connector.id}-${endpoint}`}
            x={point.x} y={point.y} radius={5}
            fill="#ffffff" stroke="#7c6df2" strokeWidth={1.5}
            shadowColor="#7c6df2" shadowBlur={6} shadowOpacity={0.3}
            onMouseDown={(e) => onConnectorStart(e, connector.id, endpoint, 'connector')}
            onTouchStart={(e) => onConnectorStart(e, connector.id, endpoint, 'connector')}
            onMouseUp={(e)   => onConnectorEnd(e, connector.id, endpoint, 'connector')}
            onTouchEnd={(e)  => onConnectorEnd(e, connector.id, endpoint, 'connector')}
            onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'crosshair' }}
            onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default' }}
          />
        )
      })}
    </Group>
  )
}