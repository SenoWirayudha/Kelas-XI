import { Link } from 'react-router-dom'
import { Heart, Eye, MoreHorizontal } from 'lucide-react'
import { aspectRatioMap } from '../utils/aspectRatioMap'
import MasonryImage from '../components/MasonryImage'

const items = [
  { 
    id: 'post-1', 
    title: 'Aura Flux', 
    art: 'art-1', 
    aspectRatio: aspectRatioMap['art-1'],
    author: 'Elena Vance',
    likes: 2400,
    views: 12000
  },
  { 
    id: 'post-2', 
    title: 'Violet Bloom', 
    art: 'art-2', 
    aspectRatio: aspectRatioMap['art-2'],
    author: 'Marcus Chen',
    likes: 1800,
    views: 8500
  },
  { 
    id: 'post-3', 
    title: 'Noir Studio', 
    art: 'art-3', 
    aspectRatio: aspectRatioMap['art-3'],
    author: 'Sofia Rodriguez',
    likes: 3200,
    views: 15000
  },
  { 
    id: 'post-4', 
    title: 'Skyline Drift', 
    art: 'art-4', 
    aspectRatio: aspectRatioMap['art-4'],
    author: 'Kai Nakamura',
    likes: 2100,
    views: 9800
  },
  { 
    id: 'post-5', 
    title: 'Pulse Lines', 
    art: 'art-5', 
    aspectRatio: aspectRatioMap['art-5'],
    author: 'Isabella Martinez',
    likes: 1500,
    views: 7200
  },
  { 
    id: 'post-6', 
    title: 'Cipher Grid', 
    art: 'art-6', 
    aspectRatio: aspectRatioMap['art-6'],
    author: 'Liam O\'Connor',
    likes: 2800,
    views: 11500
  },
]

function Home() {
  return (
    <section className="home-page">
      <div className="tag-row" aria-label="Tags">
        <button type="button" className="tag active">#all_creative</button>
        <button type="button" className="tag">#minimal</button>
        <button type="button" className="tag">#cinematic</button>
        <button type="button" className="tag">#dark_aesthetic</button>
        <button type="button" className="tag">#ui_ux</button>
        <button type="button" className="tag">#abstract</button>
        <button type="button" className="tag">#architecture</button>
        <button type="button" className="tag">#3d_render</button>
      </div>

      <section className="gallery masonry-grid">
        {items.map((item) => (
          <article className="gallery-card" key={item.id}>
            <Link to={`/post/${item.id}`} className="gallery-link">
              <MasonryImage
                imageKey={item.art}
                alt={item.title}
                className="gallery-art"
                fallbackRatio={item.aspectRatio}
              >
                <div className="gallery-card-overlay">
                  <div className="gallery-card-actions">
                    <button className="gallery-action-btn" title="Save" onClick={(e) => e.preventDefault()}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                    <button className="gallery-action-btn" title="Download" onClick={(e) => e.preventDefault()}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </MasonryImage>
            </Link>

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
                <button className="metadata-menu-btn" onClick={(e) => e.preventDefault()}>
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

      <button className="fab" type="button" aria-label="New item">
        +
      </button>
    </section>
  )
}

export default Home
