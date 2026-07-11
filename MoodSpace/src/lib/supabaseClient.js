import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// TODO: Auth upgrade — ganti anon key dengan Supabase Realtime token
// dari backend endpoint POST /api/collab/token (channel authorization)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diset — collaboration tidak aktif')
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  realtime: {
    heartbeatIntervalMs: 30000,
    timeout: 25000,
    params: {
      eventsPerSecond: 10,
    },
  },
})
