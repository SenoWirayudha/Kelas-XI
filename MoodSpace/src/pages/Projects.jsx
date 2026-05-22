import {
  CloudUpload,
  Crown,
  Filter,
  Heart,
  Eye,
  MoreHorizontal,
  RotateCcw,
} from 'lucide-react'
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

function Projects() {
  return (
    <section className="projects-page">
      <header className="projects-hero">
        <div>
          <h1>Your Projects</h1>
          <p>Manage and showcase your creative work within the Moodspace ecosystem.</p>
        </div>
        <div className="projects-actions">
          <button className="project-filter-btn" type="button">
            <Filter size={17} strokeWidth={1.8} />
            Filter
          </button>
          <button className="project-upload-btn" type="button">
            <CloudUpload size={18} strokeWidth={1.8} />
            Upload New
          </button>
        </div>
      </header>

      <div className="projects-grid masonry-grid">
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
      </div>

      <button className="load-projects-btn" type="button">
        <RotateCcw size={18} strokeWidth={1.8} />
        Load More Projects
      </button>
    </section>
  )
}

export default Projects
