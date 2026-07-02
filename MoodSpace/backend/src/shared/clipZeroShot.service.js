import { getTextEmbedding, cosineSimilarity } from '../modules/externalImages/clip.service.js'

const CATEGORIES = [
  'food', 'drink', 'landscape', 'beach', 'mountain', 'city', 'nature', 'forest',
  'animal', 'cat', 'dog', 'bird', 'person', 'portrait', 'selfie', 'family',
  'sports', 'vehicle', 'car', 'motorcycle', 'interior', 'exterior', 'architecture',
  'technology', 'fashion', 'clothing', 'art', 'painting', 'plant', 'flower', 'tree',
  'sky', 'sunset', 'night', 'water', 'sea', 'river', 'snow', 'rain',
  'abstract', 'texture', 'black and white', 'vintage', 'minimalist',
  'cafe', 'restaurant', 'music', 'instrument', 'travel',
]

let cachedEmbeddings = null

const getCategoryEmbeddings = async () => {
  if (cachedEmbeddings) return cachedEmbeddings
  const embeddings = await Promise.all(CATEGORIES.map((cat) => getTextEmbedding(cat)))
  cachedEmbeddings = CATEGORIES.map((cat, i) => ({ label: cat, embedding: embeddings[i] }))
  return cachedEmbeddings
}

export const computeZeroShotTags = async (imageEmbedding, { threshold = 0.20, maxTags = 5 } = {}) => {
  if (!imageEmbedding) return []
  const categories = await getCategoryEmbeddings()
  const scored = categories
    .map(({ label, embedding }) => ({ label, score: cosineSimilarity(imageEmbedding, embedding) }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTags)
  return scored.map(({ label }) => label)
}
