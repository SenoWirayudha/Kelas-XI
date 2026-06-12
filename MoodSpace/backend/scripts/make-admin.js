import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../src/db/pool.js'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') })

const identifier = process.argv[2]

if (!identifier) {
  console.error('Usage: node make-admin.js <email-or-username>')
  process.exit(1)
}

;(async () => {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `update users set role = 'admin', updated_at = now()
       where (email = $1 or username = $1) and status = 'active'
       returning id, email, username, role`,
      [identifier],
    )
    if (rows.length === 0) {
      console.error('No active user found with that email or username')
      process.exit(1)
    }
    console.log(`User ${rows[0].username} (${rows[0].email}) is now an admin`)
  } finally {
    client.release()
    await pool.end()
  }
})()
