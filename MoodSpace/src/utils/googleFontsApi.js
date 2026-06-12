const CACHE_KEY = 'moodspace_google_fonts_cache_v2'
const CACHE_DURATION = 24 * 60 * 60 * 1000

const CATEGORY_MAP = {
  'sans-serif': 'Sans Serif',
  serif: 'Serif',
  display: 'Display',
  handwriting: 'Handwriting',
  monospace: 'Monospace',
}

const FALLBACK_MAP = {
  'sans-serif': 'sans-serif',
  serif: 'serif',
  display: 'serif',
  handwriting: 'serif',
  monospace: 'monospace',
}

export const getGoogleFontsApiKey = () => import.meta.env.VITE_GOOGLE_FONTS_API_KEY || ''

// Clear old cache keys on load
try {
  localStorage.removeItem('moodspace_google_fonts_cache')
} catch { /* ignore */ }

const getCached = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_DURATION) return null
    return data
  } catch {
    return null
  }
}

const setCached = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    /* quota exceeded – ignore */
  }
}

const toFontEntry = (f) => {
  const cat = f.category || 'sans-serif'
  return {
    name: f.family,
    family: `${f.family}, ${FALLBACK_MAP[cat] || 'sans-serif'}`,
    category: CATEGORY_MAP[cat] || 'Sans Serif',
  }
}

export const fetchGoogleFonts = async (apiKey) => {
  if (!apiKey) return []

  const cached = getCached()
  if (cached) return cached

  const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google Fonts API error: ${res.status}`)

  const json = await res.json()

  const fonts = (json.items || []).map(toFontEntry)

  setCached(fonts)
  return fonts
}
