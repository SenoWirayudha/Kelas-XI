import Map from './Map'
import './HeroSection.css'

const profileCards = [
  {
    name: "H. Subandi, S.H., M.Kn",
    role: 'Bupati',
    image: '/Wakil_Bupati_Sidoarjo_Subandi-removebg-preview.png',
  },
  {
    name: 'Hj. Mimik Idayana',
    role: 'Wakil Bupati',
    image: '/Wakil_Bupati_Sidoarjo__Mimik_Idayana-removebg-preview (1).png',
  },
]

const menuItems = [
  { icon: '🏛', label: 'Pemerintahan' },
  { icon: '🗺', label: 'Web GIS' },
  { icon: '🗂', label: 'Satu Data' },
  { icon: '🏙', label: 'Smart City' },
  { icon: '👥', label: 'Pelayanan Publik' },
  { icon: '🎥', label: 'CCTV' },
  { icon: '👁', label: 'Transparansi' },
]

function HeroSection() {
  return (
    <section className="hero-page">
      <div className="hero-wrapper">
        <div className="hero-brand">
          <img
            className="hero-header-logo"
            src="/Sidoarjo Logo.png"
            alt="Logo Sidoarjo"
          />
          <p className="hero-label">Pemkab Sidoarjo</p>
        </div>

        <div className="hero-map-card">
          <Map />
        </div>

        <div className="hero-profile-row">
          {profileCards.map((profile) => (
            <article key={profile.role} className="hero-profile-card">
              <div className="hero-avatar" aria-hidden="true">
                {profile.image ? (
                  <img
                    className="hero-avatar-image"
                    src={profile.image}
                    alt={`Foto ${profile.role}`}
                  />
                ) : (
                  profile.role[0]
                )}
              </div>
              <div>
                <h3>{profile.name}</h3>
                <p>{profile.role}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="hero-menu-row">
          {menuItems.map((item) => (
            <button key={item.label} className="hero-menu-item" type="button">
              <span className="hero-menu-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
