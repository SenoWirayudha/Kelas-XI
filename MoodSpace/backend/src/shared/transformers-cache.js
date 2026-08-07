import { env } from '@xenova/transformers'
import os from 'node:os'
import path from 'node:path'

// Belmo/Coolify: node_modules filesystem is read-only, so the default cache
// (node_modules/@xenova/transformers/.cache) cannot be written. Redirect model
// downloads to a writable temp dir so CLIP models warm up / load correctly.
if (!process.env.TRANSFORMERS_CACHE_DIR) {
  env.cacheDir = path.join(os.tmpdir(), 'moodspace-transformers-cache')
} else {
  env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR
}