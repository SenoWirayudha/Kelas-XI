# MoodSpace - Browse + CLIP + Home Feed

## Status
Done: CLIP embeddings (external_images, posts, user_embeddings), L2 normalization, profile momentum-based EMA, CLIP reranking with threshold 0.05 + 3-level safety net, cold-start from signals, in-memory pagination with snapshot anchor + frozen seed (zero duplicates verified), TMDB recommendations in "More Like This" (2:1 interleaving, 10min cache), visibility badges (Lock/Users), `findAnyEmbedding` for uploaded images, `findMutualFollow` for unlisted visibility, Refresh → RotateCw icons, eraser native resolution fix, remove-bg model pre-warm, lazy CLIP for uploaded images in `searchExternalImages`, canvas item metadata (mediaId/sourceType/title/tags), signal regeneration from items on workspace load, browseRefreshKey for re-fetch.

Fixed: UUID filename tokens skipped from signals, browse effect guarded by `hasRestoredWorkspaceRef`, load-more cursor preserved on rejection, `similarPostsByImage` now has lazy CLIP for uploaded images (with `findAnyEmbedding` + `findMediaById` + `getImageEmbedding` + in-memory cache), initial browse effect no longer reads stale cursor from closure (removed `!hasCursor` check) and retries external search without `visualSimilarTo` on failure, empty `getSimilarPostsByImage` results fall back to home feed, external search in browse now uses `context: 'browse_asset'` which disables the `isDesignItem` filter (was filtering out movie-related images with tags like "character"), retries with fallback queries if results are empty, `runExternalSearch` wrapped in try/catch, `CLIP_SCORE_THRESHOLD` raised from 0.10 → 0.20 with `similarPostsByImage` capped at 12 items, re-mixing on Load More replaced with append-only stable mixing via `mixedBrowseAssets` state + `computeMixedBrowseAssets` useCallback.

## Architecture
- **CLIP**: `Xenova/clip-vit-base-patch16` via `@xenova/transformers`, ~200MB cache. Text ~10ms, image ~500ms–4s. Embeddings as `jsonb`, L2-normalized. Cosine = dot product. `src/lib/clip.js` (worker), `backend/src/modules/externalImages/clip.service.js` (server, for lazy compute).
- **Profile**: EMA momentum (0.7/<50 events, 0.95/>=50). `buildProfileFromSignals` — single UNION ALL, weighted avg + recency decay (30-day half-life). Text-only fallback from interest tags.
- **Pagination**: Overfetch `limit*3+50`, CLIP rerank, `sortPos` slice. Snapshot anchor `publishedAt <= $snapshot`. Frozen `seed` in cursor. No duplicates.
- **"More Like This"**: `searchTmdbRecommendations` — `/movie/{id}/recommendations`, max 6 movies × 2 images, interleave 2:1. Cursor tracks `recOffset`.
- **Unlisted**: Mutual follow via `followerVisibilitySql` in repository queries. Author always sees own. `findMutualFollow` in follows repository.
- **Browse asset**: 7 internal : 3 external interleave. Visual similarity via `visualSimilarTo`. Lazy CLIP for uploaded images via `findMediaById` + `getImageEmbedding`, in-memory cache per process.

## Signal Regeneration
From saved canvas items on workspace load (no `browseAssetContext` in snapshot). Extracts `mediaId` from UUID in URL, skips UUID as search token, uses title/tags/meaningful filename instead.

## Key Files
- backend: `clip.service.js`, `externalImages.service.js`/`.repository.js`/`.controller.js`, `posts.service.js`/`.repository.js`, `profile.service.js`, `follows.repository.js`, `media.repository.js`, `cursor.js`
- frontend: `Workspace.jsx`, `ExternalImageDetail.jsx`, `PostDetail.jsx`, `CommunityPostCard.jsx`, `api/externalImages.js`, `api/posts.js`

## Next Steps
- pgvector for PG18 Windows (no prebuilt binary, build from source)
- Admin endpoint for profile backfill status/trigger
- Backfill script for existing users

## Known Issues
- `getProviderSearchersForQuery` limits home movie queries to `[tmdb, wikimedia]` only
- Design filter keyword-based — CLIP needed for semantic accuracy
- Eraser quality fix: native resolution used internally, item retains display size for layout

## Important
- `tags` in `user_interest_events` is `text[]`, not `jsonb`
- pgvector NOT installed — cosine in JS O(n) scan
