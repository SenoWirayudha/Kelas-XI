import argon2 from 'argon2';
import { query } from '../src/db/pool.js';

async function reset() {
  const email = 'newacc5@gmail.com';
  const newPassword = '12345678';

  const { rows: users } = await query(
    `select id from users where email = $1 limit 1`,
    [email]
  );

  if (!users.length) {
    console.log(`User ${email} not found`);
    process.exit(1);
  }

  const userId = users[0].id;
  const hash = await argon2.hash(newPassword);

  await query(
    `update user_auth set password_hash = $1, password_updated_at = now(), failed_login_count = 0, locked_until = null where user_id = $2`,
    [hash, userId]
  );

  console.log(`✅ Password untuk ${email} berhasil di-reset ke "12345678"`);
  process.exit(0);
}

reset().catch(e => { console.error(e); process.exit(1); });
