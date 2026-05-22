import { Bell, Settings } from 'lucide-react'

function Header() {
  return (
    <header className="layout-header">
      <div className="header-bar">
        <div className="search">
          <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M16.5 16.5 21 21"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            placeholder="Search inspiration, artists, or boards..."
            aria-label="Search"
          />
        </div>
        <div className="top-actions">
          <button className="icon-btn" type="button" aria-label="Notifications">
            <Bell size={18} strokeWidth={1.6} />
          </button>
          <button className="icon-btn" type="button" aria-label="Settings">
            <Settings size={18} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
