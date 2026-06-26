import {
  CircleX, Contrast, Palette, Sun, GripVertical, Grid3x3, Droplets,
  FlipHorizontal2, RotateCcw, Move, Maximize2, RotateCw, Crosshair,
  Layers, Columns2, Triangle, Copy, FileWarning, Film, Check, Type, ScanLine, Tv,
} from 'lucide-react'

const ICONS = {
  CircleOff: CircleX,
  Contrast,
  Palette,
  Sun,
  Grip: GripVertical,
  Grid: Grid3x3,
  Droplets,
  FlipHorizontal: FlipHorizontal2,
  RotateCcw,
  Move,
  Maximize: Maximize2,
  RotateCw,
  Target: Crosshair,
  Layers,
  Split: Columns2,
  Triangle,
  Copy,
  FileWarning,
  Film,
  Type,
  ScanLine,
  Tv,
}

export function getDefaultEnabledValue(effect) {
  if (effect.type === 'slider') {
    const mid = effect.min + (effect.max - effect.min) * 0.3
    return Math.round(mid / (effect.step || 1)) * (effect.step || 1)
  }
  if (effect.type === 'select') return effect.options?.[1]?.value || 'h'
  if (effect.type === 'object') {
    if (effect.id === 'spectralMap') {
      return {
        shadowColor: '#ff0000',
        midColor: '#00ff00',
        highlightColor: '#0000ff',
        tahap: 0,
        repeat: 1,
        saturation: 1.0,
        alpha: 1,
      }
    }
    const defaults = {}
    if (effect.params) {
      for (const p of effect.params) {
        defaults[p.key] = p.default
      }
    }
    return defaults
  }
  return true
}

export function getDefaultDisabledValue(effect) {
  if (effect.type === 'toggle') return false
  if (effect.type === 'slider') return effect.default ?? 0
  if (effect.type === 'select') return 'none'
  if (effect.type === 'object') return null
  return false
}

export default function FxEffectCard({ effect, value, onClick }) {
  const Icon = ICONS[effect.icon]
  const isActive = value != null && value !== false && value !== 0 && value !== 'none' && value !== ''

  return (
    <button
      type="button"
      className={`workspace-fx-card ${isActive ? 'is-active' : ''}`}
      onClick={() => onClick(effect.id)}
    >
      {Icon && (
        <span className="workspace-fx-card-icon">
          <Icon size={16} />
        </span>
      )}
      <span className="workspace-fx-card-label">{effect.label}</span>
      <span className="workspace-fx-card-check">
        {isActive && <Check size={14} />}
      </span>
    </button>
  )
}
