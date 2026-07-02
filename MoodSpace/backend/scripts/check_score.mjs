import { query } from '../src/db/pool.js';
import { cosineSimilarity } from '../src/modules/externalImages/clip.service.js';

async function check() {
  // Post Farewell My Concubine milik user
  const { rows: posts } = await query(
    "select id, embedding from posts where id = '288e6e59-43b3-45b9-991c-bfc5cce1136f' limit 1"
  );
  // TMDB poster The Handmaiden (yang terdeteksi)
  const { rows: tmdb } = await query(
    "select id, title, metadata, embedding from external_images where id = 'tmdb:290098:poster:3upEZ0ltY7WwOSFVXrtiP34D48p-jpg' limit 1"
  );

  if (!posts.length) { console.log('Post not found'); process.exit(1); }
  if (!tmdb.length) { console.log('TMDB not found'); process.exit(1); }

  const postEmb = posts[0].embedding;
  const tmdbEmb = tmdb[0].embedding;

  console.log('Post embedding type:', typeof postEmb, 'isArray:', Array.isArray(postEmb), 'length:', postEmb?.length);
  console.log('TMDB embedding type:', typeof tmdbEmb, 'isArray:', Array.isArray(tmdbEmb), 'length:', tmdbEmb?.length);

  if (!Array.isArray(postEmb) || !Array.isArray(tmdbEmb)) {
    console.log('NOT ARRAY!');
    console.log('Post:', JSON.stringify(postEmb).slice(0, 200));
    console.log('TMDB:', JSON.stringify(tmdbEmb).slice(0, 200));
    process.exit(1);
  }

  // Manual dot product
  let manualDot = 0;
  for (let i = 0; i < postEmb.length; i++) manualDot += postEmb[i] * tmdbEmb[i];

  // Via fungsi
  const fnDot = cosineSimilarity(postEmb, tmdbEmb);

  console.log('Manual dot:', manualDot);
  console.log('Function dot:', fnDot);

  // Norms
  let pNorm = 0, tNorm = 0;
  for (const v of postEmb) pNorm += v * v;
  for (const v of tmdbEmb) tNorm += v * v;
  console.log('Post norm:', Math.sqrt(pNorm));
  console.log('TMDB norm:', Math.sqrt(tNorm));

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
