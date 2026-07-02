import Tesseract from 'tesseract.js'
import { cosineSimilarity, getTextEmbedding } from '../modules/externalImages/clip.service.js'
import { findEntityCandidates } from '../modules/externalImages/externalImages.repository.js'

const OCR_LANG = 'eng+chi_sim+chi_tra+kor'
const MAX_RETRIES = 2

const runOcr = async (imageUrl, attempt = 1) => {
  try {
    const { data } = await Tesseract.recognize(imageUrl, OCR_LANG)
    return data
  } catch (err) {
    if (attempt < MAX_RETRIES && err.message?.includes('read image')) {
      console.log(`[OCR] Retry ${attempt}/${MAX_RETRIES} after image read error...`)
      await new Promise((r) => setTimeout(r, 2000))
      return runOcr(imageUrl, attempt + 1)
    }
    throw err
  }
}

export const matchOcrEntity = async (imageUrl, { threshold = 0.85 } = {}) => {
  if (!imageUrl) return { text: null, entity: null }

  try {
    const data = await runOcr(imageUrl)
    const text = data.text?.trim()
    const confidence = data.confidence

    if (!text || text.length < 3 || confidence < 30) {
      console.log('[OCR] Skipped — text too short or low confidence:', {
        length: text?.length || 0, confidence: confidence?.toFixed(1) || 'N/A',
      })
      return { text: text || null, entity: null }
    }

    console.log('[OCR] Extracted text:', text.slice(0, 120), `(conf=${confidence.toFixed(1)})`)

    const textEmb = await getTextEmbedding(text)
    if (!textEmb) {
      console.log('[OCR] Text embedding failed')
      return { text, entity: null }
    }

    const candidates = await findEntityCandidates()
    let best = null
    for (const c of candidates) {
      if (!c.embedding || !Array.isArray(c.embedding)) continue
      const score = cosineSimilarity(textEmb, c.embedding)
      if (score >= threshold && (!best || score > best.score)) {
        const isTmdb = c.provider === 'tmdb'
        best = {
          type: isTmdb ? 'movie' : 'album',
          entityId: isTmdb ? `tmdb:${c.metadata?.tmdbId}` : `itunes:${c.externalId}`,
          title: isTmdb ? c.metadata?.displayTitle || c.title : c.title,
          score,
          status: 'suggested',
        }
      }
    }

    console.log('[OCR] Entity match result:', best ? `${best.title} (score=${best.score.toFixed(3)})` : 'none')
    return { text, entity: best }
  } catch (error) {
    console.error('[OCR] Failed:', error.message)
    return { text: null, entity: null }
  }
}
