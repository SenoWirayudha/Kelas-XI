import { useState } from 'react'
import {
  CircleX, Contrast, Palette, Sun, GripVertical, Grid3x3, Droplets,
  FlipHorizontal2, RotateCcw, Move, Maximize2, RotateCw, Crosshair,
  Layers, Columns2, Triangle, Copy, FileWarning, Film, Check, Type, ScanLine, Tv,
} from 'lucide-react'
import { getDefaultEnabledValue, getDefaultDisabledValue } from '../../utils/effectUtils'

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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const STORAGE_BUCKET = 'moodspace'

function getPreviewUrl(previewImagePath) {
  if (!previewImagePath || !SUPABASE_URL) return null
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${previewImagePath}`
}

export default function FxEffectCard({ effect, value, onClick, showPreview, count }) {
  const Icon = ICONS[effect.icon]
  const isActive = value != null && value !== false && value !== 0 && value !== 'none' && value !== ''
  const [imgError, setImgError] = useState(false)
  const previewUrl = showPreview && effect.previewImagePath && !imgError ? getPreviewUrl(effect.previewImagePath) : null

  return (
    <button
      type="button"
      className={`workspace-fx-card ${isActive ? 'is-active' : ''}${showPreview ? ' has-preview' : ''}`}
      onClick={() => onClick(effect.id)}
    >
      {count > 0 && (
        <span className="workspace-fx-card-badge">{count}x</span>
      )}
      {showPreview && (
        previewUrl ? (
          <img
            className="workspace-fx-card-preview"
            src={previewUrl}
            alt=""
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="workspace-fx-card-preview" />
        )
      )}
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
