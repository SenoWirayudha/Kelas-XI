# MoodSpace - Browse + CLIP + Home Feed

## Status
Done: CLIP embeddings (external_images, posts, user_embeddings), L2 normalization, profile momentum-based EMA, CLIP reranking with threshold 0.05 + 3-level safety net, cold-start from signals, in-memory pagination with snapshot anchor + frozen seed (zero duplicates verified), TMDB recommendations in "More Like This" (2:1 interleaving, 10min cache), visibility badges (Lock/Users), `findAnyEmbedding` for uploaded images, `findMutualFollow` for unlisted visibility, Refresh → RotateCw icons, eraser native resolution fix, remove-bg model pre-warm, lazy CLIP for uploaded images in `searchExternalImages`, canvas item metadata (mediaId/sourceType/title/tags), signal regeneration from items on workspace load, browseRefreshKey for re-fetch.

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
- **CLIP**: `Xenova/clip-vit-base-patch16` via `@xenova/transformers`, ~200MB cache. Text ~10ms, image ~500ms–4s. Embeddings as `jsonb`, L2-normalized. Cosine = dot product. **CLIP runs 100% server-side** — no `src/lib/clip.js` frontend worker exists.
- **Profile**: EMA momentum (0.7/<50 events, 0.95/>=50). `buildProfileFromSignals` — single UNION ALL, weighted avg + recency decay (30-day half-life). Text-only fallback from interest tags.
- **Pagination**: Overfetch `limit*3+50`, CLIP rerank, `sortPos` slice. Snapshot anchor `publishedAt <= $snapshot`. Frozen `seed` in cursor. No duplicates.
- **"More Like This"**: `searchTmdbRecommendations` — `/movie/{id}/recommendations`, max 6 movies × 2 images, interleave 2:1. Cursor tracks `recOffset`.
- **Unlisted**: Mutual follow via `followerVisibilitySql` in repository queries. Author always sees own. `findMutualFollow` in follows repository.
- **Browse asset**: 7 internal : 3 external interleave. Visual similarity via `visualSimilarTo`. Lazy CLIP for uploaded images via `findMediaById` + `getImageEmbedding`, in-memory cache per process.
- **Workspace loading**: 3-phase: loading (data fetch) → analyzing (pre-warm CLIP via browse API) → preparing (200ms canvas setup) → done (canvas renders). Pre-warm eliminates CLIP cold-start freeze on first browse effect.

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

## Next Steps
- pgvector for PG18 Windows (no prebuilt binary, build from source)
- Admin endpoint for profile backfill status/trigger
- Backfill script for existing users
- Consider creating `src/lib/clip.js` Web Worker if CLIP progress reporting inside loading phase is needed
- **Known limitation**: semantic search pool dibatasi 500 post terbaru (O(n) JS scan tanpa pgvector). Perlu pgvector untuk search semua post tanpa limit arbitrary.

## Known Issues
- `getProviderSearchersForQuery` limits home movie queries to `[tmdb, wikimedia]` only
- Design filter keyword-based — CLIP needed for semantic accuracy
- Eraser quality fix: native resolution used internally, item retains display size for layout
- Semantic search pool dibatasi 500 post terbaru (O(n) JS scan tanpa pgvector)

## Important
- `tags` in `user_interest_events` is `text[]`, not `jsonb`
- pgvector NOT installed — cosine in JS O(n) scan
- CLIP is entirely server-side (`clip.service.js`); frontend has no CLIP worker/WebAssembly
- Relight uses offscreen canvas `destination-in` compositing for alpha masking, not Konva `globalCompositeOperation`
- Text embeddings (`text_embedding jsonb`) disimpan terpisah dari image embeddings; path semantic search interleave 2 keyword : 1 semantic

Skills provide specialized instructions and workflows for specific tasks.
Use the skill tool to load a skill when a task matches its description.
