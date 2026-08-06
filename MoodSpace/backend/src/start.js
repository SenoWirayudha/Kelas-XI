import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await import('./server.js')

const migration = spawn(process.execPath, [path.join(__dirname, 'db', 'migrate.js')], {
  stdio: 'inherit',
})

migration.on('error', (error) => {
  console.error('[START] Failed to spawn DB migration:', error.message)
})

migration.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[START] DB migration exited with code ${code}`)
  } else {
    console.log('[START] DB migration complete')
  }
})
