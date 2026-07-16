# MoodSpace - Browse + CLIP + Home Feed

## Status
Done: CLIP embeddings (external_images, posts, user_embeddings, media_assets), L2 normalization, profile momentum-based EMA, CLIP reranking with threshold 0.05 + 3-level safety net, cold-start from signals, in-memory pagination with snapshot anchor + frozen seed (zero duplicates verified), TMDB recommendations in "More Like This" (2:1 interleaving, 10min cache), visibility badges (Lock/Users), `findAnyEmbedding` for uploaded images (3-level: external_images → posts → media_assets), `findMutualFollow` for unlisted visibility, Refresh → RotateCw icons, eraser native resolution fix, lazy CLIP for uploaded images in `searchExternalImages`, canvas item metadata (mediaId/sourceType/title/tags), signal regeneration from items on workspace load, browseRefreshKey for re-fetch.

Fixed: UUID filename tokens skipped from signals, browse effect guarded by `hasRestoredWorkspaceRef`, load-more cursor preserved on rejection, `similarPostsByImage` now has lazy CLIP for uploaded images (with `findAnyEmbedding` + `findMediaById` + `getImageEmbedding` + in-memory cache), initial browse effect no longer reads stale cursor from closure (removed `!hasCursor` check) and retries external search without `visualSimilarTo` on failure, empty `getSimilarPostsByImage` results fall back to home feed, external search in browse now uses `context: 'browse_asset'` which disables the `isDesignItem` filter (was filtering out movie-related images with tags like "character"), retries with fallback queries if results are empty, `runExternalSearch` wrapped in try/catch, `CLIP_SCORE_THRESHOLD` raised from 0.10 → 0.20 with `similarPostsByImage` capped at 12 items, re-mixing on Load More replaced with append-only stable mixing via `mixedBrowseAssets` state + `computeMixedBrowseAssets` useCallback, eraser preview strokeWidth and image eraser lineWidth now divide by camera.scale (was not accounting for zoom, causing preview/erasure mismatch at non-1x zoom).

## Session 2026-06-19: Relight + Loading Phase
Done:
- Relight tool: two colored light sources with draggable balls, canvas-based alpha-masked overlay (`destination-in`), per-light brightness slider, global darken slider, bake to blob URL via `handleApplyRelight`
- `addRelightOverlayClones` for export (thumbnail + full) using offscreen canvas compositing, not Konva Rect
- Fixed `Image` / `new Image()` conflict: import aliased to `KonvaImage`
- `RemoveBgOverlay.jsx` with animated spinner + "Sedang menghapus background..." text
- FX panel: `EFFECT_COLOR_SUGGESTIONS`, `imageDominantColors` prop, merged color presets (image dominants + effect suggestions + standard, deduped via Set)
- Max signals reduced 8 → 5 in 3 places
- Loading phase: real CLIP pre-warm via `searchExternalImages` API call (triggers server cold-start before canvas mounts). 3-step progress: (1/3) Memuat workspace..., (2/3) Menyiapkan alat AI..., (3/3) Menyiapkan canvas...
- Lightbulb icon removed from Relight panel header
- Loading phase `.loading-phase-num` CSS span for counter
- Animated loading dots (`loadingDots` keyframes, cycles `''` → `'.'` → `'..'` → `'...'`)
- ONNX Runtime pre-warm di fase (2/3): `@imgly/background-removal` di-import + remove-bg 32x32 dijalankan bareng CLIP pre-warm (timeout 5s). Ini menghilangkan freeze ONNX cold-start pas user pertama kali klik Remove Background.

## Architecture
- **CLIP**: `Xenova/clip-vit-base-patch16` via `@xenova/transformers`, ~200MB cache. Text ~10ms, image ~500ms–4s. Embeddings as `jsonb`, L2-normalized. Cosine = dot product. **CLIP runs 100% server-side** — no `src/lib/clip.js` frontend worker exists. **Cold start**: text + vision models pre-warmed via `warmUpClip()` at server start using dummy 1x1 PNG.
- **Profile**: EMA momentum (0.7/<50 events, 0.95/>=50). `buildProfileFromSignals` — single UNION ALL, weighted avg + recency decay (30-day half-life). Text-only fallback from interest tags.
- **Pagination**: Overfetch `limit*3+50`, CLIP rerank, `sortPos` slice. Snapshot anchor `publishedAt <= $snapshot`. Frozen `seed` in cursor. No duplicates.
- **"More Like This"**: `searchTmdbRecommendations` — `/movie/{id}/recommendations`, max 6 movies × 2 images, interleave 2:1. Cursor tracks `recOffset`.
- **Unlisted**: Mutual follow via `followerVisibilitySql` in repository queries. Author always sees own. `findMutualFollow` in follows repository.
- **Browse asset**: 7 internal : 3 external interleave. Visual similarity via `visualSimilarTo`. Lazy CLIP for uploaded images via `findMediaById` + `getImageEmbedding`, in-memory cache per process.
- **Workspace loading**: 3-phase: loading (data fetch) → analyzing (pre-warm CLIP via browse API) → preparing (200ms canvas setup) → done (canvas renders). Pre-warm (tanpa timeout) eliminates CLIP cold-start freeze on first browse effect.

## Signal Regeneration
From saved canvas items on workspace load (no `browseAssetContext` in snapshot). Extracts `mediaId` from UUID in URL, skips UUID as search token, uses title/tags/meaningful filename instead.

## Key Files
- backend: `clip.service.js`, `externalImages.service.js`/`.repository.js`/`.controller.js`, `posts.service.js`/`.repository.js`, `profile.service.js`, `follows.repository.js`, `media.repository.js`, `cursor.js`
- frontend: `Workspace.jsx` (loading phase, browse pre-warm, relight, remove-bg), `ToolRelightPanel.jsx` (sliders, color pickers), `RelightBalls.jsx` (canvas light overlay + draggable balls), `FxPanel.jsx` (color presets), `RemoveBgOverlay.jsx` (spinner overlay), `api/externalImages.js`, `api/posts.js`

## Session 2026-07-01: Text Embedding + Semantic Search + More Like This Fix

### More Like This (Recommended Posts)
- SQL `getRecommendedPosts`: `current_tags` CTE UNION dari `metadata->'tags'` + `metadata->'autoGeneratedTags'`; candidate tag overlap juga cek kedua sumber (posts.repository.js:524-541)
- Dual-path CLIP rerank di `recommendedPosts`: **visual path** (image→image cosine) + **semantic path** (text→image cosine). Interleave `[vis1, txt1, vis2, txt2, ...]`. Pool diperluas 100→200 (posts.service.js:677-774)
- External images di PostDetail: `semanticText` parameter — `findImagesByVisualSimilarity` pake text embedding. Interleave 2 semantic : 1 text. CLIP rerank akhir pake semanticText (externalImages.service.js:1543-1564)

### Text Embedding (`text_embedding jsonb`)
- Migration `023_posts_text_embeddings.sql`: kolom baru + GIN index
- `computePostEmbedding`: juga compute text embedding via `buildSemanticText` + `getTextEmbedding`, disimpan bareng image embedding
- `updatePostEmbedding`: tambah parameter `textEmbedding`
- `getPostsWithTextEmbedding`: helper fetch posts dengan text_embedding IS NOT NULL
- Backfill: `backfillTextEmbeddings.js` — 47/50 posts backfilled

### Semantic Search
- `search.service.js:search`: saat `query.semantic=true`, compute `getTextEmbedding(q)`, scan pool 500 posts, score cosine similarity, filter threshold 0.20, interleave 2 keyword : 1 semantic
- Validation: `semantic: z.coerce.boolean().optional().default(false)` di searchQuerySchema
- Frontend: `searchPosts` API accept `semantic` param; `SearchResults.jsx` hardcode `semantic: true`

## Session 2026-07-03: Entity Matching Overhaul (OCR string match fix, all posts backfilled)

### What changed
- **`cosineSimilarity` ditulis ulang** (`clip.service.js`): sebelumnya dot product (asumsi L2-normalized input), sekarang `dot / (sqrt(na) * sqrt(nb))` — cosine similarity proper. NORMALIZED semua scores jadi range 0–1. Semua scores inflated (>1.0) dari era dot product ilang total.
- **Entity matching dari OCR pake string matching, bukan CLIP**: `findStringMatch` di `ocr.service.js` — 3 phase:
  - Phase A1: `norm === title` (exact full string match) → skor 20000 + titleLen
  - Phase A2: `norm.includes(title)` (exact substring) → skor 10000 + titleLen
  - Phase B: exact token match (≥60% tokens cocok) → skor 1000 + tokens*10 + (TMDB ? 50 : 0)
  - Phase C: fuzzy matching (Levenshtein) dihapus — terlalu banyak false positive dari garbage OCR
- **CJK characters di-filter** dari OCR text sebelum string matching (noise dari poster stylized)
- **Phase B scoring tanpa titleLen**: dulu iTunes entity kayak "Chungking Express - Single" menang karena title lebih panjang. Sekarang skor pure dari token match count + TMDB bonus 50.
- **`findEntityCandidates` ditambah `ORDER BY (provider = 'tmdb') DESC`**: TMDB entities selalu diprioritaskan di atas iTunes saat tie score
- **Tag matching (matchTagsToEntity) jadi fallback akhir**, strict (≥60% entity tokens tercocok di tag string)

### Backfill — all 57 published posts re-processed
- Re-run entity matching (visual + OCR string + tag) untuk SEMUA published posts menggunakan stored embedding + stored OCR text. **Tanpa re-inference CLIP/OCR.**
- **Hasil akhir**: 34 posts dengan entity (semua TMDB movie, bukan iTunes album kecuali album2 legit), 23 posts tanpa entity (generic content, no entity available, atau OCR gagal baca stylized poster)
- **Key fixes**:
  - "Korean poster film" → Memories of Murder (sebelumnya: Rude — dari dot product bug)
  - "Chungking-express-movie-poster-" → TMDB Chungking Express (sebelumnya: iTunes Chungking Express - Single)
  - "past lives" → TMDB Past Lives (sebelumnya: iTunes Past Lives - Single)
  - "Farewell My Concubine" → TMDB Farewell My Concubine (sebelumnya: iTunes Split with Horsebladder & Farewell My Concubine)
  - "Portrait of a Lady on Fire (2019)" → TMDB Portrait of a Lady on Fire (sebelumnya: iTunes Portrait Of A Lady On Fire - Single)
  - "Background toy story" → TMDB Toy Story 5 (sebelumnya: iTunes Toy Story Favorites - EP)
  - "The Truman Show - Retro Design" → The Truman Show (tag match)
  - "Parasite retro poster" → (none) — OCR gagal baca poster stylized, tag juga gak cukup, lebih baik no entity daripada wrong entity

### CLIP Cold Start Fix
- **`warmUpClip()` di `clip.service.js`**: sekarang pre-warm **text model + vision model** paralel (dulu cuma text model). Vision model di-warm pake `DUMMY_IMAGE` — 1x1 pixel PNG hardcoded sebagai Buffer, gak butuh file eksternal.
- **`getImageEmbedding(`**: parameter diubah dari `imageUrl` ke `imageInput` — bisa nerima string URL atau Buffer/Uint8Array. `RawImage.read()` dari `@xenova/transformers` handle kedua format.
- **Timeout 3s dihapus** dari CLIP pre-warm fase 2/3 (`Workspace.jsx:3484`). Dulu `Promise.race([searchExternalImages, setTimeout(3000)])`, sekarang langsung `searchExternalImages(...)` aja. ONNX pre-warm masih retain timeout 5s (download WASM bisa lambat).
- Efek: pas server start, kedua model CLIP langsung di-load. Pas user buka workspace pertama, gak ada cold-start vision model. Loading phase nunggu sampai model beneran ready. Delay 500ms–4s pindah dari "pas browse" ke "pas server start" atau "pas loading phase".

## Next Steps
- pgvector for PG18 Windows (no prebuilt binary, build from source)
- Admin endpoint for profile backfill status/trigger
- Backfill script for existing users
- Consider creating `src/lib/clip.js` Web Worker if CLIP progress reporting inside loading phase is needed
- **Known limitation**: semantic search pool dibatasi 500 post terbaru (O(n) JS scan tanpa pgvector). Perlu pgvector untuk search semua post tanpa limit arbitrary.
- "Parasite retro poster" dan "Parasite poster film" — OCR gagal (stylized), perlu tag "Parasite" di post atau entity "Parasite" di DB (cek TMDB 496243)
- "Kunto Aji album" — no image URL, no entity. Ini intentional.

## Known Issues
- `getProviderSearchersForQuery` limits home movie queries to `[tmdb, wikimedia]` only
- Design filter keyword-based — CLIP needed for semantic accuracy
- Eraser quality fix: native resolution used internally, item retains display size for layout
- Semantic search pool dibatasi 500 post terbaru (O(n) JS scan tanpa pgvector)
- Stylized poster fonts yang Tesseract gak bisa baca → OCR gagal → fallback ke tag matching. User harus nambah judul film di tags untuk posts yang posternya stylized.
- **Undo/redo per-item patch (v1).** Perubahan properti item (warna, posisi, ukuran, visibility, lock, crop, align) menggunakan undo patch per-item (bukan snapshot). Undo dari User A otomatis broadcast ke User B via `updateItem`. Remote changes di-exclude dari undo stack (`skipUndoCaptureRef`). **Belum di-cover:** slider (gesture-based, perlu preGestureRef), delete/add item, layer reorder, composite group operations — masih fallback ke old snapshot undo. Slider tidak menghasilkan sampah undo stack (tiap tick skip karena `skipBroadcast=true`).
- `matchTagsToEntity` di `posts.service.js` masih pake `candidates.find()` mencari ulang candidate setelah `matchTagsToEntity` return title — bisa mismatch kalo ada multiple candidates dengan title serupa. Workaround: `findEntityCandidates` prioritaskan TMDB, jadi yg ditemukan pertama adalah TMDB.

## Important
- `tags` in `user_interest_events` is `text[]`, not `jsonb`
- pgvector NOT installed — cosine in JS O(n) scan
- CLIP is entirely server-side (`clip.service.js`); frontend has no CLIP worker/WebAssembly
- Relight uses offscreen canvas `destination-in` compositing for alpha masking, not Konva `globalCompositeOperation`
- Text embeddings (`text_embedding jsonb`) disimpan terpisah dari image embeddings; path semantic search interleave 2 keyword : 1 semantic
- **Entity matching scoring tiers**: Phase A1 (20000+) >> Phase A2 (10000+) >> Phase B (1000+) >> tag matching (fallback). TMDB entities prioritized via SQL ORDER BY + score bonus.
- **All entity matching uses FIXED cosineSimilarity** (proper normalization). No inflated scores. All matches in 0-1 range for visual CLIP, or 500+ for string matching.
- **Backfill batch**: 57 posts processed. Uses stored embedding + stored OCR text — no re-inference needed.

## Session 2026-07-03: Media Assets Embedding + ONNX Pre-warm Removed

### What changed
- **Migration `024_media_assets_embeddings.sql`**: Added `embedding jsonb` + `ocr_text text` columns to `media_assets` table.
- **Background CLIP + OCR on upload** (`media.service.js`): After `uploadImageFile` completes, `setImmediate` runs `getImageEmbedding(fileBuffer)` + `extractText(fileBuffer)` in background. Results stored in `media_assets.embedding` / `.ocr_text`. Non-blocking — response returns immediately.
- **`findAnyEmbedding` fallback expanded** (`externalImages.repository.js`): 3-level lookup — `external_images` → `posts` → `media_assets`. Uploaded images now have stored embeddings accessible without lazy CLIP re-compute.
- **`extractText` exported** (`ocr.service.js`): Simple wrapper around `tesseract.recognize()` returning raw OCR text (no entity matching). Accepts Buffer or URL.
- **ONNX pre-warm REMOVED** (`Workspace.jsx`): `useEffect` with `setTimeout(10000)` for `@imgly/background-removal` deleted entirely. WASM compilation blocked main thread for 32s after canvas load. First "Remove Background" click will pay the ~32s compilation cost — acceptable because user expects processing time when clicking an action button.
- **Timing instrumentation** (`Workspace.jsx`): 3 `console.time` markers added for diagnosing freeze sources — `[WORKSPACE] browse effect pertama`, `[WORKSPACE] canvas render`. ONNX marker removed along with the pre-warm.

### Root cause of post-load freeze
`import('@imgly/background-removal')` + first `removeBackground()` call triggers ~40MB WASM compilation blocking the main thread for **32.3 seconds**. Even deferred 10s after mount, the freeze was still jarring. Web Worker not viable because `removeBackground` requires DOM Canvas API. Solution: remove pre-warm entirely — accept cold-start cost on first explicit user action.

## Session 2026-07-06: Alpha Mask + Adjustment Layer Fixes

### Alpha Mask (Tahap 1)
- `getEffectedAlphaMask()`: offscreen canvas → draw source image → `applyEffectsToImageData` (chroma key etc)
- `CompositeAlphaBitmap`: `globalCompositeOperation` 'source-in'/'destination-out' with alpha from effects result
- Caching via `maskCacheRef` + `maskKeyRef` (JSON.stringify key), skip recompute on identical effectsKey
- Branch `sourceItem?.maskSourceType === 'alpha'` checked FIRST in CompositeCanvasGroup JSX
- `console.time` instrumentation in `getEffectedAlphaMask` for performance diagnosis

### Auto-detect maskSourceType
- `applyCompositeGroupMode`: operator item with effects → auto-set `maskSourceType: 'alpha'`; no effects → `undefined` (shape mask)
- `updateItem`: when `'effects' in patch` on composite operator (mask/exclude), update `maskSourceType` reactively
- Both set `maskSourceType: 'alpha'` when effects exist, `undefined` when cleared

### FAB Root Cause Fix
- `selectItem()` at line ~4830: now calls `setActivePanel('properties')` in addition to `setIsRightPanelOpen(true)`
- Defensive guard: FAB only renders when `activePanel === 'assets' && assetSubView === 'uploads'`
- Root cause: `selectItem` didn't reset `activePanel`, so clicking an Object on canvas left `activePanel='assets'` + `assetSubView='uploads'` = FAB rendered in wrong panel

### Bug: Composite Group Cached Canvas Position in Adjustment Layer
- `GlobalAdjustmentLayer.jsx`: composite group `_getCachedSceneCanvas()` was placed at `x: 0, y: 0` instead of `groupNode.x(), groupNode.y()`
- Cache covers (0,0) to (canvasWidth,canvasHeight) in GROUP LOCAL space, but group is at non-zero stage position
- Caused content position mismatch: `toCanvas({x,y,w,h})` crop missed or partially overlapped composite content
- Fix: `x: groupNode.x(), y: groupNode.y()` so cached image aligns with stage position

### Bug: CompositeAlphaBitmap Race Condition with async image loading
- `useCanvasImage`/`useCanvasImages` load images async (`new Image()`) in regular `useEffect`
- Parent `useLayoutEffect` runs `recache()` BEFORE children's `updateBitmap()` — cache captures stale/null image
- Adjustment layer's 150ms debounce often fires while cache is still empty (image not yet loaded)
- Fix: replace `useCanvasImage` with `getStageImage` — reads already-loaded images directly from Konva stage via `stageRef.current.findOne('#itemId').findOne('.canvas-image-main').image()`
- No async dependency → images available synchronously in `useLayoutEffect` → cache captures correct content on first run → adjustment layer has correct data at 150ms
- Shared image cache (`useCanvasImages.js`) also rewritten with module-level `imageCache` + `subscribe`/`notify` pub/sub for deduped Image creation

### Key Files
- `backend/src/db/migrations/024_media_assets_embeddings.sql` — migration
- `backend/src/modules/media/media.repository.js` — `updateMediaAssetEmbedding()`
- `backend/src/modules/media/media.service.js` — `setImmediate` background compute
- `backend/src/shared/ocr.service.js` — `extractText()` export
- `backend/src/modules/externalImages/externalImages.repository.js` — `findAnyEmbedding` 3-level fallback
- `src/pages/Workspace.jsx` — ONNX pre-warm removed, timing markers; `getEffectedAlphaMask`, `CompositeAlphaBitmap`, branching alpha; auto-detect in `applyCompositeGroupMode` + `updateItem`; FAB fix; `stageRef` passthrough
- `src/components/canvas/GlobalAdjustmentLayer.jsx` — cached canvas position fix
- `src/hooks/useCanvasImages.js` — shared image cache with `imageCache` Map + `subscribe`/`notify` pub/sub
- `src/App.css` — `.workspace-upload-fab-wrap` position:absolute; `.workspace-align-btn-modern:disabled`

## Session 2026-07-10: Home Feed Empty Fix — 4 Root Causes

### Root causes
1. **`expandHomeTagToQueries` produced garbage queries**: `drop_to_canvas` filename events (`.jpg`, `.webp`, `.png`) → `expandHomeTagToQueries` returned garbage that filled all 6 query slots → fallback query excluded → all rejected by `classifyMovieQuery` gate0 (FILE_EXT_RE) → `getProviderSearchersForQuery` returned `[]` for non-movie queries in home context → **0 items**

2. **Visual similarity pool was dead code**: Pool code was placed inside `if (context === 'browse_asset'){...}` block; the `if (context === 'home')` check at higher line never executed for home feed

3. **`classifyMusicQuery` false-positive for "unggahan"**: When `classifyMovieQuery` returns null (rejected at gate1 via `nonMovieWords`), all movie-intent guards are skipped → `classifyMusicQuery` returned `true` → `hasMusicQuery: true` changed interleaving to prefer cover art

4. **Generic design queries went to TMDB**: Fallback query "design inspiration editorial poster moodboard" classified as movie query (isGeneric=true) → went to TMDB trending → returned random movie posters instead of design content

### Fixes
- **`expandHomeTagToQueries`**: Added `EXPAND_EXT_RE` filter — returns `[]` for normalized strings containing `.ext` patterns (jpg, png, etc.)
- **`buildHomeExternalQueries`**: Added `ensureFallback()` helper — guarantees fallback query is always present by replacing last slot if needed
- **Visual similarity pool**: Moved from inside `browse_asset` block to after `semanticText` block (now fires for `context === 'home'`)
- **`normalizeTag` + `normalizeInterestTag`**: Added `EXT_WORD_RE = /\b(?:jpe?g|png|webp|gif|bmp|svg|tiff?|avif|heic?)\b/gi` to strip extension words as whole tokens globally (not just trailing `.ext`)
- **`classifyMovieQuery` gate3**: Generic design-only queries (isGeneric=true, no titleCandidate, no strong movie intent words) return null → routed to design providers instead of TMDB
- **`classifyMusicQuery`**: Added `musicKeywords` set + null-movieResult guard — only classifies as music if explicit music keywords present when `classifyMovieQuery` returns null
- **`getProviderSearchersForQuery`**: Non-movie home queries now return `[unsplash, pexels, pixabay, openverse, wikimedia]` instead of `[]`

### Validation
- `newacc5` (has garbage events): 12 items (unsplash/openverse/pexels/tmdb mix)
- `sen` (no events): 12 items (TMDB trending)
- `accuser`: 12 items (TMDB trending)
- Normalization: 6 test cases show no residual `jpg`/`png`/`webp` tokens
- Fallback query → design providers (unsplash/pexels/pixabay), not TMDB
- `classifyMovieQuery` gate0: no normalized test strings matched FILE_EXT_RE (all passed)

### Key Files
- `backend/src/modules/externalImages/externalImages.service.js` — all home feed fixes
- `backend/src/modules/interest/interest.service.js` — `normalizeInterestTag` EXT_WORD_RE

## Session 2026-07-10: Interest Decay Fix + Weighted Sampling + Garbage Tag Filter

### Fix 1 — `open_post` decay 6h → 3d
- **File**: `interest.repository.js` (3 occurrences: `getTopRecentInterestTags`, `getTopRecentInterestTagsWithScores`, `getTopRecentInterestQueries`)
- **Change**: `when 'open_post' then interval '6 hours'` → `when 'open_post' then interval '3 days'`
- **Reason**: 77% of newacc5 activity is `open_post`. With 6h decay, diverse movie interests (La Haine 23.42, Chungking Express 16.42, Parasite 14.43, Yorgos Lanthimos 18.10) decayed to ~0 before contributing to home feed. Only "past lives" survived because it had `search` (3d decay) and `drop_to_canvas` (7d decay) events.
- **After**: La Haine (23.42), films (24.56), korean (15.02), lanthimos (11.96) now appear in top tags.

### Fix 2 — Weighted Random Sampling + Garbage Tag Filter
- **`seededRandom` / `weightedSampleByScore`**: Seed-based weighted sampling selects which tags get query slots when more tags exist than available slots (6). Lower-score films get non-zero probability across different 30-minute time buckets.
- **`interleaveTagExpansions`**: Accepts `scores` + `seed`, applies weighted sampling before round-robin, keeping `MAX_SLOTS_PER_FILM=3` per tag.
- **`isHomeGarbageTag`**: Filters filename garbage (UUIDs >12 chars, known prefixes: `unggahan`, `download`, `untitled`, `null`) at the `effectiveTags` level, preventing garbage from reaching exploration/expansion paths.
- **`normalizeInterestTag` / `normalizeTag`**: Added `.replace(/\s*\.\s*/g, ' ')` to remove orphaned dots after `EXT_WORD_RE` strips extension words. Removed `.` from `[^a-z0-9\s.]+` → `[^a-z0-9\s]+`.
- **`expandHomeTagToQueries`**: Checks original tag (pre-normalization) for `.ext` pattern via `EXPAND_EXT_RE`, so `"past lives .jpg past lives"` is filtered before normalization.

### Verification — newacc5 top tags (after Fix 1)
| Tag | Score | Status |
|-----|-------|--------|
| past lives | 40.42 | ✅ survived |
| films | 24.56 | ✅ revived (was 0) |
| haine | 23.42 | ✅ revived (was 0) |
| la haine poster | 23.42 | ✅ revived (was 0) |
| lives poster | 22.04 | ✅ revived (was 0) |
| past lives poster | 22.04 | ✅ revived (was 0) |
| korean | 15.02 | ✅ revived (was 0) |
| korean films | 12.61 | ✅ revived (was 0) |
| lanthimos | 11.96 | ✅ revived (was 0) |

### Verification — Query diversity (across seeds)
```
seed=0: past lives | la haine (1995) poster | films | fallback
seed=2: films | fallback | past lives | la haine (1995) poster
seed=4: fallback | past lives | la haine (1995) poster | films
```

### Item-level limitation
Query slots now diverse (multiple films represented). However, final 12 items remain Past Lives-dominated because:
- CLIP rerank uses profile embedding (strongest = Past Lives, 40.42)
- 20 TMDB results from "past lives" + "past lives inspiration"
- 10 TMDB results from "la haine (1995) poster" — all outranked by rerank
- Visual similarity pool adds ~4 serendipity items (iTunes, Godzilla, Unsplash)

Item-level interleaving (per-query or per-film cap) would need separate implementation.

### Key Files
- `backend/src/modules/interest/interest.repository.js` — decay rates
- `backend/src/modules/externalImages/externalImages.service.js` — weighted sampling, garbage filter, normalizeTag
- `backend/src/modules/interest/interest.service.js` — `normalizeInterestTag` dot cleanup

### Commits
- `75c8f18` — Fix(interest): increase open_post decay from 6 hours to 3 days
- `844498e` — Fix(home-feed): weighted sampling for query slot allocation + garbage tag filter
- `13883c8` — Fix(classifyMovieQuery): reject generic single-word tags from TMDB title search

## Session 2026-07-10: Fix — Generic Tag "films" Resolved to TMDB Entity

### Root Cause Chain
1. Tag "films" (score 23.97) survived decay fix and entered `effectiveTags`
2. `interleaveTagExpansions` → `expandHomeTagToQueries("films")` → `["films", "films inspiration", "films moodboard"]`
3. `classifyMovieQuery("films")` **passed all gates** because:
   - `"films"` was NOT in `nonMovieWords`, `titleNoiseWords`, `genericVisualWords`, or `connectingWords`
   - Gate 3 (`isGeneric && !titleCandidate`) didn't apply because `titleCandidate = "films"` (non-empty)
   - No other gate caught it
4. `getProviderSearchersForQuery` routed "films" to TMDB
5. TMDB partial-token match returned **"Cursed Films (2020)"** — a documentary series containing the word "films"

### Why Previous Fixes Didn't Cover This
- **Gate 3 (design-only rejection)**: requires ALL tokens to be generic visual/noise words, but "films" as a standalone word isn't in any of those lists
- **`nonMovieWords`**: only covered "trending", "unggahan", etc., not common nouns like "films"
- **`titleNoiseWords`**: had `'film'` (singular) but not `'films'` (plural)
- All previous fixes focused on user SEARCH QUERIES, not TAG EXPANSION queries

### Fix — Gate 4 in `classifyMovieQuery`
**Rule**: `titleCandidate` is single word AND `hasMovieIntent` is false → reject as too generic for TMDB title search.

Single common nouns like "films", "haine" (standalone) are not specific entity titles. Multi-word candidates (e.g. "past lives", "la haine") are specific enough.

**Also**: Added `'films'` to `titleNoiseWords` so multi-word queries like "korean films" strip the generic word, leaving "korean" (single-word, rejected by Gate 4) → routed to design providers.

### Verification
- **`newacc5` home feed**: queries include "trending films", "films inspiration", "films cinematic" — ALL routed to design providers (Unsplash/Pexels), NOT TMDB
- **TMDB debug logs**: No `sq: 'films'` search in any request; only "past lives", "haine" (as buildMovieSearchVariants variant from "la haine (1995) poster"), "poster" appear
- **Items**: Past Lives + La Haine + iTunes serendipity — no Cursed Films
- **Multi-seed test**: No single-word "films" query reaches TMDB across any seed

### Key Files
- `backend/src/modules/externalImages/externalImages.service.js` — Gate 4 in `classifyMovieQuery`, `'films'` in `titleNoiseWords`

## Session 2026-07-14: Broadcast Fix — Adjustment Sliders, Radius, Crop, Color Pickers, Blend Mode Undefined

### Color Pickers — skipBroadcast + onBlur commit
- All `<input type="color">` that modify BROADCAST_KEYS properties now use `skipBroadcast=true` on `onChange` + `broadcastItemUpdate` on `onBlur` → 1 broadcast per picker close, not per tick
- 5 item-property color inputs fixed: main color (fill/imageStroke/stroke), gradient stop (strokeGradientStops), composite stroke, composite shadow, regular shadow
- 3 canvas background color inputs left unchanged (not item properties, not in BK)

### `undefined` → `null` Broadcast Fix
- `blendMode: undefined` (set when switching back to Normal) stripped by `JSON.stringify` during broadcast — receiver stayed on previous blend mode
- `broadcastItemUpdate` now converts `undefined` → `null` before sending
- `itemUpdateHandlerRef` deletes properties with `null` values on receipt
- Fixes blend mode Normal broadcast for both AdjustmentSliders blend mode dropdown and main blend mode dropdowns

### Composite Stroke Broadcast
- Added `compositeStrokeEnabled`, `compositeStrokeWidth`, `compositeStrokeColor` to `BROADCAST_KEYS`
- Toggle checkbox and color picker now automatically broadcast via `updateItem` guard

### Audio Notes
- Audio dihapus — tidak ada kode broadcast untuk audio. Tidak perlu dikerjakan.

### Adjustment Sliders — onCommit Pattern
- Added 13 adjustment properties (`exposure`, `temperature`, `hue`, `highlights`, `shadows`, `whites`, `blacks`, `brightness`, `contrast`, `saturation`, `sharpen`, `vignette`, `blur`) to `BROADCAST_KEYS`
- `AdjustmentSliders` now accepts `onCommit` prop → `broadcastItemUpdate`
- 4 triggers all call `onCommit` after `onChange`:
  1. Range slider `onPointerUp` — broadcast final drag value
  2. Number input `onBlur` — broadcast committed value
  3. Preset button click — broadcast preset values
  4. Blend mode dropdown click — broadcast `blendMode`
  5. Reset button click — broadcast `RESET_VALUES`
- `onChange` prop calls `updateItem(id, patch, true)` — skips broadcast for per-tick slider calls
- Opacity slider unchanged (already had `onOpacityChange`/`onOpacityCommit` from Session 2026-07-13)

### Radius Slider
- Added `radius` to `BROADCAST_KEYS` for consistency
- Already had `skipBroadcast=true` + `onPointerUp` → `broadcastItemUpdate` from Session 2026-07-13

### Crop Image
- Added `imageCropRect`, `cropSourceWidth`, `cropSourceHeight`, `cropEnabled` to `BROADCAST_KEYS`
- `applyImageCrop` calls `updateItem(id, { x, y, w, h, imageCropRect, ... })` once on "Done" button — broadcast guard fires for all crop properties automatically

### Key Files
- `src/components/panels/AdjustmentSliders.jsx` — `onCommit` prop, wired to slider `onPointerUp`, number input `onBlur`, preset/reset/blend mode clicks
- `src/pages/Workspace.jsx` — BROADCAST_KEYS expanded (adjustment keys, radius, crop keys, composite stroke keys), `undefined→null` in `broadcastItemUpdate`/`itemUpdateHandlerRef`, all color picker `onBlur` handlers, `<AdjustmentSliders>` `onChange`→`skipBroadcast` + `onCommit`

## Session 2026-07-13: Collaboration Broadcast — Item Add/Remove + Slider Optimization

### Item Add/Remove Broadcast
- `item_added` / `item_removed` message types in `CollaborationContext` with `itemAddHandlerRef` / `itemRemoveHandlerRef`
- `broadcastItemAdd` / `broadcastItemRemove` functions in `Workspace.jsx`
- Wired for all entry points: `addAssetToCanvas`, `addNote`, `addShapeToCanvas`, `addFrameToCanvas`, `addText`, `finishConnectorDrag`, `duplicateItems`, `handlePaste`, `detachFrameImages`, `addImageToFrame`
- `detachFrameImages`: broadcasts each new image item as `item_added` + frame clearance as `item_update`
- `addImageToFrame` (grid + single): broadcasts frame `item_update` + source `item_remove`

### Broadcast Guard (`BROADCAST_KEYS`)
- Replaced inline conditions with `BROADCAST_KEYS Set` (42 keys)
- Added `frameImageSrc`, `frameImages`, `frameImagePosition`, `frameImageScale`, `frameImageFit` — frame image edits broadcast
- Added text properties (`runs`, `text`, `isBold`, `isItalic`, `isUnderline`, `fontSize`, `fontFamily`, `fill`, `align`, `shapeText`) — text commit = 1 broadcast
- `updateItem` accepts 3rd param `skipBroadcast` (default `false`) to suppress broadcast for rapid slider calls

### Slider Optimization (skipBroadcast + onPointerUp/onBlur commit)
Pattern: `updateItem(id, patch, true)` on `onChange` + `broadcastItemUpdate(id, patch)` on `onPointerUp`/`onBlur` → 1 broadcast per gesture, not per tick.
- Opacity sliders: 3 panels (image `~12292`, shape `~12573`, text `~12856`) + `AdjustmentSliders.jsx` via `onOpacityChange`/`onOpacityCommit` props
- Radius slider (`~12198`)
- `compositeOpacity` range + number (`~11594-11603`)
- `imageStrokeWidth` range (`~12258-12264`)
- `compositeStrokeWidth` range (`~11726-11732`)
- Shadow sliders: 2 `.map()` loops (regular `~12405-12408`, composite `~11726-11729`) — both updated

### Other Collaboration Fixes
- Collaborator guard: `collaboratorsRef.current.length === 0` → `<= 1` (presence always includes self)
- `cursor_move` throttle 50ms→200ms (`useCursorBroadcast.js:5`)
- `item_update` throttle 50ms→100ms
- **`undefined` → `null` broadcast fix**: `undefined` values stripped by `JSON.stringify` during broadcast (e.g. `blendMode: undefined` when switching back to Normal). `broadcastItemUpdate` converts `undefined` → `null` before sending; `itemUpdateHandlerRef` deletes properties with `null` values on receipt. Fixes blend mode Normal broadcast (object wouldn't reset on receiver).
- **Composite stroke broadcast**: Added `compositeStrokeEnabled`, `compositeStrokeWidth`, `compositeStrokeColor` to `BROADCAST_KEYS` — toggle and color picker now broadcast to collaborators.

### Key Files
- `src/pages/Workspace.jsx` — `BROADCAST_KEYS Set` (~341), `updateItem` guard + `skipBroadcast` (~6725), all sliders, `broadcastItemAdd`/`broadcastItemRemove`, all add/drop/duplicate/paste wiring
- `src/context/CollaborationContext.jsx` — `item_added`/`item_removed` handlers (~174-179), collaborator length guard (~263), `itemAddHandlerRef`/`itemRemoveHandlerRef` props
- `src/hooks/useCursorBroadcast.js` — throttle 50→200ms
- `src/components/panels/AdjustmentSliders.jsx` — `onOpacityChange`/`onOpacityCommit` props

## Session 2026-07-15: View-Only Collaborator Permission Fix

### Problem
View-only collaborators (`role: 'view'`) were able to drop items, edit properties, delete, reorder, and save changes. The backend `assertWorkspaceAccess` only checked if the user had ANY access — didn't differentiate between `view` and `edit` roles.

### Backend Fix
- **`assertWorkspaceAccess`**: Added `operation` parameter (`'read'`|`'write'`). For `'write'` operations, checks `collab.role !== 'edit'` → throws 403. Owner always passes.
- **Callers updated**: `getWorkspace` → `'read'`, `saveWorkspace`/`updateWorkspace`/`setThumbnail`/`deleteWorkspace` → `'write'`
- **`getWorkspace` returns `role`**: Fetches collaborator via `assertWorkspaceAccess`, returns `result.role = 'edit'|'view'` so frontend knows the user's permission level
- Collaborator management endpoints (`inviteCollaborator`, `changeCollaboratorRole`, `removeCollaborator`, `listCollaborators`) unchanged — already use `assertOwner`

### Frontend Fix — `isViewerRef`
- Added `isViewerRef = useRef(false)` in Workspace
- Set from `workspace.role` returned by `getWorkspace`: `isViewerRef.current = workspace.role === 'view'`

### Frontend Fix — Guarded Entry Points
All guarded with `if (isViewerRef.current) return`:
- **`handleCanvasDrop`** — DnD onto canvas
- **`addAssetToCanvas`**, `addNote`, `addShapeToCanvas`, `addFrameToCanvas`, `addText` — toolbar add buttons
- **`handlePaste`**, `duplicateItems` — clipboard/duplicate
- **`deleteObject`**, `deleteSelectedObject` — delete
- **`handleGroupSelectionAction`**, `ungroupSelectedItems` — group/ungroup
- **`moveLayerBlock`**, `handleDragEnd` (layer panel) — reorder
- **`finishBezierPath`** — bezier path tool
- **`finishConnectorDrag`** — connector tool
- **`processRemoveBg`** — remove background
- **`applyCompositeGroupMode`** — composite mode toggle
- **`applyImageCrop`** — crop commit
- **`editTextObject`** — double-click text edit
- **`updateItem`** — BASE GUARD (all property edits)
- **`persistWorkspaceSnapshot`** — auto/manual save
- **Keyboard arrow nudge** — `handleSelectionKeyboard` arrow keys
- **`handleObjectDragEnd`** — Konva drag end
- **`disableDrag` prop** (3 rendering sites) — prevents drag entirely
- **Transformer hidden** — `!isViewerRef.current` condition
- **Save button disabled** — `disabled={... || isViewerRef.current}`
- **Viewer badge** — "Lihat" badge in top bar (`.workspace-viewer-badge` CSS)

## Session 2026-07-15 (lanjutan): Undo/Redo Broadcast ke Collaborator

### Problem
Undo/redo hanya lokal — perubahan undo (add/delete/reorder) tidak dikirim ke receiver via broadcast. Receiver tetap melihat item yang sudah di-undo.

### Fix
- **`handleUndo`**: Setelah `_type: 'add'` → broadcast `item_removed`; setelah `_type: 'delete'` → broadcast `item_added`; setelah `_type: 'reorder'` → broadcast `items_reorder` dengan `orderedIds` (urutan item yang benar setelah undo)
- **`handleRedo`**: Sama — broadcast `item_added` untuk undo delete, `item_removed` untuk undo add, `items_reorder` untuk reorder
- **`itemsReorderHandlerRef`** di Workspace: handler yang menerima `orderedIds` dan mengurutkan ulang `items` state sesuai dengan urutan ID
- **CollaborationContext**: listener `items_reorder` baru + prop `itemsReorderHandlerRef`

### Per-item undo coverage (Session 2026-07-15 continued)

✅ **Sudah per-item undo:**
- Transform (drag/resize/rotate) → `updateItem` → `captureUndo`
- Add/drop (12 entry points) → `captureAddUndo`
- Delete (4 entry points) → `captureDeleteUndo`
- Layer reorder (6 entry points) → `captureReorderUndo`
- Group/ungroup → `captureGroupUndo`
- Semua property edits (opacity, efek, warna via slider onPointerUp/onBlur, color picker onBlur, presets, dll) → `updateItem` → `captureUndo`
- **Composite member property edits** → `updateItem` → `captureGroupUndo` (sebelumnya snapshot-only karena `captureUndo` skip `item.groupId`)
- Text edit commit → `updateItem`
- Paste/duplicate → `captureAddUndo`
- **Multi-object drag end** → `captureUndo`/`captureGroupUndo` per movingId
- **Arrow key nudge** (keyboard + panel buttons) → `captureUndo`/`captureGroupUndo`
- **Align items** → `captureUndo`/`captureGroupUndo`
- **Lock toggle selected** → `captureUndo`/`captureGroupUndo`
- **Group visibility/lock toggle** (layer panel) → `captureUndo` per member
- **Bezier editing** (corner radius, anchor move) → `captureUndo`

❌ **Masih snapshot-only fallback (diterima):**
- Canvas resize (punya guard sendiri, ga perlu undo)
- Brush strokes (punya undo sendiri via `brushUndoStackRef`)
- Control point drags di bezier (data cuma di ref, ga commit ke item state — bug terpisah)

### Key Files (View-Only + Undo Broadcast + Per-item Coverage)

- `backend/src/modules/workspaces/workspaces.service.js` — `assertWorkspaceAccess` operation param, `getWorkspace` role
- `src/pages/Workspace.jsx` — `isViewerRef`, all guarded entry points, `disableDrag`, transformer guard, viewer badge, undo/redo broadcast, `itemsReorderHandlerRef`, per-item undo for composite members/multi-drag/arrow/align/lock/group-visibility/bezier
- `src/context/CollaborationContext.jsx` — `items_reorder` listener, `itemsReorderHandlerRef` prop
- `src/App.css` — `.workspace-viewer-badge` styles

## Session 2026-07-16: Slider tap broadcast + View-only guard gap fix + Realtime throttle

### Slider tap broadcast + BROADCAST_KEYS
- Added `starInnerRatio`, `numPoints` to BROADCAST_KEYS
- All range/number slider/input `onChange` now call `updateItem(id, patch, true)` + `broadcastItemUpdate(id, patch)` (dual: skip internal broadcast but fire external broadcast for tap fix)
- All `onPointerUp` (range) / `onBlur` (number) call `updateItem(id, patch)` (no true) to capture undo + broadcast final value
- X/Y/W/H/Rotation number inputs: changed from `updateItem(id, patch)` + `broadcastItemUpdate(id, patch)` to `updateItem(id, patch, true)` + `broadcastItemUpdate(id, patch)` + `onBlur` commit — prevents undo flood per keystroke and double broadcast
- AdjustmentSliders: `onCommit` now calls `updateItem(id, patch)` (was `broadcastItemUpdate` — missed undo capture); `onMouseUp`/`onTouchEnd` merged to `onPointerUp`
- Color picker `onChange` stays `updateItem(..., true)` only with deferred `onBlur` broadcast (Session 2026-07-14 pattern)

### View-only guard gaps
- **Layer panel** group visibility/lock/delete: added `if (isViewerRef.current) return` — these used direct `setItems` + broadcast, bypassing `updateItem`/`deleteObject` guards
- **`lockToggleSelected`**: added `if (isViewerRef.current) return` — 5 entry points (selection panel, group panel, floating toolbar, right-click, bottom context menu)
- **`handleApplyWarp`**: added `if (isViewerRef.current) return` — direct `setItems` + broadcast bypassed `updateItem`
- **All broadcast functions** (`broadcastItemUpdate`, `broadcastItemAdd`, `broadcastItemRemove`, `broadcastWorkspaceUpdate`): added early return for viewer — blanket guard preventing viewer broadcasts reaching Supabase

### Realtime message usage optimization
- `cursor_move` throttle: 500ms → 1000ms (`useCursorBroadcast.js:5`)
- `CollaborationCursors` rAF loop: pauses when no cursors present or tab hidden — uses 500ms `setTimeout` polling instead of 60fps rAF when idle; resumes on `visibilitychange`

## Session 2026-07-16 (lanjutan): Remove Private toggle + beforeunload warning

- Removed "Workspace Privat" toggle from settings panel (lines 14989-14993)
- Removed `privateWorkspace` from `canvasSettings` initial state and restoration
- Publish handler now always uses `visibility: 'public'`
- Added `hasUnsavedChangesRef` to track unsaved state via snapshot hash comparison
- Added `beforeunload` event listener that triggers browser dialog when `hasUnsavedChangesRef.current` is true
- Added exit confirmation modal using `ConfirmationModal` + `useBlocker` from React Router to intercept SPA navigation (browser back, in-app back, link clicks). Blocker resets automatically when `hasUnsavedChangesRef` becomes false.
- Auto-save (2500ms debounce) verified working: auto-save ON = periodic save; OFF = only manual Ctrl+S
