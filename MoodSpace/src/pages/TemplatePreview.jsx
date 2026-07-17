import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LoaderCircle, User } from 'lucide-react'
import { getWorkspaceByToken, useAsTemplate } from '../lib/api/workspaces'
import { useAuth } from '../context/authState'
import ConfirmationModal from '../components/ConfirmationModal'
import { useToast } from '../context/ToastContext'

export default function TemplatePreview() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, requireAuth } = useAuth()
  const toast = useToast()
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isForking, setIsForking] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError(null)
    getWorkspaceByToken(token)
      .then((data) => {
        setTemplate(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Template tidak ditemukan')
        setLoading(false)
      })
  }, [token])

  const handleUseTemplate = useCallback(() => {
    if (!user) {
      requireAuth('login')
      return
    }
    setShowConfirm(true)
  }, [user, requireAuth])

  const handleConfirmFork = useCallback(async () => {
    if (!template?.id || !user) return
    setIsForking(true)
    try {
      const result = await useAsTemplate(template.id)
      console.log('[template-preview] Fork result:', result)
      toast?.addToast?.('Workspace berhasil dibuat dari template!', { type: 'success', duration: 4000 })
      navigate(`/workspace/${result.workspaceId}`)
    } catch (error) {
      console.error('[template-preview] Fork error:', error)
      toast?.addToast?.(error.message || 'Gagal menduplikasi template', { type: 'error', duration: 5000 })
    } finally {
      setIsForking(false)
      setShowConfirm(false)
    }
  }, [template, user, navigate, toast])

  if (loading) {
    return (
      <div className="template-preview-page">
        <div className="template-preview-loading">
          <LoaderCircle size={32} className="confirm-modal-spinner" />
          <p>Memuat template...</p>
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="template-preview-page">
        <div className="template-preview-error">
          <h2>Template Tidak Ditemukan</h2>
          <p>{error || 'Link template tidak valid atau sudah tidak tersedia.'}</p>
          <Link to="/" className="template-preview-back-link">Kembali ke beranda</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="template-preview-page">
      <div className="template-preview-container">
        <button type="button" className="template-preview-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Kembali
        </button>

        <div className="template-preview-card">
          <div className="template-preview-thumbnail">
            {template.thumbnailUrl ? (
              <img src={template.thumbnailUrl} alt={template.title} />
            ) : (
              <div className="template-preview-thumbnail-placeholder">
                <User size={48} />
              </div>
            )}
          </div>

          <div className="template-preview-info">
            <h1>{template.title || 'Untitled Template'}</h1>
            {template.description && <p className="template-preview-desc">{template.description}</p>}
            <p className="template-preview-meta">Template by @{template.ownerId?.slice(0, 8) || 'unknown'}</p>

            <button
              type="button"
              className="template-preview-use-btn"
              onClick={handleUseTemplate}
              disabled={isForking}
            >
              {isForking && <LoaderCircle size={16} className="confirm-modal-spinner" />}
              {isForking ? 'Menduplikasi...' : 'Gunakan Template'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        title="Gunakan Template"
        description={`Apakah kamu yakin ingin menggunakan template "${template.title || 'ini'}"? Workspace baru akan dibuat untukmu.`}
        confirmLabel="Ya, Gunakan"
        cancelLabel="Batal"
        isDanger={false}
        isConfirming={isForking}
        onConfirm={handleConfirmFork}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
