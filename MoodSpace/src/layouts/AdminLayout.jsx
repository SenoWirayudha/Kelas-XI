import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authState'
import { BarChart3, Users, FileText, Flag, MessageSquare, Image, ArrowLeft } from 'lucide-react'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: BarChart3, end: true },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/posts', label: 'Posts', icon: FileText },
  { path: '/admin/reports', label: 'Reports', icon: Flag },
  { path: '/admin/comments', label: 'Comments', icon: MessageSquare },
  { path: '/admin/media', label: 'Media', icon: Image },
]

function AdminLayout() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div className="admin-loading">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/" state={{ from: location }} replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">A</div>
            <div>
              <p className="brand-name">Moodspace</p>
              <p className="brand-tag">Admin Control Panel</p>
            </div>
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => {
            const active = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item${active ? ' active' : ''}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <Link to="/" className="admin-back-link">
          <ArrowLeft size={16} />
          Back to App
        </Link>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
