import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, UserCheck, UserPlus, X } from 'lucide-react'
import { followUser, getFollowers, getFollowing, unfollowUser } from '../lib/api/follows'
import { useAuth } from '../context/authState'
import CroppedProfileImage from './CroppedProfileImage'

function FollowListModal({ isOpen, type, userId, onClose }) {
  const { user, requireAuth } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !userId) return
    setLoading(true)
    setError('')
    const fetcher = type === 'followers' ? getFollowers : getFollowing
    fetcher(userId)
      .then((data) => setItems(data.items || []))
      .catch((nextError) => setError(nextError.message || 'Gagal memuat'))
      .finally(() => setLoading(false))
  }, [isOpen, type, userId])

  const handleToggleFollow = async (targetId) => {
    if (!requireAuth('login')) return
    setItems((current) =>
      current.map((item) =>
        item.id === targetId ? { ...item, isFollowing: !item.isFollowing } : item,
      ),
    )
    try {
      const target = items.find((i) => i.id === targetId)
      if (target?.isFollowing) {
        await unfollowUser(targetId)
      } else {
        await followUser(targetId)
      }
    } catch {
      setItems((current) =>
        current.map((item) =>
          item.id === targetId ? { ...item, isFollowing: !item.isFollowing } : item,
        ),
      )
    }
  }

  if (!isOpen) return null

  const currentUserId = user?.id

  return (
    <div className="mood-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="mood-modal mood-modal-compact" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>{type === 'followers' ? 'Followers' : 'Following'}</h2>
        <div className="follow-list">
          {loading ? (
            <p className="follow-list-state">Memuat...</p>
          ) : error ? (
            <p className="follow-list-state error">{error}</p>
          ) : items.length === 0 ? (
            <p className="follow-list-state">Tidak ada {type === 'followers' ? 'followers' : 'following'}.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="follow-list-row">
                <Link to={`/user/${item.username}`} className="follow-list-item" onClick={onClose}>
                  <div className="follow-list-avatar">
                    <CroppedProfileImage
                      src={item.avatarUrl}
                      circle
                      fallback={<div className="profile-avatar-empty"><User size={20} /></div>}
                    />
                  </div>
                  <div className="follow-list-info">
                    <span className="follow-list-name">{item.displayName}</span>
                    <span className="follow-list-username">@{item.username}</span>
                  </div>
                </Link>
                {currentUserId && item.id !== currentUserId && (
                  <button
                    type="button"
                    className={`follow-list-follow ${item.isFollowing ? 'following' : ''}`}
                    onClick={() => handleToggleFollow(item.id)}
                  >
                    {item.isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    {item.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default FollowListModal
