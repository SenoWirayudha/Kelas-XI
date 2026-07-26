import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Eye, EyeOff, CircleOff, Contrast, Palette, Sun, Grid3x3, Droplets, FlipHorizontal2, Move, Maximize2, RotateCw, Crosshair, Layers, Columns2, Triangle, Copy, FileWarning, Film, Type, ScanLine, Tv, Waves, Circle } from 'lucide-react'
import { findEffect, toggleEffectInStack, removeEffectFromStack } from '../../utils/effectUtils'

const ICONS = {
  CircleOff, Contrast, Palette, Sun, Grip: GripVertical, Grid: Grid3x3,
  Droplets, FlipHorizontal: FlipHorizontal2, Move, Maximize: Maximize2,
  RotateCw, Target: Crosshair, Layers, Split: Columns2, Triangle, Copy,
  FileWarning, Film, Type, ScanLine, Tv, Wave: Waves, Circle, Feather: Droplets,
}

export default function ActiveEffectRow({ instanceId, item, onUpdate, onSelect }) {
  const entry = item.effects?.[instanceId]
  const effect = entry ? findEffect(entry.effectId) : null
  const value = entry?.value
  const isActive = value != null && value !== false && value !== 0 && value !== 'none' && value !== ''

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: instanceId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  if (!effect || !entry) return null

  const Icon = ICONS[effect.icon]

  const handleToggle = () => {
    const patch = toggleEffectInStack(item, instanceId)
    if (patch) onUpdate(item.id, patch)
  }

  const handleDelete = () => {
    const patch = removeEffectFromStack(item, instanceId)
    if (patch) onUpdate(item.id, patch)
  }

  const handleRowClick = (e) => {
    if (e.defaultPrevented) return
    onSelect(instanceId)
  }

  return (
    <div ref={setNodeRef} style={style} className={`active-effect-row ${isDragging ? 'is-dragging' : ''}`}>
      <div className="active-effect-row-main" onClick={handleRowClick}>
        <button type="button" className="active-effect-row-drag" {...attributes} {...listeners} aria-label="Reorder effect" onClick={(e) => e.stopPropagation()}>
          <GripVertical size={14} />
        </button>
        <span className="active-effect-row-icon">
          {Icon ? <Icon size={16} /> : <Circle size={16} />}
        </span>
        <span className="active-effect-row-label">{effect.label}</span>
        <button type="button" className="active-effect-row-vis-toggle" onClick={(e) => { e.stopPropagation(); handleToggle() }} aria-label={isActive ? 'Nonaktifkan efek' : 'Aktifkan efek'}>
          {isActive ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button type="button" className="active-effect-row-delete" onClick={(e) => { e.stopPropagation(); handleDelete() }} aria-label="Remove effect">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
