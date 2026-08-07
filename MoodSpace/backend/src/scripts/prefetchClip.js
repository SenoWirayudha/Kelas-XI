// Build-step prefetch: downloads both CLIP models into ./model_cache so the
// runtime server loads them from the image filesystem instead of writing to a
// RAM-backed /tmp (which ENOSPC on Belmo free 512MB).
//
// Run during the Belmo Build Command:  node backend/src/scripts/prefetchClip.js
import { warmUpClip } from '../modules/externalImages/clip.service.js'

const start = Date.now()
try {
  await warmUpClip()
  console.log(`[PREFETCH] CLIP models cached in ${Date.now() - start}ms`)
} catch (error) {
  console.error('[PREFETCH] CLIP prefetch failed (non-fatal):', error.message)
}
process.exit(0)