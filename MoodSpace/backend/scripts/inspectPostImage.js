import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') })
import { query } from '../src/db/pool.js'

const postId = 'fbc1856f-94b7-4061-bd46-13f4e9df3b01'

// Get metadata + URLs
const { rows: meta } = await query(`select title, metadata from posts where id = $1`, [postId])
console.log('Post:', JSON.stringify(meta[0], null, 2))

const { rows: urls } = await query(
  `select m.public_url, m.content_type
   from post_media pm join media_assets m on m.id = pm.media_id where pm.post_id = $1
   union
   select m.public_url, m.content_type
   from posts p2 join media_assets m on m.id = p2.cover_media_id where p2.id = $1
   limit 1`,
  [postId]
)
console.log('Image:', JSON.stringify(urls[0], null, 2))

// Try HEAD request
try {
  const resp = await fetch(urls[0]?.public_url, { method: 'HEAD' })
  console.log('HTTP status:', resp.status, resp.statusText)
  console.log('Content-Type:', resp.headers.get('content-type'))
  console.log('Content-Length:', resp.headers.get('content-length'))
} catch (e) {
  console.log('Fetch error:', e.message)
}

process.exit(0)
