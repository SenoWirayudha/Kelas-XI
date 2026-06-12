import { useCallback, useEffect, useState } from 'react'
import { listPosts, deletePost } from '../../lib/api/admin'
import { Search, ChevronLeft, ChevronRight, Trash2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 20

function AdminPosts() {
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listPosts({ search: search || undefined, status: statusFilter || undefined, page, pageSize: PAGE_SIZE })
      setPosts(data.posts)
      setTotal(data.total)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  const handleDelete = async (id) => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await deletePost(id)
    load()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="admin-page">
      <h1>Posts</h1>

      <div className="admin-filters">
        <div className="admin-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by title or caption..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Visibility</th>
              <th>Saves</th>
              <th>Views</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="admin-table-empty">Loading...</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={9} className="admin-table-empty">No posts found</td></tr>
            ) : posts.map((post) => (
              <tr key={post.id}>
                <td className="admin-media-preview-cell">
                  {post.coverUrl ? (
                    <img src={post.coverUrl} alt="" className="admin-media-thumb" />
                  ) : (
                    <div className="admin-media-thumb admin-media-thumb-file">
                      <ExternalLink size={14} />
                    </div>
                  )}
                </td>
                <td>{post.title || 'Untitled'}</td>
                <td>{post.authorDisplayName || post.username}</td>
                <td><span className={`admin-badge status-${post.status}`}>{post.status}</span></td>
                <td>{post.visibility}</td>
                <td>{post.saveCount}</td>
                <td>{post.viewCount}</td>
                <td>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'}</td>
                <td>
                  <div className="admin-action-btns">
                    <Link to={`/post/${post.id}`} className="admin-btn-icon" target="_blank" title="View">
                      <ExternalLink size={16} />
                    </Link>
                    <button className="admin-btn-icon danger" onClick={() => handleDelete(post.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
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

export default AdminPosts
