import { ArrowRight, FolderKanban, ImagePlus, Layers3, Sparkles } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import { useAuth } from '../context/authState'

const highlights = [
  {
    icon: ImagePlus,
    title: 'Collect',
    text: 'Kumpulkan gambar, referensi, dan ide visual dalam board yang mudah dibuka lagi.',
  },
  {
    icon: Layers3,
    title: 'Compose',
    text: 'Susun moodboard di canvas bebas dengan layer, crop, frame, text, dan rasio siap publikasi.',
  },
  {
    icon: FolderKanban,
    title: 'Present',
    text: 'Simpan project, lanjutkan revisi, lalu publish hasilnya sebagai post komunitas.',
  },
]

function Landing() {
  const { user, isLoading, openLogin, openRegister } = useAuth()

  if (user) return <Navigate to="/feed" replace />

  return (
    <main className="landing-page">
      <section className="landing-hero" style={{ backgroundImage: `url("${heroImage}")` }}>
        <nav className="landing-nav" aria-label="Landing navigation">
          <Link className="landing-brand" to="/">
            <span>Moodspace</span>
          </Link>
          <div className="landing-nav-actions">
            <Link to="/feed">Feed</Link>
            <Link to="/projects">Projects</Link>
            <button type="button" className="landing-nav-primary" onClick={openLogin} disabled={isLoading}>Login</button>
          </div>
        </nav>

        <div className="landing-hero-content">
          <div className="landing-kicker">
            <Sparkles size={16} />
            <span>Creative moodboard workspace</span>
          </div>
          <h1>Moodspace</h1>
          <p>
            Workspace visual untuk mengumpulkan inspirasi, menyusun canvas moodboard,
            dan mempresentasikan arah kreatif dalam satu alur.
          </p>
          <div className="landing-hero-actions">
            <button type="button" className="landing-primary-btn" onClick={openRegister} disabled={isLoading}>
              Start Creating
              <ArrowRight size={18} />
            </button>
            <Link className="landing-secondary-btn" to="/feed">Explore Feed</Link>
          </div>
        </div>

        <div className="landing-hero-strip" aria-label="Product signals">
          <span>Boards</span>
          <span>Canvas Editor</span>
          <span>Autosave</span>
          <span>Publish</span>
        </div>
      </section>

      <section className="landing-flow" aria-label="Moodspace workflow">
        <div className="landing-section-heading">
          <span>Workflow</span>
          <h2>Dari referensi ke canvas siap presentasi.</h2>
        </div>
        <div className="landing-highlight-grid">
          {highlights.map(({ icon: Icon, title, text }) => (
            <article className="landing-highlight" key={title}>
              <div className="landing-highlight-icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default Landing
