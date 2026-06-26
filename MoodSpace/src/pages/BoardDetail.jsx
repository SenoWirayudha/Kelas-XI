import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import ConfirmationModal from '../components/ConfirmationModal'
import MasonryImage from '../components/MasonryImage'
import ResponsiveMasonry from '../components/ResponsiveMasonry'
import { useAuth } from '../context/authState'
import { getPublicBoard, removeBoardItem } from '../lib/api/boards'

const estimateBoardItemHeight = (item, columnWidth) => {
  const media = item.postMedia?.[0] || item
  const ratio = media?.width && media?.height ? media.width / media.height : 1
  return columnWidth / Math.max(0.35, ratio) + 98
}

function BoardDetail() {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const [board, setBoard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState({})

  const isOwner = isAuthenticated && board?.ownerId === user?.id

  useEffect(() => {
    setIsLoading(true)
    setError('')
    getPublicBoard(id)
      .then((payload) => setBoard(payload.board))
      .catch((nextError) => setError(nextError.message || 'Board gagal dimuat'))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleRemove = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await removeBoardItem(id, deleteTarget.id)
      setBoard((current) => ({
        ...current,
        itemCount: Math.max(0, current.itemCount - 1),
        items: current.items.filter((item) => item.id !== deleteTarget.id),
      }))
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) return <p className="community-state">Memuat board...</p>
  if (error || !board) return <p className="community-state error">{error || 'Board tidak ditemukan'}</p>

  return (
    <div className="board-detail-page">
      <nav className="board-breadcrumb">
        <Link to="/boards" className="breadcrumb-link">Boards</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{board.name}</span>
      </nav>

      <header className="board-detail-header">
        <div className="board-info">
          <h1 className="board-detail-title">{board.name}</h1>
          <p className="board-detail-description">{board.description || 'Koleksi visual tersimpan.'}</p>
        </div>
      </header>

      {board.items.length === 0 && <p className="community-state">Board ini masih kosong. Simpan post dari Home untuk mengisinya.</p>}
      <ResponsiveMasonry
        items={board.items}
        estimateHeight={estimateBoardItemHeight}
        renderItem={(item) => {
          const media = item.postMedia?.length
            ? item.postMedia
            : item.publicUrl
              ? [{ url: item.publicUrl, width: item.width, height: item.height }]
              : []
          const activeMedia = media[activeIndex[item.id] || 0] || media[0]
          const ratio = activeMedia?.width && activeMedia?.height ? activeMedia.width / activeMedia.height : 1
          return (
          <article className="gallery-card" key={item.id}>
            {media.length > 1 ? (
              <div className="board-item-carousel" style={{ aspectRatio: ratio }}>
                <div className="board-item-carousel-track" style={{ transform: `translateX(-${(activeIndex[item.id] || 0) * 100}%)` }}>
                  {media.map((m, i) => (
                    <div className="board-item-carousel-slide" key={i}>
                      <MasonryImage imageKey={m.url} alt={item.title} className="gallery-art" fallbackRatio={m.width && m.height ? m.width / m.height : 1} />
                    </div>
                  ))}
                </div>
                <button type="button" className="board-item-carousel-prev" onClick={(event) => { event.stopPropagation(); setActiveIndex((current) => ({ ...current, [item.id]: ((current[item.id] || 0) - 1 + media.length) % media.length })) }}><ChevronLeft size={16} /></button>
                <button type="button" className="board-item-carousel-next" onClick={(event) => { event.stopPropagation(); setActiveIndex((current) => ({ ...current, [item.id]: ((current[item.id] || 0) + 1) % media.length })) }}><ChevronRight size={16} /></button>
                <span className="board-item-carousel-count">{(activeIndex[item.id] || 0) + 1} / {media.length}</span>
              </div>
            ) : (
              <MasonryImage imageKey={item.publicUrl} alt={item.title} className="gallery-art" fallbackRatio={item.width && item.height ? item.width / item.height : 1} />
            )}
            <div className="gallery-card-metadata">
              <div className="metadata-left">
                <span className="author-username">{item.username ? `@${item.username}` : item.externalProvider ? item.externalProvider : 'External'}</span>
                <h3 className="metadata-title">{item.title}</h3>
              </div>
              <div className="metadata-right">
                {isOwner && <button type="button" className="metadata-menu-btn" title="Remove from board" onClick={() => setDeleteTarget(item)}>
                  <Trash2 size={15} />
                </button>}
              </div>
            </div>
          </article>
          )
        }}
      />
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Hapus item board?"
        description={deleteTarget ? `${deleteTarget.title} akan dihapus dari board ini.` : ''}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleRemove}
      />
    </div>
  )
}

export default BoardDetail
