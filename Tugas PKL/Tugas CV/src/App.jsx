import { useEffect, useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import FotoImg from './assets/fotoku.png'
import heroBgVideo from './assets/Mogu.mp4'
import heroTextArt from './assets/Desain text hero section.png'
import dvdImg from './assets/DVD.png'; 
import RoteImg from './assets/Rote.png';
import FilmReviewImg from './assets/film andro.png'
import FilmReviewWebImg from './assets/film web.png'
import CapcutLogo from './assets/CapCut.png'
import DavinciLogo from './assets/DaVinci_Resolve_Studio.png'
import CanvaLogo from './assets/Canva.png'
import AmLogo from './assets/Alight_Motion.png'
import IGLogo from './assets/instagram.jpg'
import TTLogo from './assets/tiktok.jpg'
import LBLogo from './assets/letterboxd.png'

const education = [
  {
    school: 'SMKN 2 Buduran, Sidoarjo',
    major: 'Rekayasa Perangkat Lunak',
    year: '2024 - 2026',
    dot: 'bg-cyan-400',
  },
  {
    school: 'SMPN 2 Sidoarjo',
    major: 'Junior High School',
    year: '2021 - 2024',
    dot: 'bg-rose-300',
  },
]

const projects = [
  {
    title: 'Aplikasi Media Sosial Review Film & Bioskop',
    description:
      'Mengembangkan aplikasi media sosial berbasis film yang dibuat secara mandiri dengan fitur review film, pemesanan tiket bioskop, payment gateway, serta konsep media sosial khusus film seperti Letterboxd. Dalam proyek ini saya berperan sebagai pengembang utama yang mengerjakan keseluruhan sistem.',
    images: [FilmReviewImg, FilmReviewWebImg],
  },
  {
    title: 'E-commerce DVD Store',
    description:
      'Membuat konsep website e-commerce sederhana untuk jual beli DVD film dengan fitur payment manual, ulasan, dan rating. Berkontribusi dalam perancangan ide desain UI dan tampilan website secara keseluruhan.',
    image: dvdImg,
  },
  {
    title: 'Website Informasi Kabupaten Rote Ndao',
    description:
      'Mengembangkan website informatif mengenai keanekaragaman Kepulauan Rote Ndao. Berkontribusi dalam ide desain UI, serta terlibat dalam proses pengembangan web.',
    image: RoteImg,
    websiteUrl: 'https://v0-rote-ndao-website.vercel.app/',
  },
]

const experience = [
  {
    role: 'Pameran SMPN 2 Sidoarjo',
    title: 'Documentation & Design Team',
    desc: 'Berperan dalam tim dokumentasi dan desain untuk acara pameran sekolah. Membantu merancang konsep poster/pamflet promosi.',
    icon: 'ᝰ.ᐟ',
    tone: 'bg-rose-100 text-rose-500',
  },
  {
    role: 'Kegiatan Kokurikuler (Pembuatan Taman Sekolah)',
    title: 'Content & Documentation',
    desc: 'Bertanggung jawab dalam dokumentasi dan publikasi kegiatan: Mengambil foto dan video progres kegiatan, mengedit konten visual untuk media sosial, mengelola upload konten harian di Instagram kelas.',
    icon: '✿',
    tone: 'bg-cyan-100 text-cyan-600',
  },
]

const softSkills = [
  { label: 'Kreativitas dalam membuat desain visual', icon: '' },
  { label: 'Manajemen waktu', icon: '' },
  { label: 'Kerja sama tim', icon: '' }
]

const hardSkills = [
  { label: 'UI/UX Design', icon: '' },
  { label: 'Graphic Design', icon: '' },
  { label: 'Video Editing', icon: '' },
  { label: 'HTML & CSS', icon: '' },
]

const tools = [
  { label: 'CapCut', icon: CapcutLogo },
  { label: 'Alight Motion', icon: AmLogo },
  { label: 'DaVinci Resolve', icon: DavinciLogo },
  { label: 'Canva', icon: CanvaLogo },
]

const socialLinks = [
  { name: 'Instagram', short: 'IG', icon: IGLogo, href: 'https://www.instagram.com/sennyudzzz?igsh=ZndsaHBzemd0ZHBx' },
  { name: 'TikTok', short: 'TT', icon: TTLogo, href: 'https://www.tiktok.com/@senngefilm?_r=1&_t=ZS-95C0ka99KEP' },
  { name: 'Letterboxd', short: 'LB', icon: LBLogo, href: 'https://boxd.it/bb4B3' },
]

function IconListItem({ item, tone = 'rose' }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-white/75 px-3 py-2 shadow-sm">
      {item.icon ? (
        <img
          src={item.icon}
          alt={`${item.label} icon`}
          className="h-6 w-6 rounded-md object-cover"
        />
      ) : (
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
            tone === 'cyan' ? 'bg-cyan-100 text-cyan-700' : 'bg-rose-100 text-rose-600'
          }`}
          aria-hidden="true"
        >
          {item.label.charAt(0)}
        </span>
      )}
      <span className="text-sm text-slate-700">{item.label}</span>
    </li>
  )
}

function RevealSection({ children, className = '', ...props }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = ref.current
    if (!target) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.14 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}

function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [isSending, setIsSending] = useState(false)
  const [toast, setToast] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}
    if (!formData.fullName.trim()) nextErrors.fullName = 'Full Name is required'
    if (!formData.email.trim()) nextErrors.email = 'Email is required'
    if (!formData.message.trim()) nextErrors.message = 'Message is required'
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !publicKey) {
      alert('EmailJS belum dikonfigurasi. Isi VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, dan VITE_EMAILJS_PUBLIC_KEY.')
      return
    }

    try {
      setIsSending(true)
      await emailjs.send(
        serviceId,
        templateId,
        {
          name: formData.fullName,
          email: formData.email,
          message: formData.message,
          from_name: formData.fullName,
          from_email: formData.email,
          reply_to: formData.email,
        },
        publicKey
      )

      setToast('Message sent successfully!')
      setFormData({ fullName: '', email: '', message: '' })
      setErrors({})
      window.setTimeout(() => setToast(''), 2800)
    } catch {
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-3xl">
      <div className="glass rounded-[2rem] px-6 py-10 shadow-soft md:px-10">
        <div className="mx-auto max-w-xl text-center">
          <h3 className="section-title text-3xl font-semibold text-slate-800">Contact Me</h3>
          <p className="mt-3 text-slate-600">
            Feel free to reach out for collaborations or just a friendly hello!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-xl space-y-4">
          <div>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            />
            {errors.fullName && <p className="mt-1 text-xs text-rose-500">{errors.fullName}</p>}
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
          </div>

          <div>
            <textarea
              name="message"
              placeholder="Message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            />
            {errors.message && <p className="mt-1 text-xs text-rose-500">{errors.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full rounded-xl bg-gradient-to-r from-rose-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        {toast && (
          <p className="mt-4 text-center text-sm font-medium text-emerald-600 transition">
            {toast}
          </p>
        )}

      </div>
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFilmPreview, setActiveFilmPreview] = useState(0)

  const navItems = ['Home', 'About', 'Project', 'Skill', 'Experience', 'Contact']

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveFilmPreview((prev) => (prev === 0 ? 1 : 0))
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <div className="overflow-x-hidden text-slate-800">
      <header className="fixed left-0 top-0 z-50 w-full px-5 py-4 md:px-10">
        <div className="glass-nav mx-auto flex max-w-6xl items-center justify-end rounded-full px-5 py-3 md:justify-center">
          <nav className="hidden gap-6 text-sm md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-slate-600 transition hover:text-rose-500"
              >
                {item}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="glass-pill rounded-full px-4 py-2 text-sm font-semibold text-slate-700 md:hidden"
          >
            Menu
          </button>
        </div>

        {menuOpen && (
          <div className="mx-auto mt-3 max-w-6xl md:hidden">
            <nav className="glass-nav rounded-3xl px-5 py-4">
              <ul className="grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-white/55"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </header>

      <section
        id="home"
        className="relative flex min-h-screen items-center justify-center px-6 pb-24 pt-32 text-center md:px-10"
      >
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <video
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="Hero background video"
          >
            <source src={heroBgVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,112,161,.28),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(109,224,255,.3),transparent_36%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/16 via-white/26 to-white/56 backdrop-blur-[3.5px]" />
        </div>

        <div className="max-w-5xl">
          <div className="hero-shine-wrap mx-auto w-[320px] animate-float sm:w-[480px] md:w-[640px] lg:w-[760px]">
            <img
              src={heroTextArt}
              alt="Portofolio Muhammad Seno Wirayudha"
              className="hero-text-art"
            />
            <span
              className="hero-shine-sweep"
              style={{
                WebkitMaskImage: `url(${heroTextArt})`,
                maskImage: `url(${heroTextArt})`,
              }}
              aria-hidden="true"
            />
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white md:text-base ">
            UI/UX Designer | Video Editor | Graphic Design
          </p>
          <a
            href="#about"
            className="glass-pill mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-1 hover:bg-white/40"
          >
            Let’s Explore
            <span aria-hidden="true">→</span>
          </a>
        </div>

      </section>

      <div className="hero-transition">
        <div className="hero-fade h-full w-full" />
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 md:gap-24 md:px-10">
        <RevealSection id="about" className="scroll-mt-28">
          <div className="glass flex flex-col items-center gap-6 rounded-[2rem] px-6 py-8 shadow-soft md:flex-row md:gap-10 md:px-10 md:py-10">
            <img
              src={FotoImg}
              alt="Profile"
                className="h-36 w-36 rounded-full border-4 border-white object-cover object-[50%_5%] shadow-lg"
            />
            <div className="text-center md:text-left">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Get to Know Me</p>
              <h2 className="section-title mt-1 text-3xl font-semibold text-slate-800">Designing Digital Experiences</h2>
              <p className="mt-2 text-sm text-slate-600">Magersari, Sidoarjo, Jawa Timur</p>
              <p className="mt-4 max-w-2xl leading-relaxed text-slate-700/90">
                  Halo! Saya Seno, siswa SMK jurusan Rekayasa Perangkat Lunak yang tertarik di bidang UI/UX design, desain grafis, dan video editing. Saya suka membuat tampilan yang tidak hanya menarik secara visual, tapi juga nyaman digunakan. Selain itu, saya juga memiliki pemahaman dasar dalam pengembangan web, sehingga saya bisa menggabungkan desain dan fungsionalitas dalam satu proyek. Saat ini, saya terus belajar dan mengembangkan skill untuk menjadi UI/UX Designer yang lebih profesional. Saya juga tertarik dengan film, terutama dalam memahami bagaimana visual dan storytelling dapat membangun pengalaman yang emosional, yang kemudian saya adaptasi dalam proses desain UI/UX.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                {['UI/UX Design (basic)', 'Video Editing', 'Graphic Design'].map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection id="education" className="scroll-mt-28">
          <h3 className="section-title mb-7 text-center text-3xl font-semibold text-slate-800">Education Path</h3>
          <div className="relative ml-3 border-l-2 border-slate-200 pl-7 md:mx-auto md:max-w-4xl">
            {education.map((item) => (
              <article key={item.school} className="relative mb-6 last:mb-0">
                <span className={`absolute -left-[38px] top-7 h-3.5 w-3.5 rounded-full ring-4 ring-white ${item.dot}`} />
                <div className="rounded-3xl bg-white px-6 py-5 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-semibold text-slate-800">{item.school}</h4>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{item.year}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">{item.major}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection id="project" className="scroll-mt-28">
          <h3 className="section-title mb-7 text-3xl font-semibold text-slate-800">Creative Portfolio</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((item, index) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-[1.6rem] bg-white shadow-soft transition duration-300 hover:scale-[1.03] hover:shadow-[0_20px_50px_-18px_rgba(56,189,248,0.45)]"
              >
                {index === 0 && item.images ? (
                  <button
                    type="button"
                    onClick={() => setActiveFilmPreview((prev) => (prev === 0 ? 1 : 0))}
                    className="group relative block h-44 w-full overflow-hidden text-left"
                    aria-label="Ganti preview gambar project"
                  >
                    <img
                      src={item.images[0]}
                      alt={`${item.title} mobile preview`}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                        activeFilmPreview === 0 ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <img
                      src={item.images[1]}
                      alt={`${item.title} web preview`}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                        activeFilmPreview === 1 ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white opacity-80 backdrop-blur transition group-hover:opacity-100">
                      Tap to switch
                    </span>
                  </button>
                ) : (
                  <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                )}
                <div className="p-5">
                  <h4 className="text-xl font-semibold text-slate-800">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                  {item.websiteUrl && (
                    <a
                      href={item.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    >
                      Kunjungi Website
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection id="skill" className="scroll-mt-28">
          <h3 className="section-title mb-7 text-3xl font-semibold text-slate-800">Skillset Universe</h3>
          <div className="grid gap-5 lg:grid-cols-3">
            <article className="rounded-3xl bg-rose-50 p-6 shadow-soft">
              <h4 className="text-lg font-semibold text-rose-600">Soft Skills</h4>
              <ul className="mt-4 space-y-2">
                {softSkills.map((item) => (
                  <IconListItem key={item.label} item={item} tone="rose" />
                ))}
              </ul>
            </article>
            <article className="rounded-3xl bg-cyan-50 p-6 shadow-soft">
              <h4 className="text-lg font-semibold text-cyan-700">Hard Skills</h4>
              <ul className="mt-4 space-y-2">
                {hardSkills.map((item) => (
                  <IconListItem key={item.label} item={item} tone="cyan" />
                ))}
              </ul>
            </article>
            <article className="glass rounded-3xl p-6 shadow-soft">
              <h4 className="text-lg font-semibold text-slate-700">Tools</h4>
              <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {tools.map((tool) => (
                  <li key={tool.label} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-slate-600 shadow">
                    {tool.icon ? (
                      <img src={tool.icon} alt={`${tool.label} icon`} className="h-5 w-5 rounded object-cover" />
                    ) : (
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" aria-hidden="true" />
                    )}
                    <span>{tool.label}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </RevealSection>

        <RevealSection id="experience" className="scroll-mt-28">
          <h3 className="section-title mb-7 text-center text-3xl font-semibold text-slate-800">Experience & Roles</h3>
          <div className="space-y-4 md:mx-auto md:max-w-4xl">
            {experience.map((item) => (
              <article key={item.title} className="flex gap-4 rounded-3xl bg-white p-5 shadow-soft">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${item.tone}`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{item.role}</p>
                  <h4 className="mt-1 text-lg font-semibold text-slate-800">{item.title}</h4>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection id="contact" className="scroll-mt-28">
          <div className="glass mx-auto max-w-3xl rounded-[2rem] px-8 py-12 text-center shadow-soft">
            <h3 className="section-title text-3xl font-semibold text-slate-800">Let's Create Together</h3>
            <p className="mt-3 text-slate-600">Have a project in mind? Let&apos;s talk about design and impact.</p>
            <div className="mt-8 grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="font-semibold text-slate-700">Email Me</p>
                <p className="mt-1 text-slate-600">fanoyudha03@email.com</p>
                <p className="mt-1 text-slate-600">senoy250@email.com</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="font-semibold text-slate-700">Call Me</p>
                <p className="mt-1 text-slate-600">0882-2533-4652</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  title={social.name}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-[10px] font-semibold text-white transition hover:-translate-y-1 hover:bg-cyan-500"
                >
                  {social.icon ? (
                    <img
                      src={social.icon}
                      alt={`${social.name} icon`}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    social.short
                  )}
                </a>
              ))}
            </div>
          </div>

          <ContactSection />
        </RevealSection>
      </main>

      <footer className="border-t border-white/70 bg-white/50 px-6 py-5 text-xs text-slate-500 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
          <p>© 2026 Muhammad Seno Wirayudha</p>
          <p>Built with React & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  )
}

export default App
