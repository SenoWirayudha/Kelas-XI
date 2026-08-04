import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Folder, Home, LayoutGrid, Plus, Shield, User } from 'lucide-react'
import { useAuth } from '../context/authState'
import CreateMenu from './CreateMenu'

const getNavClass = ({ isActive }) =>
  isActive ? 'nav-item active' : 'nav-item'

function Sidebar({ onLinkClick }) {
  const { user } = useAuth()
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const closeTimer = useRef(null)

  const openMenu = () => {
    clearTimeout(closeTimer.current)
    setIsCreateMenuOpen(true)
  }

  const scheduleClose = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setIsCreateMenuOpen(false), 120)
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-logo" src="/logo-text.svg" alt="Moodspace" />
      </div>

      <nav className="nav" aria-label="Primary">
        <NavLink className={getNavClass} to="/feed" onClick={onLinkClick}>
          <Home size={20} className="nav-icon" aria-hidden="true" />
          <span>Home</span>
        </NavLink>
        <NavLink className={getNavClass} to="/boards" onClick={onLinkClick}>
          <LayoutGrid size={20} className="nav-icon" aria-hidden="true" />
          <span>Boards</span>
        </NavLink>
        <NavLink className={getNavClass} to="/projects" onClick={onLinkClick}>
          <Folder size={20} className="nav-icon" aria-hidden="true" />
          <span>Projects</span>
        </NavLink>
        <NavLink className={getNavClass} to="/profile" onClick={onLinkClick}>
          <User size={20} className="nav-icon" aria-hidden="true" />
          <span>Profile</span>
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink className={({ isActive }) => isActive ? 'nav-item active admin-nav' : 'nav-item admin-nav'} to="/admin" onClick={onLinkClick}>
            <Shield size={20} className="nav-icon" aria-hidden="true" />
            <span>Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-create">
        <button type="button" className="upload-btn" onClick={() => setIsCreateMenuOpen((value) => !value)} onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
          <Plus size={14} aria-hidden="true" />
          Upload
        </button>
        {isCreateMenuOpen && (
          <div className="sidebar-create-menu" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
            <CreateMenu onAction={() => setIsCreateMenuOpen(false)} />
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
