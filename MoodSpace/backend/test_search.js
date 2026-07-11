import { pool } from './src/db/pool.js'

const { rows } = await pool.query(
  'select id, email, username, email_verified_at from users where username = $1',
  ['new4']
)
console.log('=== User new4 ===')
console.log(JSON.stringify(rows, null, 2))

const excludeId = '00000000-0000-0000-0000-000000000000'
const { rows: found } = await pool.query(
  `select u.id, u.email, u.username, u.display_name
   from users u
   where u.email_verified_at is not null
     and u.id != $2
     and (lower(u.email) like lower($1) or lower(u.username) like lower($1))
   limit 10`,
  ['%new4%', excludeId]
)
console.log('=== Search results ===')
console.log(JSON.stringify(found, null, 2))

await pool.end()
