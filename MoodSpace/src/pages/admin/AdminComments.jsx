import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listComments, deleteComment } from '../../lib/api/admin'
import { Search, ChevronLeft, ChevronRight, Ban, Trash2, ExternalLink } from 'lucide-react'
import ConfirmationModal from '../../components/ConfirmationModal'

const PAGE_SIZE = 20

function AdminComments() {
  const [comments, setComments] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [confirmingHard, setConfirmingHard] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listComments({ search: search || undefined, page, pageSize: PAGE_SIZE })
      setComments(data.comments)
      setTotal(data.total)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search])

  const handleDelete = (id, hard) => {
    setConfirmingId(id)
    setConfirmingHard(hard)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="admin-page">
      <h1>Comments</h1>

      <div className="admin-filters">
        <div className="admin-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Content</th>
              <th>Author</th>
              <th>Status</th>
              <th>Post</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-table-empty">Loading...</td></tr>
            ) : comments.length === 0 ? (
              <tr><td colSpan={6} className="admin-table-empty">No comments found</td></tr>
            ) : comments.map((comment) => (
              <tr key={comment.id}>
                <td className="admin-comment-content">{comment.content}</td>
                <td>{comment.authorUsername}</td>
                <td><span className={`admin-badge status-${comment.status || 'active'}`}>{comment.status || 'active'}</span></td>
                <td>
                  <Link to={`/post/${comment.postId}`} className="admin-link" target="_blank">
                    {comment.postTitle || 'Untitled'} <ExternalLink size={12} />
                  </Link>
                </td>
                <td>{new Date(comment.createdAt).toLocaleDateString()}</td>
                <td>
                  {comment.status === 'banned' ? (
                    <button className="admin-btn-icon danger" onClick={() => handleDelete(comment.id, true)} title="Delete permanently">
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button className="admin-btn-icon danger" onClick={() => handleDelete(comment.id, false)} title="Ban">
                      <Ban size={16} />
                    </button>
                  )}
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

      <ConfirmationModal
        isOpen={confirmingId !== null}
        title={confirmingHard ? 'Delete Comment Permanently' : 'Ban Comment'}
        description={confirmingHard ? 'Permanently delete this comment? This cannot be undone.' : 'Ban this comment? It will no longer appear. The author will be notified.'}
        isDanger={true}
        onConfirm={async () => {
          await deleteComment(confirmingId, confirmingHard)
          setConfirmingId(null)
          setConfirmingHard(false)
          load()
        }}
        onCancel={() => { setConfirmingId(null); setConfirmingHard(false) }}
      />
    </div>
  )
}

export default AdminComments
