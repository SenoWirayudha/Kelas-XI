import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Header from '../components/Header.jsx'

function MainLayout() {
  return (
    <div className="app-shell layout">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default MainLayout
