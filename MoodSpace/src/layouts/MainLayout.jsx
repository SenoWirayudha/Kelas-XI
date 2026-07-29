import { useState, useLayoutEffect, useRef, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SidebarOverlay from '../components/SidebarOverlay.jsx'
import CreationModals from '../components/CreationModals.jsx'

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const scrollPositionsRef = useRef({})
  const prevPathnameRef = useRef(location.pathname)

  const toggleSidebar = () => setIsSidebarOpen((v) => !v)
  const closeSidebar = () => setIsSidebarOpen(false)

  useLayoutEffect(() => {
    const container = document.querySelector('.layout-content')
    if (!container) return

    const prev = prevPathnameRef.current
    const curr = location.pathname

    if (prev !== curr) {
      scrollPositionsRef.current[prev] = container.scrollTop
      prevPathnameRef.current = curr

      const saved = scrollPositionsRef.current[curr]
      container.scrollTop = saved ?? 0

      console.debug('[SCROLL-RESTORE] save path=%s scrollTop=%d → restore path=%s scrollTop=%d', prev, scrollPositionsRef.current[prev], curr, container.scrollTop)
    }
  }, [location.pathname])

  useEffect(() => {
    const container = document.querySelector('.layout-content')
    if (container) {
      console.debug('[SCROLL-RESTORE] after paint path=%s scrollTop=%d', location.pathname, container.scrollTop)
    }
  }, [location.pathname])

  return (
    <div className="app-shell layout">
      <div className={`layout-sidebar${isSidebarOpen ? ' open' : ''}`}>
        <Sidebar onLinkClick={closeSidebar} />
      </div>
      {isSidebarOpen && <SidebarOverlay onClick={closeSidebar} />}
      <div className="layout-main">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
      <BottomNav />
      <CreationModals />
    </div>
  )
}

export default MainLayout
