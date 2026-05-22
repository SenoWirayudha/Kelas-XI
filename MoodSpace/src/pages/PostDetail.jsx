import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react'
import { aspectRatioMap } from '../utils/aspectRatioMap'

// Mock data untuk post detail
const mockPosts = [
  {
    id: 'post-1',
    title: 'Neon Etherealism Vol. 04',
    description: 'An exploration into the intersection of fluid dynamics and digital luminescence. This project utilizes custom shaders to simulate the behavior of silk in a zero-gravity environment, reacting to phantom light sources. Part of a larger series investigating the emotional resonance of generative abstraction.',
    author: {
      name: 'Julian Rivera',
      role: 'Visual Architect',
      avatar: 'avatar-1'
    },
    image: 'art-1',
    tags: ['abstract', '3d-art', 'generative', 'luminescence'],
    likes: 342,
    comments: 24,
    saves: 128,
    category: 'ORIGINAL WORK',
    createdAt: '2024-01-15T10:30:00Z',
    aspectRatio: aspectRatioMap['art-1'],
  },
  {
    id: 'post-2',
    title: 'Cyberpunk Metropolis',
    description: 'A dystopian vision of future urban landscapes, where neon lights pierce through perpetual rain and fog.',
    author: {
      name: 'Elena Vance',
      role: 'Digital Artist',
      avatar: 'avatar-2'
    },
    image: 'art-2',
    tags: ['cyberpunk', 'urban', 'neon', 'architecture'],
    likes: 289,
    comments: 18,
    saves: 95,
    category: 'CONCEPT ART',
    createdAt: '2024-01-14T15:20:00Z',
    aspectRatio: aspectRatioMap['art-2'],
  }
]

const mockComments = [
  {
    id: 'comment-1',
    author: 'Marcus Chen',
    avatar: 'avatar-3',
    text: 'The way you\'ve handled the light refraction on the silk edges is incredible. It feels tangible even though it\'s purely digital. Would love to know what engine you rendered this in!',
    likes: 24,
    timestamp: '2 hours ago'
  },
  {
    id: 'comment-2',
    author: 'Elena Sokolá',
    avatar: 'avatar-4',
    text: 'Absolutely mesmerizing. The color palette reminds me of late-night Tokyo rain. Minimalist yet emotionally heavy. Great work!',
    likes: 18,
    timestamp: '5 hours ago'
  }
]

function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching post data
    const foundPost = mockPosts.find(p => p.id === id)
    if (!foundPost) {
      navigate('/')
      return
    }
    
    setPost(foundPost)
    setComments(mockComments)
    setIsLoading(false)
  }, [id, navigate])

  const handlePostComment = () => {
    if (newComment.trim()) {
      // Add comment logic here
      setNewComment('')
    }
  }

  if (isLoading || !post) {
    return <div className="post-detail-loading">Loading...</div>
  }

  return (
    <div className="post-detail-page">
      {/* Main Content */}
      <div className="post-detail-container">
        {/* Left: Image */}
        <div className="post-detail-image-section">
          <div className="post-category-badge">{post.category}</div>
          <div 
            className={`post-detail-image ${post.image}`}
            style={{ 
              aspectRatio: `1 / ${1 / post.aspectRatio}`,
              width: '100%',
              height: 'auto'
            }}
          ></div>
        </div>

        {/* Right: Info */}
        <div className="post-detail-info-section">
          {/* Author */}
          <div className="post-detail-author">
            <div className={`author-avatar ${post.author.avatar}`}></div>
            <div className="author-info">
              <h3>{post.author.name}</h3>
              <p>{post.author.role}</p>
            </div>
            <button className="follow-btn">Follow</button>
          </div>

          {/* Title & Description */}
          <div className="post-detail-content">
            <h1>{post.title}</h1>
            <p className="post-description">{post.description}</p>

            {/* Tags */}
            <div className="post-tags">
              {post.tags.map((tag, index) => (
                <span key={index} className="post-tag">#{tag}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="post-detail-actions">
            <button className="action-btn primary">
              <Heart size={18} />
              Appreciate
            </button>
            <button className="action-btn secondary">
              <Bookmark size={18} />
              Save
            </button>
            <button className="action-btn secondary">
              <Share2 size={18} />
              Share Project
            </button>
          </div>

          {/* Stats */}
          <div className="post-detail-stats">
            <div className="stat-item">
              <Heart size={16} />
              <span>{post.likes}</span>
            </div>
            <div className="stat-item">
              <MessageCircle size={16} />
              <span>{post.comments}</span>
            </div>
            <div className="stat-item">
              <Bookmark size={16} />
              <span>{post.saves}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="post-comments-section">
        <h2>Comments ({comments.length})</h2>

        {/* Add Comment */}
        <div className="add-comment">
          <div className="comment-avatar current-user"></div>
          <div className="comment-input-wrapper">
            <textarea
              placeholder="Add a thoughtful comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <button 
              className="post-comment-btn"
              onClick={handlePostComment}
              disabled={!newComment.trim()}
            >
              Post Comment
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className={`comment-avatar ${comment.avatar}`}></div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-timestamp">{comment.timestamp}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
                <div className="comment-actions">
                  <button className="comment-action-btn">
                    <Heart size={14} />
                    {comment.likes}
                  </button>
                  <button className="comment-action-btn">Reply</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="show-all-comments-btn">
          Show all comments →
        </button>
      </div>

      {/* Recommended Posts */}
      <div className="recommended-section">
        <h2>More Like This</h2>
        <div className="recommended-grid">
          {mockPosts.filter(p => p.id !== id).map((recommendedPost) => (
            <Link 
              key={recommendedPost.id} 
              to={`/post/${recommendedPost.id}`}
              className="recommended-card"
            >
              <div 
                className={`recommended-image ${recommendedPost.image}`}
                style={{ 
                  aspectRatio: `1 / ${1 / recommendedPost.aspectRatio}`,
                  width: '100%',
                  height: 'auto'
                }}
              ></div>
              <div className="recommended-info">
                <h3>{recommendedPost.title}</h3>
                <div className="recommended-author">
                  <div className={`author-avatar-small ${recommendedPost.author.avatar}`}></div>
                  <span>{recommendedPost.author.name}</span>
                </div>
                <div className="recommended-stats">
                  <span><Heart size={14} /> {recommendedPost.likes}</span>
                  <span><MessageCircle size={14} /> {recommendedPost.comments}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PostDetail
