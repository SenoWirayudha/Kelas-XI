import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, MoreHorizontal, Crown } from 'lucide-react'
import { getAllBoards } from '../data/mockBoards'
import { aspectRatioMap } from '../utils/aspectRatioMap'
import MasonryImage from '../components/MasonryImage'

const projects = [
  {
    title: 'Lumina Identity',
    tags: ['Branding', '3D Design'],
    badge: 'Premium',
    art: 'project-art-lumina',
    size: 'medium',
    likes: 248,
    comments: 32,
    aspectRatio: aspectRatioMap['project-art-lumina'],
  },
  {
    title: 'Concrete Echo',
    tags: ['Architecture', 'CGI'],
    art: 'project-art-concrete',
    size: 'large',
    likes: 189,
    comments: 21,
    aspectRatio: aspectRatioMap['project-art-concrete'],
  },
  {
    title: 'Chromatic Flow',
    tags: ['Abstract Art', 'Motion'],
    art: 'project-art-chromatic',
    size: 'small',
    likes: 312,
    comments: 44,
    aspectRatio: aspectRatioMap['project-art-chromatic'],
  },
  {
    title: 'Noir Editorial',
    tags: ['Photography', 'Fashion'],
    art: 'project-art-noir',
    size: 'large',
    likes: 126,
    comments: 18,
    aspectRatio: aspectRatioMap['project-art-noir'],
  },
  {
    title: 'Nexus UI Kit',
    tags: ['UI/UX', 'Web App'],
    badge: 'Active',
    art: 'project-art-nexus',
    size: 'large',
    likes: 401,
    comments: 57,
    aspectRatio: aspectRatioMap['project-art-nexus'],
  },
  {
    title: 'Orbital Void',
    tags: ['Metaverse', 'NFT'],
    art: 'project-art-orbital',
    size: 'small',
    likes: 276,
    comments: 39,
    aspectRatio: aspectRatioMap['project-art-orbital'],
  },
]

const savedItems = [
  { 
    title: 'Luminous Field', 
    art: 'art-1', 
    aspectRatio: aspectRatioMap['art-1'],
    author: 'Marcus Chen',
    likes: 1800,
    views: 9200
  },
  { 
    title: 'Gravity Bloom', 
    art: 'art-2', 
    aspectRatio: aspectRatioMap['art-2'],
    author: 'Sofia Rodriguez',
    likes: 2100,
    views: 11500
  },
  { 
    title: 'Soft Circuit', 
    art: 'art-3', 
    aspectRatio: aspectRatioMap['art-3'],
    author: 'Kai Nakamura',
    likes: 1500,
    views: 7800
  },
  { 
    title: 'Steel Drift', 
    art: 'art-4', 
    aspectRatio: aspectRatioMap['art-4'],
    author: 'Isabella Martinez',
    likes: 2800,
    views: 13200
  },
  { 
    title: 'Glass Orbit', 
    art: 'art-5', 
    aspectRatio: aspectRatioMap['art-5'],
    author: 'Liam O\'Connor',
    likes: 1200,
    views: 6500
  },
  { 
    title: 'Vector Wave', 
    art: 'art-6', 
    aspectRatio: aspectRatioMap['art-6'],
    author: 'Yuki Tanaka',
    likes: 3100,
    views: 15800
  },
]

function Profile() {
  const [activeTab, setActiveTab] = useState('boards')
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
    <section className="profile-page">
      <div className="profile-header">
        <div className="profile-backdrop"></div>
      </div>

      <div className="profile-container" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="profile-hero">
          <div className="profile-left">
            <div className="profile-avatar" aria-hidden="true"></div>
            <div className="profile-info">
              <div>
                <h1>Elena Vance</h1>
                <p className="profile-handle">@elenav_design</p>
              </div>
              <p className="profile-bio">
                Digital Artist & Creative Director specializing in minimalist brand identities and
                futuristic UI systems. Exploring the intersection of light and structure.
              </p>
              <div className="profile-stats">
                <div>
                  <strong>1.2k</strong>
                  <span>Followers</span>
                </div>
                <div>
                  <strong>482</strong>
                  <span>Following</span>
                </div>
                <div>
                  <strong>14</strong>
                  <span>Boards</span>
                </div>
                <div>
                  <strong>32</strong>
                  <span>Projects</span>
                </div>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            <button type="button" className="profile-follow">Follow</button>
            <button type="button" className="profile-share" aria-label="Share profile">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M15 8a3 3 0 1 0-2.8-4H12a3 3 0 0 0 0 6h.2A3 3 0 0 0 15 8z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M9 12 15 9m-6 3 6 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M9 21a3 3 0 1 1 2.8-4H12a3 3 0 0 1-6 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M18 21a3 3 0 1 1 2.8-4H21a3 3 0 0 1-6 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </button>
          </div>
        </div>

        <nav className="profile-tabs" aria-label="Profile sections">
          <button
            type="button"
            className={`profile-tab ${activeTab === 'boards' ? 'active' : ''}`}
            onClick={() => setActiveTab('boards')}
          >
            Boards
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved
          </button>
        </nav>

        <div className="profile-content">
          {activeTab === 'boards' && (
            <section className="boards-grid">
              {boards.map((board) => (
                <article 
                  className="board-card" 
                  key={board.id}
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
            </section>
          )}

          {activeTab === 'projects' && (
            <section className="projects-grid">
              {projects.map((project) => (
                <article className={`project-card ${project.size}`} key={project.title}>
                  <div className="project-card-image">
                    <MasonryImage
                      imageKey={project.art}
                      alt={project.title}
                      className="project-art"
                      fallbackRatio={project.aspectRatio}
                    >
                      {project.badge && (
                        <span className="project-badge">
                          {project.badge === 'Premium' && (
                            <Crown size={14} strokeWidth={1.8} />
                          )}
                          {project.badge}
                        </span>
                      )}
                      <div className="project-card-overlay">
                        <div className="project-card-actions">
                          <button className="project-action-btn" title="Save">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                          <button className="project-action-btn" title="Download">
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

                  {/* Metadata - No Avatar for Projects */}
                  <div className="project-card-metadata">
                    <div className="metadata-left">
                      <h3 className="metadata-title">{project.title}</h3>
                    </div>
                    <div className="metadata-right">
                      <button className="metadata-menu-btn">
                        <MoreHorizontal size={16} strokeWidth={2} />
                      </button>
                      <div className="metadata-stats">
                        <span className="stat-item">
                          <Heart size={13} strokeWidth={2} />
                          {project.likes >= 1000 ? `${(project.likes / 1000).toFixed(1)}k` : project.likes}
                        </span>
                        <span className="stat-item">
                          <Eye size={13} strokeWidth={2} />
                          {project.comments >= 1000 ? `${(project.comments / 1000).toFixed(1)}k` : project.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}

          {activeTab === 'saved' && (
            <section className="gallery">
              {savedItems.map((item) => (
                <article className="gallery-card" key={item.title}>
                  <div className="gallery-link">
                    <MasonryImage
                      imageKey={item.art}
                      alt={item.title}
                      className="gallery-art"
                      fallbackRatio={item.aspectRatio}
                    >
                      <div className="gallery-card-overlay">
                        <div className="gallery-card-actions">
                          <button className="gallery-action-btn" title="Save">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                          <button className="gallery-action-btn" title="Download">
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
                  <div className="gallery-card-metadata">
                    <div className="metadata-left">
                      <div className="metadata-author">
                        <div className="author-avatar" />
                        <span className="author-username">@{item.author.toLowerCase().replace(/\s+/g, '')}</span>
                      </div>
                      <h3 className="metadata-title">{item.title}</h3>
                    </div>
                    <div className="metadata-right">
                      <button className="metadata-menu-btn">
                        <MoreHorizontal size={16} strokeWidth={2} />
                      </button>
                      <div className="metadata-stats">
                        <span className="stat-item">
                          <Heart size={13} strokeWidth={2} />
                          {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
                        </span>
                        <span className="stat-item">
                          <Eye size={13} strokeWidth={2} />
                          {item.views >= 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </section>
  )
}

export default Profile
