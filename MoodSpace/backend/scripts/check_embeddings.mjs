import { query } from '../src/db/pool.js';

async function check() {
  const { rows: tmdbEmb } = await query(
    "select id, provider, jsonb_array_length(embedding) as dim from external_images where provider = 'tmdb' and embedding is not null limit 3"
  );
  console.log('TMDB samples:', JSON.stringify(tmdbEmb, null, 2));

  for (const row of tmdbEmb) {
    const { rows } = await query('select embedding from external_images where id = $1', [row.id]);
    if (!rows.length) continue;
    const emb = rows[0].embedding;
    let sum = 0;
    for (const v of emb) sum += v * v;
    const norm = Math.sqrt(sum);
    console.log('TMDB', row.id, 'norm:', norm, 'dim:', emb.length, 'first:', emb[0]);
  }

  const { rows: postEmb } = await query(
    "select id, jsonb_array_length(embedding) as dim from posts where embedding is not null order by created_at desc limit 3"
  );
  console.log('\nPost samples:', JSON.stringify(postEmb, null, 2));

  for (const row of postEmb) {
    const { rows } = await query('select embedding from posts where id = $1', [row.id]);
    if (!rows.length) continue;
    const emb = rows[0].embedding;
    let sum = 0;
    for (const v of emb) sum += v * v;
    const norm = Math.sqrt(sum);
    console.log('Post', row.id, 'norm:', norm, 'dim:', emb.length, 'first:', emb[0]);
  }

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
