import { createPortal } from 'react-dom'
import { useState, useMemo } from 'react'
import { Palette, Sparkles, Droplets, Move, Layers, Type as TypeIcon, X, Search } from 'lucide-react'
import { EFFECT_CATEGORIES, EFFECTS, ADJUSTMENT_RESTRICTED_EFFECTS, getEffectInstances } from '../../utils/effectUtils'
import FxEffectCard from './FxEffectCard'

const CATEGORY_ICONS = {
  Palette, Sparkles, Droplets, Move, Layers, Type: TypeIcon,
}

const ALL_TAB = { id: null, label: 'All', icon: null }

const CATEGORY_TABS = [ALL_TAB, ...EFFECT_CATEGORIES]

function getFilteredEffects(item) {
  return EFFECTS.filter((e) => {
    if (item?.isAdjustmentLayer && ADJUSTMENT_RESTRICTED_EFFECTS.has(e.id)) return false
    if (item?.kind !== 'text' && e.category === 'text') return false
    if (item?.kind !== 'image' && e.id === 'solid') return false
    return true
  })
}

export default function EffectLibraryModal({ item, effects, effectOrder, onAdd, onClose }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const q = search.trim().toLowerCase()

  const instanceCounts = useMemo(() => {
    const counts = {}
    const instances = getEffectInstances(item)
    for (const inst of instances) {
      counts[inst.effectId] = (counts[inst.effectId] || 0) + 1
    }
    return counts
  }, [item])

  const availableEffects = useMemo(() => getFilteredEffects(item), [item])

  const searchedEffects = useMemo(() => {
    if (!q) return null
    return availableEffects.filter((e) => e.label.toLowerCase().includes(q))
  }, [q, availableEffects])

  const filteredByCategory = useMemo(() => {
    if (!selectedCategory) return null
    return availableEffects.filter((e) => e.category === selectedCategory)
  }, [selectedCategory, availableEffects])

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
        <div className="effect-library-categories">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id ?? '__all__'}
              type="button"
              className={`effect-library-cat-tab${selectedCategory === tab.id ? ' is-active' : ''}`}
              onClick={() => setSelectedCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="effect-library-content">
          {q || selectedCategory ? (
            (() => {
              const items = q ? (searchedEffects || []) : (filteredByCategory || [])
              if (q && selectedCategory) {
                return availableEffects.filter((e) =>
                  e.label.toLowerCase().includes(q) && e.category === selectedCategory
                )
              }
              return items
            })().length === 0 ? (
              <div className="effect-library-empty">
                <Search size={24} />
                <span>Efek tidak ditemukan</span>
              </div>
            ) : (
              <div className="effect-library-grid">
                {(q && selectedCategory
                  ? availableEffects.filter((e) => e.label.toLowerCase().includes(q) && e.category === selectedCategory)
                  : q
                  ? searchedEffects
                  : filteredByCategory
                ).map((effect) => (
                  <FxEffectCard
                    key={effect.id}
                    effect={effect}
                    onClick={() => onAdd(effect.id)}
                    showPreview
                    count={instanceCounts[effect.id] || 0}
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
                        onClick={() => onAdd(effect.id)}
                        showPreview
                        count={instanceCounts[effect.id] || 0}
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
