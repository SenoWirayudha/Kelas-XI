import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flag, Globe, MapPin, MoreVertical, UserPlus, UserCheck } from 'lucide-react'
import { detectPlatform, SocialLinkIcon, toAbsoluteUrl } from '../components/SocialLinkIcon'
import CommunityPostCard from '../components/CommunityPostCard'
import CroppedProfileImage from '../components/CroppedProfileImage'
import FollowListModal from '../components/FollowListModal'
import ReportModal from '../components/ReportModal'
import ResponsiveMasonry from '../components/ResponsiveMasonry'
import { useAuth } from '../context/authState'
import { followUser, unfollowUser } from '../lib/api/follows'
import { getUserPosts, likePost, savePost, unlikePost, unsavePost } from '../lib/api/posts'
import { getPublicProfile } from '../lib/api/profiles'
import { listPublicUserBoards } from '../lib/api/boards'

const formatCount = (value = 0) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
const estimatePostHeight = (post, columnWidth) => {
  const ratio = post.cover?.width && post.cover?.height ? post.cover.width / post.cover.height : 1
  return columnWidth / Math.max(0.35, ratio) + 98
}

function UserProfile() {
  const navigate = useNavigate()
  const { username } = useParams()
  const { user, requireAuth } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [boards, setBoards] = useState([])
  const [activeTab, setActiveTab] = useState('posts')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followList, setFollowList] = useState({ isOpen: false, type: '' })
  const [reportUserId, setReportUserId] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)

  const isOwner = user?.username?.toLowerCase() === username?.toLowerCase()

  const load = useCallback(async () => {
    if (!username) return
    setIsLoading(true)
    setError('')
    try {
      const [profilePayload, postsPayload, boardsPayload] = await Promise.all([
        getPublicProfile(username),
        getUserPosts(username),
        listPublicUserBoards(username),
      ])
      setProfile(profilePayload.profile)
      setPosts(postsPayload.items)
      setBoards(boardsPayload.boards || [])
      setIsFollowing(profilePayload.profile?.isFollowing || false)
    } catch (nextError) {
      setError(nextError.message || 'Profile gagal dimuat')
    } finally {
      setIsLoading(false)
    }
  }, [username])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!showProfileMenu) return undefined
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setShowProfileMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showProfileMenu])

  const handleToggleFollow = async () => {
    if (!requireAuth('login')) return
    if (!profile) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await unfollowUser(profile.id)
        setIsFollowing(false)
        setProfile((p) => ({ ...p, followerCount: Math.max(0, p.followerCount - 1) }))
      } else {
        await followUser(profile.id)
        setIsFollowing(true)
        setProfile((p) => ({ ...p, followerCount: p.followerCount + 1 }))
      }
    } catch {
      // handled
    } finally {
      setFollowLoading(false)
    }
  }

  const handleToggleLike = async (post) => {
    if (!requireAuth('login')) return
    const nextLiked = !post.isLiked
    setPosts((list) => list.map((item) => (
      item.id === post.id
        ? { ...item, isLiked: nextLiked, likeCount: Math.max(0, (item.likeCount || 0) + (nextLiked ? 1 : -1)) }
        : item
    )))
    try {
      await (nextLiked ? likePost(post.id) : unlikePost(post.id))
    } catch {
      setPosts((list) => list.map((item) => item.id === post.id ? post : item))
    }
  }

  const handleToggleSave = async (post) => {
    if (!requireAuth('login')) return
    const nextSaved = !post.isSaved
    setPosts((list) => list.map((item) => (
      item.id === post.id
        ? { ...item, isSaved: nextSaved, saveCount: Math.max(0, item.saveCount + (nextSaved ? 1 : -1)) }
        : item
    )))
    try {
      await (nextSaved ? savePost(post.id) : unsavePost(post.id))
    } catch {
      setPosts((list) => list.map((item) => item.id === post.id ? post : item))
    }
  }

  if (isLoading) return <p className="community-state">Memuat profile...</p>
  if (error || !profile) return <p className="community-state error">{error || 'Profile tidak ditemukan'}</p>

  return (
    <section className="profile-page">
      <div className="profile-header">
        <div className="profile-backdrop">
          <CroppedProfileImage src={profile.bannerUrl} crop={profile.metadata?.bannerCrop} />
        </div>
      </div>

      <div className="profile-container" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="profile-hero">
          <div className="profile-left">
            <div className="profile-avatar">
              <CroppedProfileImage
                src={profile.avatarUrl}
                crop={profile.metadata?.avatarCrop}
                circle
                fallback={<div className="profile-avatar-empty"><span className="avatar-initial" style={{ fontSize: '48px' }}>{(profile?.displayName || profile?.username || '?')[0].toUpperCase()}</span></div>}
              />
            </div>
            <div className="profile-info">
              <div>
                <h1>{profile.displayName}</h1>
                <p className="profile-handle">@{profile.username}</p>
              </div>
              <p className="profile-bio">{profile.bio || 'Belum ada bio.'}</p>
              <div className="profile-links">
                {profile.location && (
                  <a href={`https://www.google.com/maps?q=${encodeURIComponent(profile.location)}`} target="_blank" rel="noopener noreferrer" className="profile-link-item" title={profile.location}>
                    <MapPin size={14} />
                    {profile.location}
                  </a>
                )}
                {profile.websiteUrl && (
                  <a href={toAbsoluteUrl(profile.websiteUrl)} target="_blank" rel="noopener noreferrer" className="profile-link-item" title={profile.websiteUrl}>
                    <Globe size={14} />
                    {profile.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {(() => {
                  const socialUrl = profile.socialLinks?.main
                  if (!socialUrl) return null
                  const { platform, domain } = detectPlatform(socialUrl)
                  return (
                    <a key="social" href={toAbsoluteUrl(socialUrl)} target="_blank" rel="noopener noreferrer" className="profile-link-item" title={socialUrl}>
                      <SocialLinkIcon platform={platform} />
                      {domain || socialUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )
                })()}
              </div>
              <div className="profile-stats">
                <button type="button" className="profile-stat-btn" onClick={() => setFollowList({ isOpen: true, type: 'followers' })}>
                  <strong>{formatCount(profile.followerCount)}</strong><span>Followers</span>
                </button>
                <button type="button" className="profile-stat-btn" onClick={() => setFollowList({ isOpen: true, type: 'following' })}>
                  <strong>{formatCount(profile.followingCount)}</strong><span>Following</span>
                </button>
                <div><strong>{formatCount(profile.boardCount)}</strong><span>Boards</span></div>
                <div><strong>{formatCount(profile.postCount)}</strong><span>Posts</span></div>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            {!isOwner && (
              <button
                type="button"
                className={`profile-follow ${isFollowing ? 'following' : ''}`}
                onClick={handleToggleFollow}
                disabled={followLoading}
              >
                {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            {!isOwner && (
              <div className="profile-menu-wrapper" ref={profileMenuRef}>
                <button type="button" className="profile-menu-btn" onClick={() => setShowProfileMenu((prev) => !prev)} title="More">
                  <MoreVertical size={18} />
                </button>
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <button type="button" className="profile-dropdown-item" onClick={() => { setShowProfileMenu(false); setReportUserId(profile.id) }}>
                      <Flag size={14} /> Laporkan Pengguna
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="profile-content">
          <nav className="profile-tabs" aria-label="Profile sections">
            <button type="button" className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Posts</button>
            {boards.length > 0 && <button type="button" className={`profile-tab ${activeTab === 'boards' ? 'active' : ''}`} onClick={() => setActiveTab('boards')}>Boards</button>}
          </nav>
          {activeTab === 'posts' ? (
            <>
              <ResponsiveMasonry items={posts} estimateHeight={estimatePostHeight} renderItem={(post) => (
                <CommunityPostCard key={post.id} post={post} isOwner={false} onToggleLike={handleToggleLike} onToggleSave={handleToggleSave} />
              )} />
              {posts.length === 0 && <p className="community-state">Belum ada workspace yang dipublish.</p>}
            </>
          ) : (
            <div className="boards-grid">
              {boards.map((board) => (
                <article key={board.id} className="board-card" onClick={() => navigate(`/boards/${board.id}`)}>
                  <div className="board-cover">
                    {(board.coverImages || []).slice(0, 4).map((url, index) => (
                      <div key={`${url || 'empty'}-${index}`} className="board-thumb" style={url ? { backgroundImage: `url("${url}")` } : undefined} />
                    ))}
                  </div>
                  <div className="board-card-header">
                    <h3 className="board-title">{board.name}</h3>
                  </div>
                  <div className="board-meta">
                    <span>{board.itemCount} items</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
      <FollowListModal
        isOpen={followList.isOpen}
        type={followList.type}
        userId={profile.id}
        onClose={() => setFollowList({ isOpen: false, type: '' })}
      />
      <ReportModal isOpen={!!reportUserId} targetType="user" targetId={reportUserId} onClose={() => setReportUserId(null)} />
    </section>
  )
}

export default UserProfile
