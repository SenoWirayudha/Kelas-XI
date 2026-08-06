import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

try {
  execSync(`node ${path.join(__dirname, 'db', 'migrate.js')}`, { stdio: 'inherit' })
} catch (error) {
  console.error('[START] DB migration failed:', error.message)
}

await import('./server.js')
