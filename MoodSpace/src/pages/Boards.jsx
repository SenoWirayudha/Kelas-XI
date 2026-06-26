import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Pen, Trash2 } from 'lucide-react'
import ConfirmationModal from '../components/ConfirmationModal'
import NewBoardModal from '../components/NewBoardModal'
import { useAuth } from '../context/authState'
import { deleteBoard, listBoards } from '../lib/api/boards'

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently updated'
  return `Updated ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

function BoardCover({ images = [] }) {
  const slots = Array.from({ length: 4 }, (_, index) => images[index] || null)
  return (
    <div className="board-cover">
      {slots.map((url, index) => (
        <div
          key={`${url || 'empty'}-${index}`}
          className="board-thumb"
          style={url ? { backgroundImage: `url("${url}")` } : undefined}
        />
      ))}
    </div>
  )
}

function Boards() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthLoading, requireAuth } = useAuth()
  const [boards, setBoards] = useState([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editBoard, setEditBoard] = useState(null)
  const [error, setError] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return
    setIsLoading(true)
    listBoards()
      .then((payload) => setBoards(payload.boards))
      .catch((nextError) => setError(nextError.message || 'Boards gagal dimuat'))
      .finally(() => setIsLoading(false))
  }, [isAuthenticated, isAuthLoading])

  const visibleBoards = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return boards
    return boards.filter((board) => board.name.toLowerCase().includes(normalized))
  }, [boards, query])

  const handleCreate = async () => {
    if (!requireAuth('login')) return
    setIsCreateModalOpen(true)
  }

  const handleCreated = (updated) => {
    if (editBoard) {
      setBoards((current) => current.map((b) => b.id === updated.id ? { ...b, ...updated } : b))
      setEditBoard(null)
    } else {
      setBoards((current) => [updated, ...current])
      navigate(`/boards/${updated.id}`)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteBoard(deleteTarget.id)
      setBoards((current) => current.filter((b) => b.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = () => setOpenMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

  if (!isAuthLoading && !isAuthenticated) {
    return (
      <section className="boards-page">
        <header className="boards-header"><h1>Your Boards</h1></header>
        <button type="button" className="new-board-btn" onClick={() => requireAuth('login')}>Login untuk melihat Boards</button>
      </section>
    )
  }

  return (
    <section className="boards-page">
      <header className="boards-header">
        <h1>Your Boards</h1>
        <p>Koleksi referensi dan workspace publik yang kamu simpan.</p>
      </header>

      <div className="boards-toolbar">
        <label className="boards-search">
          <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M16.5 16.5 21 21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input type="search" placeholder="Search boards..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="boards-controls">
          <button type="button" className="new-board-btn" onClick={handleCreate}>
            <span aria-hidden="true">+</span>
            New Board
          </button>
        </div>
      </div>

      {error && <p className="community-state error">{error}</p>}
      {isLoading && <p className="community-state">Memuat boards...</p>}
      {!isLoading && visibleBoards.length === 0 && <p className="community-state">Belum ada board. Buat board pertama untuk menyimpan referensi.</p>}

      <div className="boards-grid">
        {visibleBoards.map((board) => (
          <article key={board.id} className="board-card" onClick={() => navigate(`/boards/${board.id}`)}>
            <BoardCover images={board.coverImages} />
            <div className="board-card-header">
              <h3 className="board-title">{board.name}</h3>
              <div className="board-menu-wrapper">
                <button type="button" className="board-menu-btn" onClick={(event) => { event.stopPropagation(); setOpenMenuId(openMenuId === board.id ? null : board.id) }} aria-label="Board menu">
                  <MoreVertical size={16} />
                </button>
                {openMenuId === board.id && (
                  <div className="board-dropdown-menu" onClick={(event) => event.stopPropagation()}>
                    <button type="button" className="board-dropdown-item" onClick={(event) => { event.stopPropagation(); setOpenMenuId(null); setEditBoard(board) }}>
                      <Pen size={14} />
                      Edit Board
                    </button>
                    <button type="button" className="board-dropdown-item danger" onClick={(event) => { event.stopPropagation(); setOpenMenuId(null); setDeleteTarget(board) }}>
                      <Trash2 size={14} />
                      Delete Board
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="board-meta">
              <span>{board.itemCount} items</span>
              <span>{formatDate(board.updatedAt)}</span>
            </div>
            <div className="board-tags">
              {board.categories.slice(0, 2).map((tag) => <span key={tag} className="board-tag">{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
      <NewBoardModal
        isOpen={isCreateModalOpen || !!editBoard}
        board={editBoard}
        onCancel={() => { setIsCreateModalOpen(false); setEditBoard(null) }}
        onCreated={handleCreated}
      />
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete board?"
        description={deleteTarget ? `"${deleteTarget.name}" and all its items will be permanently deleted.` : ''}
        confirmLabel="Delete Board"
        isConfirming={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </section>
  )
}

export default Boards
