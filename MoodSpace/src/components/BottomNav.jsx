import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, Folder, User, Plus } from 'lucide-react'
import { useState, useRef } from 'react'
import CreateMenu from './CreateMenu'

function BottomNav() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const closeTimer = useRef(null)

  const openMenu = () => {
    clearTimeout(closeTimer.current)
    setIsCreateOpen(true)
  }

  const scheduleClose = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setIsCreateOpen(false), 120)
  }

  return (
    <>
      <nav className="bottom-nav">
        <NavLink to="/feed" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <Home size={22} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Home</span>
        </NavLink>
        <NavLink to="/boards" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <LayoutGrid size={22} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Boards</span>
        </NavLink>
        <button
          type="button"
          className="bottom-nav-plus"
          onClick={() => setIsCreateOpen((v) => !v)}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          aria-label="Create"
        >
          <Plus size={26} />
        </button>
        <NavLink to="/projects" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <Folder size={22} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Projects</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <User size={22} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Profile</span>
        </NavLink>
      </nav>
      {isCreateOpen && (
        <div className="bottom-nav-create-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="bottom-nav-create-menu" onClick={(e) => e.stopPropagation()} onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
            <CreateMenu onAction={() => setIsCreateOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

export default BottomNav
