import Tesseract from 'tesseract.js'
import { findEntityCandidates } from '../modules/externalImages/externalImages.repository.js'

let worker = null
const OCR_LANG = 'eng'

const getWorker = async () => {
  if (!worker) {
    worker = await Tesseract.createWorker(OCR_LANG).catch((e) => {
      console.error('[OCR] Worker creation failed:', e.message)
      return null
    })
    console.log('[OCR] Worker created')
  }
  return worker
}

const STOPS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'is', 'it', 'its', 'my', 'your', 'his', 'her', 'our', 'their'])

const cleanTitle = (title) => {
  if (!title) return ''
  return title.replace(/\s*\(\d{4}\)\s*(poster|cinematic still)?\s*/gi, '').trim()
}

const getEntityTitles = (c) => {
  const titles = new Set()
  const dt = c.metadata?.displayTitle
  const rawTitle = cleanTitle(c.title)
  if (dt) titles.add(dt.toLowerCase())
  if (rawTitle) titles.add(rawTitle.toLowerCase())
  return [...titles]
}

const getEntityTokens = (c) => {
  const raw = c.metadata?.displayTitle || cleanTitle(c.title)
  return raw.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 3 && !STOPS.has(t))
}

// Levenshtein distance between two strings
const levenshtein = (a, b) => {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// Normalized similarity (1 - edit_distance / max_len)
const tokenSimilarity = (ocrToken, entityToken) => {
  const dist = levenshtein(ocrToken, entityToken)
  return 1 - dist / Math.max(ocrToken.length, entityToken.length)
}

export const findStringMatch = (ocrText, candidates, { minScore = 1000 } = {}) => {
  // Strip non-Latin characters (CJK, emoji, etc.) — they're noise for English OCR
  const noCjk = ocrText.replace(/[^\x00-\x7F]/g, ' ')
  const norm = noCjk.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const ocrTokens = norm.split(/\s+/).filter(t => t.length >= 3)
  const ocrSet = new Set(ocrTokens)

  if (ocrTokens.length < 2) return null

  const scored = []

  for (const c of candidates) {
    const entityTokens = getEntityTokens(c)
    if (entityTokens.length < 2) continue

    const titleRaw = (c.metadata?.displayTitle || cleanTitle(c.title) || '')
    const titleLen = titleRaw.length

    // Phase A1: exact full-string match (norm === title)
    for (const t of getEntityTitles(c)) {
      if (t.length >= 4 && norm === t) {
        scored.push({ candidate: c, score: 20000 + titleLen })
      }
    }

    // Phase A2: exact substring match (title is part of norm)
    for (const t of getEntityTitles(c)) {
      if (t.length >= 4 && norm.includes(t) && norm !== t) {
        scored.push({ candidate: c, score: 10000 + titleLen })
      }
    }

    // Phase B: exact token match (no titleLen — avoids iTunes "- Single" suffix bonus)
    const exactMatched = entityTokens.filter(t => ocrSet.has(t))
    if (exactMatched.length >= Math.max(2, Math.ceil(entityTokens.length * 0.6))) {
      const bonus = c.provider === 'tmdb' ? 50 : 0
      scored.push({ candidate: c, score: 1000 + exactMatched.length * 10 + bonus })
    }

    // Phase C removed — fuzzy token matching produces too many false positives
    // from garbage OCR text (stylized posters, complex backgrounds).
  }

  if (!scored.length) return null
  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]
  if (best.score < minScore) return null
  return best
}

export const extractText = async (imageInput) => {
  if (!imageInput) return null
  try {
    const tesseract = await getWorker()
    const { data } = await tesseract.recognize(imageInput)
    const text = data.text?.trim()
    if (!text || text.length < 3) return null
    return text
  } catch (error) {
    console.error('[OCR] extractText failed:', error.message)
    return null
  }
}

export const matchOcrEntity = async (imageUrl, { threshold = 0.85 } = {}) => {
  if (!imageUrl) return { text: null, entity: null }

  try {
    const tesseract = await getWorker()
    const { data } = await tesseract.recognize(imageUrl)
    const text = data.text?.trim()
    const confidence = data.confidence

    if (!text || text.length < 3) {
      console.log('[OCR] Skipped — text too short')
      return { text: null, entity: null }
    }

    console.log('[OCR] Extracted text:', text.slice(0, 120), `(conf=${confidence.toFixed(1)})`)

    const candidates = await findEntityCandidates()

    // Phase 1: string matching (exact + fuzzy Levenshtein)
    const match = findStringMatch(text, candidates)
    if (match) {
      const c = match.candidate
      const isTmdb = c.provider === 'tmdb'
      const best = {
        type: isTmdb ? 'movie' : 'album',
        entityId: isTmdb ? `tmdb:${c.metadata?.tmdbId}` : `itunes:${c.externalId}`,
        title: isTmdb ? c.metadata?.displayTitle || c.title : c.title,
        score: match.score,
        status: 'suggested',
        _stringMatch: true,
      }
      console.log('[OCR] String match:', best.title)
      return { text, entity: best }
    }

    // No CLIP matching — only string-based matching
    console.log('[OCR] No entity matched via string matching')
    return { text, entity: null }
  } catch (error) {
    console.error('[OCR] Failed:', error.message)
    worker = null
    return { text: null, entity: null }
  }
}
