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

Skills provide specialized instructions and workflows for specific tasks.
Use the skill tool to load a skill when a task matches its description.
