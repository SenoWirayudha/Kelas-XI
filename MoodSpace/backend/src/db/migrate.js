import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from './pool.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.join(__dirname, 'migrations')

const ensureMigrationsTable = async (client) => {
  await client.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `)
}

const getAppliedMigrationIds = async (client) => {
  const { rows } = await client.query('select id from schema_migrations order by id asc')
  return new Set(rows.map((row) => row.id))
}

const run = async () => {
  const client = await pool.connect()

  try {
    await ensureMigrationsTable(client)
    const appliedIds = await getAppliedMigrationIds(client)
    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      if (appliedIds.has(file)) {
        console.log(`Skipping migration ${file}`)
        continue
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8')
      console.log(`Applying migration ${file}`)
      await client.query('begin')
      try {
        await client.query(sql)
        await client.query('insert into schema_migrations (id) values ($1)', [file])
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        throw error
      }
    }

    console.log('Migrations complete')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
