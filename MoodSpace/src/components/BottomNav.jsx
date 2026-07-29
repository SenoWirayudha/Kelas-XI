import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, Folder, User, Plus } from 'lucide-react'
import { useState, useRef } from 'react'
import CreateMenu from './CreateMenu'

function BottomNav() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const animTimer = useRef(null)

  const openMenu = () => {
    setIsCreateOpen(true)
    setIsAnimatingOut(false)
    if (animTimer.current) {
      clearTimeout(animTimer.current)
      animTimer.current = null
    }
  }

  const closeMenu = () => {
    setIsAnimatingOut(true)
    animTimer.current = setTimeout(() => {
      setIsCreateOpen(false)
      setIsAnimatingOut(false)
      animTimer.current = null
    }, 140)
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
          onClick={isCreateOpen ? closeMenu : openMenu}
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
        <div
          className={`bottom-nav-create-backdrop${isAnimatingOut ? ' closing' : ''}`}
          onClick={closeMenu}
        >
          <div
            className={`bottom-nav-create-menu${isAnimatingOut ? ' closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CreateMenu onAction={closeMenu} staggerDelay={50} />
          </div>
        </div>
      )}
    </>
  )
}

export default BottomNav
