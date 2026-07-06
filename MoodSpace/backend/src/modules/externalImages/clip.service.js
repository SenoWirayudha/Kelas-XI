import {
  AutoProcessor,
  AutoTokenizer,
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  RawImage,
} from '@xenova/transformers'

let textModel = null
let textTokenizer = null
let visionModel = null
let visionProcessor = null

const getTextModel = async () => {
  if (!textModel) {
    textModel = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch16', { quantized: true })
    textTokenizer = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch16')
  }
  return { model: textModel, tokenizer: textTokenizer }
}

const getVisionModel = async () => {
  if (!visionModel) {
    visionModel = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch16', { quantized: true })
    visionProcessor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch16')
  }
  return { model: visionModel, processor: visionProcessor }
}

export const l2Normalize = (vector) => {
  let norm = 0
  for (let i = 0; i < vector.length; i++) norm += vector[i] * vector[i]
  norm = Math.sqrt(norm)
  if (norm === 0) return vector
  const normalized = new Array(vector.length)
  for (let i = 0; i < vector.length; i++) normalized[i] = vector[i] / norm
  return normalized
}

// 1x1 pixel white PNG as Buffer — used for vision model warm-up without external file
const DUMMY_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

export const warmUpClip = async () => {
  try {
    console.log('[CLIP] Warming up models...')
    const start = Date.now()
    await Promise.all([
      getTextEmbedding('warmup'),
      getImageEmbedding(DUMMY_IMAGE),
    ])
    console.log(`[CLIP] Models pre-warmed in ${Date.now() - start}ms`)
  } catch (error) {
    console.error('[CLIP] Pre-warm failed:', error.message)
  }
}

export const getTextEmbedding = async (text) => {
  try {
    if (!text || typeof text !== 'string' || text.trim().length < 2) {
      return null
    }
    const { model, tokenizer } = await getTextModel()
    const inputs = await tokenizer(text.trim(), { padding: true, truncation: true })
    const outputs = await model(inputs)
    const embedding = outputs.text_embeds?.data
    if (!embedding) return null
    return l2Normalize(Array.from(embedding))
  } catch (error) {
    console.error('[CLIP] Text embedding failed:', error.message)
    return null
  }
}

export const getImageEmbedding = async (imageInput) => {
  try {
    if (!imageInput) return null
    const { model, processor } = await getVisionModel()
    // RawImage.read() only accepts string (URL/path) or URL instance.
    // For Buffer/Uint8Array/Blob input, use fromBlob() instead.
    const image = typeof imageInput === 'string' || imageInput instanceof URL
      ? await RawImage.read(imageInput)
      : await RawImage.fromBlob(new Blob([imageInput]))
    const inputs = await processor(image)
    const outputs = await model(inputs)
    const embedding = outputs.image_embeds?.data
    if (!embedding) return null
    return l2Normalize(Array.from(embedding))
  } catch (error) {
    console.error('[CLIP] Image embedding failed:', error.message)
    return null
  }
}

export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

export const averageEmbeddings = (embeddings) => {
  if (!embeddings?.length) return null
  if (embeddings.length === 1) return embeddings[0]
  const dim = embeddings[0].length
  const sum = new Array(dim).fill(0)
  for (const emb of embeddings)
    for (let i = 0; i < dim; i++) sum[i] += emb[i]
  const avg = sum.map((v) => v / embeddings.length)
  return l2Normalize(avg)
}

export const rerankByQueryEmbedding = (items, queryEmbedding, topN = null) => {
  if (!queryEmbedding || !items?.length) return items || []
  const scored = items.map((item) => ({
    item,
    score: item._embedding ? cosineSimilarity(queryEmbedding, item._embedding) : 0,
  }))
  scored.sort((a, b) => b.score - a.score)
  const result = scored.map(({ item: { _embedding, ...rest }, score }) => ({
    ...rest,
    clipScore: score,
  }))
  return topN ? result.slice(0, topN) : result
}
