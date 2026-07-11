import { pool } from './src/db/pool.js'

const { rows } = await pool.query(
  "select id, email, username, display_name, email_verified_at from users where username = 'new4'"
)
console.log('User new4:', JSON.stringify(rows, null, 2))

// Also test the actual search query used in the code
const q = 'new4'
const excludeId = '00000000-0000-0000-0000-000000000000'
const { rows: searchRows } = await pool.query(
  `select u.id, u.email, u.username, u.display_name
   from users u
   where u.email_verified_at is not null
     and u.id != $2
     and (lower(u.email) like lower($1) or lower(u.username) like lower($1))
   limit 10`,
  [`%${q}%`, excludeId]
)
console.log('Search results:', JSON.stringify(searchRows, null, 2))

await pool.end()
