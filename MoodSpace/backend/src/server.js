import { createApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './db/pool.js'

const app = createApp()

const port = env.PORT || 4000

const server = app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})

const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down backend`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
