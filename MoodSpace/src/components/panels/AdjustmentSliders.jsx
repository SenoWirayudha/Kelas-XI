import { useState } from 'react'
import { ADJUSTMENT_CONTROLS, ADJUSTMENT_PRESETS, RESET_VALUES } from '../../utils/adjustmentLayerUtils'
import { BLEND_MODES } from '../../constants/uiConstants'

const hueGradientStyle = (value) => ({
  '--hue-track': `linear-gradient(to right,
    hsl(${value + 180}, 100%, 50%),
    hsl(${value + 270}, 100%, 50%),
    hsl(${value + 360}, 100%, 50%),
    hsl(${value + 450}, 100%, 50%),
    hsl(${value + 540}, 100%, 50%)
  )`,
})

export default function AdjustmentSliders({ item, onChange }) {
  const [editingSliderKey, setEditingSliderKey] = useState(null)
  const [isBlendModeOpen, setIsBlendModeOpen] = useState(false)

  const getValue = (key) => item[key] ?? 0
  const activeBlendMode = item.blendMode || 'source-over'
  const activeBlendModeLabel = BLEND_MODES.find((mode) => mode.value === activeBlendMode)?.label || 'Normal'
  const opacityValue = Math.round((item.opacity ?? 1) * 100)

  return (
    <div className="workspace-adjustment-content">
      <div className="workspace-filter-row">
        {ADJUSTMENT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(item.id, preset.values)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <label className="workspace-typography-field workspace-typography-field-full workspace-adjustment-blend-control">
        Blend Mode
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="workspace-font-picker-trigger"
            onClick={() => setIsBlendModeOpen((current) => !current)}
          >
            {activeBlendModeLabel}
          </button>
          {isBlendModeOpen && (
            <div className="workspace-blend-mode-dropdown">
              {BLEND_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={`workspace-blend-mode-item ${activeBlendMode === mode.value ? 'active' : ''}`}
                  onClick={() => {
                    onChange(item.id, { blendMode: mode.value === 'source-over' ? undefined : mode.value })
                    setIsBlendModeOpen(false)
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>
            Opacity
          </span>
          <span style={{ fontSize: '11px', color: '#c4bfd4', minWidth: '36px', textAlign: 'right' }}>
            {opacityValue}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={opacityValue}
          onChange={(event) => onChange(item.id, { opacity: Number(event.target.value) / 100 })}
        />
      </label>
      <div className="workspace-slider-list">
        {ADJUSTMENT_CONTROLS.map((control) => (
          <label key={control.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>
                {control.label}
              </span>
              {editingSliderKey === control.key ? (
                <input
                  type="number"
                  defaultValue={getValue(control.key)}
                  min={control.min}
                  max={control.max}
                  autoFocus
                  style={{ width: '52px', fontSize: '11px', textAlign: 'right', padding: '1px 4px', border: '1px solid #7c6df2', borderRadius: '4px', background: '#1a1721', color: '#c4bfd4', outline: 'none' }}
                  onBlur={(e) => {
                    const val = Math.max(control.min, Math.min(control.max, Number(e.target.value)))
                    onChange(item.id, { [control.key]: val })
                    setEditingSliderKey(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') setEditingSliderKey(null)
                  }}
                />
              ) : (
                <span
                  style={{ fontSize: '11px', color: '#c4bfd4', minWidth: '36px', textAlign: 'right', cursor: 'text' }}
                  onDoubleClick={() => setEditingSliderKey(control.key)}
                >
                  {getValue(control.key)}{control.unit}
                </span>
              )}
            </div>
            <input
              type="range"
              min={control.min}
              max={control.max}
              value={getValue(control.key)}
              className={control.key === 'temperature' ? 'slider-temperature' : control.key === 'hue' ? 'slider-hue' : ''}
              style={control.key === 'hue' ? hueGradientStyle(getValue('hue')) : {}}
              onChange={(event) => onChange(item.id, { [control.key]: Number(event.target.value) })}
            />
          </label>
        ))}
        <button
          type="button"
          className="workspace-reset-adjustments"
          onClick={() => onChange(item.id, RESET_VALUES)}
        >
          Reset adjustments
        </button>
      </div>
    </div>
  )
}
