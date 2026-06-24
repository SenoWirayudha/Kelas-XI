import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bookmark, ChevronLeft, ChevronRight, Download, Eye, Flag, FolderPlus, Heart, LoaderCircle, Lock, MoreVertical, Share2, Trash2, User, Users } from 'lucide-react'
import BoardPickerModal from '../components/BoardPickerModal'
import CommunityPostCard from '../components/CommunityPostCard'
import ConfirmationModal from '../components/ConfirmationModal'
import NewBoardModal from '../components/NewBoardModal'
import MasonryImage from '../components/MasonryImage'
import ReportModal from '../components/ReportModal'
import ResponsiveMasonry from '../components/ResponsiveMasonry'
import { Skeleton, createSkeletonItems } from '../components/Skeleton'
import { useAuth } from '../context/authState'
import { addBoardItem, listBoards, removeBoardItem } from '../lib/api/boards'
import { createComment, deleteComment, listComments } from '../lib/api/comments'
import { saveExternalImage, searchExternalImages, unsaveExternalImage } from '../lib/api/externalImages'
import { getHomeFeed, getPost, getRecommendedPosts, likePost, savePost, unlikePost, unsavePost } from '../lib/api/posts'
import { externalImageToPost, postToExternalImagePayload } from '../utils/externalImagePost'

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const getExtensionFromUrl = (url = '') => {
  const cleanUrl = url.split('?')[0]
  const extension = cleanUrl.split('.').pop()?.toLowerCase()
  return extension && extension.length <= 5 ? extension : 'jpg'
}

const safeFileName = (value = 'moodspace-post') => (
  value.toLowerCase().trim().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'moodspace-post'
)

function CommentItem({ comment, currentUser, onDelete, onReport }) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!showMenu) return undefined
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  return (
    <div className="comment-item" key={comment.id}>
      {comment.avatarUrl ? (
        <div className="comment-avatar" style={{ backgroundImage: `url("${comment.avatarUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      ) : (
        <div className="comment-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={20} color="white" />
        </div>
      )}
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">{comment.displayName || comment.username}</span>
          <span className="comment-timestamp">{timeAgo(comment.createdAt)}</span>
          <div className="comment-actions" ref={menuRef}>
            <button type="button" className="comment-action-btn" onClick={() => setShowMenu((prev) => !prev)} title="More">
              <MoreVertical size={12} />
            </button>
            {showMenu && (
              <div className="comment-dropdown">
                {currentUser?.id !== comment.authorId && (
                  <button type="button" className="comment-dropdown-item" onClick={() => { setShowMenu(false); onReport(comment.id) }}>
                    <Flag size={12} /> Laporkan
                  </button>
                )}
                {currentUser?.id === comment.authorId && (
                  <button type="button" className="comment-dropdown-item danger" onClick={() => { setShowMenu(false); onDelete(comment.id) }}>
                    <Trash2 size={12} /> Hapus
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="comment-text">{comment.content}</p>
      </div>
    </div>
  )
}

const RECOMMENDED_SKELETON_COUNT = 4
const estimatePostHeight = (post, columnWidth) => {
  const ratio = post.cover?.width && post.cover?.height ? post.cover.width / post.cover.height : 1
  return columnWidth / Math.max(0.35, ratio) + 98
}
const feedEstimateHeight = (item, columnWidth) => {
  if (item._isSkeleton) return item._height
  return estimatePostHeight(item, columnWidth)
}

function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { requireAuth, user: currentUser } = useAuth()
  const [post, setPost] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [boardPicker, setBoardPicker] = useState({ isOpen: false, post: null, boards: [] })
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsCursor, setCommentsCursor] = useState(null)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [recommendedPosts, setRecommendedPosts] = useState([])
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)
  const [hasMoreRecommended, setHasMoreRecommended] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [reportPostId, setReportPostId] = useState(null)
  const [reportCommentId, setReportCommentId] = useState(null)
  const [toastData, setToastData] = useState(null)
  const moreMenuRef = useRef(null)
  const recommendedSentinelRef = useRef(null)
  const recommendedLoadingRef = useRef(false)
  const recommendedOffsetRef = useRef(0)
  const recommendedExternalCursorRef = useRef(null)
  const recommendedQueryRef = useRef('')

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setRecommendedPosts([])
    setHasMoreRecommended(false)
    recommendedOffsetRef.current = 0
    recommendedExternalCursorRef.current = null
    recommendedQueryRef.current = ''
    setIsLoadingRecommended(false)
    getPost(id)
      .then((payload) => {
        if (cancelled) return
        setPost(payload.post)
        if (payload.post.allowComments !== false) {
          listComments(id).then((result) => {
            if (cancelled) return
            setComments(result.comments)
            setCommentsCursor(result.nextCursor)
            setHasMoreComments(!!result.nextCursor)
          }).catch(() => {})
        }
        setIsLoadingRecommended(true)
        const titleTokens = (payload.post.title || '').split(/\s+/).filter(Boolean)
        const externalQuery = titleTokens.slice(0, 5).join(' ') || (payload.post.tags || []).slice(0, 3).join(' ') || 'design inspiration'
        recommendedQueryRef.current = externalQuery || 'design inspiration'
        getRecommendedPosts(id, { limit: 8, offset: 0 }).then(async (result) => {
          if (cancelled) return
          const items = result.items || []
          recommendedOffsetRef.current = result.nextOffset
          const external = await searchExternalImages({ q: recommendedQueryRef.current, limit: 6 }).catch(() => ({ items: [], nextCursor: null }))
          recommendedExternalCursorRef.current = external.nextCursor || null
          const externalItems = (external.items || []).map(externalImageToPost)
          setHasMoreRecommended(!!result.nextOffset || !!external.nextCursor)
          if (items.length > 0) {
            setRecommendedPosts([...items, ...externalItems])
            return
          }
          return getHomeFeed({ limit: 9 }).then((fallback) => {
            if (cancelled) return
            recommendedOffsetRef.current = fallback.nextCursor
            setHasMoreRecommended(!!fallback.nextCursor || !!external.nextCursor)
            const filtered = (fallback.items || []).filter((item) => item.id !== id).slice(0, 8)
            setRecommendedPosts([...filtered, ...externalItems])
          }).catch(() => {
            if (!cancelled) setRecommendedPosts([])
          })
        }).catch(() => {
          return getHomeFeed({ limit: 9 }).then((fallback) => {
            if (cancelled) return
            recommendedOffsetRef.current = fallback.nextCursor
            setHasMoreRecommended(!!fallback.nextCursor)
            setRecommendedPosts((fallback.items || []).filter((item) => item.id !== id).slice(0, 8))
          }).catch(() => {
            if (!cancelled) setRecommendedPosts([])
          })
        }).finally(() => {
          if (!cancelled) setIsLoadingRecommended(false)
        })
      })
      .catch((nextError) => setError(nextError.message || 'Post gagal dimuat'))
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!isMoreOpen) return undefined
    const handlePointerDown = (event) => {
      if (moreMenuRef.current?.contains(event.target)) return
      setIsMoreOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isMoreOpen])

  useEffect(() => {
    if (!toastData) return undefined
    const timer = window.setTimeout(() => setToastData(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toastData])

  const loadMoreComments = useCallback(async () => {
    if (!id || !commentsCursor) return
    setIsLoadingComments(true)
    try {
      const result = await listComments(id, { cursor: commentsCursor })
      setComments((prev) => [...prev, ...result.comments])
      setCommentsCursor(result.nextCursor)
      setHasMoreComments(!!result.nextCursor)
    } catch {
    } finally {
      setIsLoadingComments(false)
    }
  }, [id, commentsCursor])

  const loadMoreRecommended = useCallback(async () => {
    if (!id || recommendedLoadingRef.current || !hasMoreRecommended) return
    recommendedLoadingRef.current = true
    setIsLoadingRecommended(true)
    setRecommendedPosts((current) => [...current, ...createSkeletonItems(RECOMMENDED_SKELETON_COUNT)])
    try {
      const [internalResult, externalResult] = await Promise.allSettled([
        recommendedOffsetRef.current === null
          ? Promise.resolve({ items: [], nextOffset: null })
          : getRecommendedPosts(id, { limit: 8, offset: recommendedOffsetRef.current || 0 }),
        recommendedExternalCursorRef.current
          ? searchExternalImages({ q: recommendedQueryRef.current || 'design inspiration', limit: 6, cursor: recommendedExternalCursorRef.current })
          : Promise.resolve({ items: [], nextCursor: null }),
      ])
      const internalPayload = internalResult.status === 'fulfilled' ? internalResult.value : { items: [], nextOffset: null }
      const externalPayload = externalResult.status === 'fulfilled' ? externalResult.value : { items: [], nextCursor: null }
      recommendedOffsetRef.current = internalPayload.nextOffset
      recommendedExternalCursorRef.current = externalPayload.nextCursor || null
      const nextItems = [
        ...(internalPayload.items || []),
        ...(externalPayload.items || []).map(externalImageToPost),
      ]
      setRecommendedPosts((current) => {
        const clean = current.filter((p) => !p._isSkeleton)
        const seen = new Set(clean.map((item) => item.id))
        return [...clean, ...nextItems.filter((item) => {
          if (seen.has(item.id) || item.id === id) return false
          seen.add(item.id)
          return true
        })]
      })
      setHasMoreRecommended(!!internalPayload.nextOffset || !!externalPayload.nextCursor)
    } catch {
      setRecommendedPosts((current) => current.filter((p) => !p._isSkeleton))
    } finally {
      recommendedLoadingRef.current = false
      setIsLoadingRecommended(false)
    }
  }, [hasMoreRecommended, id])

  useEffect(() => {
    const sentinel = recommendedSentinelRef.current
    if (!sentinel || !hasMoreRecommended) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMoreRecommended()
    }, { rootMargin: '500px 0px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMoreRecommended, loadMoreRecommended])

  const handleSave = async () => {
    if (!requireAuth('login') || !post) return
    const nextSaved = !post.isSaved
    setPost((current) => ({
      ...current,
      isSaved: nextSaved,
      saveCount: Math.max(0, current.saveCount + (nextSaved ? 1 : -1)),
    }))
    try {
      await (nextSaved ? savePost(post.id) : unsavePost(post.id))
    } catch {
      setPost(post)
    }
  }

  const handleLike = async () => {
    if (!requireAuth('login') || !post) return
    const nextLiked = !post.isLiked
    setPost((current) => ({
      ...current,
      isLiked: nextLiked,
      likeCount: Math.max(0, (current.likeCount || 0) + (nextLiked ? 1 : -1)),
    }))
    try {
      await (nextLiked ? likePost(post.id) : unlikePost(post.id))
    } catch {
      setPost(post)
    }
  }

  const handleAddToBoard = async (targetPost = post) => {
    if (targetPost?.preventDefault) targetPost = post
    if (!requireAuth('login') || !targetPost) return
    const payload = await listBoards()
    const body = targetPost.isExternalImage ? { externalImage: postToExternalImagePayload(targetPost) } : { postId: targetPost.id }
    if (payload.boards.length === 1) {
      const result = await addBoardItem(payload.boards[0].id, body)
      setToastData({ message: `Disimpan ke ${payload.boards[0].name}`, post: targetPost, currentBoardId: payload.boards[0].id, boardItemId: result?.itemId })
      setIsMoreOpen(false)
      return
    }
    setIsMoreOpen(false)
    setBoardPicker({ isOpen: true, post: targetPost, boards: payload.boards })
  }

  const handleToggleRecommendedSave = async (targetPost) => {
    if (!requireAuth('login')) return
    const nextSaved = !targetPost.isSaved
    setRecommendedPosts((current) => current.map((item) => (
      item.id === targetPost.id
        ? { ...item, isSaved: nextSaved, saveCount: Math.max(0, item.saveCount + (nextSaved ? 1 : -1)) }
        : item
    )))
    try {
      if (targetPost.isExternalImage) {
        await (nextSaved ? saveExternalImage(postToExternalImagePayload(targetPost)) : unsaveExternalImage(targetPost.id))
      } else {
        await (nextSaved ? savePost(targetPost.id) : unsavePost(targetPost.id))
      }
    } catch {
      setRecommendedPosts((current) => current.map((item) => item.id === targetPost.id ? targetPost : item))
    }
  }

  const handleToggleRecommendedLike = async (targetPost) => {
    if (targetPost.isExternalImage) return
    if (!requireAuth('login')) return
    const nextLiked = !targetPost.isLiked
    setRecommendedPosts((current) => current.map((item) => (
      item.id === targetPost.id
        ? { ...item, isLiked: nextLiked, likeCount: Math.max(0, (item.likeCount || 0) + (nextLiked ? 1 : -1)) }
        : item
    )))
    try {
      await (nextLiked ? likePost(targetPost.id) : unlikePost(targetPost.id))
    } catch {
      setRecommendedPosts((current) => current.map((item) => item.id === targetPost.id ? targetPost : item))
    }
  }

  const handleDownloadActiveMedia = async () => {
    if (!post) return
    const media = (post.media?.length ? post.media : post.cover ? [post.cover] : [])[activeMediaIndex] || post.cover
    if (!media?.url) return
    const filename = `${safeFileName(post.title || post.id)}-${activeMediaIndex + 1}.${getExtensionFromUrl(media.url)}`
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
      setIsMoreOpen(false)
    }
  }

  const handleReport = () => {
    setIsMoreOpen(false)
    setReportPostId(post?.id)
  }

  const handleReportComment = (commentId) => {
    setReportCommentId(commentId)
  }

  const handleSelectBoard = async (board) => {
    const body = boardPicker.post.isExternalImage ? { externalImage: postToExternalImagePayload(boardPicker.post) } : { postId: boardPicker.post.id }

    if (boardPicker.changingFrom) {
      await removeBoardItem(boardPicker.changingFrom.boardId, boardPicker.changingFrom.itemId)
    }

    const result = await addBoardItem(board.id, body)
    setToastData({ message: `Disimpan ke ${board.name}`, post: boardPicker.post, currentBoardId: board.id, boardItemId: result?.itemId })
    setBoardPicker({ isOpen: false, post: null, boards: [], changingFrom: null })
  }

  const handleCreateBoardForPost = async (board) => {
    const body = boardPicker.post.isExternalImage ? { externalImage: postToExternalImagePayload(boardPicker.post) } : { postId: boardPicker.post.id }

    if (boardPicker.changingFrom) {
      await removeBoardItem(boardPicker.changingFrom.boardId, boardPicker.changingFrom.itemId)
    }

    const result = await addBoardItem(board.id, body)
    setToastData({ message: `Disimpan ke ${board.name}`, post: boardPicker.post, currentBoardId: board.id, boardItemId: result?.itemId })
    setBoardPicker({ isOpen: false, post: null, boards: [], changingFrom: null })
    setIsNewBoardModalOpen(false)
  }

  const handleUbahBoard = async () => {
    if (!toastData) return
    const payload = await listBoards()
    setBoardPicker({ isOpen: true, post: toastData.post, boards: payload.boards, changingFrom: { boardId: toastData.currentBoardId, itemId: toastData.boardItemId } })
    setToastData(null)
  }

  const handleSubmitComment = async () => {
    if (!requireAuth('login') || !commentText.trim() || !post) return
    setIsSubmittingComment(true)
    try {
      const result = await createComment(post.id, commentText.trim())
      setComments((prev) => [result.comment, ...prev])
      setCommentText('')
    } catch {
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmitComment()
    }
  }

  if (isLoading) return <Skeleton.Detail />
  if (error || !post) return <p className="community-state error">{error || 'Post tidak ditemukan'}</p>

  const media = post.media?.length ? post.media : post.cover ? [post.cover] : []
  const activeMedia = media[activeMediaIndex] || media[0]
  const ratio = activeMedia?.width && activeMedia?.height ? activeMedia.width / activeMedia.height : 1
  const isOwnPost = currentUser?.id === post.author?.id
  const visibleTags = (post.tags || post.metadata?.tags || []).filter(Boolean).slice(0, 10)

  return (
    <div className="post-detail-page">
      <button type="button" className="post-detail-back-sticky" onClick={() => navigate(-1)}>
        <ChevronLeft size={18} />
        Back
      </button>
      <div className="post-detail-container">
        <div className="post-detail-image-section">
          {activeMedia?.url ? (
            media.length > 1 ? (
              <div className="post-carousel">
                <div className="post-carousel-track" style={{ transform: `translateX(-${activeMediaIndex * 100}%)` }}>
                  {media.map((m, i) => (
                    <div className="post-carousel-slide" key={i}>
                      <MasonryImage imageKey={m.url} alt={post.title} className="post-detail-image" fill fallbackRatio={m.width && m.height ? m.width / m.height : 1} />
                    </div>
                  ))}
                </div>
                <button type="button" className="post-carousel-prev" onClick={() => setActiveMediaIndex((current) => (current - 1 + media.length) % media.length)}><ChevronLeft size={20} /></button>
                <button type="button" className="post-carousel-next" onClick={() => setActiveMediaIndex((current) => (current + 1) % media.length)}><ChevronRight size={20} /></button>
                <span className="post-carousel-count">{activeMediaIndex + 1} / {media.length}</span>
              </div>
            ) : (
              <div className="post-carousel">
                <MasonryImage imageKey={activeMedia.url} alt={post.title} className="post-detail-image" fill fallbackRatio={ratio} />
              </div>
            )
          ) : (
            <div className="community-post-placeholder">Preview belum tersedia</div>
          )}
        </div>

        <div className="post-detail-info-section">
          <div className="post-detail-author">
            <Link to={`/user/${post.author.username}`} className="post-detail-author-link">
              <div className="author-avatar" style={post.author.avatarUrl ? { backgroundImage: `url("${post.author.avatarUrl}")` } : undefined} />
              <div className="author-info">
                <h3>{post.author.displayName || post.author.username}</h3>
                <p>@{post.author.username}</p>
              </div>
            </Link>
            <div className="post-detail-more" ref={moreMenuRef}>
              <button type="button" className="post-detail-more-btn" aria-label="More actions" onClick={() => setIsMoreOpen((current) => !current)}>
                <MoreVertical size={18} />
              </button>
              {isMoreOpen && (
                <div className="metadata-dropdown-menu post-detail-more-menu">
                  <button type="button" className="metadata-dropdown-item" onClick={handleLike}>
                    <Heart size={13} fill={post.isLiked ? 'currentColor' : 'none'} /> {post.isLiked ? 'Unlike' : 'Like'}
                  </button>
                  <button type="button" className="metadata-dropdown-item" onClick={handleSave}>
                    <Bookmark size={13} fill={post.isSaved ? 'currentColor' : 'none'} /> {post.isSaved ? 'Unsave' : 'Save'}
                  </button>
                  <button type="button" className="metadata-dropdown-item" onClick={handleAddToBoard}>
                    <FolderPlus size={13} /> Add to board
                  </button>
                  <button type="button" className="metadata-dropdown-item" onClick={handleDownloadActiveMedia}>
                    <Download size={13} /> Download image
                  </button>
                  {!isOwnPost && (
                    <button type="button" className="metadata-dropdown-item" onClick={handleReport}>
                      <Flag size={13} /> Laporkan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="post-detail-content">
            <h1 className="post-detail-title-row">
              {post.title || 'Untitled workspace'}
              {post.visibility === 'private' && (
                <span className="visibility-badge visibility-badge-private" title="Private">
                  <Lock size={14} />
                </span>
              )}
              {post.visibility === 'unlisted' && (
                <span className="visibility-badge visibility-badge-unlisted" title="Hanya teman">
                  <Users size={14} />
                </span>
              )}
            </h1>
            {post.caption && <p className="post-description">{post.caption}</p>}
            {visibleTags.length > 0 && (
              <div className="post-detail-tags" aria-label="Post tags">
                {visibleTags.map((tag) => (
                  <button type="button" onClick={() => navigate(`/search?tags=${encodeURIComponent(tag)}`)} key={tag}>
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="post-detail-actions">
            <button type="button" className="action-btn primary" onClick={handleLike}>
              <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
              {post.isLiked ? 'Liked' : 'Like'}
            </button>
            <button type="button" className="action-btn secondary" onClick={handleSave}>
              <Bookmark size={18} fill={post.isSaved ? 'currentColor' : 'none'} />
              {post.isSaved ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="action-btn secondary" onClick={handleAddToBoard}>
              <FolderPlus size={18} />
              Board
            </button>
            {post.workspaceId && (
              <Link className="action-btn secondary" to={`/workspace?projectId=${post.workspaceId}`}>
                <Share2 size={18} />
                Open Workspace
              </Link>
            )}
            <button type="button" className="action-btn secondary" onClick={handleDownloadActiveMedia}>
              <Download size={18} />
              Download
            </button>
          </div>

          <div className="post-detail-stats">
            <div className="stat-item"><Heart size={16} /><span>{post.likeCount || 0}</span></div>
            <div className="stat-item"><Bookmark size={16} /><span>{post.saveCount}</span></div>
            {isOwnPost && <div className="stat-item" title={`${post.uniqueViewCount || 0} unique viewers`}><Eye size={16} /><span>{post.viewCount}</span></div>}
          </div>
        </div>
      </div>

      {post.allowComments !== false && (
        <section className="post-comments-section">
          <h2>Comments</h2>

          <div className="add-comment">
            {currentUser && (currentUser.profile?.avatarUrl ? (
              <div className="comment-avatar current-user" style={{ backgroundImage: `url("${currentUser.profile.avatarUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            ) : (
              <div className="comment-avatar current-user" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="white" />
              </div>
            ))}
            <div className="comment-input-wrapper">
              <textarea
                placeholder={currentUser ? 'Write a comment...' : 'Login to comment'}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!currentUser}
                rows={3}
              />
              <button type="button" className="post-comment-btn" onClick={handleSubmitComment} disabled={!currentUser || !commentText.trim() || isSubmittingComment}>
                {isSubmittingComment && <LoaderCircle size={14} style={{ marginRight: 6 }} />}
                {isSubmittingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          {comments.length > 0 && (
            <div className="comments-list">
              {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onDelete={handleDeleteComment}
                    onReport={handleReportComment}
                  />
              ))}
            </div>
          )}

          {isLoadingComments && (
            <div style={{ padding: '0 4px' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton.Comment key={i} />
              ))}
            </div>
          )}

          {hasMoreComments && !isLoadingComments && (
            <button type="button" className="show-all-comments-btn" onClick={loadMoreComments}>
              Show more comments
            </button>
          )}
        </section>
      )}

      {(isLoadingRecommended || recommendedPosts.length > 0) && (
        <section className="post-recommended-section">
          <div className="post-recommended-header">
            <h2>More like this</h2>
            <p>Rekomendasi berdasarkan tag, popularitas, dan post terbaru.</p>
          </div>
          {recommendedPosts.length > 0 && (
            <ResponsiveMasonry
              items={recommendedPosts}
              estimateHeight={feedEstimateHeight}
              renderItem={(item) =>
                item._isSkeleton ? (
                  <Skeleton.Card key={item.id} />
                ) : (
                  <CommunityPostCard
                    key={item.id}
                    post={item}
                    onToggleLike={handleToggleRecommendedLike}
                    onToggleSave={handleToggleRecommendedSave}
                    onAddToBoard={handleAddToBoard}
                  />
                )
              }
            />
          )}
          {isLoadingRecommended && recommendedPosts.length === 0 && <Skeleton.Masonry count={RECOMMENDED_SKELETON_COUNT} />}
          <div ref={recommendedSentinelRef} className="feed-sentinel" aria-hidden="true" />
        </section>
      )}

      <BoardPickerModal
        isOpen={boardPicker.isOpen}
        boards={boardPicker.boards}
        postTitle={boardPicker.post?.title || ''}
        onCancel={() => setBoardPicker({ isOpen: false, post: null, boards: [] })}
        onSelect={handleSelectBoard}
        onCreate={() => setIsNewBoardModalOpen(true)}
      />
      <NewBoardModal
        isOpen={isNewBoardModalOpen}
        onCancel={() => setIsNewBoardModalOpen(false)}
        onCreated={handleCreateBoardForPost}
      />
      <ReportModal isOpen={!!reportPostId} targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />
      <ReportModal isOpen={!!reportCommentId} targetType="comment" targetId={reportCommentId} onClose={() => setReportCommentId(null)} />
      {toastData && (
        <div className="post-detail-toast" role="status" aria-live="polite">
          <FolderPlus size={15} />
          <span>{toastData.message}</span>
          <button type="button" className="toast-ubah-btn" onClick={handleUbahBoard}>Ubah</button>
        </div>
      )}
    </div>
  )
}

export default PostDetail
