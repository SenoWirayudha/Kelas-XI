// Sample design type classification — ~100 rows with OLD vs NEW labels comparison.
// Does NOT update DB. Uses SETSEED for reproducible sampling.
// Run: node scripts/sampleDesignType.mjs (from backend/)

import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

import { getTextEmbedding } from '../src/modules/externalImages/clip.service.js';

// OLD labels (first run, 42% TMDB poster accuracy)
const OLD_LABELS = [
  { label: 'poster',        text: 'a movie poster, film poster, graphic poster design with title text, minimal poster' },
  { label: 'photography',   text: 'a photograph, photo image, real life photography shot, camera photo' },
  { label: 'illustration',  text: 'a digital illustration, vector art, drawing, graphic design artwork, digital art' },
  { label: 'artwork',       text: 'a painting, fine art, abstract art, artistic creation, canvas art' },
  { label: 'screenshot',    text: 'a screenshot, screen capture, digital interface, computer screen capture' },
]

// NEW labels (refined v2: stronger poster distinction from photography)
const NEW_LABELS = [
  { label: 'poster',        text: 'a movie poster design with title typography, credits, and promotional artwork; a film poster with graphic design elements, text overlay, and visual composition' },
  { label: 'photography',   text: 'a raw photograph without text overlay or title; a candid photo, portrait, or landscape photography without graphic design elements' },
  { label: 'illustration',  text: 'a digital illustration, vector art, drawing, graphic design artwork, digital art' },
  { label: 'artwork',       text: 'a painting, fine art, abstract art, artistic creation, canvas art' },
  { label: 'screenshot',    text: 'a screenshot, screen capture, digital interface, computer screen capture' },
]

const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length || !a.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
};

const classifyOne = (embedding, labels, labelEmbs) => {
  let best = { label: null, score: -1 };
  let runnerUp = { label: null, score: -1 };
  for (const { label, embedding: lemb } of labelEmbs) {
    const score = cosineSimilarity(embedding, lemb);
    if (score > best.score) { runnerUp = best; best = { label, score }; }
    else if (score > runnerUp.score) runnerUp = { label, score };
  }
  return { label: best.label, confidence: best.score, gap: best.score - runnerUp.score };
};

(async () => {
  // 1. Compute label embeddings for both sets (triggers CLIP model load once)
  console.log('[SAMPLE] Computing label embeddings...');
  const start = Date.now();
  const oldEmbs = await Promise.all(OLD_LABELS.map(async (l) => ({ label: l.label, embedding: await getTextEmbedding(l.text) })));
  const newEmbs = await Promise.all(NEW_LABELS.map(async (l) => ({ label: l.label, embedding: await getTextEmbedding(l.text) })));
  const validOld = oldEmbs.filter(l => l.embedding);
  const validNew = newEmbs.filter(l => l.embedding);
  if (validOld.length < OLD_LABELS.length || validNew.length < NEW_LABELS.length) {
    console.error('[SAMPLE] FAILED: some labels missing embeddings');
    process.exit(1);
  }
  console.log('[SAMPLE] Labels ready in', Date.now() - start, 'ms');

  // 2. Get proportional sample with deterministic seed for reproducibility
  await pool.query('SELECT SETSEED(0.5)');

  const providerTargets = {
    tmdb:       Math.ceil(1041 / 1988 * 100),
    itunes:     Math.ceil(351 / 1988 * 100),
    openverse:  Math.ceil(217 / 1988 * 100),
    pexels:     Math.ceil(133 / 1988 * 100),
    unsplash:   Math.ceil(98 / 1988 * 100),
    pixabay:    Math.ceil(82 / 1988 * 100),
    wikimedia:  Math.ceil(66 / 1988 * 100),
  };
  providerTargets.tmdb = Math.min(providerTargets.tmdb, 50);

  const allRows = [];
  for (const [provider, target] of Object.entries(providerTargets)) {
    if (target <= 0) continue;
    const { rows } = await pool.query(
      `select id, provider, title, metadata, thumbnail_url, embedding
       from external_images
       where embedding is not null and provider = $1
       order by random()
       limit $2`,
      [provider, target]
    );
    for (const row of rows) {
      let raw = row.embedding;
      if (!raw) continue;
      if (typeof raw === 'string') raw = JSON.parse(raw);
      if (!Array.isArray(raw) || raw.length < 100) continue;
      allRows.push({
        id: row.id,
        provider: row.provider,
        title: (row.title || '').slice(0, 55),
        imageType: row.metadata?.imageType || null,
        embedding: raw,
      });
    }
  }

  // 3. Classify with both old and new labels
  const results = allRows.map(r => {
    const old = classifyOne(r.embedding, OLD_LABELS, validOld);
    const neu = classifyOne(r.embedding, NEW_LABELS, validNew);
    return { ...r, oldLabel: old.label, oldConf: old.confidence, oldGap: old.gap, newLabel: neu.label, newConf: neu.confidence, newGap: neu.gap };
  });

  // 4. Print summary
  console.log('\n=== OVERALL ===');
  console.log(`Total classified: ${results.length}`);

  // TMDB poster accuracy comparison
  const tmdbPosters = results.filter(r => r.provider === 'tmdb' && r.imageType === 'poster');
  const oldCorrect = tmdbPosters.filter(r => r.oldLabel === 'poster');
  const newCorrect = tmdbPosters.filter(r => r.newLabel === 'poster');
  console.log(`\nTMDB poster samples: ${tmdbPosters.length}`);
  console.log(`OLD accuracy: ${oldCorrect.length}/${tmdbPosters.length} (${(oldCorrect.length/tmdbPosters.length*100).toFixed(0)}%)`);
  console.log(`NEW accuracy: ${newCorrect.length}/${tmdbPosters.length} (${(newCorrect.length/tmdbPosters.length*100).toFixed(0)}%)`);

  // Per-provider distribution comparison
  console.log('\n--- Per-provider distribution: OLD → NEW ---');
  const byProv = {};
  for (const r of results) {
    if (!byProv[r.provider]) byProv[r.provider] = { count: 0, old: {}, neu: {} };
    byProv[r.provider].count++;
    byProv[r.provider].old[r.oldLabel] = (byProv[r.provider].old[r.oldLabel] || 0) + 1;
    byProv[r.provider].neu[r.newLabel] = (byProv[r.provider].neu[r.newLabel] || 0) + 1;
  }
  for (const [prov, data] of Object.entries(byProv)) {
    console.log(`\n  ${prov} (${data.count})`);
    const allTypes = [...new Set([...Object.keys(data.old), ...Object.keys(data.neu)])].sort();
    for (const t of allTypes) {
      const o = data.old[t] || 0;
      const n = data.neu[t] || 0;
      const arrow = o === n ? '=' : (o < n ? '+' : '-');
      console.log(`    ${t.padEnd(14)} OLD:${String(o).padStart(2)} ${arrow}→ NEW:${String(n).padStart(2)}`);
    }
  }

  // 5. Side-by-side for TMDB posters (most important)
  console.log('\n=== TMDB POSTERS SIDE-BY-SIDE ===');
  console.log('OLD'.padEnd(18) + 'NEW'.padEnd(18) + 'Conf(OLD→NEW)    ID              Title');
  console.log(''.padEnd(95, '-'));
  const tmdbSorted = [...tmdbPosters].sort((a, b) => (b.newConf) - (a.newConf));
  for (const r of tmdbSorted) {
    const oldOk = r.oldLabel === 'poster' ? '✅' : ' ';
    const newOk = r.newLabel === 'poster' ? '✅' : ' ';
    const confChange = `${r.oldConf.toFixed(4)}→${r.newConf.toFixed(4)}`;
    console.log(
      `${oldOk} ${r.oldLabel.padEnd(14)} ${newOk} ${r.newLabel.padEnd(14)} ${confChange.padEnd(18)} ${r.id.slice(0, 16).padEnd(16)} ${r.title}`
    );
  }

  // 6. Items that CHANGED classification
  const changed = results.filter(r => r.oldLabel !== r.newLabel);
  if (changed.length) {
    console.log(`\n=== CLASSIFICATION CHANGED (${changed.length} items) ===`);
    for (const r of changed) {
      const oldOk = r.oldLabel === 'poster' ? '✅' : '';
      const newOk = r.newLabel === 'poster' ? '✅' : '';
      console.log(`  ${oldOk}${r.oldLabel.padEnd(14)} → ${newOk}${r.newLabel.padEnd(14)} gap:${r.newGap.toFixed(4)} ${r.provider.padEnd(10)} ${r.title}`);
    }
  }

  await pool.end();
  console.log('\nDone.');
})();
