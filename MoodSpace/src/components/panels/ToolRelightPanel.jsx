import { ArrowLeft, Lightbulb } from 'lucide-react'
import { BLEND_MODES } from '../../constants/uiConstants'

export default function ToolRelightPanel({
  selectedItem,
  relightState,
  onActivate,
  onUpdateLight,
  onDeactivate,
  onApply,
  onBack,
}) {
  const isActive = !!relightState
  const isImage = selectedItem?.kind === 'image'

  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        {onBack && (
          <button type="button" className="workspace-back-button" onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
        )}
        <Lightbulb size={16} />
        <span className="panel-title">Relight</span>
      </div>

      <div className="panel-section">
        <p className="panel-hint">
          Add two colored light sources to your image. Drag the balls on canvas to set direction.
        </p>
      </div>

      {!selectedItem && (
        <div className="panel-section">
          <p className="panel-hint" style={{ color: '#f87171' }}>
            Select an image first.
          </p>
        </div>
      )}

      {selectedItem && !isImage && (
        <div className="panel-section">
          <p className="panel-hint" style={{ color: '#f87171' }}>
            This tool only works on images.
          </p>
        </div>
      )}

      {isImage && !isActive && (
        <div className="panel-actions">
          <button
            type="button"
            className="panel-btn panel-btn-primary"
            onClick={onActivate}
          >
            Activate Lights
          </button>
        </div>
      )}

      {isActive && (
        <>
          <div className="panel-section">
            <label className="panel-label">Light A — Color</label>
            <input
              type="color"
              value={relightState.lightA.color}
              onChange={(e) => onUpdateLight('lightA', { color: e.target.value })}
              className="panel-color-input"
              style={{ width: '100%', height: 36 }}
            />
          </div>
          <div className="panel-section">
            <label className="panel-label">Light B — Color</label>
            <input
              type="color"
              value={relightState.lightB.color}
              onChange={(e) => onUpdateLight('lightB', { color: e.target.value })}
              className="panel-color-input"
              style={{ width: '100%', height: 36 }}
            />
          </div>
          <div className="panel-section panel-actions" style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="panel-btn panel-btn-primary"
              style={{ flex: 1 }}
              onClick={onApply}
            >
              Apply
            </button>
            <button
              type="button"
              className="panel-btn panel-btn-ghost"
              style={{ flex: 1 }}
              onClick={onDeactivate}
            >
              Remove Lights
            </button>
          </div>
        </>
      )}
    </div>
  )
}
