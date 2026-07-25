import { createPortal } from 'react-dom'
import { useState, useMemo } from 'react'
import { Palette, Sparkles, Droplets, Move, Layers, Type as TypeIcon, X, Search } from 'lucide-react'
import { EFFECT_CATEGORIES, EFFECTS, ADJUSTMENT_RESTRICTED_EFFECTS } from '../../utils/effectUtils'
import FxEffectCard from './FxEffectCard'

const CATEGORY_ICONS = {
  Palette, Sparkles, Droplets, Move, Layers, Type: TypeIcon,
}

function getFilteredEffects(item) {
  return EFFECTS.filter((e) => {
    if (item?.isAdjustmentLayer && ADJUSTMENT_RESTRICTED_EFFECTS.has(e.id)) return false
    if (item?.kind !== 'text' && e.category === 'text') return false
    if (item?.kind !== 'image' && e.id === 'solid') return false
    return true
  })
}

export default function EffectLibraryModal({ item, effects, effectOrder, onAdd, onClose }) {
  const inStack = new Set(effectOrder || [])
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()

  const availableEffects = useMemo(() => getFilteredEffects(item), [item])

  const filtered = useMemo(() => {
    if (!q) return null
    return availableEffects.filter((e) => e.label.toLowerCase().includes(q))
  }, [q, availableEffects])

  return createPortal(
    <div className="effect-library-backdrop" onClick={onClose}>
      <div className="effect-library-modal" onClick={(e) => e.stopPropagation()}>
        <div className="effect-library-header">
          <div className="effect-library-title">Tambah Efek</div>
          <button type="button" className="effect-library-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="effect-library-search">
          <input
            className="effect-library-search-input"
            type="text"
            placeholder="Cari efek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="effect-library-content">
          {filtered !== null ? (
            filtered.length === 0 ? (
              <div className="effect-library-empty">
                <Search size={24} />
                <span>Efek tidak ditemukan</span>
              </div>
            ) : (
              <div className="effect-library-grid">
                {filtered.map((effect) => (
                  <FxEffectCard
                    key={effect.id}
                    effect={effect}
                    value={inStack.has(effect.id) ? (effects?.[effect.id] ?? null) : undefined}
                    onClick={() => onAdd(effect.id)}
                    showPreview
                  />
                ))}
              </div>
            )
          ) : (
            EFFECT_CATEGORIES.map((cat) => {
              const categoryEffects = availableEffects.filter((e) => e.category === cat.id)
              if (categoryEffects.length === 0) return null
              const CategoryIcon = CATEGORY_ICONS[cat.icon]
              return (
                <div key={cat.id} className="effect-library-section">
                  <div className="effect-library-section-title">
                    {CategoryIcon && <CategoryIcon size={12} style={{ marginRight: 4 }} />}
                    {cat.label}
                  </div>
                  <div className="effect-library-grid">
                    {categoryEffects.map((effect) => (
                      <FxEffectCard
                        key={effect.id}
                        effect={effect}
                        value={inStack.has(effect.id) ? (effects?.[effect.id] ?? null) : undefined}
                        onClick={() => onAdd(effect.id)}
                        showPreview
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
