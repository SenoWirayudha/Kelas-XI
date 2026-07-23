import { pool } from '../db/pool.js'

const THRESHOLD_WARN = 4000
const THRESHOLD_CRITICAL = 5000
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // 1 day
let intervalHandle = null

export const checkEmbeddingCount = async () => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) as cnt FROM external_images WHERE embedding IS NOT NULL`)
    const count = Number(rows[0]?.cnt || 0)

    if (count >= THRESHOLD_CRITICAL) {
      console.warn(`[EMBEDDING-MONITOR] ⚠️ CRITICAL: ${count} rows with embedding >= ${THRESHOLD_CRITICAL}. pgvector migration URGENT!`)
    } else if (count >= THRESHOLD_WARN) {
      console.warn(`[EMBEDDING-MONITOR] ⚠️ WARNING: ${count} rows with embedding >= ${THRESHOLD_WARN}. Plan pgvector migration soon.`)
    } else {
      console.log(`[EMBEDDING-MONITOR] OK: ${count} rows with embedding (threshold: ${THRESHOLD_WARN})`)
    }

    // Log growth rate if we have a previous check
    const { rows: growth } = await pool.query(`
      SELECT 
        ROUND(COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '7 days') / 7.0, 1) as daily_avg_7d,
        COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '7 days') as last_7days
      FROM external_images WHERE embedding IS NOT NULL
    `)
    const dailyAvg = Number(growth[0]?.daily_avg_7d || 0)
    if (dailyAvg > 0) {
      const daysToWarn = dailyAvg > 0 ? Math.round((THRESHOLD_WARN - count) / dailyAvg) : 'N/A'
      const daysToCrit = dailyAvg > 0 ? Math.round((THRESHOLD_CRITICAL - count) / dailyAvg) : 'N/A'
      console.log(`[EMBEDDING-MONITOR] Growth: ~${dailyAvg}/day (7d: ${growth[0]?.last_7days}), ~${daysToWarn}d to ${THRESHOLD_WARN}, ~${daysToCrit}d to ${THRESHOLD_CRITICAL}`)
    }

    return { count, dailyAvg, thresholdWarn: THRESHOLD_WARN, thresholdCritical: THRESHOLD_CRITICAL }
  } catch (error) {
    console.error('[EMBEDDING-MONITOR] Query failed:', error.message)
    return null
  }
}

export const startEmbeddingMonitor = () => {
  if (intervalHandle) return

  checkEmbeddingCount()
  intervalHandle = setInterval(checkEmbeddingCount, CHECK_INTERVAL_MS)
  console.log(`[EMBEDDING-MONITOR] Daily check scheduled (every ${CHECK_INTERVAL_MS / 1000 / 60 / 60}h)`)
}

export const stopEmbeddingMonitor = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
