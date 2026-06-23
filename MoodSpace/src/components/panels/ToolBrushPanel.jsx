import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

const BRUSH_SIZES = [3, 6, 10, 16, 24, 40]
const BRUSH_COLORS = ['#000000', '#ffffff', '#ff4444', '#4488ff', '#44cc44', '#ffaa00', '#cc44ff']

const BRUSH_ICONS = {
  solid: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18 Q8 6 12 12 Q16 18 21 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  pixel: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="14" width="3" height="3" fill="currentColor"/>
      <rect x="6" y="11" width="3" height="3" fill="currentColor"/>
      <rect x="9" y="8" width="3" height="3" fill="currentColor"/>
      <rect x="12" y="8" width="3" height="3" fill="currentColor"/>
      <rect x="15" y="11" width="3" height="3" fill="currentColor"/>
      <rect x="18" y="5" width="3" height="3" fill="currentColor"/>
    </svg>
  ),
  dashed: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18 Q8 6 12 12 Q16 18 21 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3"/>
    </svg>
  ),
  dotted: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18 Q8 6 12 12 Q16 18 21 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.1 4"/>
    </svg>
  ),
  airbrush: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="7" fill="currentColor" opacity="0.08"/>
      <circle cx="12" cy="12" r="4.5" fill="currentColor" opacity="0.15"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="7" cy="8" r="0.8" fill="currentColor" opacity="0.3"/>
      <circle cx="17" cy="7" r="0.6" fill="currentColor" opacity="0.25"/>
      <circle cx="17" cy="15" r="0.8" fill="currentColor" opacity="0.25"/>
      <circle cx="6" cy="15" r="0.6" fill="currentColor" opacity="0.2"/>
    </svg>
  ),
  watercolor: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="12" rx="9" ry="3.5" fill="currentColor" opacity="0.07"/>
      <ellipse cx="11" cy="11.5" rx="7" ry="2.8" fill="currentColor" opacity="0.1"/>
      <path d="M4,13 C4.5,11 6.5,9.5 9,9 C11.5,8.5 13.5,10 15,11.5 C16.5,13 18.5,13.5 20,12 C20,13.5 18.5,14.5 16.5,14 C14.5,13.5 13,14.5 11,14 C9,13.5 7,14.5 5.5,14 C4.5,13.5 4,13.5 4,13 Z" fill="currentColor" opacity="0.22"/>
      <path d="M4,12.5 C4.5,10.5 7,8.5 10,8 C13,7.5 15.5,9.5 17,11 C18.5,12.5 20,12 20.5,11.5" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.12" strokeLinecap="round"/>
      <path d="M7,8 C7.5,6.5 8.5,6 9,7.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.12" strokeLinecap="round"/>
      <path d="M15,7.5 C16,6 17,6.5 16.5,8" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.1" strokeLinecap="round"/>
    </svg>
  ),
}

const BRUSH_TYPES = ['solid', 'pixel', 'dashed', 'dotted', 'airbrush', 'watercolor']

export default function ToolBrushPanel({ settings, onChange, onBack }) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const isErase = settings.mode === 'erase'

  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        {onBack && (
          <button type="button" className="workspace-back-button" onClick={onBack}>
            <ArrowLeft size={16} />
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
        <label className="panel-label">Type</label>
        <div className="brush-type-row">
          {BRUSH_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`brush-type-btn ${settings.type === t ? 'active' : ''}`}
              onClick={() => onChange({ ...settings, type: t })}
            >
              <span className="brush-type-icon">{BRUSH_ICONS[t]}</span>
              <span className="brush-type-label">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            </button>
          ))}
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
