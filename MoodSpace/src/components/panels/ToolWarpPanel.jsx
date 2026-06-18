import { useState, useCallback } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'

const MODES = [
  { id: 'perspective', label: 'Perspektif' },
  { id: 'mesh', label: 'Bentuk Bertalian' },
]

export default function ToolWarpPanel({
  selectedItem,
  warpState,
  onApplyWarp,
  onCancelWarp,
  onResetWarp,
  onBack,
}) {
  const [mode, setMode] = useState(warpState?.mode || 'perspective')
  const [divX, setDivX] = useState(warpState?.divX || 3)
  const [divY, setDivY] = useState(warpState?.divY || 3)
  const isActive = !!warpState

  const handleSetMode = useCallback((nextMode) => {
    setMode(nextMode)
    if (warpState && onResetWarp) {
      onResetWarp(nextMode === 'perspective' ? 1 : (warpState?.divX || 3), nextMode === 'perspective' ? 1 : (warpState?.divY || 3), nextMode)
    }
  }, [warpState, onResetWarp])

  const handleDivChange = useCallback((axis, value) => {
    const nextX = axis === 'x' ? value : divX
    const nextY = axis === 'y' ? value : divY
    if (axis === 'x') setDivX(value)
    else setDivY(value)
    if (warpState && onResetWarp) {
      onResetWarp(nextX, nextY, mode)
    }
  }, [divX, divY, mode, warpState, onResetWarp])

  const canWarp = selectedItem?.kind === 'image'

  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        <button type="button" className="workspace-back-button" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <span className="panel-title">Mesh Warp</span>
      </div>

      {!selectedItem && (
        <div className="panel-section">
          <p className="panel-hint" style={{ color: '#f87171' }}>
            Select an image first.
          </p>
        </div>
      )}

      {selectedItem && selectedItem.kind !== 'image' && (
        <div className="panel-section">
          <p className="panel-hint" style={{ color: '#f87171' }}>
            This tool only works on images.
          </p>
        </div>
      )}

      <div className="panel-section">
        <label className="panel-label">Mode</label>
        <div className="workspace-canvas-align-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {MODES.map((m) => (
            <button
              type="button"
              key={m.id}
              className={`workspace-align-btn-modern ${mode === m.id ? 'active' : ''}`}
              onClick={() => handleSetMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'mesh' && (
        <>
          <div className="panel-section">
            <label className="panel-label">
              Divisi X: <strong>{divX}</strong>
            </label>
            <input
              type="range"
              min={2}
              max={8}
              value={divX}
              onChange={(e) => handleDivChange('x', Number(e.target.value))}
              className="panel-slider"
            />
          </div>

          <div className="panel-section">
            <label className="panel-label">
              Divisi Y: <strong>{divY}</strong>
            </label>
            <input
              type="range"
              min={2}
              max={8}
              value={divY}
              onChange={(e) => handleDivChange('y', Number(e.target.value))}
              className="panel-slider"
            />
          </div>
        </>
      )}

      <div className="panel-section">
        <p className="panel-hint">
          Grid: {mode === 'perspective' ? '1' : divX} × {mode === 'perspective' ? '1' : divY} = {mode === 'perspective' ? 1 : divX * divY} sel ({mode === 'perspective' ? 2 : divX * divY * 2} triangle)
        </p>
      </div>

      <div className="panel-actions" style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          className="panel-btn panel-btn-secondary"
          disabled={!isActive}
          onClick={onResetWarp}
          style={{ flex: 1 }}
        >
          <RotateCcw size={14} style={{ marginRight: 4 }} />
          Reset
        </button>
        {!isActive ? (
          <button
            type="button"
            className="panel-btn panel-btn-primary"
            disabled={!canWarp}
            onClick={() => onApplyWarp(mode, divX, divY)}
            style={{ flex: 2 }}
          >
            Apply Warp
          </button>
        ) : (
          <>
            <button
              type="button"
              className="panel-btn panel-btn-primary"
              onClick={() => onApplyWarp(mode, divX, divY)}
              style={{ flex: 1 }}
            >
              Apply
            </button>
            <button
              type="button"
              className="panel-btn panel-btn-ghost"
              onClick={onCancelWarp}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
