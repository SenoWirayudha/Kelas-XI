import { useCallback, useEffect, useState } from 'react'
import { listUsers, updateUser } from '../../lib/api/admin'
import { Search, ChevronLeft, ChevronRight, Shield, ShieldOff, Ban, CheckCircle } from 'lucide-react'

const PAGE_SIZE = 20

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listUsers({ search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined, page, pageSize: PAGE_SIZE })
      setUsers(data.users)
      setTotal(data.total)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, roleFilter, statusFilter])

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    await updateUser(user.id, { role: newRole })
    load()
  }

  const handleToggleStatus = async (user, newStatus) => {
    await updateUser(user.id, { status: newStatus })
    load()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="admin-page">
      <h1>Users</h1>

      <div className="admin-filters">
        <div className="admin-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Display Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="admin-table-empty">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="admin-table-empty">No users found</td></tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.displayName || '-'}</td>
                <td>
                  <span className={`admin-badge ${user.role}`}>{user.role}</span>
                </td>
                <td>
                  <span className={`admin-badge status-${user.status}`}>{user.status}</span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="admin-action-btns">
                    <button
                      className="admin-btn-icon"
                      onClick={() => handleToggleRole(user)}
                      title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                    >
                      {user.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </button>
                    {user.status === 'active' ? (
                      <>
                        <button className="admin-btn-icon" onClick={() => handleToggleStatus(user, 'banned')} title="Ban">
                          <Ban size={16} />
                        </button>
                      </>
                    ) : (
                      <button className="admin-btn-icon" onClick={() => handleToggleStatus(user, 'active')} title="Activate">
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
