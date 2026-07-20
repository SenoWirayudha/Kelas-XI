import { useCallback, useEffect, useRef, useState } from 'react'
import { Bookmark, Download, Edit3, Eye, Flag, FolderPlus, GitFork, Heart, Images, Lock, MoreHorizontal, Trash2, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authState'
import { ensureExternalImage } from '../lib/api/externalImages'
import { postToExternalImagePayload } from '../utils/externalImagePost'
import MasonryImage from './MasonryImage'
import ReportModal from './ReportModal'
import ConfirmationModal from './ConfirmationModal'
import { useAsTemplate } from '../lib/api/workspaces'

const formatCount = (value = 0) => (
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
)

const getExtensionFromUrl = (url = '') => {
  const cleanUrl = url.split('?')[0]
  const extension = cleanUrl.split('.').pop()?.toLowerCase()
  return extension && extension.length <= 5 ? extension : 'jpg'
}

const safeFileName = (value = 'moodspace-post') => (
  value.toLowerCase().trim().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'moodspace-post'
)

function CommunityPostCard({ post, isOwner, onToggleLike, onToggleSave, onAddToBoard, onDeleteClick }) {
  const navigate = useNavigate()
  const { user: currentUser, requireAuth } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [reportPostId, setReportPostId] = useState(null)
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false)
  const [isForking, setIsForking] = useState(false)
  const menuRef = useRef(null)
  const isDraft = post.status === 'draft'
  const isExternalImage = !!post.isExternalImage
  const isOwnPost = isOwner || currentUser?.id === post.author?.id
  const ratio = post.cover?.width && post.cover?.height
    ? post.cover.width / post.cover.height
    : 1

  useEffect(() => {
    if (!showMenu) return undefined
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  const handleEdit = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setShowMenu(false)
    navigate(`/posts/new?edit=${post.id}`)
  }, [navigate, post.id])

  const handleDelete = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setShowMenu(false)
    onDeleteClick?.(post)
  }, [post, onDeleteClick])

  const handleOpenCard = useCallback(async (event) => {
    if (!isExternalImage) return
    event.preventDefault()
    try {
      await ensureExternalImage(postToExternalImagePayload(post))
    } catch {
      // Detail can still try to load if the image was saved earlier.
    }
    navigate(`/external/${encodeURIComponent(post.id)}`)
  }, [isExternalImage, navigate, post])

  const handleReport = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setShowMenu(false)
    setReportPostId(post.id)
  }, [post.id])

  const handleSave = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!onToggleSave || isSaving) return
    setIsSaving(true)
    try {
      await onToggleSave(post)
    } finally {
      setIsSaving(false)
      setShowMenu(false)
    }
  }

  const handleLike = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (isExternalImage || !onToggleLike || isSaving) return
    setIsSaving(true)
    try {
      await onToggleLike(post)
    } finally {
      setIsSaving(false)
      setShowMenu(false)
    }
  }

  const handleAddToBoard = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (onAddToBoard) await onAddToBoard(post)
    setShowMenu(false)
  }

  const handleDownload = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const media = post.cover || post.media?.[0]
    if (!media?.url) return

    const filename = `${safeFileName(post.title || post.id)}-cover.${getExtensionFromUrl(media.url)}`
    try {
      const response = await fetch(media.url, { mode: 'cors' })
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(media.url, '_blank', 'noopener,noreferrer')
    } finally {
      setShowMenu(false)
    }
  }

  return (
    <>
    <article className={`gallery-card${showMenu ? ' has-open-menu' : ''}`}>
      <Link
        to={isExternalImage ? `/external/${encodeURIComponent(post.id)}` : isDraft ? `/posts/new?draft=${post.id}` : `/post/${post.id}`}
        className="gallery-link"
        onClick={handleOpenCard}
      >
        {post.cover?.url ? (
          <MasonryImage
            imageKey={post.cover.url}
            alt={post.title || 'Published workspace'}
            className="gallery-art"
            fallbackRatio={ratio}
          >
            {isDraft && <span className="gallery-draft-badge">Draft</span>}
            {!isDraft && post.visibility === 'private' && (
              <span className="gallery-visibility-badge gallery-visibility-private" title="Private">
                <Lock size={12} />
              </span>
            )}
            {!isDraft && post.visibility === 'unlisted' && (
              <span className="gallery-visibility-badge gallery-visibility-unlisted" title="Hanya teman">
                <Users size={12} />
              </span>
            )}
            {!isDraft && post.media?.length > 1 && (
              <span className="gallery-carousel-badge" title={`${post.media.length} images`}>
                <Images size={14} />
                {post.media.length}
              </span>
            )}
            <div className="gallery-card-overlay">
              <div className="gallery-card-actions">
                {!isDraft && !isExternalImage && <button
                  type="button"
                  className={`gallery-action-btn ${post.isLiked ? 'active' : ''}`}
                  title={post.isLiked ? 'Unlike' : 'Like'}
                  disabled={isSaving}
                  onClick={handleLike}
                >
                  <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
                </button>}
                {!isDraft && onAddToBoard && (
                  <button type="button" className="gallery-action-btn" title="Add to board" onClick={handleAddToBoard}>
                    <FolderPlus size={18} />
                  </button>
                )}
                {!isDraft && (
                  <button type="button" className="gallery-action-btn" title="Download cover image" onClick={handleDownload}>
                    <Download size={18} />
                  </button>
                )}
                {!isDraft && !isExternalImage && (post.workspaceId || post.metadata?.templateWorkspaceId) && (post.isTemplate || post.metadata?.source === 'workspace') && (
                  <button type="button" className="gallery-action-btn" title="Gunakan sebagai template" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTemplateConfirm(true) }}>
                    <GitFork size={18} />
                  </button>
                )}
              </div>
            </div>
          </MasonryImage>
        ) : (
          <div className="community-post-placeholder">
            {isDraft && <span className="gallery-draft-badge">Draft</span>}
            Preview belum tersedia
          </div>
        )}
      </Link>

      <div className="gallery-card-metadata">
        <div className="metadata-left">
          <Link to={isExternalImage ? `/external/${encodeURIComponent(post.id)}` : `/user/${post.author.username}`} className={`metadata-author ${isExternalImage ? 'external-source' : ''}`} onClick={(e) => e.stopPropagation()}>
            {!isExternalImage && (
    <div
      className="author-avatar"
      style={post.author.avatarUrl ? { backgroundImage: `url("${post.author.avatarUrl}")` } : undefined}
    >
      {!post.author.avatarUrl && <span className="avatar-initial" style={{ fontSize: '9px' }}>{(post.author.displayName || post.author.username || '?')[0].toUpperCase()}</span>}
    </div>
            )}
            <span className="author-username">{isExternalImage ? post.author.username : `@${post.author.username}`}</span>
          </Link>
          <h3 className="metadata-title">{post.title || 'Untitled workspace'}</h3>
          {post.metadata?.source === 'workspace' && <span className="gallery-template-badge">MoodSpace</span>}
        </div>
        <div className="metadata-right">
          {!isDraft && (
            <div className="metadata-menu-wrapper" ref={menuRef}>
              <button type="button" className="metadata-menu-btn" aria-label="Post options" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setShowMenu((current) => !current) }}>
                <MoreHorizontal size={16} strokeWidth={2} />
              </button>
              {showMenu && (
                <div className="metadata-dropdown-menu">
                  {!isExternalImage && onToggleLike && (
                    <button type="button" className="metadata-dropdown-item" onClick={handleLike} disabled={isSaving}>
                      <Heart size={13} fill={post.isLiked ? 'currentColor' : 'none'} /> {post.isLiked ? 'Unlike' : 'Like'}
                    </button>
                  )}
                  <button type="button" className="metadata-dropdown-item" onClick={handleSave} disabled={isSaving}>
                    <Bookmark size={13} fill={post.isSaved ? 'currentColor' : 'none'} /> {post.isSaved ? 'Unsave' : 'Save'}
                  </button>
                  {onAddToBoard && (
                    <button type="button" className="metadata-dropdown-item" onClick={handleAddToBoard}>
                      <FolderPlus size={13} /> Add to board
                    </button>
                  )}
                  {!isExternalImage && (post.workspaceId || post.metadata?.templateWorkspaceId) && (post.isTemplate || post.metadata?.source === 'workspace') && (
                    <button type="button" className="metadata-dropdown-item" onClick={() => { setShowMenu(false); setShowTemplateConfirm(true) }}>
                      <GitFork size={13} /> Sesuaikan
                    </button>
                  )}
                  <button type="button" className="metadata-dropdown-item" onClick={handleDownload}>
                    <Download size={13} /> Download
                  </button>
                  {!isExternalImage && !isOwnPost && (
                    <button type="button" className="metadata-dropdown-item" onClick={handleReport}>
                      <Flag size={13} /> Laporkan
                    </button>
                  )}
                  {isOwner && <>
                    <span className="metadata-dropdown-divider" />
                    <button type="button" className="metadata-dropdown-item" onClick={handleEdit}>
                      <Edit3 size={13} /> Edit
                    </button>
                    <button type="button" className="metadata-dropdown-item danger" onClick={handleDelete}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </>}
                </div>
              )}
            </div>
          )}
          <div className="metadata-stats">
            {isDraft ? <span className="stat-item">Draft</span> : isExternalImage ? (
              <span className="stat-item">{post.externalProvider || 'Open image'}</span>
            ) : <>
            <span className="stat-item">
              <Heart size={13} strokeWidth={2} />
              {formatCount(post.likeCount)}
            </span>
            <span className="stat-item">
              <Bookmark size={13} strokeWidth={2} />
              {formatCount(post.saveCount)}
            </span>
            {isOwnPost && (
              <span className="stat-item" title={`${formatCount(post.uniqueViewCount)} unique viewers`}>
                <Eye size={13} strokeWidth={2} />
                {formatCount(post.viewCount)}
              </span>
            )}
            </>}
          </div>
        </div>
      </div>
    </article>
      <ReportModal isOpen={!!reportPostId} targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />

      <ConfirmationModal
        isOpen={showTemplateConfirm}
        title="Gunakan Template"
        description={`Apakah kamu yakin ingin menggunakan "${post.title || 'template ini'}" sebagai template? Workspace baru akan dibuat untukmu.`}
        confirmLabel="Ya, Gunakan"
        cancelLabel="Batal"
        isDanger={false}
        isConfirming={isForking}
        onConfirm={async () => {
          if (!currentUser) {
            setShowTemplateConfirm(false)
            requireAuth('login')
            return
          }
          setIsForking(true)
          try {
            const workspaceId = post.workspaceId || post.metadata?.templateWorkspaceId
            const result = await useAsTemplate(workspaceId)
            console.log('[post-card] Fork result:', result)
            navigate(`/workspace?projectId=${result.workspaceId}`)
          } catch (error) {
            console.error('[post-card] Fork error:', error)
          } finally {
            setIsForking(false)
            setShowTemplateConfirm(false)
          }
        }}
        onCancel={() => setShowTemplateConfirm(false)}
      />
    </>
  )
}

export default CommunityPostCard
