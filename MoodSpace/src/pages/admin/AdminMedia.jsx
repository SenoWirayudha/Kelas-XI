import { useCallback, useEffect, useState } from 'react'
import { listMedia, deleteMedia } from '../../lib/api/admin'
import { ChevronLeft, ChevronRight, Trash2, ExternalLink, HardDrive } from 'lucide-react'

const PAGE_SIZE = 20

function AdminMedia() {
  const [media, setMedia] = useState([])
  const [total, setTotal] = useState(0)
  const [totalSize, setTotalSize] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMedia({ page, pageSize: PAGE_SIZE })
      setMedia(data.media)
      setTotal(data.total)
      setTotalSize(data.totalSize)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('Delete this media file?')) return
    await deleteMedia(id)
    load()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className="admin-page">
      <h1>Media</h1>

      <div className="admin-media-summary">
        <div className="admin-stat-card" style={{ borderLeftColor: '#ec4899' }}>
          <div className="admin-stat-icon" style={{ background: '#ec48991a', color: '#ec4899' }}>
            <HardDrive size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{total}</span>
            <span className="admin-stat-label">Total Files</span>
          </div>
        </div>
        <div className="admin-stat-card" style={{ borderLeftColor: '#14b8a6' }}>
          <div className="admin-stat-icon" style={{ background: '#14b8a61a', color: '#14b8a6' }}>
            <HardDrive size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{formatFileSize(totalSize)}</span>
            <span className="admin-stat-label">Total Storage</span>
          </div>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>File Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Owner</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="admin-table-empty">Loading...</td></tr>
            ) : media.length === 0 ? (
              <tr><td colSpan={7} className="admin-table-empty">No media found</td></tr>
            ) : media.map((item) => (
              <tr key={item.id}>
                <td className="admin-media-preview-cell">
                  {item.mimeType?.startsWith('image/') ? (
                    <img src={item.publicUrl} alt="" className="admin-media-thumb" />
                  ) : (
                    <div className="admin-media-thumb admin-media-thumb-file">
                      <ExternalLink size={16} />
                    </div>
                  )}
                </td>
                <td>{item.fileName || item.publicUrl?.split('/').pop() || 'Unknown'}</td>
                <td>{item.mimeType || '-'}</td>
                <td>{formatFileSize(item.fileSize)}</td>
                <td>{item.ownerUsername || 'Unknown'}</td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="admin-action-btns">
                    <a href={item.publicUrl} className="admin-btn-icon" target="_blank" rel="noopener noreferrer" title="Open">
                      <ExternalLink size={16} />
                    </a>
                    <button className="admin-btn-icon danger" onClick={() => handleDelete(item.id)} title="Delete">
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

export default AdminMedia
