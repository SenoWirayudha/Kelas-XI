import { useCallback, useEffect, useRef, useState } from 'react'
import { FolderPlus } from 'lucide-react'
import BoardPickerModal from '../components/BoardPickerModal'
import CommunityPostCard from '../components/CommunityPostCard'
import NewBoardModal from '../components/NewBoardModal'
import CreateMenu from '../components/CreateMenu'
import ResponsiveMasonry from '../components/ResponsiveMasonry'
import { Skeleton, createSkeletonItems } from '../components/Skeleton'
import { useAuth } from '../context/authState'
import { addBoardItem, listBoards } from '../lib/api/boards'
import { searchExternalImages } from '../lib/api/externalImages'
import { saveExternalImage, unsaveExternalImage } from '../lib/api/externalImages'
import { getHomeFeed, likePost, savePost, unlikePost, unsavePost } from '../lib/api/posts'
import { externalImageToPost, postToExternalImagePayload } from '../utils/externalImagePost'

const tags = []
const SKELETON_COUNT = 6
const feedModes = [
  ['for-you', 'For You'],
  ['recent', 'Recent'],
  ['popular', 'Popular'],
]
const estimatePostHeight = (post, columnWidth) => {
  const ratio = post.cover?.width && post.cover?.height ? post.cover.width / post.cover.height : 1
  return columnWidth / Math.max(0.35, ratio) + 98
}
const feedEstimateHeight = (item, columnWidth) => {
  if (item._isSkeleton) return item._height
  return estimatePostHeight(item, columnWidth)
}

const hashString = (value = '') => (
  Array.from(String(value)).reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0)
)

const createSeededRandom = (seed = '') => {
  let state = (Math.abs(hashString(seed)) || 1) >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const shuffleWithSeed = (items = [], seed = '') => {
  const random = createSeededRandom(seed)
  const output = [...items]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[output[index], output[swapIndex]] = [output[swapIndex], output[index]]
  }
  return output
}

const mixInternalExternalFeed = (internalItems = [], externalItems = [], seed = '') => {
  if (!externalItems.length) return shuffleWithSeed(internalItems, `${seed}:internal-only`)
  if (!internalItems.length) return shuffleWithSeed(externalItems, `${seed}:external-only`)

  const internal = shuffleWithSeed(internalItems, `${seed}:internal`)
  const external = shuffleWithSeed(externalItems, `${seed}:external`)
  const random = createSeededRandom(`${seed}:mix`)
  const targetExternalRatio = 0.3
  const mixed = []
  let internalIndex = 0
  let externalIndex = 0
  let lastSource = null
  let streak = 0

  while (internalIndex < internal.length || externalIndex < external.length) {
    const canUseInternal = internalIndex < internal.length
    const canUseExternal = externalIndex < external.length
    let useExternal = false

    if (!mixed.length) {
      useExternal = canUseExternal && random() < targetExternalRatio
    } else if (!canUseInternal) {
      useExternal = true
    } else if (!canUseExternal) {
      useExternal = false
    } else if (lastSource === 'internal' && streak >= 3) {
      useExternal = true
    } else if (lastSource === 'external' && streak >= 2) {
      useExternal = false
    } else {
      const externalRatio = externalIndex / Math.max(1, mixed.length)
      const ratioGap = targetExternalRatio - externalRatio
      if (Math.abs(ratioGap) > 0.12) {
        useExternal = ratioGap > 0
      } else {
        useExternal = random() < targetExternalRatio
      }
    }

    const source = useExternal ? 'external' : 'internal'
    const nextItem = useExternal ? external[externalIndex] : internal[internalIndex]
    if (useExternal) externalIndex += 1
    else internalIndex += 1

    if (lastSource === source) streak += 1
    else {
      lastSource = source
      streak = 1
    }

    mixed.push(nextItem)
  }

  return mixed
}

function Home() {
  const { requireAuth, user } = useAuth()
  const sentinelRef = useRef(null)
  const loadingRef = useRef(false)
  const externalCursorRef = useRef(null)
  const internalExhaustedRef = useRef(false)
  const feedSeedRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const [posts, setPosts] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [boardPicker, setBoardPicker] = useState({ isOpen: false, post: null, boards: [] })
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false)
  const [isFabOpen, setIsFabOpen] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [feedMode, setFeedMode] = useState('for-you')
  const [hasMoreFeed, setHasMoreFeed] = useState(false)
  const viewerSeed = user?.id || user?.username || 'guest'

  const loadFeed = useCallback(async ({ cursor = null, reset = false } = {}) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (reset) {
      feedSeedRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      externalCursorRef.current = null
      internalExhaustedRef.current = false
    }
    setIsLoading(true)
    setError('')
    if (!reset) {
      setPosts((current) => [...current, ...createSkeletonItems(SKELETON_COUNT)])
    }
    try {
      const [internalResult, externalResult] = await Promise.allSettled([
        !reset && internalExhaustedRef.current
          ? Promise.resolve({ items: [], nextCursor: null })
          : getHomeFeed({ cursor, limit: 14, mode: feedMode, seed: `${feedSeedRef.current}:${viewerSeed}` }),
        searchExternalImages({
          context: 'home',
          mode: feedMode,
          seed: `${feedSeedRef.current}:${viewerSeed}`,
          limit: 6,
          cursor: reset ? null : externalCursorRef.current,
        }),
      ])
      if (internalResult.status === 'rejected' && externalResult.status === 'rejected') {
        throw internalResult.reason || externalResult.reason
      }
      const internalPayload = internalResult.status === 'fulfilled' ? internalResult.value : { items: [], nextCursor: null }
      const externalPayload = externalResult.status === 'fulfilled' ? externalResult.value : { items: [], nextCursor: null }
      const externalPosts = (externalPayload.items || []).map(externalImageToPost)
      const mixSeed = `${feedSeedRef.current}:${viewerSeed}:${feedMode}:${reset ? 'reset' : cursor || externalCursorRef.current || 'initial'}`
      const mixedItems = mixInternalExternalFeed(internalPayload.items || [], externalPosts, mixSeed)
      setPosts((current) => {
        const nextItems = (reset ? [] : current).filter((p) => !p._isSkeleton)
        const seen = new Set(nextItems.map((item) => item.id))
        return [...nextItems, ...mixedItems.filter((item) => {
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })]
      })
      setNextCursor(internalPayload.nextCursor)
      setHasMoreFeed(!!internalPayload.nextCursor || !!externalPayload.nextCursor)
      internalExhaustedRef.current = !internalPayload.nextCursor
      externalCursorRef.current = externalPayload.nextCursor || null
    } catch (nextError) {
      if (!reset) {
        setPosts((current) => current.filter((p) => !p._isSkeleton))
      }
      setError(nextError.message || 'Feed gagal dimuat')
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [feedMode, viewerSeed])

  useEffect(() => {
    loadFeed({ reset: true })
  }, [loadFeed])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMoreFeed) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadFeed({ cursor: nextCursor })
    }, { rootMargin: '500px 0px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadFeed, nextCursor, hasMoreFeed])

  const handleToggleSave = async (post) => {
    if (!requireAuth('login')) return
    const nextSaved = !post.isSaved
    setPosts((current) => current.map((item) => (
      item.id === post.id
        ? { ...item, isSaved: nextSaved, saveCount: Math.max(0, item.saveCount + (nextSaved ? 1 : -1)) }
        : item
    )))
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
    setPosts((current) => current.map((item) => (
      item.id === post.id
        ? { ...item, isLiked: nextLiked, likeCount: Math.max(0, (item.likeCount || 0) + (nextLiked ? 1 : -1)) }
        : item
    )))
    try {
      await (nextLiked ? likePost(post.id) : unlikePost(post.id))
    } catch {
      setPosts((current) => current.map((item) => item.id === post.id ? post : item))
    }
  }

  const handleAddToBoard = async (post) => {
    if (!requireAuth('login')) return
    const payload = await listBoards()
    const body = post.isExternalImage ? { externalImage: postToExternalImagePayload(post) } : { postId: post.id }
    if (payload.boards.length === 1) {
      await addBoardItem(payload.boards[0].id, body)
      setToastMessage(`Disimpan ke ${payload.boards[0].name}`)
      return
    }
    setBoardPicker({ isOpen: true, post, boards: payload.boards })
  }

  const handleSelectBoard = async (board) => {
    if (!boardPicker.post) return
    const body = boardPicker.post.isExternalImage ? { externalImage: postToExternalImagePayload(boardPicker.post) } : { postId: boardPicker.post.id }
    await addBoardItem(board.id, body)
    setToastMessage(`Disimpan ke ${board.name}`)
    setBoardPicker({ isOpen: false, post: null, boards: [] })
  }

  const handleCreateBoardForPost = async (board) => {
    if (!boardPicker.post) return
    const body = boardPicker.post.isExternalImage ? { externalImage: postToExternalImagePayload(boardPicker.post) } : { postId: boardPicker.post.id }
    await addBoardItem(board.id, body)
    setToastMessage(`Disimpan ke ${board.name}`)
    setIsNewBoardModalOpen(false)
    setBoardPicker({ isOpen: false, post: null, boards: [] })
  }

  return (
    <section className="home-page">
      <div className="home-feed-controls">
        <div className="home-feed-tabs" aria-label="Feed mode">
          {feedModes.map(([id, label]) => (
            <button
              type="button"
              className={feedMode === id ? 'active' : ''}
              onClick={() => {
                setFeedMode(id)
                setPosts([])
                setNextCursor(null)
                setHasMoreFeed(false)
                externalCursorRef.current = null
                internalExhaustedRef.current = false
                feedSeedRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
              }}
              key={id}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="tag-row" aria-label="Tags">
        {tags.map((tag, index) => (
          <button type="button" className={`tag ${index === 0 ? 'active' : ''}`} key={tag}>{tag}</button>
        ))}
      </div>

      {error && <p className="community-state error">{error}</p>}
      {!isLoading && posts.length === 0 && <p className="community-state">Belum ada workspace publik. Publish workspace pertama dari editor.</p>}

      <ResponsiveMasonry
        items={posts}
        estimateHeight={feedEstimateHeight}
        renderItem={(item) =>
          item._isSkeleton ? (
            <Skeleton.Card key={item.id} />
          ) : (
            <CommunityPostCard key={item.id} post={item} onToggleLike={handleToggleLike} onToggleSave={handleToggleSave} onAddToBoard={handleAddToBoard} />
          )
        }
      />

      <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true" />
      {isLoading && posts.length === 0 && <Skeleton.Masonry count={SKELETON_COUNT} />}
      {isFabOpen && <div className="home-fab-backdrop" onClick={() => setIsFabOpen(false)} />}
      <div className="home-fab-wrap">
        {isFabOpen && <CreateMenu className="home-fab-menu" onAction={() => setIsFabOpen(false)} />}
        <button className="fab" type="button" aria-label="Create" onClick={() => setIsFabOpen((value) => !value)}>+</button>
      </div>
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
      {toastMessage && (
        <div className="post-detail-toast" role="status" aria-live="polite">
          <FolderPlus size={15} />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  )
}

export default Home
