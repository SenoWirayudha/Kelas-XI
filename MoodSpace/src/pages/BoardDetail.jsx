import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Eye, MoreHorizontal } from 'lucide-react'
import { getBoardById } from '../data/mockBoards'
import { getAssetsByBoardId } from '../data/mockAssets'
import MasonryImage from '../components/MasonryImage'

const MASONRY_ROW_HEIGHT = 4
const MASONRY_GAP = 16

function BoardDetail() {
  // Get board ID from route parameter
  const { id } = useParams()
  const navigate = useNavigate()
  const board = getBoardById(id)
  const assets = board ? getAssetsByBoardId(id) : []
  const [assetHeights, setAssetHeights] = useState({})

  useEffect(() => {
    if (board === null) {
      navigate('/boards')
    }
  }, [board, navigate])

  const getGridRowSpan = (asset) => {
    const fallbackHeight = 280 * (1 / (asset.aspectRatio || 1))
    const height = assetHeights[asset.id] || fallbackHeight

    return Math.ceil((height + MASONRY_GAP) / (MASONRY_ROW_HEIGHT + MASONRY_GAP))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (!board) {
    return null
  }

  return (
    <div className="board-detail-page">
      {/* Breadcrumb Navigation */}
      <nav className="board-breadcrumb">
        <Link to="/boards" className="breadcrumb-link">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          Boards
        </Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{board.name}</span>
      </nav>

      {/* Board Header */}
      <header className="board-detail-header">
        <div className="board-info">
          <h1 className="board-detail-title">{board.name}</h1>
          <p className="board-detail-description">{board.description}</p>
          
          <div className="board-tags-list">
            {board.category.map((tag, index) => (
              <span key={index} className="board-detail-tag">
                #{tag.toUpperCase().replace(/-/g, '')}
              </span>
            ))}
          </div>
        </div>

        <div className="board-actions">
          <Link to="/workspace" className="board-action-btn secondary">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Create Project
          </Link>
          <button className="board-action-btn primary">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add to Board
          </button>
          <button className="board-action-btn icon-only">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      </header>

      {/* Masonry Grid */}
      <div className="board-masonry-grid">
        {assets.map((asset) => (
          <article 
            key={asset.id} 
            className="masonry-card"
            style={{ 
              gridRowEnd: `span ${getGridRowSpan(asset)}`,
              cursor: 'pointer'
            }}
          >
            <div className="masonry-card-image">
              <MasonryImage
                imageKey={asset.imageUrl}
                alt={asset.title}
                className="placeholder-image"
                fallbackRatio={asset.aspectRatio}
                onMeasure={(height) => {
                  setAssetHeights((current) => (
                    Math.abs((current[asset.id] || 0) - height) < 1
                      ? current
                      : { ...current, [asset.id]: height }
                  ))
                }}
              >
                <div className="masonry-card-overlay">
                  <div className="masonry-card-actions">
                    <button className="masonry-action-btn" title="Save" onClick={(event) => event.stopPropagation()}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                    <button className="masonry-action-btn" title="Download" onClick={(event) => event.stopPropagation()}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </MasonryImage>
            </div>

            {/* Metadata */}
            <div className="masonry-card-metadata">
              <div className="metadata-left">
                <div className="metadata-author">
                  <div className="author-avatar" />
                  <span className="author-username">@{asset.author.toLowerCase().replace(/\s+/g, '')}</span>
                </div>
                <h3 className="metadata-title">{asset.title}</h3>
              </div>
              <div className="metadata-right">
                <button className="metadata-menu-btn" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal size={16} strokeWidth={2} />
                </button>
                <div className="metadata-stats">
                  <span className="stat-item">
                    <Heart size={13} strokeWidth={2} />
                    {asset.likes >= 1000 ? `${(asset.likes / 1000).toFixed(1)}k` : asset.likes}
                  </span>
                  <span className="stat-item">
                    <Eye size={13} strokeWidth={2} />
                    {asset.saves >= 1000 ? `${(asset.saves / 1000).toFixed(1)}k` : asset.saves}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Board Footer Info */}
      <footer className="board-detail-footer">
        <div className="board-footer-info">
          <span className="footer-label">ASSETS COLLECTED</span>
          <span className="footer-value">{assets.length}</span>
        </div>
        <div className="board-footer-info">
          <span className="footer-label">LAST UPDATED</span>
          <span className="footer-value">{formatDate(board.lastUpdated).toUpperCase()}</span>
        </div>
      </footer>
    </div>
  )
}

export default BoardDetail
