import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Users, FileText, Flag, MessageSquare, Image, TrendingUp, AlertTriangle } from 'lucide-react'
import { getAdminStats } from '../../lib/api/admin'

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to} className="admin-stat-card" style={{ borderLeftColor: color }}>
    <div className="admin-stat-icon" style={{ background: `${color}18`, color }}>
      <Icon size={24} />
    </div>
    <div className="admin-stat-info">
      <span className="admin-stat-value">{value ?? '-'}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  </Link>
)

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="admin-loading">Loading...</div>

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>

      <div className="admin-stats-grid">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="#A855F7" to="/admin/users" />
        <StatCard icon={TrendingUp} label="New Today" value={stats?.newUsersToday} color="#22c55e" to="/admin/users" />
        <StatCard icon={FileText} label="Published Posts" value={stats?.totalPosts} color="#f59e0b" to="/admin/posts" />
        <StatCard icon={TrendingUp} label="Posts Today" value={stats?.postsPublishedToday} color="#A855F7" to="/admin/posts" />
        <StatCard icon={Flag} label="Pending Reports" value={stats?.unresolvedReports} color="#ef4444" to="/admin/reports" />
        <StatCard icon={AlertTriangle} label="Total Reports" value={stats?.totalReports} color="#f97316" to="/admin/reports" />
        <StatCard icon={MessageSquare} label="Comments" value={stats?.totalComments} color="#22D3EE" to="/admin/comments" />
        <StatCard icon={Image} label="Media Files" value={stats?.totalMedia} color="#F472B6" to="/admin/media" />
      </div>

      <div className="admin-charts">
        <div className="admin-chart-card">
          <h3>User Registration (30 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.registrationTrend || []}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#A855F7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3>Posts Published (30 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.postTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
