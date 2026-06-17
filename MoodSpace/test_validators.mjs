import { pool } from './backend/src/db/pool.js';
import { findPostById } from './backend/src/modules/posts/posts.repository.js';
import { findUserById } from './backend/src/modules/auth/auth.repository.js';
import { findCommentById } from './backend/src/modules/comments/comments.repository.js';

try {
  // Test findCommentById
  const comments = await findCommentById({ commentId: '00000000-0000-0000-0000-000000000000' });
  console.log('findCommentById (no authorId):', comments);

  // Test findUserById
  const user = await findUserById('00000000-0000-0000-0000-000000000000');
  console.log('findUserById:', user);

  // Test findPostById
  const post = await findPostById({ postId: '00000000-0000-0000-0000-000000000000' });
  console.log('findPostById:', post);

  console.log('All validators work!');
} catch (e) {
  console.error('Error:', e.message);
  console.error('Stack:', e.stack);
} finally {
  await pool.end();
}
