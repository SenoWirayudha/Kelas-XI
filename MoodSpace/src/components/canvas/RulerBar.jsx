import { useMemo } from 'react'

const RULER_SIZE = 24
const MIN_PX_BETWEEN_TICKS = 60
const MAX_TICKS = 120

function getAdaptiveInterval(scale) {
  const worldPerPx = 1 / scale
  const rawInterval = MIN_PX_BETWEEN_TICKS * worldPerPx
  const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000]
  let best = nice[0]
  for (const n of nice) {
    best = n
    if (n >= rawInterval) break
  }
  return best
}

function computeTicks({ axis, camera, viewportSize }) {
  const scale = camera.scale || 1
  const interval = getAdaptiveInterval(scale)
  const offset = axis === 'x' ? camera.x : camera.y
  const length = axis === 'x' ? viewportSize.width : viewportSize.height

  const worldStart = -offset / scale
  const worldEnd = (length - offset) / scale

  const firstTick = Math.floor(worldStart / interval) * interval
  const lastTick = Math.ceil(worldEnd / interval) * interval

  const rawTicks = []
  for (let w = firstTick; w <= lastTick; w += interval) {
    const screenPos = w * scale + offset
    if (screenPos < -50 || screenPos > length + 50) continue
    const isLabel = rawTicks.length % 2 === 0
    rawTicks.push({ screenPos, worldCoord: w, isLabel })
    if (rawTicks.length > MAX_TICKS) break
  }
  return rawTicks
}

function toScreenX(worldX, camera) {
  return worldX * camera.scale + camera.x
}

function toScreenY(worldY, camera) {
  return worldY * camera.scale + camera.y
}

export default function RulerBar({ camera, viewportSize, cursorWorldPos, selectedBounds }) {
  const topTicks = useMemo(() => computeTicks({ axis: 'x', camera, viewportSize }), [camera.x, camera.scale, viewportSize.width])
  const leftTicks = useMemo(() => computeTicks({ axis: 'y', camera, viewportSize }), [camera.y, camera.scale, viewportSize.height])

  const topSel = useMemo(() => {
    if (!selectedBounds) return null
    return {
      screenLeft: toScreenX(selectedBounds.x, camera),
      screenRight: toScreenX(selectedBounds.right, camera),
      screenY: 0,
      height: RULER_SIZE,
    }
  }, [selectedBounds, camera.x, camera.scale])

  const leftSel = useMemo(() => {
    if (!selectedBounds) return null
    return {
      screenTop: toScreenY(selectedBounds.y, camera),
      screenBottom: toScreenY(selectedBounds.bottom, camera),
      screenX: 0,
      width: RULER_SIZE,
    }
  }, [selectedBounds, camera.y, camera.scale])

  const cursorScreenX = cursorWorldPos ? toScreenX(cursorWorldPos.x, camera) : null
  const cursorScreenY = cursorWorldPos ? toScreenY(cursorWorldPos.y, camera) : null
  const showCursorX = cursorScreenX != null && cursorScreenX >= 0 && cursorScreenX <= viewportSize.width
  const showCursorY = cursorScreenY != null && cursorScreenY >= RULER_SIZE && cursorScreenY <= viewportSize.height

  return (
    <div className="workspace-ruler-container">
      <svg width={viewportSize.width} height={viewportSize.height}>
        {/* Top ruler background */}
        <rect x={RULER_SIZE} y={0} width={viewportSize.width - RULER_SIZE} height={RULER_SIZE} fill="#121216" />
        {/* Left ruler background */}
        <rect x={0} y={RULER_SIZE} width={RULER_SIZE} height={viewportSize.height - RULER_SIZE} fill="#121216" />
        {/* Corner square */}
        <rect x={0} y={0} width={RULER_SIZE} height={RULER_SIZE} fill="#121216" />

        {/* Separator: top ruler bottom edge */}
        <line x1={0} y1={RULER_SIZE} x2={viewportSize.width} y2={RULER_SIZE} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        {/* Separator: left ruler right edge */}
        <line x1={RULER_SIZE} y1={0} x2={RULER_SIZE} y2={viewportSize.height} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

        {/* Selection range highlight — top ruler */}
        {topSel && (
          <rect
            x={topSel.screenLeft} y={topSel.screenY}
            width={Math.max(2, topSel.screenRight - topSel.screenLeft)} height={topSel.height}
            fill="#6b21a8" opacity={0.35}
          />
        )}

        {/* Selection range highlight — left ruler */}
        {leftSel && (
          <rect
            x={leftSel.screenX} y={leftSel.screenTop}
            width={leftSel.width} height={Math.max(2, leftSel.screenBottom - leftSel.screenTop)}
            fill="#6b21a8" opacity={0.35}
          />
        )}

        {/* Selection range outline — top ruler */}
        {topSel && (
          <line x1={topSel.screenLeft} y1={0} x2={topSel.screenLeft} y2={RULER_SIZE} stroke="#a855f7" strokeWidth={1} opacity={0.8} />
        )}
        {topSel && (
          <line x1={topSel.screenRight} y1={0} x2={topSel.screenRight} y2={RULER_SIZE} stroke="#a855f7" strokeWidth={1} opacity={0.8} />
        )}

        {/* Selection range outline — left ruler */}
        {leftSel && (
          <line x1={0} y1={leftSel.screenTop} x2={RULER_SIZE} y2={leftSel.screenTop} stroke="#a855f7" strokeWidth={1} opacity={0.8} />
        )}
        {leftSel && (
          <line x1={0} y1={leftSel.screenBottom} x2={RULER_SIZE} y2={leftSel.screenBottom} stroke="#a855f7" strokeWidth={1} opacity={0.8} />
        )}

        {/* Top ticks */}
        <g>
          {topTicks.map((t, i) => (
            <g key={`ht-${i}`}>
              <line
                x1={t.screenPos} y1={RULER_SIZE - 1}
                x2={t.screenPos} y2={RULER_SIZE - (t.isLabel ? 14 : 7)}
                stroke={t.isLabel ? '#c8c3d6' : '#6b647b'}
                strokeWidth={t.isLabel ? 1.5 : 0.8}
              />
              {t.isLabel && (
                <text
                  x={t.screenPos + 3} y={10}
                  fill="#c8c3d6" fontSize={10}
                  fontFamily="Inter, Arial, sans-serif"
                >
                  {t.worldCoord}
                </text>
              )}
            </g>
          ))}
        </g>

        {/* Left ticks */}
        <g>
          {leftTicks.map((t, i) => (
            <g key={`vt-${i}`}>
              <line
                x1={RULER_SIZE - 1} y1={t.screenPos}
                x2={RULER_SIZE - (t.isLabel ? 14 : 7)} y2={t.screenPos}
                stroke={t.isLabel ? '#c8c3d6' : '#6b647b'}
                strokeWidth={t.isLabel ? 1.5 : 0.8}
              />
              {t.isLabel && (
                <text
                  x={3} y={t.screenPos + 10}
                  fill="#c8c3d6" fontSize={10}
                  fontFamily="Inter, Arial, sans-serif"
                >
                  {t.worldCoord}
                </text>
              )}
            </g>
          ))}
        </g>

        {/* Cursor indicator — top ruler */}
        {showCursorX && (
          <g>
            <polygon
              points={`${cursorScreenX},${RULER_SIZE - 2} ${cursorScreenX - 4},${RULER_SIZE - 9} ${cursorScreenX + 4},${RULER_SIZE - 9}`}
              fill="#fbbf24"
            />
            <line x1={cursorScreenX} y1={RULER_SIZE - 9} x2={cursorScreenX} y2={0} stroke="#fbbf24" strokeWidth={1} opacity={0.5} />
          </g>
        )}

        {/* Cursor indicator — left ruler */}
        {showCursorY && (
          <g>
            <polygon
              points={`${RULER_SIZE - 2},${cursorScreenY} ${RULER_SIZE - 9},${cursorScreenY - 4} ${RULER_SIZE - 9},${cursorScreenY + 4}`}
              fill="#fbbf24"
            />
            <line x1={RULER_SIZE - 9} y1={cursorScreenY} x2={0} y2={cursorScreenY} stroke="#fbbf24" strokeWidth={1} opacity={0.5} />
          </g>
        )}
      </svg>
    </div>
  )
}
