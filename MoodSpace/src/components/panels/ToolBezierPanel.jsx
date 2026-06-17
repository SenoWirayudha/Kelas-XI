import { ArrowLeft } from 'lucide-react'

export default function ToolBezierPanel({
  anchors,
  strokeColor,
  strokeWidth,
  onStrokeChange,
  onComplete,
  onCancel,
  onUndo,
  onBack,
}) {
  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        {onBack && (
          <button type="button" className="workspace-back-button" onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
        )}
        <span className="panel-title">Bezier Path</span>
      </div>

      <div className="panel-section">
        <label className="panel-label">Points</label>
        <p className="panel-hint">{anchors.length} anchor{anchors.length !== 1 ? 's' : ''} placed</p>
        <p className="panel-hint">Click canvas to add anchors. Click first anchor to close & auto-fill. Double-click finished path to edit corner rounding.</p>
      </div>

      <div className="panel-section">
        <label className="panel-label">Stroke</label>
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => onStrokeChange({ strokeColor: e.target.value, strokeWidth })}
          className="panel-color-input"
        />
      </div>

      <div className="panel-section">
        <label className="panel-label">Width</label>
        <input
          type="range"
          min={1}
          max={30}
          value={strokeWidth}
          onChange={(e) => onStrokeChange({ strokeColor, strokeWidth: Number(e.target.value) })}
          className="panel-slider"
        />
        <span className="panel-value">{strokeWidth}px</span>
      </div>

      <div className="panel-actions">
        <button type="button" className="panel-btn panel-btn-secondary" onClick={onUndo} disabled={anchors.length === 0}>
          Undo Point
        </button>
        {anchors.length >= 2 && (
          <button type="button" className="panel-btn panel-btn-primary" onClick={onComplete}>
            Finish Path
          </button>
        )}
        <button type="button" className="panel-btn panel-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
