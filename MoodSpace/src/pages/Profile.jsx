import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FolderPlus, Globe, MapPin, User } from 'lucide-react'
import { detectPlatform, SocialLinkIcon, toAbsoluteUrl } from '../components/SocialLinkIcon'
import BoardPickerModal from '../components/BoardPickerModal'
import CommunityPostCard from '../components/CommunityPostCard'
import ConfirmationModal from '../components/ConfirmationModal'
import CropImageModal from '../components/CropImageModal'
import CroppedProfileImage from '../components/CroppedProfileImage'
import EditProfileModal from '../components/EditProfileModal'
import FollowListModal from '../components/FollowListModal'
import NewBoardModal from '../components/NewBoardModal'
import ResponsiveMasonry from '../components/ResponsiveMasonry'
import { useAuth } from '../context/authState'
import { addBoardItem, listBoards } from '../lib/api/boards'
import { updateCurrentProfile } from '../lib/api/auth'
import { getSavedExternalImages, saveExternalImage, unsaveExternalImage } from '../lib/api/externalImages'
import { deletePost as deletePostApi, getSavedPosts, getUserPosts, likePost, savePost, unlikePost, unsavePost } from '../lib/api/posts'
import { getPublicProfile } from '../lib/api/profiles'
import { externalImageToPost, postToExternalImagePayload } from '../utils/externalImagePost'

const formatCount = (value = 0) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
const estimatePostHeight = (post, columnWidth) => {
  const ratio = post.cover?.width && post.cover?.height ? post.cover.width / post.cover.height : 1
  return columnWidth / Math.max(0.35, ratio) + 98
}

function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const headerRef = useRef(null)
  const { user, isLoading: isAuthLoading, requireAuth, reloadUser } = useAuth()
  const [activeTab, setActiveTab] = useState('posts')
  const [profile, setProfile] = useState(null)
  const [boards, setBoards] = useState([])
  const [posts, setPosts] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [boardPicker, setBoardPicker] = useState({ isOpen: false, post: null })
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileCropRequest, setProfileCropRequest] = useState(null)
  const [profileCropResult, setProfileCropResult] = useState(null)
  const [bannerAspectRatio, setBannerAspectRatio] = useState(16 / 5)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [followList, setFollowList] = useState({ isOpen: false, type: '' })

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    if (!headerRef.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setBannerAspectRatio(width / height)
    })
    observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [isLoading, profile])

  const loadProfile = useCallback(() => {
    if (isAuthLoading) return
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    Promise.all([
      getPublicProfile(user.username),
      listBoards(),
      getUserPosts(user.username),
      getSavedPosts(),
      getSavedExternalImages(),
    ])
      .then(([profilePayload, boardsPayload, postsPayload, savedPayload, savedExternalPayload]) => {
        setProfile(profilePayload.profile)
        setBoards(boardsPayload.boards)
        setPosts(postsPayload.items)
        setSavedPosts([...(savedPayload.items || []), ...(savedExternalPayload.items || []).map(externalImageToPost)])
      })
      .catch((nextError) => setError(nextError.message || 'Profile gagal dimuat'))
      .finally(() => setIsLoading(false))
  }, [isAuthLoading, user])

  useEffect(() => { loadProfile() }, [loadProfile])

  useEffect(() => {
    const onFocus = () => { if (!isAuthLoading && user) loadProfile() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [isAuthLoading, user, loadProfile])

  useEffect(() => {
    if (location.state?.openEditProfile) {
      setIsEditProfileOpen(true)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const handleToggleSave = async (post) => {
    if (!requireAuth('login')) return
    const nextSaved = !post.isSaved
    const patchList = (list) => list.map((item) => (
      item.id === post.id
        ? { ...item, isSaved: nextSaved, saveCount: Math.max(0, item.saveCount + (nextSaved ? 1 : -1)) }
        : item
    ))
    setPosts(patchList)
    setSavedPosts((current) => nextSaved
      ? [post, ...current.filter((item) => item.id !== post.id)]
      : current.filter((item) => item.id !== post.id))
    try {
      if (post.isExternalImage) {
        await (nextSaved ? saveExternalImage(postToExternalImagePayload(post)) : unsaveExternalImage(post.id))
      } else {
        await (nextSaved ? savePost(post.id) : unsavePost(post.id))
      }
    } catch {
      setPosts((current) => current.map((item) => item.id === post.id ? post : item))
    }
  }

  const handleToggleLike = async (post) => {
    if (!requireAuth('login')) return
    const nextLiked = !post.isLiked
    const patchList = (list) => list.map((item) => (
      item.id === post.id
        ? { ...item, isLiked: nextLiked, likeCount: Math.max(0, (item.likeCount || 0) + (nextLiked ? 1 : -1)) }
        : item
    ))
    setPosts(patchList)
    setSavedPosts(patchList)
    try {
      await (nextLiked ? likePost(post.id) : unlikePost(post.id))
    } catch {
      setPosts((current) => current.map((item) => item.id === post.id ? post : item))
      setSavedPosts((current) => current.map((item) => item.id === post.id ? post : item))
    }
  }

  const handleAddToBoard = async (post) => {
    if (!requireAuth('login')) return
    if (boards.length === 1) {
      const body = post.isExternalImage ? { externalImage: postToExternalImagePayload(post) } : { postId: post.id }
      await addBoardItem(boards[0].id, body)
      setToastMessage(`Disimpan ke ${boards[0].name}`)
      return
    }
    setBoardPicker({ isOpen: true, post })
  }

  const handleSelectBoard = async (board) => {
    if (!boardPicker.post) return
    const body = boardPicker.post.isExternalImage ? { externalImage: postToExternalImagePayload(boardPicker.post) } : { postId: boardPicker.post.id }
    await addBoardItem(board.id, body)
    setToastMessage(`Disimpan ke ${board.name}`)
    setBoardPicker({ isOpen: false, post: null })
  }

  const handleCreateBoardForPost = async (board) => {
    if (!boardPicker.post) return
    setBoards((current) => [board, ...current])
    const body = boardPicker.post.isExternalImage ? { externalImage: postToExternalImagePayload(boardPicker.post) } : { postId: boardPicker.post.id }
    await addBoardItem(board.id, body)
    setToastMessage(`Disimpan ke ${board.name}`)
    setIsNewBoardModalOpen(false)
    setBoardPicker({ isOpen: false, post: null })
  }

  const handleDeleteClick = (post) => {
    setDeleteTarget(post)
  }

  const confirmDeletePost = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deletePostApi(deleteTarget.id)
      setPosts((current) => current.filter((p) => p.id !== deleteTarget.id))
      setSavedPosts((current) => current.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditProfile = async (values) => {
    setIsSavingProfile(true)
    try {
      const payload = await updateCurrentProfile(values)
      await reloadUser()
      const refreshed = await getPublicProfile(payload.user.username)
      setProfile(refreshed.profile)
      setIsEditProfileOpen(false)
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (!isAuthLoading && !user) {
    return (
      <section className="profile-page">
        <p className="community-state">Login untuk membuka profile.</p>
        <button type="button" className="new-board-btn" onClick={() => requireAuth('login')}>Login</button>
      </section>
    )
  }
  if (isLoading) return <p className="community-state">Memuat profile...</p>
  if (error || !profile) return <p className="community-state error">{error || 'Profile tidak ditemukan'}</p>

  return (
    <section className="profile-page">
      <div className="profile-header" ref={headerRef}>
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
                fallback={<div className="profile-avatar-empty"><User size={40} /></div>}
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
            <button type="button" className="profile-follow" onClick={() => setIsEditProfileOpen(true)}>
              Edit Profile
            </button>
          </div>
        </div>

        <nav className="profile-tabs" aria-label="Profile sections">
          {[
            ['posts', 'Posts'],
            ['boards', 'Boards'],
            ['saved', 'Saved'],
          ].map(([id, label]) => (
            <button
              type="button"
              className={`profile-tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
              key={id}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="profile-content">
          {activeTab === 'posts' && (
            <>
              <ResponsiveMasonry items={posts} estimateHeight={estimatePostHeight} renderItem={(post) => <CommunityPostCard key={post.id} post={post} isOwner onToggleLike={handleToggleLike} onToggleSave={handleToggleSave} onAddToBoard={handleAddToBoard} onDeleteClick={handleDeleteClick} />} />
              {posts.length === 0 && <p className="community-state">Belum ada workspace yang dipublish.</p>}
            </>
          )}

          {activeTab === 'boards' && (
            <section className="boards-grid">
              {boards.map((board) => (
                <article className="board-card" key={board.id} onClick={() => navigate(`/boards/${board.id}`)}>
                  <div className="board-cover">
                    {Array.from({ length: 4 }, (_, index) => (
                      <div
                        className="board-thumb"
                        key={index}
                        style={board.coverImages[index] ? { backgroundImage: `url("${board.coverImages[index]}")` } : undefined}
                      />
                    ))}
                  </div>
                  <h3 className="board-title">{board.name}</h3>
                  <div className="board-meta"><span>{board.itemCount} items</span></div>
                </article>
              ))}
              {boards.length === 0 && <p className="community-state">Belum ada board.</p>}
            </section>
          )}

          {activeTab === 'saved' && (
            <>
              <ResponsiveMasonry items={savedPosts} estimateHeight={estimatePostHeight} renderItem={(post) => <CommunityPostCard key={post.id} post={post} onToggleLike={handleToggleLike} onToggleSave={handleToggleSave} onAddToBoard={handleAddToBoard} />} />
              {savedPosts.length === 0 && <p className="community-state">Belum ada post tersimpan.</p>}
            </>
          )}
        </div>
      </div>
      <BoardPickerModal
        isOpen={boardPicker.isOpen}
        boards={boards}
        postTitle={boardPicker.post?.title}
        onCancel={() => setBoardPicker({ isOpen: false, post: null })}
        onSelect={handleSelectBoard}
        onCreate={() => setIsNewBoardModalOpen(true)}
      />
      <NewBoardModal
        isOpen={isNewBoardModalOpen}
        onCancel={() => setIsNewBoardModalOpen(false)}
        onCreated={handleCreateBoardForPost}
      />
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete post?"
        description={deleteTarget ? `"${deleteTarget.title || 'this post'}" will be permanently deleted.` : ''}
        confirmLabel="Delete Post"
        isConfirming={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeletePost}
      />
      <EditProfileModal
        isOpen={isEditProfileOpen}
        profile={profile}
        bannerAspectRatio={bannerAspectRatio}
        isSaving={isSavingProfile}
        onCancel={() => setIsEditProfileOpen(false)}
        onSave={handleEditProfile}
        onRequestCrop={setProfileCropRequest}
        cropResult={profileCropResult}
      />
      <CropImageModal
        isOpen={!!profileCropRequest}
        file={profileCropRequest?.file}
        mode={profileCropRequest?.mode || 'banner'}
        aspectRatio={bannerAspectRatio}
        onCancel={() => setProfileCropRequest(null)}
        onSave={(payload) => {
          setProfileCropResult({
            id: `${profileCropRequest?.mode || 'crop'}-${Date.now()}`,
            mode: profileCropRequest?.mode || 'banner',
            file: payload.file,
            crop: payload.crop,
          })
          setProfileCropRequest(null)
        }}
      />
      <FollowListModal
        isOpen={followList.isOpen}
        type={followList.type}
        userId={user?.id}
        onClose={() => setFollowList({ isOpen: false, type: '' })}
      />
      {toastMessage && (
        <div className="post-detail-toast" role="status" aria-live="polite">
          <FolderPlus size={15} />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  )
}

export default Profile
