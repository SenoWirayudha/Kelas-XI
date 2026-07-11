import { query } from './backend/src/db/pool.js'

// Register a user directly
import argon2 from 'argon2'

const passwordHash = await argon2.hash('password1234')
const r = await query(
  `INSERT INTO users (id, email, username, display_name, password_hash, email_verified_at, role, status)
   VALUES (gen_random_uuid(), 'testcollab444@test.com', 'testcollab444', 'Test Collab', $1, now(), 'user', 'active')
   RETURNING id, email, username`,
  [passwordHash]
)
console.log('Created:', JSON.stringify(r.rows))

// Now test search by running the query
const r2 = await query(
  `select u.id, u.email, u.username, u.display_name as "displayName"
   from users u
   where u.email_verified_at is not null
     and (lower(u.email) like lower($1) or lower(u.username) like lower($1))
   limit 10`,
  ['%testcollab444%']
)
console.log('Found:', JSON.stringify(r2.rows))

process.exit(0)
