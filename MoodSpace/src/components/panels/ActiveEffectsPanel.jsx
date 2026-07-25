import { useState, useMemo, useCallback } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowLeft, Plus, Sparkles } from 'lucide-react'
import { getEffectOrder, reorderEffectStack, findEffect, getDefaultEnabledValue, addEffectToStack, toggleEffectInStack } from '../../utils/effectUtils'
import { FxEffectDetail } from './FxPanel'
import EffectLibraryModal from './EffectLibraryModal'
import ActiveEffectRow from './ActiveEffectRow'

export default function ActiveEffectsPanel({ item, onBack, onUpdate }) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [selectedEffectId, setSelectedEffectId] = useState(null)
  const effects = item.effects || {}
  const effectOrder = useMemo(() => getEffectOrder(item), [item.effectOrder, item.effects])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = effectOrder.indexOf(active.id)
    const newIndex = effectOrder.indexOf(over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const patch = reorderEffectStack(item, oldIndex, newIndex)
    if (patch) onUpdate(item.id, patch)
  }

  const handleAddEffect = (effectId) => {
    const patch = addEffectToStack(item, effectId)
    if (patch) onUpdate(item.id, patch)
  }

  const handleChange = useCallback((id, val, skipBroadcast) => {
    onUpdate(item.id, { effects: { ...item.effects, [id]: val } }, skipBroadcast)
  }, [item.id, item.effects, onUpdate])

  const handleToggle = useCallback((id) => {
    const patch = toggleEffectInStack(item, id)
    if (patch) onUpdate(item.id, patch)
  }, [item, onUpdate])

  // Detail panel when an effect is selected
  if (selectedEffectId) {
    const effect = findEffect(selectedEffectId)
    const value = effects[selectedEffectId]
    if (!effect) {
      setSelectedEffectId(null)
      return null
    }
    return (
      <div className="active-effects-panel">
        <FxEffectDetail
          effect={effect}
          value={value}
          onBack={() => setSelectedEffectId(null)}
          onChange={handleChange}
          onToggle={handleToggle}
          imageDominantColors={item?.dominantColors}
          imageSrc={item?.src}
        />
      </div>
    )
  }

  return (
    <div className="active-effects-panel">
      <div className="workspace-font-picker-header">
        <button type="button" className="workspace-back-button" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div className="workspace-color-picker-title">Effects</div>
      </div>

      <div className="active-effects-list">
        {effectOrder.length === 0 ? (
          <div className="active-effects-empty">
            <Sparkles size={32} />
            <p>Belum ada efek</p>
            <button type="button" className="workspace-button" onClick={() => setLibraryOpen(true)}>
              <Plus size={14} /> Tambah Efek
            </button>
          </div>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={effectOrder} strategy={verticalListSortingStrategy}>
                {effectOrder.map((effectId) => (
                  <ActiveEffectRow key={effectId} effectId={effectId} item={item} onUpdate={onUpdate} onSelect={setSelectedEffectId} />
                ))}
              </SortableContext>
            </DndContext>
            <div className="active-effects-footer">
              <button type="button" className="workspace-button" onClick={() => setLibraryOpen(true)}>
                <Plus size={14} /> Tambah Efek
              </button>
            </div>
          </>
        )}
      </div>

      {libraryOpen && (
        <EffectLibraryModal
          item={item}
          effects={effects}
          effectOrder={effectOrder}
          onAdd={handleAddEffect}
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </div>
  )
}
