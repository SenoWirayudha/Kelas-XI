const RemoveBgIcon = ({ size = 24, strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <defs>
      <pattern id="rmbg-chk" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="3" height="3" fill="#aaaaaa" opacity="0.4"/>
        <rect x="3" y="3" width="3" height="3" fill="#aaaaaa" opacity="0.4"/>
        <rect x="3" y="0" width="3" height="3" fill="#dddddd" opacity="0.3"/>
        <rect x="0" y="3" width="3" height="3" fill="#dddddd" opacity="0.3"/>
      </pattern>
    </defs>
    <rect x="22" y="0" width="22" height="44" fill="url(#rmbg-chk)" clipPath="url(#rmbg-clip)"/>
    <clipPath id="rmbg-clip"><rect x="0" y="0" width="44" height="44" rx="6"/></clipPath>
    <circle cx="22" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M8 38 Q8 26 22 26 Q36 26 36 38" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
    <line x1="22" y1="0" x2="22" y2="44" stroke="currentColor" strokeWidth={strokeWidth * 0.8} strokeDasharray="3 3"/>
    <rect x="0.75" y="0.75" width="42.5" height="42.5" rx="6" fill="none" stroke="currentColor" strokeWidth={strokeWidth} opacity="0.4"/>
  </svg>
)

const MeshWarpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5 C9 3 15 3 19 5 C21 9 21 15 19 19 C15 21 9 21 5 19 C3 15 3 9 5 5 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M4.5 12 C9 10.3 15 10.3 19.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 4.5 C10.3 9 10.3 15 12 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="5" cy="5" r="1.4" fill="currentColor"/>
    <circle cx="19" cy="5" r="1.4" fill="currentColor"/>
    <circle cx="5" cy="19" r="1.4" fill="currentColor"/>
    <circle cx="19" cy="19" r="1.4" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor"/>
  </svg>
)

const RelightIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="4" fill="currentColor" opacity="0.5"/>
    <circle cx="16" cy="16" r="4" fill="currentColor" opacity="0.5"/>
    <path d="M8 8 Q12 12 16 16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" fill="none"/>
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.3"/>
    <circle cx="16" cy="16" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.3"/>
  </svg>
)

const TOOLS = [
  {
    id: 'removeBg',
    label: 'Remove Background',
    description: 'Hapus latar belakang gambar menggunakan AI',
    icon: RemoveBgIcon,
  },
  {
    id: 'meshWarp',
    label: 'Mesh Warp',
    description: 'Perspektif / bentuk bertalian dengan grid',
    icon: MeshWarpIcon,
  },
  {
    id: 'relight',
    label: 'Relight',
    description: 'Tambah 2 sumber cahaya warna ke gambar',
    icon: RelightIcon,
  },
]

export default function ToolsPanel({ onSelect, selectedItem }) {
  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        <span className="panel-title">Tools</span>
      </div>

      <div className="panel-section">
        <p className="panel-hint">
          {selectedItem ? 'Select a tool to apply to the selected image.' : 'Select an image first, then choose a tool.'}
        </p>
      </div>

      <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              type="button"
              key={tool.id}
              className="workspace-fx-card"
              onClick={() => onSelect(tool.id)}
            >
              <span className="workspace-fx-card-icon">
                {Icon && <Icon />}
              </span>
              <div className="workspace-fx-card-text">
                <span className="workspace-fx-card-label">{tool.label}</span>
                <span className="workspace-fx-card-desc">{tool.description}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
