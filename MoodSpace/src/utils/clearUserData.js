import { supabase } from '../lib/supabaseClient'
import { clearImageCache } from '../hooks/useCanvasImages'
import { clearAllDominantColorsCache } from './dominantColors'
import { clearFilterCaches } from './imageFilters'
import { clearAllFontCache } from './konvaUtils'

const cleanupFns = new Set()

export function registerCleanup(fn) {
  cleanupFns.add(fn)
  return () => cleanupFns.delete(fn)
}

export function clearAllUserData() {
  // 1. localStorage: hapus key user-specific (bukan moodspace_access_token — itu
  //    sudah di-handle oleh setAccessToken(null) di client.js)
  try { localStorage.removeItem('moodspace.projects') } catch { /* noop */ }
  try { localStorage.removeItem('moodspace_search_history') } catch { /* noop */ }

  // 2. Module-level in-memory caches
  clearImageCache()
  clearAllDominantColorsCache()
  clearFilterCaches()
  clearAllFontCache()

  // 3. Supabase Realtime: unsubscribe semua channel + hapus dari client.
  //    Client-side only — zero database impact.
  //    Otomatis broadcast presence:leave ke channel subscriber lain.
  try {
    const channels = supabase.getChannels()
    channels.forEach((ch) => {
      ch.unsubscribe()
      supabase.removeChannel(ch)
    })
  } catch { /* noop */ }

  // 4. Registered cleanup functions (component module-level vars)
  cleanupFns.forEach((fn) => fn())
  cleanupFns.clear()
}
