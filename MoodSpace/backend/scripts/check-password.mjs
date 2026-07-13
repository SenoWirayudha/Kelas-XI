import argon2 from 'argon2';
import { query } from '../src/db/pool.js';

async function check() {
  const email = 'newacc5@gmail.com';
  const testPassword = '12345678';

  const { rows } = await query(
    `select ua.password_hash from user_auth ua
     join users u on u.id = ua.user_id
     where u.email = $1 limit 1`,
    [email]
  );

  if (!rows.length) {
    console.log(`User ${email} not found`);
    process.exit(1);
  }

  const hash = rows[0].password_hash;
  console.log('Stored hash:', hash);

  try {
    const valid = await argon2.verify(hash, testPassword);
    console.log(`\nPassword "12345678" cocok? ${valid ? '✅ YA' : '❌ TIDAK'}`);
  } catch (e) {
    console.error('Verification error:', e.message);
  }

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
