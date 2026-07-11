import { pool } from './src/db/pool.js'
import jwt from 'jsonwebtoken'
import { env } from './src/config/env.js'

// Create a valid token for existing user
const { rows } = await pool.query("select id, username, role from users order by created_at asc limit 1")
const user = rows[0]
const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' })

console.log('Testing with user:', user.username, user.id)

const resp = await fetch('http://localhost:4000/api/workspaces/search-users?q=new4', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const data = await resp.json()
console.log('Status:', resp.status)
console.log('Response:', JSON.stringify(data, null, 2))

await pool.end()
