import { query, pool } from './backend/src/db/pool.js';

try {
  const [users, comments] = await Promise.all([
    query('select id, username from users limit 3'),
    query('select c.id, c.content, c.author_id, u.username from comments c join users u on u.id = c.author_id limit 3'),
  ]);
  console.log('USERS:', JSON.stringify(users.rows));
  console.log('COMMENTS:', JSON.stringify(comments.rows));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await pool.end();
}
