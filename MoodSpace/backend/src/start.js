import { execSync } from 'child_process'

try {
  execSync('node backend/src/db/migrate.js', { stdio: 'inherit' })
} catch (error) {
  console.error('[START] DB migration failed:', error.message)
  process.exit(1)
}

await import('./server.js')
