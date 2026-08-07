import { env } from '@xenova/transformers'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

// CLIP models must be resident on the image filesystem so runtime loading does
// not write to a RAM-backed /tmp (ENOSPC on Belmo free 512MB). During the build
// step the prefetch script (backend/src/scripts/prefetchClip.js) downloads the
// models into ./model_cache. At runtime the dir already exists on the image's
// app filesystem, so transformers only READS from it (no writes needed).
//
// node_modules is read-only on Belmo, so we never use the default
// node_modules/@xenova/transformers/.cache.
if (process.env.TRANSFORMERS_CACHE_DIR) {
  env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR
} else {
  const projectCache = path.resolve(process.cwd(), 'model_cache')
  try {
    fs.mkdirSync(projectCache, { recursive: true })
    fs.accessSync(projectCache, fs.constants.W_OK)
    env.cacheDir = projectCache
  } catch {
    // Fallback to a writable tmp dir when project dir is not writable.
    env.cacheDir = path.join(os.tmpdir(), 'moodspace-transformers-cache')
  }
}