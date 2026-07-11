import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Search, Trash2, ChevronDown } from 'lucide-react'
import { listCollaborators, inviteCollaborator, updateCollaboratorRole, removeCollaborator, searchUsers } from '../../lib/api/workspaces'

export default function ShareModal({ workspaceId, onClose }) {
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
          <h2>Bagikan Workspace</h2>
          <button type="button" className="share-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

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
                    <span className="share-modal-avatar" style={user.profile?.avatarUrl ? { backgroundImage: `url("${user.profile.avatarUrl}")` } : undefined} />
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
                <span className="share-modal-avatar" style={c.user?.profile?.avatarUrl ? { backgroundImage: `url("${c.user.profile.avatarUrl}")` } : undefined} />
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
      </section>
    </div>
  )
}
