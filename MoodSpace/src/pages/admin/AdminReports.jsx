import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listReports, resolveReport } from '../../lib/api/admin'
import { ChevronLeft, ChevronRight, CheckCircle, ExternalLink, Trash2, XCircle } from 'lucide-react'

const PAGE_SIZE = 20

const reasonLabels = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  hate_speech: 'Hate Speech',
  plagiarism: 'Plagiarism',
  other: 'Other',
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
        <label className="admin-toggle">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reason</th>
              <th>Detail</th>
              <th>Reported Post</th>
              <th>Post Author</th>
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
                <td><span className={`admin-badge reason-${report.reason}`}>{reasonLabels[report.reason] || report.reason}</span></td>
                <td>{report.detail || '-'}</td>
                <td>
                  {report.postId ? (
                    <Link to={`/post/${report.postId}`} className="admin-link" target="_blank">
                      {report.postTitle || 'Untitled'} <ExternalLink size={12} />
                      {report.postStatus === 'banned' && <span className="admin-badge status-banned" style={{ marginLeft: 6 }}>Banned</span>}
                    </Link>
                  ) : (
                    <span className="admin-text-muted">Post deleted</span>
                  )}
                </td>
                <td>{report.authorUsername || <span className="admin-text-muted">Deleted user</span>}</td>
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
                  {!report.resolvedAt && report.postStatus !== 'banned' ? (
                    <div className="admin-action-btns">
                      <button className="admin-btn-icon success" onClick={() => handleResolve(report.id, 'dismissed')} title="Dismiss">
                        <XCircle size={16} />
                      </button>
                      <button className="admin-btn-icon warning" onClick={() => handleResolve(report.id, 'warned')} title="Warning">
                        <CheckCircle size={16} />
                      </button>
                      <button className="admin-btn-icon danger" onClick={() => handleResolve(report.id, 'post_deleted')} title="Ban post">
                        <Trash2 size={16} />
                      </button>
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
