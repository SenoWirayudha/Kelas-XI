import { query } from '../../db/pool.js'
import { cosineSimilarity } from '../externalImages/clip.service.js'

const INTERACTION_WEIGHTS = {
  drop_to_canvas: 1.0,
  add_to_board: 0.8,
  save_post: 0.6,
  open_post: 0.2,
}

const MOMENTUM_NEW_USER = 0.7
const MOMENTUM_MATURE = 0.95
const MATURE_THRESHOLD = 50

const l2Normalize = (vector) => {
  let norm = 0
  for (let i = 0; i < vector.length; i++) norm += vector[i] * vector[i]
  norm = Math.sqrt(norm)
  if (norm === 0) return vector
  const out = new Array(vector.length)
  for (let i = 0; i < vector.length; i++) out[i] = vector[i] / norm
  return out
}

const getOrCreateProfile = async (userId) => {
  const { rows } = await query(
    `select embedding, momentum, total_weight
     from user_embeddings
     where user_id = $1`,
    [userId],
  )
  if (rows[0]) return rows[0]

  const defaultEmb = new Array(512).fill(0)
  await query(
    `insert into user_embeddings (user_id, embedding, momentum, total_weight)
     values ($1, $2::jsonb, $3, $4)
     on conflict (user_id) do nothing`,
    [userId, JSON.stringify(defaultEmb), MOMENTUM_NEW_USER, 0],
  )
  return { embedding: defaultEmb, momentum: MOMENTUM_NEW_USER, total_weight: 0 }
}

export const updateProfile = async ({ userId, embedding, weight }) => {
  if (!userId || !embedding || !weight) return

  const profile = await getOrCreateProfile(userId)
  const oldEmb = profile.embedding || new Array(512).fill(0)
  const newTotal = (profile.total_weight || 0) + weight
  const momentum = newTotal < MATURE_THRESHOLD ? MOMENTUM_NEW_USER : MOMENTUM_MATURE

  const updated = new Array(512)
  const alpha = 1 - momentum
  for (let i = 0; i < 512; i++) {
    updated[i] = momentum * (oldEmb[i] || 0) + alpha * embedding[i] * weight
  }

  const normalized = l2Normalize(updated)

  await query(
    `update user_embeddings
     set embedding = $2::jsonb,
         momentum = $3,
         total_weight = $4,
         updated_at = now()
     where user_id = $1`,
    [userId, JSON.stringify(normalized), momentum, newTotal],
  )
}

export const getUserProfileEmbedding = async (userId) => {
  if (!userId) return null
  const { rows } = await query(
    `select embedding from user_embeddings where user_id = $1`,
    [userId],
  )
  const emb = rows[0]?.embedding
  if (!emb) return null
  const sum = emb.reduce((s, x) => s + x * x, 0)
  if (sum === 0) return null
  return emb
}

export const rankPostsByProfile = (posts, profileEmbedding) => {
  if (!profileEmbedding || !posts?.length) return posts
  return posts
    .map((post) => ({
      ...post,
      _clipScore: post.embedding
        ? cosineSimilarity(profileEmbedding, post.embedding)
        : 0,
    }))
    .sort((a, b) => b._clipScore - a._clipScore)
}
