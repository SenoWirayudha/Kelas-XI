import { Palette, TrendingUp } from 'lucide-react'

export default function AdjustmentTriggerButton({ type, active, onClick }) {
  const Icon = type === 'hsl' ? Palette : TrendingUp
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          background: '#241f2e',
          border: '0.5px solid #3a3444',
          borderRadius: '8px',
          padding: '10px 12px',
          cursor: 'pointer',
        }}
      >
        <Icon size={16} color="#a89aef" />
        <span style={{ color: '#d8d4e0', fontSize: '13px' }}>
          {type === 'hsl' ? 'HSL' : 'Curves'}
        </span>
      </button>
      {active && (
        <span style={{
          position: 'absolute',
          top: '-3px',
          right: '-3px',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#a89aef',
          border: '1.5px solid #121216',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}