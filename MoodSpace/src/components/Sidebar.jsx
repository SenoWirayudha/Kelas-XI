import { NavLink } from 'react-router-dom'

const getNavClass = ({ isActive }) =>
  isActive ? 'nav-item active' : 'nav-item'

function Sidebar() {
  return (
    <aside className="sidebar layout-sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          M
        </div>
        <div>
          <p className="brand-name">Moodspace</p>
          <p className="brand-tag">Creative Workspace</p>
        </div>
      </div>

      <nav className="nav" aria-label="Primary">
        <NavLink className={getNavClass} to="/">
          <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          <span>Home</span>
        </NavLink>
        <NavLink className={getNavClass} to="/boards">
          <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 7h6v6H4zM14 7h6v6h-6zM4 17h6v3H4zM14 17h6v3h-6z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          <span>Boards</span>
        </NavLink>
        <NavLink className={getNavClass} to="/projects">
          <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 6h6l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          <span>Projects</span>
        </NavLink>
        <NavLink className={getNavClass} to="/profile">
          <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="9" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M5 20c1.5-3.6 4.3-5.4 7-5.4S17.5 16.4 19 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span>Profile</span>
        </NavLink>
      </nav>

      <button type="button" className="upload-btn">
        <span className="upload-icon" aria-hidden="true">+</span>
        Upload
      </button>
    </aside>
  )
}

export default Sidebar
