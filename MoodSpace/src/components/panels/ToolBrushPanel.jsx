import { useState } from 'react'

const BRUSH_SIZES = [3, 6, 10, 16, 24, 40]
const BRUSH_COLORS = ['#000000', '#ffffff', '#ff4444', '#4488ff', '#44cc44', '#ffaa00', '#cc44ff']

export default function ToolBrushPanel({ settings, onChange, onBack }) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const isErase = settings.mode === 'erase'

  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        {onBack && (
          <button type="button" className="panel-back-btn" onClick={onBack}>
            ←
          </button>
        )}
        <span className="panel-title">Brush</span>
      </div>

      <div className="panel-section">
        <p className="panel-hint">{isErase ? 'Draw on an image to erase pixels. Works like remove-bg but manual.' : 'Draw on canvas to create strokes. Successive strokes merge into the same layer. Tap empty canvas to start a new brush layer.'}</p>
      </div>

      <div className="panel-section">
        <div className="brush-mode-row">
          <button
            type="button"
            className={`brush-mode-btn ${!isErase ? 'active' : ''}`}
            onClick={() => onChange({ ...settings, mode: 'paint' })}
          >
            Paint
          </button>
          <button
            type="button"
            className={`brush-mode-btn ${isErase ? 'active' : ''}`}
            onClick={() => onChange({ ...settings, mode: 'erase' })}
          >
            Erase
          </button>
        </div>
      </div>

      <div className="panel-section">
        <label className="panel-label">Size</label>
        <div className="brush-size-row">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className={`brush-size-btn ${settings.size === s ? 'active' : ''}`}
              onClick={() => onChange({ ...settings, size: s })}
            >
              <span
                style={{
                  width: Math.min(s, 28),
                  height: Math.min(s, 28),
                  borderRadius: '50%',
                  background: isErase ? '#ffffff' : settings.color,
                  border: isErase ? '2px solid #ff4444' : 'none',
                  display: 'inline-block',
                }}
              />
            </button>
          ))}
        </div>
        <input
          type="range"
          min={1}
          max={80}
          value={settings.size}
          onChange={(e) => onChange({ ...settings, size: Number(e.target.value) })}
          className="panel-slider"
        />
        <span className="panel-value">{settings.size}px</span>
      </div>

      {!isErase && (
        <>
          <div className="panel-section">
            <label className="panel-label">Color</label>
            <div className="brush-color-row">
              {BRUSH_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`brush-color-swatch ${settings.color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => onChange({ ...settings, color: c })}
                />
              ))}
              <button
                type="button"
                className="brush-color-picker-btn"
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                <span style={{ background: settings.color, borderRadius: '50%', width: 20, height: 20, display: 'inline-block', border: '2px solid rgba(255,255,255,0.2)' }} />
              </button>
            </div>
            {showColorPicker && (
              <input
                type="color"
                value={settings.color}
                onChange={(e) => onChange({ ...settings, color: e.target.value })}
                className="panel-color-input"
              />
            )}
          </div>

          <div className="panel-section">
            <label className="panel-label">Opacity</label>
            <input
              type="range"
              min={5}
              max={100}
              value={Math.round(settings.opacity * 100)}
              onChange={(e) => onChange({ ...settings, opacity: Number(e.target.value) / 100 })}
              className="panel-slider"
            />
            <span className="panel-value">{Math.round(settings.opacity * 100)}%</span>
          </div>
        </>
      )}
    </div>
  )
}
