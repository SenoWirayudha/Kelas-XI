import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FolderPlus } from 'lucide-react'
import BoardPickerModal from '../components/BoardPickerModal'
import CommunityPostCard from '../components/CommunityPostCard'
import NewBoardModal from '../components/NewBoardModal'
import ResponsiveMasonry from '../components/ResponsiveMasonry'
import { Skeleton, createSkeletonItems } from '../components/Skeleton'
import { useAuth } from '../context/authState'
import { addBoardItem, listBoards, removeBoardItem } from '../lib/api/boards'
import { saveExternalImage, searchExternalImages, unsaveExternalImage } from '../lib/api/externalImages'
import { likePost, savePost, unlikePost, unsavePost } from '../lib/api/posts'
import { searchPosts } from '../lib/api/search'
import { externalImageToPost, postToExternalImagePayload } from '../utils/externalImagePost'

const SKELETON_COUNT = 6
const estimatePostHeight = (post, columnWidth) => {
  const ratio = post.cover?.width && post.cover?.height ? post.cover.width / post.cover.height : 1
  return columnWidth / Math.max(0.35, ratio) + 98
}
const feedEstimateHeight = (item, columnWidth) => {
  if (item._isSkeleton) return item._height
  return estimatePostHeight(item, columnWidth)
}

function SearchResults() {
  const { requireAuth } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const tags = searchParams.get('tags') || ''
  const sort = searchParams.get('sort') || 'relevance'
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [boardPicker, setBoardPicker] = useState({ isOpen: false, post: null, boards: [] })
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false)
  const [toastData, setToastData] = useState(null)
  const sentinelRef = useRef(null)
  const loadingRef = useRef(false)
  const requestSerialRef = useRef(0)
  const nextOffsetRef = useRef(0)
  const externalCursorRef = useRef(null)

  const title = useMemo(() => {
    if (q.trim()) return q.trim()
    if (tags.trim()) return tags.trim()
    return 'Explore'
  }, [q, tags])

  const loadResults = useCallback(async ({ reset = false } = {}) => {
    if (loadingRef.current && !reset) return
    const requestId = ++requestSerialRef.current
    loadingRef.current = true
    setIsLoading(true)
    setError('')
    if (reset) {
      nextOffsetRef.current = 0
      externalCursorRef.current = null
      setHasMore(false)
    }
    if (!reset) {
      setItems((current) => [...current, ...createSkeletonItems(SKELETON_COUNT)])
    }
    try {
      const [internalResult, externalResult] = await Promise.allSettled([
        searchPosts({ q, tags, sort, limit: 21, offset: nextOffsetRef.current, semantic: true }),
        searchExternalImages({ q: q || tags || 'design inspiration', limit: 9, cursor: externalCursorRef.current }),
      ])
      if (requestSerialRef.current !== requestId) return
      if (internalResult.status === 'rejected' && externalResult.status === 'rejected') throw internalResult.reason || externalResult.reason
      const internalPayload = internalResult.status === 'fulfilled' ? internalResult.value : { items: [], nextOffset: null }
      const externalPayload = externalResult.status === 'fulfilled' ? externalResult.value : { items: [], nextCursor: null }
      const internalItems = internalPayload.items || []
      const externalItems = (externalPayload.items || []).map(externalImageToPost)
      nextOffsetRef.current = internalPayload.nextOffset
      externalCursorRef.current = externalPayload.nextCursor || null
      setItems((current) => {
        const nextItems = (reset ? [] : current).filter((p) => !p._isSkeleton)
        const seen = new Set(nextItems.map((item) => item.id))
        const interleave = []
        let ii = 0, ei = 0
        while (ii < internalItems.length || ei < externalItems.length) {
          for (let c = 0; c < 3 && ii < internalItems.length; c++) {
            const item = internalItems[ii++]
            if (!seen.has(item.id)) { seen.add(item.id); interleave.push(item) }
          }
          while (ei < externalItems.length && seen.has(externalItems[ei].id)) ei++
          if (ei < externalItems.length) { seen.add(externalItems[ei].id); interleave.push(externalItems[ei++]) }
        }
        return [...nextItems, ...interleave]
      })
      setHasMore(!!internalPayload.nextOffset || !!externalPayload.nextCursor)
    } catch (nextError) {
      if (requestSerialRef.current !== requestId) return
      if (!reset) {
        setItems((current) => current.filter((p) => !p._isSkeleton))
      }
      setError(nextError.message || 'Search gagal dimuat')
    } finally {
      if (requestSerialRef.current !== requestId) return
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [q, tags, sort])

  useEffect(() => {
    setItems([])
    loadResults({ reset: true })
  }, [q, tags, sort, loadResults])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadResults()
    }, { rootMargin: '500px 0px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadResults])

  useEffect(() => {
    if (!toastData) return undefined
    const timer = window.setTimeout(() => setToastData(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toastData])

  const updateSort = (nextSort) => {
    const next = new URLSearchParams(searchParams)
    next.set('sort', nextSort)
    setSearchParams(next)
  }

  const patchPost = useCallback((postId, patcher) => {
    setItems((current) => current.map((item) => item.id === postId ? patcher(item) : item))
  }, [])

  const handleToggleLike = async (post) => {
    if (!requireAuth('login')) return
    const nextLiked = !post.isLiked
    patchPost(post.id, (item) => ({
      ...item,
      isLiked: nextLiked,
      likeCount: Math.max(0, (item.likeCount || 0) + (nextLiked ? 1 : -1)),
    }))
    try {
      await (nextLiked ? likePost(post.id) : unlikePost(post.id))
    } catch {
      patchPost(post.id, () => post)
    }
  }

  const handleToggleSave = async (post) => {
    if (!requireAuth('login')) return
    const nextSaved = !post.isSaved
    patchPost(post.id, (item) => ({
      ...item,
      isSaved: nextSaved,
      saveCount: Math.max(0, item.saveCount + (nextSaved ? 1 : -1)),
    }))
    try {
      if (post.isExternalImage) {
        await (nextSaved ? saveExternalImage(postToExternalImagePayload(post)) : unsaveExternalImage(post.id))
      } else {
        await (nextSaved ? savePost(post.id) : unsavePost(post.id))
      }
    } catch {
      patchPost(post.id, () => post)
    }
  }

  const handleAddToBoard = async (post) => {
    if (!requireAuth('login')) return
    const payload = await listBoards()
    const body = post.isExternalImage ? { externalImage: postToExternalImagePayload(post) } : { postId: post.id }
    if (payload.boards.length === 1) {
      const result = await addBoardItem(payload.boards[0].id, body)
      setToastData({ message: `Disimpan ke ${payload.boards[0].name}`, post, currentBoardId: payload.boards[0].id, boardItemId: result?.itemId })
      return
    }
    setBoardPicker({ isOpen: true, post, boards: payload.boards })
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
    if (!boardPicker.post) return
    const body = boardPicker.post.isExternalImage ? { externalImage: postToExternalImagePayload(boardPicker.post) } : { postId: boardPicker.post.id }

    if (boardPicker.changingFrom) {
      await removeBoardItem(boardPicker.changingFrom.boardId, boardPicker.changingFrom.itemId)
    }

    const result = await addBoardItem(board.id, body)
    setToastData({ message: `Disimpan ke ${board.name}`, post: boardPicker.post, currentBoardId: board.id, boardItemId: result?.itemId })
    setIsNewBoardModalOpen(false)
    setBoardPicker({ isOpen: false, post: null, boards: [], changingFrom: null })
  }

  const handleUbahBoard = async () => {
    if (!toastData) return
    const payload = await listBoards()
    setBoardPicker({ isOpen: true, post: toastData.post, boards: payload.boards, changingFrom: { boardId: toastData.currentBoardId, itemId: toastData.boardItemId } })
    setToastData(null)
  }

  return (
    <section className="search-results-page">
      <div className="search-results-header">
        <div>
          <h1>{title}</h1>
          <div>{isLoading ? <Skeleton width={120} height={14} borderRadius={6} /> : `${items.length} result${items.length === 1 ? '' : 's'}`}</div>
        </div>
        <div className="search-sort-tabs" aria-label="Sort search results">
          {[
            ['relevance', 'Relevant'],
            ['recent', 'Recent'],
            ['popular', 'Popular'],
          ].map(([id, label]) => (
            <button type="button" className={sort === id ? 'active' : ''} onClick={() => updateSort(id)} key={id}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="community-state error">{error}</p>}
      {!isLoading && !error && items.length === 0 && <p className="community-state">Tidak ada hasil yang cocok.</p>}
      <ResponsiveMasonry
        items={items}
        estimateHeight={feedEstimateHeight}
        renderItem={(item) =>
          item._isSkeleton ? (
            <Skeleton.Card key={item.id} />
          ) : (
            <CommunityPostCard
              key={item.id}
              post={item}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onAddToBoard={handleAddToBoard}
            />
          )
        }
      />
      <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true" />
      {isLoading && items.length === 0 && <Skeleton.Masonry count={SKELETON_COUNT} />}

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

export default SearchResults
