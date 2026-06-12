import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SidebarOverlay from '../components/SidebarOverlay.jsx'
import CreationModals from '../components/CreationModals.jsx'

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen((v) => !v)
  const closeSidebar = () => setIsSidebarOpen(false)

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
