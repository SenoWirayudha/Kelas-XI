import { useState, useRef } from 'react'
import { ArrowLeft, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

const CHANNELS = [
  { key: 'reds', label: 'Reds', color: '#ff2d2d' },
  { key: 'yellows', label: 'Yellows', color: '#ffd700' },
  { key: 'greens', label: 'Greens', color: '#2dff2d' },
  { key: 'cyans', label: 'Cyans', color: '#2de0e0' },
  { key: 'blues', label: 'Blues', color: '#4d4dff' },
  { key: 'magentas', label: 'Magentas', color: '#e02de0' },
]

const SLIDER_PROPS = [
  { key: 'hue', label: 'Hue', min: -180, max: 180, unit: '°' },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, unit: '%' },
  { key: 'lightness', label: 'Lightness', min: -100, max: 100, unit: '%' },
]

const DEFAULT_CHANNEL_CFG = {
  reds: { rangeStart: 345, rangeEnd: 15, feather: 15 },
  yellows: { rangeStart: 15, rangeEnd: 75, feather: 15 },
  greens: { rangeStart: 75, rangeEnd: 165, feather: 15 },
  cyans: { rangeStart: 165, rangeEnd: 225, feather: 15 },
  blues: { rangeStart: 225, rangeEnd: 285, feather: 15 },
  magentas: { rangeStart: 285, rangeEnd: 345, feather: 15 },
}

export default function HslPanel({ item, onChange, onCommit, onBack }) {
  const [activeChannel, setActiveChannel] = useState('reds')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const sliderStartRef = useRef({})

  const hsl = item.hsl ?? {}

  const getChannel = (key) => {
    const def = DEFAULT_CHANNEL_CFG[key] ?? {}
    return { hue: 0, saturation: 0, lightness: 0, ...def, ...(hsl[key] ?? {}) }
  }

  const buildPatch = (field, val) => {
    const cur = getChannel(activeChannel)
    const patch = { ...cur, [field]: val }
    return { hsl: { ...hsl, [activeChannel]: patch } }
  }

  const handleReset = () => onCommit(item.id, { hsl: null })

  return (
    <div className="workspace-fx-panel">
      <div className="workspace-font-picker-header">
        <button type="button" className="workspace-back-button" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div className="workspace-color-picker-title">HSL</div>
        <button type="button" onClick={handleReset} style={{ background: 'transparent', border: 'none', color: '#a09ca6', cursor: 'pointer', padding: '4px' }}>
          <RotateCcw size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px', padding: '8px 0', justifyContent: 'center' }}>
        {CHANNELS.map((ch) => {
          const isActive = activeChannel === ch.key
          return (
            <button
              key={ch.key}
              type="button"
              onClick={() => setActiveChannel(ch.key)}
              title={ch.label}
              style={{
                width: isActive ? '22px' : '18px',
                height: isActive ? '22px' : '18px',
                borderRadius: '50%',
                border: 'none',
                background: ch.color,
                cursor: 'pointer',
                padding: 0,
                opacity: isActive ? 1 : 0.6,
                boxShadow: isActive ? `0 0 0 2.5px #fff` : 'none',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            />
          )
        })}
      </div>

      <div className="workspace-slider-list">
        {SLIDER_PROPS.map((prop) => {
          const val = getChannel(activeChannel)[prop.key] ?? 0
          return (
            <label key={prop.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>
                  {prop.label}
                </span>
                <span style={{ fontSize: '11px', color: '#c4bfd4', minWidth: '36px', textAlign: 'right' }}>
                  {val}{prop.unit}
                </span>
              </div>
              <input
                type="range"
                min={prop.min}
                max={prop.max}
                value={val}
                onChange={(event) => {
                  const v = Number(event.target.value)
                  onChange(item.id, buildPatch(prop.key, v))
                }}
                onMouseDown={() => { sliderStartRef.current[prop.key] = val }}
                onPointerUp={(event) => {
                  const v = Number(event.target.value)
                  if (v !== sliderStartRef.current[prop.key]) {
                    onCommit(item.id, buildPatch(prop.key, v))
                    sliderStartRef.current[prop.key] = v
                  }
                }}
                onKeyUp={(event) => {
                  const v = Number(event.target.value)
                  if (v !== sliderStartRef.current[prop.key]) {
                    onCommit(item.id, buildPatch(prop.key, v))
                    sliderStartRef.current[prop.key] = v
                  }
                }}
              />
            </label>
          )
        })}

        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px',
            color: '#7c6df2', background: 'transparent', border: 'none',
            cursor: 'pointer', padding: '8px 0', marginTop: '4px',
          }}
        >
          {isAdvancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Advanced
        </button>
        {isAdvancedOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', background: '#1a1721', borderRadius: '8px' }}>
            {['rangeStart', 'rangeEnd', 'feather'].map((field) => {
              const fval = getChannel(activeChannel)[field] ?? (field === 'feather' ? 15 : 0)
              return (
                <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: '#a09ca6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{field === 'rangeStart' ? 'Range Start' : field === 'rangeEnd' ? 'Range End' : 'Feather'}</span>
                    <span style={{ color: '#c4bfd4' }}>{fval}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={fval}
                    onChange={(event) => {
                      onChange(item.id, buildPatch(field, Number(event.target.value)))
                    }}
                    onPointerUp={(event) => {
                      onCommit(item.id, buildPatch(field, Number(event.target.value)))
                    }}
                  />
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
