import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Copy,
  Crop,
  Group,
  ImagePlus,
  Layers3,
  Lock,
  MoreHorizontal,
  Share2,
  Search,
  Trash2,
  Users,
  Type,
  Sparkles,
  Shapes,
  Pen,
  Heart,
  Edit3,
  ZoomIn,
  Maximize2,
  Layout,
  Layers,
  Save,
  ExternalLink,
} from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/authState'
import { getHomeFeed } from '../lib/api/posts'
import InfoModal from '../components/InfoModal'
import WanderingCursor from '../components/WanderingCursor'

const formatCount = (value = 0) => (
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
)

const features = [
  {
    icon: Search,
    label: 'AI Visual Search',
    desc: 'Temukan aset yang secara visual mirip dengan referensi Anda hanya dalam satu klik.',
    color: 'var(--color-collect)',
  },
  {
    icon: Users,
    label: 'Real-time Collaboration',
    desc: 'Kerjakan satu moodboard bersama tim secara simultan dengan cursor tracking.',
    color: 'var(--color-present)',
  },
  {
    icon: Type,
    label: 'Multi-run Text Styling',
    desc: 'Kontrol tipografi tingkat lanjut untuk menyusun manifesto atau copy desain.',
    color: 'var(--color-compose)',
  },
  {
    icon: Sparkles,
    label: '30+ Image Effects',
    desc: 'Filter, grain, blur, dan color correction langsung di dalam kanvas.',
    color: 'var(--color-collect)',
  },
  {
    icon: Shapes,
    label: 'Masking & Exclude',
    desc: 'Operasi boolean pada gambar dan shape untuk komposisi yang lebih kompleks.',
    color: 'var(--color-compose)',
  },
  {
    icon: Pen,
    label: 'Bezier & Paint Tools',
    desc: 'Gambar ilustrasi atau elemen dekoratif custom langsung di atas moodboard.',
    color: 'var(--color-compose)',
  },
]

const workflowCards = [
  {
    icon: ImagePlus,
    label: 'COLLECT',
    title: 'Simpan Inspirasi',
    desc: 'Kumpulkan aset dari web, folder lokal, atau hasil AI search ke library pribadi.',
    color: 'var(--color-collect)',
  },
  {
    icon: Layers3,
    label: 'COMPOSE',
    title: 'Susun Moodboard',
    desc: 'Editor kanvas bebas hambatan untuk layouting, layering, dan manipulasi visual.',
    color: 'var(--color-compose)',
  },
  {
    icon: Share2,
    label: 'PRESENT',
    title: 'Presentasikan',
    desc: 'Bagikan arah kreatif dengan tim atau klien melalui link live preview interaktif.',
    color: 'var(--color-present)',
  },
]

const heroTags = [
  { icon: Layout, label: 'Boards', color: '#f7f7fb' },
  { icon: Layers, label: 'Canvas Editor', color: '#22D3EE' },
  { icon: Save, label: 'Autosave', color: '#F59E0B' },
  { icon: ExternalLink, label: 'Publish', color: '#F472B6' },
]

function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); o.disconnect() } },
      { threshold }
    )
    o.observe(el)
    return () => o.disconnect()
  }, [threshold])
  return [ref, isVisible]
}

function AnimatedCount({ value, isVisible }) {
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true
      const duration = 900
      const start = performance.now()
      const raf = requestAnimationFrame(function tick(now) {
        const t = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(Math.round(eased * value))
        if (t < 1) requestAnimationFrame(tick)
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [isVisible, value])

  return formatCount(display)
}

function Landing() {
  const { user, isLoading, openLogin, openRegister } = useAuth()
  const [communityPosts, setCommunityPosts] = useState([])
  const [communityLoading, setCommunityLoading] = useState(true)
  const [communityVisible, setCommunityVisible] = useState(false)
  const communityRef = useRef(null)
  const [discoverPosts, setDiscoverPosts] = useState([])
  const [activeInfoModal, setActiveInfoModal] = useState(null)
  const [flowRef, flowVisible] = useReveal()
  const [ecoRef, ecoVisible] = useReveal()
  const [featuresRef, featuresVisible] = useReveal()
  const [ctaRef, ctaVisible] = useReveal()

  let lastUser = null
  try {
    const raw = localStorage.getItem('moodspace_last_user')
    if (raw) lastUser = JSON.parse(raw)
  } catch { /* ignore */ }

  const heroRef = useRef(null)
  const [cursorXY, setCursorXY] = useState({ x: -100, y: -100 })
  const cursorTarget = useRef({ x: -100, y: -100 })
  const cursorCurrent = useRef({ x: -100, y: -100 })
  const cursorInHero = useRef(false)
  const cursorRaf = useRef(null)

  useEffect(() => {
    let cancelled = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCommunityVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    if (communityRef.current) observer.observe(communityRef.current)

    const fetchPosts = async () => {
      try {
        const data = await getHomeFeed({ limit: 8, mode: 'popular', seed: 'landing-community' })
        if (cancelled) return
        const items = (data.items || [])
          .filter((p) => p.visibility === 'public' && p.cover?.url)
          .slice(0, 6)
        setCommunityPosts(items)
      } catch {
        if (!cancelled) setCommunityPosts([])
      } finally {
        if (!cancelled) setCommunityLoading(false)
      }
    }
    fetchPosts()

    const fetchDiscover = async () => {
      try {
        const data = await getHomeFeed({ limit: 10, mode: 'recent', seed: 'landing-discover' })
        if (cancelled) return
        const items = (data.items || [])
          .filter((p) => p.visibility === 'public' && p.cover?.url)
          .slice(0, 6)
        setDiscoverPosts(items)
      } catch {
        if (!cancelled) setDiscoverPosts([])
      }
    }
    fetchDiscover()

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return

    const hero = heroRef.current
    if (!hero) return

    const onMove = (e) => {
      const rect = hero.getBoundingClientRect()
      cursorTarget.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      cursorInHero.current = true
    }

    const onLeave = () => {
      cursorInHero.current = false
    }

    const tick = () => {
      const cur = cursorCurrent.current
      const tgt = cursorTarget.current
      cur.x += (tgt.x - cur.x) * 0.18
      cur.y += (tgt.y - cur.y) * 0.18
      if (cursorInHero.current || Math.abs(cur.x - tgt.x) > 0.5) {
        setCursorXY({ x: cur.x, y: cur.y })
      } else {
        setCursorXY({ x: -100, y: -100 })
      }
      cursorRaf.current = requestAnimationFrame(tick)
    }

    hero.addEventListener('mousemove', onMove, { passive: true })
    hero.addEventListener('mouseleave', onLeave, { passive: true })
    cursorRaf.current = requestAnimationFrame(tick)

    return () => {
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(cursorRaf.current)
    }
  }, [])

  if (user) return <Navigate to="/feed" replace />

  return (
    <main className="landing-page">
      {/* ─── NAVBAR ─────────────────────────────────────── */}
      <section className="landing-hero" ref={heroRef}>
        <nav className="landing-nav">
          <div className="landing-nav-left">
            <Link className="landing-brand" to="/">
              Moodspace
            </Link>
            <Link className="landing-nav-explore" to="/feed">Explore</Link>
          </div>
          <div className="landing-nav-actions">
            {lastUser ? (
              <div className="landing-nav-continue-group">
                <div
                  className="landing-nav-continue"
                  role="button"
                  tabIndex={0}
                  onClick={() => openLogin(typeof lastUser.identifier === 'string' ? lastUser.identifier : '')}
                  onKeyDown={(e) => e.key === 'Enter' && openLogin(typeof lastUser.identifier === 'string' ? lastUser.identifier : '')}
                >
                  <div
                    className="landing-nav-continue-avatar"
                    style={lastUser.avatarUrl ? { backgroundImage: `url("${lastUser.avatarUrl}")` } : undefined}
                  />
                  Continue as {lastUser.displayName}
                </div>
                <span className="landing-nav-login-sep">|</span>
                <span
                  className="landing-nav-login"
                  role="button"
                  tabIndex={0}
                  onClick={openLogin}
                  onKeyDown={(e) => e.key === 'Enter' && openLogin()}
                >
                  Login
                </span>
              </div>
            ) : (
              <span
                className="landing-nav-login"
                role="button"
                tabIndex={0}
                onClick={openLogin}
                onKeyDown={(e) => e.key === 'Enter' && openLogin()}
              >
                Login
              </span>
            )}
            <button
              type="button"
              className="landing-nav-primary"
              onClick={openRegister}
              disabled={isLoading}
            >
              Start Creating
            </button>
          </div>
        </nav>

        <svg className="landing-hero-lines" viewBox="0 0 1440 800" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100,300 C250,100 500,500 800,250 S1150,550 1500,200" stroke="var(--color-collect)" strokeWidth="1" opacity="0.15" />
          <path d="M-100,450 C350,250 600,650 900,400 S1250,650 1600,350" stroke="var(--color-compose)" strokeWidth="1" opacity="0.12" />
          <path d="M-100,600 C450,400 700,800 1000,550 S1350,750 1700,500" stroke="var(--color-present)" strokeWidth="1" opacity="0.1" />
        </svg>

        {/* ─── FLOATING MOODBOARD CARDS ─────────────────── */}
        <div className="landing-hero-cards" aria-hidden="true">
          {/* ─── CARD TEMPLATE ── Each card has hidden selection handles + avatar + toolbar, activated by cursor ── */}
          <article className="landing-hero-card" data-card-index="0" style={{ top: '22%', left: '6%', rotate: '-6deg', '--float-duration': '4s', '--enter-delay': '0.1s' }}>
            <span className="landing-hero-card-avatar" style={{ background: '#f4b6d2', color: '#1e0c14' }}>R</span>
            <span className="landing-hero-handle" style={{ top: '-4.5px', left: '-4.5px' }} />
            <span className="landing-hero-handle" style={{ top: '-4.5px', left: '50%', transform: 'translateX(-50%)' }} />
            <span className="landing-hero-handle" style={{ top: '-4.5px', right: '-4.5px', left: 'auto' }} />
            <span className="landing-hero-handle" style={{ top: '50%', left: '-4.5px', transform: 'translateY(-50%)' }} />
            <span className="landing-hero-handle" style={{ top: '50%', right: '-4.5px', left: 'auto', transform: 'translateY(-50%)' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '-4.5px', top: 'auto' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '50%', top: 'auto', transform: 'translateX(-50%)' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', right: '-4.5px', left: 'auto', top: 'auto' }} />
            <div className="landing-hero-card-toolbar">
              <span className="landing-hero-toolbar-btn"><Group size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Copy size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Lock size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Crop size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Trash2 size={11} /></span>
              <span className="landing-hero-toolbar-btn"><MoreHorizontal size={11} /></span>
            </div>
            <div className="landing-hero-card-img-wrap">
              <img src="https://picsum.photos/seed/mood6/280/200" alt="" loading="lazy" />
            </div>
            <span className="landing-hero-card-caption">Film noir</span>
          </article>

          <article className="landing-hero-card" data-card-index="1" style={{ top: '18%', right: '6%', left: 'auto', rotate: '7deg', '--float-duration': '5s', '--enter-delay': '0.2s' }}>
            <span className="landing-hero-card-avatar" style={{ background: '#f4b6d2', color: '#1e0c14' }}>R</span>
            <span className="landing-hero-handle" style={{ top: '-4.5px', left: '-4.5px' }} />
            <span className="landing-hero-handle" style={{ top: '-4.5px', left: '50%', transform: 'translateX(-50%)' }} />
            <span className="landing-hero-handle" style={{ top: '-4.5px', right: '-4.5px', left: 'auto' }} />
            <span className="landing-hero-handle" style={{ top: '50%', left: '-4.5px', transform: 'translateY(-50%)' }} />
            <span className="landing-hero-handle" style={{ top: '50%', right: '-4.5px', left: 'auto', transform: 'translateY(-50%)' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '-4.5px', top: 'auto' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '50%', top: 'auto', transform: 'translateX(-50%)' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', right: '-4.5px', left: 'auto', top: 'auto' }} />
            <div className="landing-hero-card-toolbar">
              <span className="landing-hero-toolbar-btn"><Group size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Copy size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Lock size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Crop size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Trash2 size={11} /></span>
              <span className="landing-hero-toolbar-btn"><MoreHorizontal size={11} /></span>
            </div>
            <div className="landing-hero-card-img-wrap">
              <img src="https://picsum.photos/seed/mood7/280/200" alt="" loading="lazy" />
            </div>
            <span className="landing-hero-card-caption">Brand deck</span>
          </article>

          <article className="landing-hero-card" data-card-index="2" style={{ bottom: '8%', left: '5%', top: 'auto', rotate: '8deg', '--float-duration': '4.4s', '--enter-delay': '0.3s' }}>
            <span className="landing-hero-card-avatar" style={{ background: '#f4b6d2', color: '#1e0c14' }}>R</span>
            <span className="landing-hero-handle" style={{ top: '-4.5px', left: '-4.5px' }} />
            <span className="landing-hero-handle" style={{ top: '-4.5px', left: '50%', transform: 'translateX(-50%)' }} />
            <span className="landing-hero-handle" style={{ top: '-4.5px', right: '-4.5px', left: 'auto' }} />
            <span className="landing-hero-handle" style={{ top: '50%', left: '-4.5px', transform: 'translateY(-50%)' }} />
            <span className="landing-hero-handle" style={{ top: '50%', right: '-4.5px', left: 'auto', transform: 'translateY(-50%)' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '-4.5px', top: 'auto' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '50%', top: 'auto', transform: 'translateX(-50%)' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', right: '-4.5px', left: 'auto', top: 'auto' }} />
            <div className="landing-hero-card-toolbar">
              <span className="landing-hero-toolbar-btn"><Group size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Copy size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Lock size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Crop size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Trash2 size={11} /></span>
              <span className="landing-hero-toolbar-btn"><MoreHorizontal size={11} /></span>
            </div>
            <div className="landing-hero-card-img-wrap">
              <img src="https://picsum.photos/seed/mood8/280/200" alt="" loading="lazy" />
            </div>
            <span className="landing-hero-card-caption">Palet warna</span>
          </article>

          <article className="landing-hero-card" data-card-index="3" style={{ bottom: '14%', right: '6%', left: 'auto', top: 'auto', rotate: '-5deg', '--float-duration': '3.8s', '--enter-delay': '0.4s' }}>
            <span className="landing-hero-card-avatar" style={{ background: '#f4b6d2', color: '#1e0c14' }}>R</span>
            <span className="landing-hero-handle" style={{ top: '-4.5px', left: '-4.5px' }} />
            <span className="landing-hero-handle" style={{ top: '-4.5px', left: '50%', transform: 'translateX(-50%)' }} />
            <span className="landing-hero-handle" style={{ top: '-4.5px', right: '-4.5px', left: 'auto' }} />
            <span className="landing-hero-handle" style={{ top: '50%', left: '-4.5px', transform: 'translateY(-50%)' }} />
            <span className="landing-hero-handle" style={{ top: '50%', right: '-4.5px', left: 'auto', transform: 'translateY(-50%)' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '-4.5px', top: 'auto' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '50%', top: 'auto', transform: 'translateX(-50%)' }} />
            <span className="landing-hero-handle" style={{ bottom: '-4.5px', right: '-4.5px', left: 'auto', top: 'auto' }} />
            <div className="landing-hero-card-toolbar">
              <span className="landing-hero-toolbar-btn"><Group size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Copy size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Lock size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Crop size={11} /></span>
              <span className="landing-hero-toolbar-btn"><Trash2 size={11} /></span>
              <span className="landing-hero-toolbar-btn"><MoreHorizontal size={11} /></span>
            </div>
            <div className="landing-hero-card-img-wrap">
              <img src="https://picsum.photos/seed/mood9/280/200" alt="" loading="lazy" />
            </div>
            <span className="landing-hero-card-caption">Editorial</span>
          </article>

          {/* Rian cursor — wanders in safe zones */}
          <WanderingCursor heroRef={heroRef} />

          {/* Visitor's own cursor (mouse-following dot) */}
          <div className="landing-hero-follow-cursor" style={{ transform: `translate(${cursorXY.x}px, ${cursorXY.y}px)` }} />
        </div>

        {/* ─── HERO ──────────────────────────────────────── */}
        <div className="landing-hero-content">
          <div className="landing-kicker">
            <Sparkles size={16} />
            <span>CREATIVE MOODBOARD WORKSPACE</span>
          </div>
          <h1>Moodspace</h1>
          <p>
            Workspace visual untuk mengumpulkan inspirasi, menyusun moodboard,
            presentasi arah kreatif.
          </p>
          <div className="landing-hero-actions">
            <button
              type="button"
              className="landing-primary-btn"
              onClick={openRegister}
              disabled={isLoading}
            >
              Start Creating
              <ArrowRight size={18} />
            </button>
            <Link className="landing-secondary-btn" to="/feed">
              Explore Feed
            </Link>
          </div>
        </div>

        <div className="landing-hero-strip" aria-label="Product signals">
          {heroTags.map(({ icon: TagIcon, label, color }) => (
            <span key={label}>
              <TagIcon size={14} style={{ color }} />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ─── WORKFLOW HEADLINE + CARDS ──────────────────── */}
      <section className="landing-flow" ref={flowRef}>
        <div className={`${flowVisible ? 'landing-reveal-group--visible' : ''}`}>
          <div className="landing-section-heading landing-section-heading--center">
            <h2 className="landing-reveal-child" style={{ '--reveal-delay': '0ms' }}>Dari referensi ke canvas siap presentasi</h2>
          </div>
          <div className="landing-highlight-grid">
            {workflowCards.map(({ icon: Icon, label, title, desc, color }, i) => (
              <article className="landing-highlight landing-reveal-child" key={label} style={{ '--reveal-delay': `${(i * 90) + 160}ms` }}>
              <div className="landing-highlight-icon" style={{ background: color }}>
                <Icon size={22} />
              </div>
              <span className="landing-highlight-category" style={{ color }}>
                {label}
              </span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
        </div>
      </section>

      {/* ─── DUAL-ECOSYSTEM SHOWCASE ──────────────────── */}
      <section className="landing-ecosystem" ref={ecoRef}>
        <div className="landing-ecosystem-inner">
          <div className="landing-ecosystem-heading">
            <h2>
              Satu platform, dua ekosistem — cari inspirasi dan langsung edit
              tanpa pindah tempat
            </h2>
          </div>
          <div className="landing-ecosystem-grid">
            <div className={`landing-eco-panel ${ecoVisible ? 'landing-reveal-child--visible' : ''} landing-reveal-child--left`}>
              <div className="landing-eco-panel-label">
                <Search size={14} />
                <span>Discover</span>
              </div>
              <div className="landing-eco-masonry">
                {discoverPosts.length > 0 ? discoverPosts.map((post, i) => (
                  <div key={post.id} className={`landing-eco-masonry-item ${i === 0 || i === 3 ? 'landing-eco-masonry-item--tall' : ''} ${i === 1 || i === 4 ? 'landing-eco-masonry-item--wide' : ''}`}>
                    <img src={post.cover.url} alt={post.title || ''} loading="lazy" />
                  </div>
                )) : (
                  <>
                    <div className="landing-eco-masonry-item landing-eco-masonry-item--tall" />
                    <div className="landing-eco-masonry-item landing-eco-masonry-item--wide" />
                    <div className="landing-eco-masonry-item" />
                    <div className="landing-eco-masonry-item landing-eco-masonry-item--tall" />
                    <div className="landing-eco-masonry-item landing-eco-masonry-item--wide" />
                  </>
                )}
              </div>
            </div>
            <div className={`landing-eco-panel ${ecoVisible ? 'landing-reveal-child--visible' : ''} landing-reveal-child--right`}>
              <div className="landing-eco-panel-label">
                <Edit3 size={14} />
                <span>Create</span>
              </div>
              <div className="landing-eco-canvas">
                <div className="landing-eco-canvas-art">
                  <div className="landing-eco-mock-bg">
                    <img src="https://picsum.photos/seed/mockbg/400/300" alt="" loading="lazy" />
                  </div>
                  <div className="landing-eco-mock-label">SUTRADARA</div>
                  <div className="landing-eco-mock-overlay landing-eco-mock-overlay--selected">
                    <span className="landing-hero-card-avatar" style={{ background: '#5fd0de' }}>S</span>
                    <span className="landing-hero-handle" style={{ top: '-4.5px', left: '-4.5px' }} />
                    <span className="landing-hero-handle" style={{ top: '-4.5px', left: '50%', transform: 'translateX(-50%)' }} />
                    <span className="landing-hero-handle" style={{ top: '-4.5px', right: '-4.5px', left: 'auto' }} />
                    <span className="landing-hero-handle" style={{ top: '50%', left: '-4.5px', transform: 'translateY(-50%)' }} />
                    <span className="landing-hero-handle" style={{ top: '50%', right: '-4.5px', left: 'auto', transform: 'translateY(-50%)' }} />
                    <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '-4.5px', top: 'auto' }} />
                    <span className="landing-hero-handle" style={{ bottom: '-4.5px', left: '50%', top: 'auto', transform: 'translateX(-50%)' }} />
                    <span className="landing-hero-handle" style={{ bottom: '-4.5px', right: '-4.5px', left: 'auto', top: 'auto' }} />
                    <div className="landing-eco-mock-toolbar">
                      <span className="landing-hero-toolbar-btn"><Group size={11} /></span>
                      <span className="landing-hero-toolbar-btn"><Copy size={11} /></span>
                      <span className="landing-hero-toolbar-btn"><Lock size={11} /></span>
                      <span className="landing-hero-toolbar-btn"><Crop size={11} /></span>
                      <span className="landing-hero-toolbar-btn"><Trash2 size={11} /></span>
                      <span className="landing-hero-toolbar-btn"><MoreHorizontal size={11} /></span>
                    </div>
                    <img src="https://picsum.photos/seed/mockover/300/220" alt="" loading="lazy" />
                  </div>
                </div>
                <div className="landing-eco-canvas-toolbar">
                  <ZoomIn size={16} />
                  <Maximize2 size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ──────────────────────────────── */}
      <section className="landing-features" ref={featuresRef}>
        <div className="landing-features-inner">
          <div className={`landing-features-grid ${featuresVisible ? 'landing-reveal-group--visible' : ''}`}>
            {features.map(({ icon: Icon, label, desc, color }, i) => (
              <div className="landing-feature-item landing-reveal-child" key={label} style={{ '--reveal-delay': `${i * 70}ms` }}>
                <div className="landing-feature-icon" style={{ color, boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 14%, transparent), inset 0 0 20px color-mix(in srgb, ${color} 6%, transparent)` }}>
                  <Icon size={20} />
                </div>
                <div>
                  <strong>{label}</strong>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMUNITY FEED PREVIEW ────────────────────── */}
      <section className="landing-community" ref={communityRef}>
        <div className="landing-community-inner">
          <div className="landing-community-label">Inspirasi Komunitas</div>
          {communityLoading ? (
            <div className="landing-community-grid">
              {[1, 2, 3, 4].map((i) => (
                <div className="landing-community-card landing-community-card--skeleton" key={i}>
                  <div className="landing-community-card-img landing-community-card-skeleton-pulse" />
                </div>
              ))}
            </div>
          ) : communityPosts.length === 0 ? null : (
            <div className="landing-community-grid">
              {communityPosts.map((post, index) => (
                <Link
                  to={`/post/${post.id}`}
                  className={`landing-community-card ${communityVisible ? 'landing-community-card--visible' : ''}`}
                  key={post.id}
                  style={{ '--reveal-delay': `${index * 80}ms` }}
                >
                  <img className="landing-community-card-img" src={post.cover.url} alt={post.title || ''} loading="lazy" />
                  <div className="landing-community-card-overlay">
                    <span className="landing-community-card-title">{post.title || 'Untitled'}</span>
                    <span className="landing-community-card-likes">
                      <Heart size={14} fill="currentColor" />
                      <AnimatedCount value={post.likeCount} isVisible={communityVisible} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────── */}
      <section className="landing-cta" ref={ctaRef}>
        <div className={`landing-cta-inner ${ctaVisible ? 'landing-cta-inner--visible' : ''}`}>
          <h2>Wujudkan ide visual Anda sekarang.</h2>
          <button
            type="button"
            className="landing-primary-btn landing-cta-btn"
            onClick={openRegister}
            disabled={isLoading}
          >
            Start Creating
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <Link className="landing-brand" to="/">
              Moodspace
            </Link>
          </div>
          <div className="landing-footer-links">
            <span role="button" tabIndex={0} onClick={() => setActiveInfoModal('privacy')} onKeyDown={(e) => e.key === 'Enter' && setActiveInfoModal('privacy')}>Privacy</span>
            <span role="button" tabIndex={0} onClick={() => setActiveInfoModal('terms')} onKeyDown={(e) => e.key === 'Enter' && setActiveInfoModal('terms')}>Terms</span>
          </div>
        </div>
        <div className="landing-footer-bottom">
          &copy; 2026 Moodspace. All rights reserved.
        </div>
      </footer>

      {/* ─── PRIVACY / TERMS MODALS ─────────────────────── */}
      <InfoModal type={activeInfoModal} onClose={() => setActiveInfoModal(null)} />
    </main>
  )
}

export default Landing
