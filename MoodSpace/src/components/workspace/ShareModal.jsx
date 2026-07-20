import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Search, Trash2, ChevronDown, Check, Copy, Globe, Link, LoaderCircle, LayoutTemplate, Share2, Upload, Users } from 'lucide-react'
import { listCollaborators, inviteCollaborator, updateCollaboratorRole, removeCollaborator, searchUsers, shareAsTemplate } from '../../lib/api/workspaces'
import { useToast } from '../../context/ToastContext'

const PUBLISH_MODES = [
  {
    id: 'publish',
    icon: Globe,
    title: 'Publish Post',
    description: 'Post akan tampil di feed publik. Orang lain bisa lihat dan menyimpan.',
  },
  {
    id: 'share-template',
    icon: Link,
    title: 'Share as Template',
    description: 'Dapatkan link privat. Siapa pun yang punya link bisa duplicate ke workspace mereka.',
  },
  {
    id: 'publish-template',
    icon: LayoutTemplate,
    title: 'Publish as Template',
    description: 'Tampil di feed publik, orang lain bisa lihat dan menggunakan sebagai template.',
  },
]

export default function ShareModal({ workspaceId, onClose, defaultTab = 'kolaborator', workspaceTitle, onExportAndRedirect, onDownloadTemplate, onTabChange }) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    onTabChange?.(activeTab)
  }, [activeTab, onTabChange])
  const [collaborators, setCollaborators] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [role, setRole] = useState('view')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const debounceRef = useRef(null)
  const searchRef = useRef(null)

  // Publish tab state
  const [publishMode, setPublishMode] = useState('publish')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handlePublishConfirm = useCallback(async () => {
    setIsPublishing(true)
    try {
      const mode = PUBLISH_MODES.find((m) => m.id === publishMode)
      if (mode.id === 'publish') {
        onExportAndRedirect?.({ isTemplate: false })
        onClose()
      } else if (mode.id === 'share-template') {
        const res = await shareAsTemplate(workspaceId)
        await onDownloadTemplate?.()
        setPublishResult({
          shareToken: res.shareToken,
          shareUrl: `${window.location.origin}/template/${res.shareToken}`,
        })
      } else if (mode.id === 'publish-template') {
        onExportAndRedirect?.({ isTemplate: true })
        onClose()
      }
    } catch (error) {
      console.error('[share-modal] Publish error:', error)
      toast?.addToast?.(error.message || 'Gagal mempublikasikan', { type: 'error', duration: 5000 })
    } finally {
      setIsPublishing(false)
    }
  }, [publishMode, workspaceId, onExportAndRedirect, onDownloadTemplate, onClose, toast])

  const handleCopyLink = useCallback(async () => {
    if (!publishResult?.shareUrl) return
    try {
      await navigator.clipboard.writeText(publishResult.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast?.addToast?.('Gagal menyalin link', { type: 'error', duration: 3000 })
    }
  }, [publishResult, toast])

  const fetchCollaborators = useCallback(async () => {
    try {
      const data = await listCollaborators(workspaceId)
      setCollaborators(data.collaborators || [])
    } catch {}
  }, [workspaceId])

  useEffect(() => {
    fetchCollaborators()
  }, [fetchCollaborators])

  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setSearchResults([])
      return
    }

    clearTimeout(debounceRef.current)
    setSearching(true)
    setHasSearched(false)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchUsers(trimmed)
        setSearchResults(data.users || [])
      } catch {}
      setSearching(false)
      setHasSearched(true)
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [searchQuery])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([])
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const handleInvite = async () => {
    if (!selectedUser) return
    setLoading(true)
    setError('')
    try {
      await inviteCollaborator(workspaceId, selectedUser.id, role)
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
      await fetchCollaborators()
    } catch (err) {
      setError(err.message || 'Gagal mengundang user')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateCollaboratorRole(workspaceId, userId, newRole)
      await fetchCollaborators()
    } catch {}
  }

  const handleRemove = async (userId) => {
    try {
      await removeCollaborator(workspaceId, userId)
      await fetchCollaborators()
    } catch {}
  }

  return (
    <div className="workspace-export-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section className="share-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Pengaturan Workspace</h2>
          <button type="button" className="share-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="share-modal-tabs">
          <button
            type="button"
            className={`share-modal-tab ${activeTab === 'kolaborator' ? 'active' : ''}`}
            onClick={() => setActiveTab('kolaborator')}
          >
            <Users size={15} />
            Kolaborator
          </button>
          <button
            type="button"
            className={`share-modal-tab ${activeTab === 'publish' ? 'active' : ''}`}
            onClick={() => setActiveTab('publish')}
          >
            <Upload size={15} />
            Publikasi
          </button>
        </div>

        {activeTab === 'kolaborator' && (<>
          <div className="share-modal-search" ref={searchRef}>
            <div className="share-modal-search-input">
              <Search size={15} />
              <input
                type="text"
                placeholder="Cari user berdasarkan email atau username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    clearTimeout(debounceRef.current)
                    setSearching(true)
                    setHasSearched(false)
                    debounceRef.current = setTimeout(async () => {
                      try {
                        const data = await searchUsers(searchQuery.trim())
                        setSearchResults(data.users || [])
                      } catch {}
                      setSearching(false)
                      setHasSearched(true)
                    }, 100)
                  }
                }}
              />
            </div>

            {hasSearched || searching || searchResults.length > 0 ? (
              <div className="share-modal-search-results">
                {searching && (
                  <div className="share-modal-search-status">Mencari...</div>
                )}
                {!searching && searchResults.length > 0 && (
                  searchResults.map((user) => (
                    <button
                      type="button"
                      key={user.id}
                      className={`share-modal-search-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedUser(user)
                        setSearchQuery(user.displayName || user.username)
                        setSearchResults([])
                        setHasSearched(false)
                      }}
                    >
                      <span className="share-modal-avatar" style={user.profile?.avatarUrl ? { backgroundImage: `url("${user.profile.avatarUrl}")` } : undefined}>
                        {!user.profile?.avatarUrl && <span className="avatar-initial" style={{ fontSize: '13px' }}>{(user.displayName || user.username || '?')[0].toUpperCase()}</span>}
                      </span>
                      <span className="share-modal-user-info">
                        <strong>{user.displayName || user.username}</strong>
                        <small>{user.email}</small>
                      </span>
                    </button>
                  ))
                )}
                {!searching && hasSearched && searchResults.length === 0 && (
                  <div className="share-modal-search-status">User tidak ditemukan</div>
                )}
              </div>
            ) : null}
          </div>

          {selectedUser && (
            <div className="share-modal-invite-row">
              <span className="share-modal-invite-label">Akses:</span>
              <div className="share-modal-role-group">
                <button
                  type="button"
                  className={`share-modal-role-btn ${role === 'view' ? 'active' : ''}`}
                  onClick={() => setRole('view')}
                >
                  View
                </button>
                <button
                  type="button"
                  className={`share-modal-role-btn ${role === 'edit' ? 'active' : ''}`}
                  onClick={() => setRole('edit')}
                >
                  Edit
                </button>
              </div>
              <button
                type="button"
                className="share-modal-invite-btn"
                onClick={handleInvite}
                disabled={loading}
              >
                {loading ? 'Mengundang...' : 'Undang'}
              </button>
            </div>
          )}

          {error && <p className="share-modal-error">{error}</p>}

          <div className="share-modal-divider" />

          <div className="share-modal-list">
            <span className="share-modal-list-title">Collaborator</span>
            {collaborators.length === 0 ? (
              <p className="share-modal-empty">Belum ada collaborator. Undang user di atas.</p>
            ) : (
              collaborators.map((c) => (
                <div className="share-modal-collab-item" key={c.userId}>
                  <span className="share-modal-avatar" style={c.user?.profile?.avatarUrl ? { backgroundImage: `url("${c.user.profile.avatarUrl}")` } : undefined}>
                    {!c.user?.profile?.avatarUrl && <span className="avatar-initial" style={{ fontSize: '13px' }}>{(c.user.displayName || c.user.username || '?')[0].toUpperCase()}</span>}
                  </span>
                  <span className="share-modal-collab-info">
                    <strong>{c.user.displayName || c.user.username}</strong>
                    <small>{c.user.email}</small>
                  </span>
                  <div className="share-modal-role-group">
                    <button
                      type="button"
                      className={`share-modal-role-btn ${c.role === 'view' ? 'active' : ''}`}
                      onClick={() => handleRoleChange(c.userId, 'view')}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className={`share-modal-role-btn ${c.role === 'edit' ? 'active' : ''}`}
                      onClick={() => handleRoleChange(c.userId, 'edit')}
                    >
                      Edit
                    </button>
                  </div>
                  <button
                    type="button"
                    className="share-modal-remove-btn"
                    onClick={() => handleRemove(c.userId)}
                    aria-label="Remove collaborator"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </>)}

        {activeTab === 'publish' && (
          <div className="publish-modal-content">
            {!publishResult ? (
              <>
                <p className="confirm-modal-desc" style={{ marginBottom: 16, padding: '0 24px' }}>
                  Pilih cara publikasi untuk <strong>{workspaceTitle || 'workspace ini'}</strong>
                </p>

                <div className="publish-mode-list">
                  {PUBLISH_MODES.map((mode) => {
                    const Icon = mode.icon
                    const isSelected = publishMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        className={`publish-mode-card${isSelected ? ' selected' : ''}`}
                        onClick={() => setPublishMode(mode.id)}
                      >
                        <span className="publish-mode-radio">
                          {isSelected && <span className="publish-mode-radio-dot" />}
                        </span>
                        <span className="publish-mode-content">
                          <span className="publish-mode-title">
                            <Icon size={16} />
                            {mode.title}
                          </span>
                          <span className="publish-mode-desc">{mode.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="confirm-modal-actions" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, padding: '16px 24px' }}>
                  <button type="button" className="confirm-modal-cancel" onClick={onClose} disabled={isPublishing}>
                    Batal
                  </button>
                  <button type="button" className="confirm-modal-confirm" onClick={handlePublishConfirm} disabled={isPublishing}>
                    {isPublishing && <LoaderCircle size={14} className="confirm-modal-spinner" />}
                    {isPublishing ? 'Memproses...' : 'Konfirmasi'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ padding: '0 24px' }}>Berhasil Dibagikan sebagai Template!</h2>
                <p className="confirm-modal-desc" style={{ padding: '0 24px' }}>File template sudah di-download. Bagikan link ini atau kirim file .json-nya.</p>

                {publishResult.shareUrl && (
                  <div className="publish-result-link" style={{ margin: '0 24px' }}>
                    <p className="confirm-modal-desc">Atau bagikan link berikut:</p>
                    <div className="publish-share-link-row">
                      <input type="text" readOnly value={publishResult.shareUrl} className="publish-share-link-input" onClick={(e) => e.target.select()} />
                      <button type="button" className="publish-copy-btn" onClick={handleCopyLink}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="confirm-modal-actions" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, padding: '16px 24px' }}>
                  <button type="button" className="confirm-modal-cancel" onClick={onClose}>
                    Tutup
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
