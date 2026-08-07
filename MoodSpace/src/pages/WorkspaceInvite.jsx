import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, LoaderCircle, Share2 } from 'lucide-react'
import { getWorkspaceInviteInfo, joinWorkspaceByInvite } from '../lib/api/workspaces'
import { useAuth } from '../context/authState'
import { useToast } from '../context/ToastContext'

export default function WorkspaceInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, requireAuth } = useAuth()
  const toast = useToast()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError(null)
    getWorkspaceInviteInfo(token)
      .then((data) => {
        setInfo(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Link undang tidak valid')
        setLoading(false)
      })
  }, [token])

  const handleJoin = useCallback(async () => {
    if (!user) {
      requireAuth('login')
      return
    }
    setJoining(true)
    try {
      const result = await joinWorkspaceByInvite(token)
      toast?.addToast?.(result.alreadyJoined ? 'Kamu sudah menjadi kolaborator' : 'Berhasil bergabung sebagai kolaborator!', { type: 'success', duration: 4000 })
      navigate(`/workspace?projectId=${result.workspaceId}`)
    } catch (err) {
      setError(err.message || 'Gagal bergabung ke workspace')
      setJoining(false)
    }
  }, [user, token, navigate, toast, requireAuth])

  if (loading) {
    return (
      <div className="invite-page">
        <LoaderCircle size={28} className="confirm-modal-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <span className="invite-card-icon"><Share2 size={22} /></span>
          <h2>Link tidak valid</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        <span className="invite-card-icon"><Check size={22} /></span>
        <h2>Undangan Workspace</h2>
        <p className="invite-card-title">{info.workspaceTitle}</p>
        <p className="invite-card-desc">
          Kamu diundang untuk bergabung sebagai kolaborator dengan akses <strong>{info.role === 'edit' ? 'Edit' : 'View'}</strong>.
        </p>
        <button
          type="button"
          className="invite-join-btn"
          onClick={handleJoin}
          disabled={joining}
        >
          {joining ? 'Menggabungkan...' : 'Bergabung'}
        </button>
        {error && <p className="share-modal-error">{error}</p>}
      </div>
    </div>
  )
}