import { createApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './db/pool.js'
import { warmUpClip } from './modules/externalImages/clip.service.js'
import { startEmbeddingMonitor } from './shared/embeddingMonitor.js'

const app = createApp()

const port = env.PORT || 4000

const server = app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
  warmUpClip()
  startEmbeddingMonitor()
})

server.keepAliveTimeout = 65_000
server.headersTimeout = 66_000
server.timeout = 120_000
server.requestTimeout = 120_000

const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down backend`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
