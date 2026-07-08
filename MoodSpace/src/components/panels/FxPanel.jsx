import { useState, useRef, useLayoutEffect } from 'react'
import { ArrowLeft, Palette, Sparkles, Droplets, Move, Layers, Type, RotateCcw, Plus, Minus } from 'lucide-react'
import { EFFECT_CATEGORIES, EFFECTS, EFFECT_PARAM_DEFAULTS, hasAnyEffect, ADJUSTMENT_RESTRICTED_EFFECTS } from '../../utils/effectUtils'
import FxEffectCard from './FxEffectCard'
import { getDefaultEnabledValue, getDefaultDisabledValue } from './FxEffectCard'

const CATEGORY_ICONS = {
  Palette,
  Sparkles,
  Droplets,
  Move,
  Layers,
  Type,
}

const COLOR_PRESETS = ['#2b2830', '#ffffff', '#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

const EFFECT_COLOR_SUGGESTIONS = {
  chromaKey: ['#00ff00', '#008000', '#0000ff', '#00bfff', '#a8ffa8', '#00cc00'],
  spotColor: ['#ff0000', '#ff6b35', '#ffd700', '#00ff00', '#0000ff', '#ff69b4'],
  replaceColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
}

function FxEffectDetail({ effect, value, onBack, onChange, onToggle, imageDominantColors, imageSrc }) {
  const isActive = value != null && value !== false && value !== 0 && value !== 'none' && value !== ''
  const params = effect.params
  const pickerStateRef = useRef(null)
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef(null)
  const isColorEffect = ['chromaKey', 'spotColor', 'replaceColor'].includes(effect.id)
  const updateParam = (key, paramVal) => {
    if (pickerStateRef.current) {
      pickerStateRef.current = { ...pickerStateRef.current, [key]: paramVal }
      onChange(effect.id, pickerStateRef.current)
    } else {
      const next = { ...(value || {}), [key]: paramVal }
      onChange(effect.id, next)
    }
  }

  const startEditing = (key, currentVal, param) => {
    setEditingKey(key)
    setEditValue(String(currentVal))
    requestAnimationFrame(() => {
      if (editInputRef.current) {
        editInputRef.current.focus()
        editInputRef.current.select()
      }
    })
  }

  const commitEdit = (param) => {
    if (editingKey == null) return
    const min = param.min ?? 0
    const max = param.max ?? 100
    const raw = Number(editValue)
    const clamped = isNaN(raw) ? param.default : Math.min(Math.max(raw, min), max)
    updateParam(editingKey, clamped)
    setEditingKey(null)
  }

  return (
    <>
      <div className="workspace-font-picker-header">
        <button type="button" className="workspace-back-button" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div className="workspace-color-picker-title">{effect.label}</div>
        <button
          type="button"
          className={`workspace-fx-detail-toggle ${isActive ? 'is-active' : ''}`}
          onClick={() => onToggle(effect.id, !isActive)}
        >
          {isActive ? 'Matikan' : 'Aktifkan'}
        </button>
      </div>
      <div className="workspace-fx-detail-content">
        {isColorEffect && imageSrc && Array.isArray(imageDominantColors) && imageDominantColors.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
              <img src={imageSrc} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="workspace-fx-color-presets" style={{ marginTop: 0, flex: 1 }}>
              {imageDominantColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="workspace-fx-color-preset"
                  style={{ background: c }}
                  onClick={() => {
                    const targetKey = effect.id === 'chromaKey' ? 'keyColor' : effect.id === 'spotColor' ? 'color' : 'fromColor'
                    updateParam(targetKey, c)
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {effect.type === 'toggle' && (
          <label className="workspace-fx-detail-switch">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(effect.id, e.target.checked)}
            />
            <span className="toggle-track" />
            <span>{effect.label}</span>
          </label>
        )}

        {effect.type === 'slider' && (
          <div className="workspace-fx-detail-slider">
            <div className="workspace-fx-slider-header">
              {editingKey === '_simple' ? (
                <input
                  ref={editInputRef}
                  type="text"
                  className="workspace-fx-param-edit-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const raw = Number(editValue)
                      const clamped = isNaN(raw) ? (typeof value === 'number' ? value : effect.default) : Math.min(Math.max(raw, effect.min ?? 0), effect.max ?? 100)
                      onChange(effect.id, clamped)
                      setEditingKey(null)
                    }
                    if (e.key === 'Escape') setEditingKey(null)
                  }}
                  onBlur={() => {
                    const raw = Number(editValue)
                    const clamped = isNaN(raw) ? (typeof value === 'number' ? value : effect.default) : Math.min(Math.max(raw, effect.min ?? 0), effect.max ?? 100)
                    onChange(effect.id, clamped)
                    setEditingKey(null)
                  }}
                />
              ) : (
                <span
                  className="workspace-fx-slider-value"
                  onDoubleClick={() => {
                    setEditingKey('_simple')
                    setEditValue(String(typeof value === 'number' ? value : effect.default))
                    requestAnimationFrame(() => {
                      if (editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select() }
                    })
                  }}
                >
                  {typeof value === 'number' ? value : effect.default}{effect.unit || ''}
                </span>
              )}
            </div>
            <input
              type="range"
              min={effect.min ?? 0}
              max={effect.max ?? 100}
              step={effect.step ?? 1}
              value={typeof value === 'number' ? value : effect.default}
              onChange={(e) => onChange(effect.id, Number(e.target.value))}
            />
            <div className="workspace-fx-detail-range-labels">
              <span>{effect.min ?? 0}</span>
              <span>{effect.max ?? 100}</span>
            </div>
          </div>
        )}

        {effect.type === 'select' && (
          <div className="workspace-fx-detail-select">
            <div className="workspace-fx-detail-label">Mode</div>
            {effect.options?.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`workspace-fx-select-option ${value === opt.value ? 'active' : ''}`}
                onClick={() => onChange(effect.id, opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {effect.type === 'object' && params && effect.id === 'risograph' && <>
              <div className="workspace-fx-tabs">
                <button
                  type="button"
                  className={`workspace-fx-tab ${(value||{}).mode !== 'texture' ? 'is-active' : ''}`}
                  onClick={() => updateParam('mode', 'threshold')}
                >
                  Threshold
                </button>
                <button
                  type="button"
                  className={`workspace-fx-tab ${(value||{}).mode === 'texture' ? 'is-active' : ''}`}
                  onClick={() => updateParam('mode', 'texture')}
                >
                  Texture
                </button>
              </div>
              <div className="workspace-fx-detail-params">
                {params
                  .filter((param) => {
                    const currentMode = (value||{}).mode ?? 'threshold'
                    if (currentMode === 'threshold') return ['color1', 'paper', 'threshold', 'grain'].includes(param.key)
                    return ['density', 'misalignment'].includes(param.key)
                  })
                  .map((param) => {
                    const paramVal = (value || {})[param.key] ?? param.default

                    if (param.type === 'toggle') {
                      return (
                        <label key={param.key} className="workspace-fx-param-toggle">
                          <span>{param.label}</span>
                          <input
                            type="checkbox"
                            checked={!!paramVal}
                            onChange={(e) => updateParam(param.key, e.target.checked)}
                          />
                          <span className="toggle-track" />
                        </label>
                      )
                    }

                    if (param.type === 'color') {
                      return (
                        <div key={param.key} className="workspace-fx-param-color">
                          <div className="workspace-fx-detail-label">{param.label}</div>
                          <div className="workspace-fx-color-row">
                            <div className="workspace-fx-color-swatch-wrapper">
                              <input
                                type="color"
                                value={paramVal}
                                onChange={(e) => updateParam(param.key, e.target.value)}
                              />
                              <div className="workspace-fx-color-swatch-overlay" style={{ background: paramVal }} />
                            </div>
                            <input
                              type="text"
                              className="workspace-fx-color-hex-input"
                              value={paramVal}
                              onChange={(e) => updateParam(param.key, e.target.value)}
                            />
                          </div>
                          <div className="workspace-fx-color-presets">
                            {[...new Set([
                              ...(imageDominantColors || []),
                              ...(EFFECT_COLOR_SUGGESTIONS[effect.id] || []),
                              ...COLOR_PRESETS,
                            ])].map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={`workspace-fx-color-preset ${c === paramVal ? 'is-selected' : ''}`}
                                style={{ background: c }}
                                onClick={() => updateParam(param.key, c)}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    }

                    const isEditing = editingKey === param.key
                    return (
                      <div key={param.key} className="workspace-fx-param-slider">
                        <div className="workspace-fx-param-slider-header">
                          <span className="workspace-fx-detail-label">{param.label}</span>
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              className="workspace-fx-param-edit-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit(param)
                                if (e.key === 'Escape') setEditingKey(null)
                              }}
                              onBlur={() => commitEdit(param)}
                            />
                          ) : (
                            <span
                              className="workspace-fx-param-value"
                              onDoubleClick={() => startEditing(param.key, paramVal, param)}
                            >
                              {paramVal}{param.unit || ''}
                            </span>
                          )}
                        </div>
                        <input
                          type="range"
                          min={param.min ?? 0}
                          max={param.max ?? 100}
                          step={param.step ?? 1}
                          value={paramVal}
                          onChange={(e) => updateParam(param.key, Number(e.target.value))}
                        />
                      </div>
                    )
                  })}
              </div>
            </>
        }
        {effect.type === 'object' && params && effect.id !== 'risograph' && (
          <div className="workspace-fx-detail-params">
            {params.map((param) => {
              const paramVal = (value || {})[param.key] ?? param.default

              if (param.type === 'toggle') {
                return (
                  <label key={param.key} className="workspace-fx-param-toggle">
                    <span>{param.label}</span>
                    <input
                      type="checkbox"
                      checked={!!paramVal}
                      onChange={(e) => updateParam(param.key, e.target.checked)}
                    />
                    <span className="toggle-track" />
                  </label>
                )
              }

              if (param.type === 'select') {
                return (
                  <div key={param.key} className="workspace-fx-detail-select">
                    <div className="workspace-fx-detail-label">{param.label}</div>
                    <div className="workspace-fx-select">
                      {param.options?.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`workspace-fx-select-option ${paramVal === opt.value ? 'active' : ''}`}
                          onClick={() => updateParam(param.key, opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              }

              if (param.type === 'color') {
                const handleColorFocus = () => {
                  if (value && typeof value === 'object') {
                    pickerStateRef.current = { ...value }
                    onChange(effect.id, null)
                  }
                }
                const handleColorBlur = () => {
                  if (pickerStateRef.current) {
                    onChange(effect.id, pickerStateRef.current)
                    pickerStateRef.current = null
                  }
                }
                return (
                  <div key={param.key} className="workspace-fx-param-color">
                    <div className="workspace-fx-detail-label">{param.label}</div>
                    <div className="workspace-fx-color-row">
                      <div className="workspace-fx-color-swatch-wrapper">
                        <input
                          type="color"
                          value={paramVal}
                          onFocus={handleColorFocus}
                          onBlur={handleColorBlur}
                          onChange={(e) => updateParam(param.key, e.target.value)}
                        />
                        <div className="workspace-fx-color-swatch-overlay" style={{ background: paramVal }} />
                      </div>
                      <input
                        type="text"
                        className="workspace-fx-color-hex-input"
                        value={paramVal}
                        onChange={(e) => updateParam(param.key, e.target.value)}
                      />
                    </div>
                    <div className="workspace-fx-color-presets">
                      {[...new Set([
                        ...(imageDominantColors || []),
                        ...(EFFECT_COLOR_SUGGESTIONS[effect.id] || []),
                        ...COLOR_PRESETS,
                      ])].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`workspace-fx-color-preset ${c === paramVal ? 'is-selected' : ''}`}
                          style={{ background: c }}
                          onClick={() => updateParam(param.key, c)}
                        />
                      ))}
                    </div>
                  </div>
                )
              }

              if (param.type === 'gradient') {
                const colors = Array.isArray(paramVal) ? paramVal : param.default
                return (
                  <div key={param.key} className="workspace-fx-param-gradient">
                    <div className="workspace-fx-detail-label">{param.label}</div>
                    <div className="workspace-fx-gradient-stops">
                      {colors.map((c, i) => (
                        <div key={i} className="workspace-fx-gradient-stop-row">
                          <div className="workspace-fx-color-swatch-wrapper workspace-fx-gradient-swatch">
                            <input
                              type="color"
                              value={c}
                              onChange={(e) => {
                                const next = [...colors]
                                next[i] = e.target.value
                                updateParam(param.key, next)
                              }}
                            />
                            <div className="workspace-fx-color-swatch-overlay" style={{ background: c }} />
                          </div>
                          {colors.length > 2 && (
                            <button
                              type="button"
                              className="workspace-fx-gradient-stop-remove"
                              onClick={() => {
                                const next = colors.filter((_, idx) => idx !== i)
                                updateParam(param.key, next)
                              }}
                            >
                              <Minus size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="workspace-fx-color-row">
                      <div className="workspace-fx-color-presets">
                        {COLOR_PRESETS.slice(0, 6).map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="workspace-fx-color-preset"
                            style={{ background: c }}
                            onClick={() => {
                              const next = [...colors]
                              next[colors.length - 1] = c
                              updateParam(param.key, next)
                            }}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        className="workspace-fx-gradient-add"
                        onClick={() => {
                          const next = [...colors, '#ffffff']
                          updateParam(param.key, next)
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                )
              }

              if (param.type === 'stops') {
                const stopVals = Array.isArray(paramVal) ? paramVal : [0, 1]
                return (
                  <div key={param.key} className="workspace-fx-param-stops">
                    <div className="workspace-fx-detail-label">{param.label}</div>
                    {stopVals.map((stop, i) => (
                      <div key={i} className="workspace-fx-param-slider">
                        <div className="workspace-fx-param-slider-header">
                          <span>Stop {i + 1}</span>
                          <span className="workspace-fx-param-value">{stop.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={stop}
                          onChange={(e) => {
                            const next = [...stopVals]
                            next[i] = Number(e.target.value)
                            updateParam(param.key, next)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )
              }

              // default: slider
              const isEditing = editingKey === param.key
              return (
                <div key={param.key} className="workspace-fx-param-slider">
                  <div className="workspace-fx-param-slider-header">
                    <span className="workspace-fx-detail-label">{param.label}</span>
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        className="workspace-fx-param-edit-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(param)
                          if (e.key === 'Escape') setEditingKey(null)
                        }}
                        onBlur={() => commitEdit(param)}
                      />
                    ) : (
                      <span
                        className="workspace-fx-param-value"
                        onDoubleClick={() => startEditing(param.key, paramVal, param)}
                      >
                        {paramVal}{param.unit || ''}
                      </span>
                    )}
                  </div>
                  <input
                    type="range"
                    min={param.min ?? 0}
                    max={param.max ?? 100}
                    step={param.step ?? 1}
                    value={paramVal}
                    onChange={(e) => updateParam(param.key, Number(e.target.value))}
                  />
                </div>
              )
            })}
            </div>
        )}
      </div>
    </>
  )
}

export default function FxPanel({ item, onBack, onUpdate }) {
  if (!item) return null
  const [selectedEffect, setSelectedEffect] = useState(null)
  const scrollPosRef = useRef(null)
  const panelRef = useRef(null)
  const effects = item.effects || {}
  const hasActiveEffect = hasAnyEffect(item)

  const getScrollParent = () =>
    panelRef.current?.closest('.workspace-panel-scroll')

  const saveScrollPos = () => {
    const el = getScrollParent()
    if (el) scrollPosRef.current = el.scrollTop
  }

  const restoreScrollPos = () => {
    const el = getScrollParent()
    if (el && scrollPosRef.current != null) {
      el.scrollTop = scrollPosRef.current
      scrollPosRef.current = null
    }
  }

  useLayoutEffect(() => {
    if (!selectedEffect) restoreScrollPos()
  }, [selectedEffect])

  const handleEffectChange = (effectId, value) => {
    onUpdate(item.id, {
      effects: { ...effects, [effectId]: value },
    })
  }

  const handleToggle = (effectId, enabled) => {
    const effect = EFFECTS.find((e) => e.id === effectId)
    if (!effect) return
    handleEffectChange(effectId, enabled
      ? getDefaultEnabledValue(effect)
      : getDefaultDisabledValue(effect))
  }

  const handleClearAll = () => {
    const defaults = {}
    for (const effect of EFFECTS) defaults[effect.id] = effect.default
    onUpdate(item.id, { effects: defaults })
  }

  const openDetail = (id) => {
    saveScrollPos()
    setSelectedEffect(id)
  }

  const closeDetail = () => {
    setSelectedEffect(null)
  }

  if (selectedEffect) {
    const effect = EFFECTS.find((e) => e.id === selectedEffect)
    if (!effect) {
      closeDetail()
      return null
    }
    return (
      <FxEffectDetail
        effect={effect}
        value={effects[effect.id]}
        onBack={closeDetail}
        onChange={handleEffectChange}
        onToggle={handleToggle}
        imageDominantColors={item?.dominantColors}
        imageSrc={item?.src}
      />
    )
  }

  return (
    <div ref={panelRef}>
      <div className="workspace-font-picker-header">
        <button type="button" className="workspace-back-button" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div className="workspace-color-picker-title">Effects</div>
        {hasActiveEffect && (
          <button
            type="button"
            className="workspace-fx-clear-btn"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        )}
      </div>
      <div className="workspace-fx-content">
        {EFFECT_CATEGORIES.map((cat) => {
          const categoryEffects = EFFECTS.filter((e) => e.category === cat.id)
            .filter((e) => !(item.isAdjustmentLayer && ADJUSTMENT_RESTRICTED_EFFECTS.has(e.id)))
            .filter((e) => !(item.kind !== 'text' && e.category === 'text'))
          const CategoryIcon = CATEGORY_ICONS[cat.icon]
          return (
            <div key={cat.id} className="workspace-section-card" style={{ marginBottom: '10px' }}>
              <div className="workspace-section-title">
                {CategoryIcon && <CategoryIcon size={12} style={{ marginRight: 4 }} />}
                {cat.label}
              </div>
              <div className="workspace-fx-list">
                {categoryEffects.map((effect) => (
                  <FxEffectCard
                    key={effect.id}
                    effect={effect}
                    value={effects[effect.id]}
                    onClick={(id) => openDetail(id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
