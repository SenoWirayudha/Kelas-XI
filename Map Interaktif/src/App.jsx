import { useEffect, useState } from 'react'
import './App.css'
import HeroSection from './components/HeroSection'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timerId = setTimeout(() => {
      setIsLoading(false)
    }, 1600)

    return () => clearTimeout(timerId)
  }, [])

  return (
    <main className="app-container">
      {isLoading ? (
        <section className="app-loading-screen" aria-label="Memuat aplikasi">
          <img
            className="app-loading-logo"
            src="/Sidoarjo Logo.png"
            alt="Logo Sidoarjo"
          />
          <h1>Portal Sidoarjo</h1>
          <p>Menyiapkan peta interaktif...</p>
          <div className="app-loading-bar" aria-hidden="true">
            <span />
          </div>
        </section>
      ) : (
        <HeroSection />
      )}
    </main>
  )
}

export default App
