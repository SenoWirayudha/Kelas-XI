/**
 * connectorUtils.js
 * Pure helpers for connector line routing and anchor point resolution.
 */
import { connectorAnchorSides } from '../constants/uiConstants'

// ─── Anchor points on items ───────────────────────────────────────────────────

export const getItemAnchorPoint = (item, side = 'right') => {
  const x = item.x || 0; const y = item.y || 0
  const w = item.w || 0; const h = item.h || 0
  if (side === 'top')    return { x: x + w / 2, y }
  if (side === 'bottom') return { x: x + w / 2, y: y + h }
  if (side === 'left')   return { x,             y: y + h / 2 }
  return                        { x: x + w,      y: y + h / 2 }
}

export const getClosestAnchorToPoint = (item, point) => {
  if (!item || !point) return 'left'
  return connectorAnchorSides
    .map((side) => ({ side, distance: Math.hypot(getItemAnchorPoint(item, side).x - point.x, getItemAnchorPoint(item, side).y - point.y) }))
    .sort((a, b) => a.distance - b.distance)[0]?.side || 'left'
}

export const getBestConnectorAnchors = (fromItem, toItem) => {
  let best = { fromAnchor: 'right', toAnchor: 'left', distance: Infinity }
  connectorAnchorSides.forEach((fromAnchor) => {
    connectorAnchorSides.forEach((toAnchor) => {
      const fromPoint = getItemAnchorPoint(fromItem, fromAnchor)
      const toPoint   = getItemAnchorPoint(toItem,   toAnchor)
      const distance  = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y)
      if (distance < best.distance) best = { fromAnchor, toAnchor, distance }
    })
  })
  return best
}

// ─── Endpoint resolution (handles chained connectors) ────────────────────────

const getConnectorStoredEndpoint = (connector, endpoint = 'to') =>
  endpoint === 'from' ? (connector.fromPoint || null) : (connector.toPoint || null)

export const resolveConnectorEndpointPoint = (connector, endpoint, items, seen = new Set()) => {
  const objectId             = endpoint === 'from' ? connector.fromId               : connector.toId
  const objectAnchor         = endpoint === 'from' ? connector.fromAnchor           : connector.toAnchor
  const connectorId          = endpoint === 'from' ? connector.fromConnectorId      : connector.toConnectorId
  const connectorEndpoint    = endpoint === 'from' ? connector.fromConnectorEndpoint : connector.toConnectorEndpoint

  if (connectorId && connectorEndpoint && !seen.has(`${connectorId}:${connectorEndpoint}`)) {
    const target = items.find((i) => i.id === connectorId && i.kind === 'connector')
    if (target) {
      seen.add(`${connectorId}:${connectorEndpoint}`)
      return resolveConnectorEndpointPoint(target, connectorEndpoint, items, seen)
    }
  }
  if (objectId) {
    const targetItem = items.find((i) => i.id === objectId)
    if (targetItem) return getItemAnchorPoint(targetItem, objectAnchor)
  }
  return getConnectorStoredEndpoint(connector, endpoint) || { x: connector.x || 0, y: connector.y || 0 }
}

// ─── Line point arrays ────────────────────────────────────────────────────────

export const getConnectorLinePoints = (start, end, pathType = 'straight') => {
  if (pathType === 'elbow') {
    const midX = start.x + (end.x - start.x) / 2
    return [start.x, start.y, midX, start.y, midX, end.y, end.x, end.y]
  }
  return [start.x, start.y, end.x, end.y]
}

export const getConnectorCurvePath = (start, end) => {
  const dx            = end.x - start.x
  const controlOffset = Math.max(50, Math.abs(dx) * 0.5)
  return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`
}

export const getConnectorArrowTail = (start, end, length = 28) => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  return [
    end.x - Math.cos(angle) * length,
    end.y - Math.sin(angle) * length,
    end.x,
    end.y,
  ]
}