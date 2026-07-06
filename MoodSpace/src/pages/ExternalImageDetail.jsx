import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bookmark, ChevronLeft, Download, FolderPlus } from 'lucide-react'
import BoardPickerModal from '../components/BoardPickerModal'
import CommunityPostCard from '../components/CommunityPostCard'
import NewBoardModal from '../components/NewBoardModal'
import ResponsiveMasonry from '../components/ResponsiveMasonry'
import { Skeleton, createSkeletonItems } from '../components/Skeleton'
import { useAuth } from '../context/authState'
import { addBoardItem, listBoards, removeBoardItem } from '../lib/api/boards'
import { getExternalImage, saveExternalImage, searchExternalImages, unsaveExternalImage } from '../lib/api/externalImages'
import { getSimilarPostsByImage, likePost, savePost, unlikePost, unsavePost } from '../lib/api/posts'
import { externalImageToPost, postToExternalImagePayload } from '../utils/externalImagePost'

const RECOMMENDED_SKELETON_COUNT = 4
const estimatePostHeight = (post, columnWidth) => {
  const ratio = post.cover?.width && post.cover?.height ? post.cover.width / post.cover.height : 1
  return columnWidth / Math.max(0.35, ratio) + 98
}
const feedEstimateHeight = (item, columnWidth) => {
  if (item._isSkeleton) return item._height
  return estimatePostHeight(item, columnWidth)
}

const safeFileName = (value = 'external-image') => (
  value.toLowerCase().trim().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'external-image'
)

const mixRecommendedItems = (internalItems = [], externalItems = []) => {
  const mixed = []
  let internalIndex = 0
  let externalIndex = 0
  while (internalIndex < internalItems.length || externalIndex < externalItems.length) {
    for (let count = 0; count < 3 && internalIndex < internalItems.length; count += 1) {
      mixed.push(internalItems[internalIndex])
      internalIndex += 1
    }
    if (externalIndex < externalItems.length) {
      mixed.push(externalItems[externalIndex])
      externalIndex += 1
    }
  }
  return mixed
}

const getExternalRelatedSearchParams = (image, fallbackQuery) => {
  const tmdbId = image?.metadata?.tmdbId
  const rawMediaType = image?.metadata?.mediaType
  const mediaType = rawMediaType === 'tv' ? 'tv' : 'movie'
  const visualType = image?.metadata?.imageType === 'backdrop' ? 'backdrop' : 'poster'
  if (image?.provider === 'tmdb' && tmdbId && (rawMediaType === 'movie' || rawMediaType === 'tv')) {
    return { tmdbId, mediaType, visualType }
  }
  return { q: fallbackQuery }
}

function ExternalImageDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { requireAuth } = useAuth()
  const [post, setPost] = useState(null)
  const [recommended, setRecommended] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)
  const [hasMoreRecommended, setHasMoreRecommended] = useState(false)
  const [error, setError] = useState('')
  const [boardPicker, setBoardPicker] = useState({ isOpen: false, post: null, boards: [] })
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false)
  const [toastData, setToastData] = useState(null)
  const recommendedSentinelRef = useRef(null)
  const recommendedLoadingRef = useRef(false)
  const recommendedCursorRef = useRef(null)
  const recommendedQueryRef = useRef('')
  const recommendedExternalParamsRef = useRef({})

  const decodedId = useMemo(() => decodeURIComponent(id || ''), [id])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setIsLoadingRecommended(true)
    setError('')
    setRecommended([])
    setHasMoreRecommended(false)
    recommendedCursorRef.current = null
    recommendedExternalParamsRef.current = {}
    getExternalImage(decodedId)
      .then(({ image }) => {
        if (cancelled) return
        const nextPost = externalImageToPost(image)
        setPost(nextPost)
        const relatedQuery = [...(image.tags || []), image.title].filter(Boolean).slice(0, 5).join(' ')
        recommendedQueryRef.current = relatedQuery || image.provider || 'design inspiration'
        const relatedParams = getExternalRelatedSearchParams(image, recommendedQueryRef.current)
        if (image?.provider === 'tmdb') {
          relatedParams.includeRecommendations = true
        }
        relatedParams.visualSimilarTo = decodedId
        relatedParams.semanticText = [image.title, ...(image.tags || [])].filter(Boolean).slice(0, 10).join('. ')
        recommendedExternalParamsRef.current = relatedParams
        return Promise.allSettled([
          getSimilarPostsByImage(decodedId, { q: recommendedQueryRef.current, limit: 12 }),
          searchExternalImages({ ...recommendedExternalParamsRef.current, context: 'recommended', limit: 6 }),
        ])
      })
      .then((results) => {
        if (cancelled || !results) return
        const [internalResult, externalResult] = results
        const internalItems = internalResult.status === 'fulfilled' ? internalResult.value.items || [] : []
        const externalPayload = externalResult.status === 'fulfilled' ? externalResult.value : { items: [], nextCursor: null }
        const externalItems = (externalPayload.items || [])
          .filter((image) => image.id !== decodedId)
          .map(externalImageToPost)
        recommendedCursorRef.current = {
          internalExhausted: true,
          externalCursor: externalPayload.nextCursor || null,
        }
        setHasMoreRecommended(!!externalPayload.nextCursor)
        setRecommended(mixRecommendedItems(internalItems, externalItems))
      })
      .catch((nextError) => {
        if (!cancelled) setError(nextError.message || 'External image gagal dimuat')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
        if (!cancelled) setIsLoadingRecommended(false)
      })
    return () => { cancelled = true }
  }, [decodedId])

  const loadMoreRecommended = useCallback(async () => {
    if (recommendedLoadingRef.current || !hasMoreRecommended) return
    recommendedLoadingRef.current = true
    setIsLoadingRecommended(true)
    setRecommended((current) => [...current, ...createSkeletonItems(RECOMMENDED_SKELETON_COUNT)])
    try {
      const cursor = recommendedCursorRef.current || {}
      const externalResult = await searchExternalImages({
        ...recommendedExternalParamsRef.current, context: 'recommended', limit: 6,
        cursor: cursor.externalCursor,
      }).catch(() => ({ items: [], nextCursor: null }))
      recommendedCursorRef.current = {
        internalExhausted: true,
        externalCursor: externalResult.nextCursor || null,
      }
      const externalItems = (externalResult.items || [])
        .filter((image) => image.id !== decodedId)
        .map(externalImageToPost)
      setRecommended((current) => {
        const clean = current.filter((p) => !p._isSkeleton)
        const seen = new Set(clean.map((item) => item.id))
        return [...clean, ...externalItems.filter((item) => {
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })]
      })
      setHasMoreRecommended(!!recommendedCursorRef.current.externalCursor)
    } catch {
      setRecommended((current) => current.filter((p) => !p._isSkeleton))
    } finally {
      recommendedLoadingRef.current = false
      setIsLoadingRecommended(false)
    }
  }, [decodedId, hasMoreRecommended])

  useEffect(() => {
    const sentinel = recommendedSentinelRef.current
    if (!sentinel || !hasMoreRecommended) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMoreRecommended()
    }, { rootMargin: '500px 0px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMoreRecommended, loadMoreRecommended])

  useEffect(() => {
    if (!toastData) return undefined
    const timer = window.setTimeout(() => setToastData(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toastData])

  const handleSave = async (targetPost = post) => {
    if (!requireAuth('login') || !targetPost) return
    const nextSaved = !targetPost.isSaved
    const patch = (item) => item.id === targetPost.id ? { ...item, isSaved: nextSaved } : item
    if (targetPost.id === post?.id) setPost((current) => ({ ...current, isSaved: nextSaved }))
    setRecommended((current) => current.map(patch))
    try {
      if (targetPost.isExternalImage) {
        await (nextSaved ? saveExternalImage(postToExternalImagePayload(targetPost)) : unsaveExternalImage(targetPost.id))
      } else {
        await (nextSaved ? savePost(targetPost.id) : unsavePost(targetPost.id))
      }
    } catch {
      if (targetPost.id === post?.id) setPost(post)
    }
  }

  const handleAddToBoard = async (targetPost = post) => {
    if (!requireAuth('login') || !targetPost) return
    const payload = await listBoards()
    const body = targetPost.isExternalImage ? { externalImage: postToExternalImagePayload(targetPost) } : { postId: targetPost.id }
    if (payload.boards.length === 1) {
      const result = await addBoardItem(payload.boards[0].id, body)
      setToastData({ message: `Disimpan ke ${payload.boards[0].name}`, post: targetPost, currentBoardId: payload.boards[0].id, boardItemId: result?.itemId })
      return
    }
    setBoardPicker({ isOpen: true, post: targetPost, boards: payload.boards })
  }

  const handleSelectBoard = async (board) => {
    if (!boardPicker.post) return
    const body = boardPicker.post.isExternalImage ? { externalImage: postToExternalImagePayload(boardPicker.post) } : { postId: boardPicker.post.id }

    if (boardPicker.changingFrom) {
      await removeBoardItem(boardPicker.changingFrom.boardId, boardPicker.changingFrom.itemId)
    }

    const result = await addBoardItem(board.id, body)
    setToastData({ message: `Disimpan ke ${board.name}`, post: boardPicker.post, currentBoardId: board.id, boardItemId: result?.itemId })
    setBoardPicker({ isOpen: false, post: null, boards: [], changingFrom: null })
  }

  const handleCreateBoardForPost = async (board) => {
    await handleSelectBoard(board)
    setIsNewBoardModalOpen(false)
  }

  const handleUbahBoard = async () => {
    if (!toastData) return
    const payload = await listBoards()
    setBoardPicker({ isOpen: true, post: toastData.post, boards: payload.boards, changingFrom: { boardId: toastData.currentBoardId, itemId: toastData.boardItemId } })
    setToastData(null)
  }

  const handleDownload = useCallback(async () => {
    const media = post?.media?.[0] || post?.cover
    if (!media?.url) return
    try {
      const response = await fetch(media.url, { mode: 'cors' })
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${safeFileName(post.title)}.jpg`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(media.url, '_blank', 'noopener,noreferrer')
    }
  }, [post])

  const handleToggleRecommendedLike = async (targetPost) => {
    if (targetPost.isExternalImage || !requireAuth('login')) return
    const nextLiked = !targetPost.isLiked
    setRecommended((current) => current.map((item) => (
      item.id === targetPost.id
        ? { ...item, isLiked: nextLiked, likeCount: Math.max(0, (item.likeCount || 0) + (nextLiked ? 1 : -1)) }
        : item
    )))
    try {
      await (nextLiked ? likePost(targetPost.id) : unlikePost(targetPost.id))
    } catch {
      setRecommended((current) => current.map((item) => item.id === targetPost.id ? targetPost : item))
    }
  }

  if (isLoading) return <Skeleton.Detail />
  if (error || !post) return <p className="community-state error">{error || 'Image tidak ditemukan.'}</p>

  return (
    <section className="post-detail-page external-image-detail-page">
      <button type="button" className="post-detail-back-sticky" onClick={() => navigate(-1)}>
        <ChevronLeft size={18} />
        Back
      </button>
      <article className="post-detail-container">
        <div className="post-detail-image-section external-image-detail-media">
          <img className="post-detail-image external-image-detail-img" src={post.media[0].url} alt={post.title} crossOrigin="anonymous" />
        </div>
        <aside className="post-detail-info-section">
          <div className="post-detail-author external-detail-source">
            <div className="author-info">
              <h3>{post.author.username}</h3>
              <p>{post.externalProvider || 'Open image source'}</p>
            </div>
          </div>

          <div className="post-detail-content">
            <h1>{post.title}</h1>
            {post.caption && <p className="post-description">{post.caption}</p>}
            {post.tags?.length > 0 && (
              <div className="post-detail-tags" aria-label="Image tags">
                {post.tags.slice(0, 10).map((tag, index) => (
                  <button type="button" onClick={() => navigate(`/search?tags=${encodeURIComponent(tag)}`)} key={`${tag}-${index}`}>
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="post-detail-actions">
            <button type="button" className="action-btn secondary" onClick={() => handleSave(post)}>
              <Bookmark size={17} fill={post.isSaved ? 'currentColor' : 'none'} /> {post.isSaved ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="action-btn secondary" onClick={() => handleAddToBoard(post)}><FolderPlus size={17} /> Board</button>
            <button type="button" className="action-btn secondary" onClick={handleDownload}><Download size={17} /> Download</button>
          </div>
          {post.sourceUrl && (
            <a className="post-detail-source" href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
              View source
            </a>
          )}
        </aside>
      </article>

      <section className="post-recommended-section">
        <div className="post-recommended-header">
          <h2>More like this</h2>
          <p>Visual serupa dari post user dan source open image.</p>
        </div>
        <ResponsiveMasonry
          items={recommended}
          estimateHeight={feedEstimateHeight}
          renderItem={(item) =>
            item._isSkeleton ? (
              <Skeleton.Card key={item.id} />
            ) : (
              <CommunityPostCard key={item.id} post={item} onToggleLike={handleToggleRecommendedLike} onToggleSave={handleSave} onAddToBoard={handleAddToBoard} />
            )
          }
        />
        <div ref={recommendedSentinelRef} className="feed-sentinel" aria-hidden="true" />
        {isLoadingRecommended && recommended.length === 0 && <Skeleton.Masonry count={RECOMMENDED_SKELETON_COUNT} />}
      </section>

      <BoardPickerModal
        isOpen={boardPicker.isOpen}
        boards={boardPicker.boards}
        postTitle={boardPicker.post?.title}
        onCancel={() => setBoardPicker({ isOpen: false, post: null, boards: [] })}
        onSelect={handleSelectBoard}
        onCreate={() => setIsNewBoardModalOpen(true)}
      />
      <NewBoardModal
        isOpen={isNewBoardModalOpen}
        onCancel={() => setIsNewBoardModalOpen(false)}
        onCreated={handleCreateBoardForPost}
      />
      {toastData && (
        <div className="post-detail-toast" role="status" aria-live="polite">
          <FolderPlus size={15} />
          <span>{toastData.message}</span>
          <button type="button" className="toast-ubah-btn" onClick={handleUbahBoard}>Ubah</button>
        </div>
      )}
    </section>
  )
}

export default ExternalImageDetail
