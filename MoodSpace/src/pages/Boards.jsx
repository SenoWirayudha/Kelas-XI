import { useNavigate } from 'react-router-dom'
import { getAllBoards } from '../data/mockBoards'

function Boards() {
  const navigate = useNavigate()
  const boards = getAllBoards()

  const handleBoardClick = (boardId) => {
    navigate(`/boards/${boardId}`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Updated today'
    if (diffDays === 1) return 'Updated yesterday'
    if (diffDays < 7) return `Updated ${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <section className="boards-page">
      <header className="boards-header">
        <h1>Your Boards</h1>
        <p>Quick access to your active spaces and creative sprints.</p>
      </header>

      <div className="boards-toolbar">
        <label className="boards-search">
          <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M16.5 16.5 21 21"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input type="search" placeholder="Search boards..." />
        </label>
        <div className="boards-controls">
          <button type="button" className="new-board-btn">
            <span aria-hidden="true">+</span>
            New Board
          </button>
          <select className="boards-select" aria-label="Sort boards">
            <option>Sort: Recent</option>
            <option>Sort: A-Z</option>
            <option>Sort: Most items</option>
          </select>
          <div className="view-toggle" aria-label="View toggle">
            <button type="button" className="view-btn" aria-label="Grid view">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </button>
            <button type="button" className="view-btn" aria-label="List view">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="boards-grid">
        {boards.map((board) => (
          <article 
            key={board.id} 
            className="board-card"
            onClick={() => handleBoardClick(board.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="board-cover">
              {board.coverImages.slice(0, 4).map((img, index) => (
                <div 
                  key={index} 
                  className={`board-thumb thumb-${String.fromCharCode(97 + index)}`}
                ></div>
              ))}
            </div>
            <h3 className="board-title">{board.name}</h3>
            <div className="board-meta">
              <span>{board.assetCount} items</span>
              <span>{formatDate(board.lastUpdated)}</span>
            </div>
            <div className="board-tags">
              {board.category.slice(0, 2).map((tag, index) => (
                <span key={index} className="board-tag">{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Boards
