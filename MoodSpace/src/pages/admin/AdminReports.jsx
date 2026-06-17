import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listReports, resolveReport } from '../../lib/api/admin'
import { Ban, ChevronLeft, ChevronRight, CheckCircle, ExternalLink, Trash2, UserX, XCircle } from 'lucide-react'

const PAGE_SIZE = 20

const reasonLabels = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  hate_speech: 'Hate Speech',
  plagiarism: 'Plagiarism',
  other: 'Other',
}

const targetLabels = {
  post: 'Post',
  comment: 'Comment',
  user: 'User',
}

function AdminReports() {
  const [reports, setReports] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showResolved, setShowResolved] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listReports({ resolved: showResolved, page, pageSize: PAGE_SIZE })
      setReports(data.reports)
      setTotal(data.total)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [page, showResolved])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [showResolved])

  const handleResolve = async (id, resolution) => {
    try {
      await resolveReport(id, resolution)
    } catch {
      // tetap refresh list
    }
    load()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="admin-page">
      <h1>Reports</h1>

      <div className="admin-filters">
        <label className="workspace-toggle-row">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          <span className="toggle-track" />
          Show resolved
        </label>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Reason</th>
              <th>Detail</th>
              <th>Target</th>
              <th>Reported By</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="admin-table-empty">Loading...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={8} className="admin-table-empty">No reports found</td></tr>
            ) : reports.map((report) => (
              <tr key={report.id}>
                <td><span className={`admin-badge target-${report.targetType || 'post'}`}>{targetLabels[report.targetType] || 'Post'}</span></td>
                <td><span className={`admin-badge reason-${report.reason}`}>{reasonLabels[report.reason] || report.reason}</span></td>
                <td>{report.detail || '-'}</td>
                <td>
                  {(report.targetType === 'post' || !report.targetType) && (
                    report.postId ? (
                      <Link to={`/post/${report.postId}`} className="admin-link" target="_blank">
                        {report.postTitle || 'Untitled'} <ExternalLink size={12} />
                        {report.postStatus === 'banned' && <span className="admin-badge status-banned" style={{ marginLeft: 6 }}>Banned</span>}
                      </Link>
                    ) : (
                      <span className="admin-text-muted">Post deleted</span>
                    )
                  )}
                  {report.targetType === 'comment' && (
                    <div>
                      <span className="admin-text-muted">{report.commentContent ? report.commentContent.substring(0, 80) : 'Comment deleted'}</span>
                      <div className="admin-text-muted" style={{ fontSize: 11 }}>by {report.commentAuthorUsername || report.authorUsername || 'unknown'}</div>
                    </div>
                  )}
                  {report.targetType === 'user' && (
                    <span>User: {report.reportedUsername || <span className="admin-text-muted">Deleted user</span>}</span>
                  )}
                </td>
                <td>{report.reporterUsername}</td>
                <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                <td>
                  {report.resolvedAt ? (
                    <span className="admin-badge resolved">Resolved</span>
                  ) : (
                    <span className="admin-badge pending">Pending</span>
                  )}
                </td>
                <td>
                  {!report.resolvedAt ? (
                    <div className="admin-action-btns">
                      <button className="admin-btn-icon success" onClick={() => handleResolve(report.id, 'dismissed')} title="Dismiss">
                        <XCircle size={16} />
                      </button>
                      <button className="admin-btn-icon warning" onClick={() => handleResolve(report.id, 'warned')} title="Warning">
                        <CheckCircle size={16} />
                      </button>
                      {(report.targetType === 'post' || !report.targetType) && (
                        <button className="admin-btn-icon danger" onClick={() => handleResolve(report.id, 'post_deleted')} title="Ban post">
                          <Trash2 size={16} />
                        </button>
                      )}
                      {report.targetType === 'comment' && (
                        <button className="admin-btn-icon danger" onClick={() => handleResolve(report.id, 'comment_deleted')} title="Ban comment">
                          <Ban size={16} />
                        </button>
                      )}
                      {report.targetType === 'user' && (
                        <button className="admin-btn-icon danger" onClick={() => handleResolve(report.id, 'user_banned')} title="Ban user">
                          <UserX size={16} />
                        </button>
                      )}
                    </div>
                  ) : <span className="admin-text-muted">—</span>}
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

export default AdminReports
