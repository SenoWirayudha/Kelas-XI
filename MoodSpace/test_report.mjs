import { query, pool } from './backend/src/db/pool.js';

// Find a comment and a user to test with
try {
  const [comments, users] = await Promise.all([
    query('select id, content, author_id from comments limit 1'),
    query('select id, username from users limit 1'),
  ]);
  
  console.log('Comment test:', JSON.stringify(comments.rows[0]));
  console.log('User test:', JSON.stringify(users.rows[0]));
  
  // Test findCommentById directly
  if (comments.rows[0]) {
    const r = await query(
      'select id, author_id as "authorId" from comments where id = $1',
      [comments.rows[0].id]
    );
    console.log('findCommentById result:', JSON.stringify(r.rows[0]));
  }
  
  // Test insertReport for user
  if (users.rows[0]) {
    const r = await query(
      `insert into reports (target_type, post_id, comment_id, reported_user_id, reporter_id, reason, detail)
       values ('user', null, null, $1, $1, 'spam', 'test')
       returning id, target_type, post_id, comment_id, reported_user_id, reason, detail, created_at`,
      [users.rows[0].id]
    );
    console.log('Insert user report:', JSON.stringify(r.rows[0]));
  }
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await pool.end();
}
