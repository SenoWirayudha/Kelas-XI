<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\MovieMedia;
use App\Models\UserChangeMedia;
use Illuminate\Http\Request;

/**
 * PosterBackdropController
 *
 * Manages per-user poster & backdrop selections stored in user_change_medias.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  CONTEXT TYPES                                                          │
 * │                                                                         │
 * │  films     – general preference used on most screens and when viewing   │
 * │              other users' content (new-from-friends, others' reviews,   │
 * │              others' profile).  user_id = the viewer/changer.           │
 * │                                                                         │
 * │  reviews   – tied to a specific review diary entry                      │
 * │  logged    – tied to a specific log-only diary entry                    │
 * │  favorites – tied to a specific favorite-film slot                      │
 * │                                                                         │
 * │  FALLBACK ORDER (for display)                                           │
 * │    When diaries_id known:  context-specific only → movie default        │
 * │    When diaries_id null:   context-specific → films → movie default     │
 * │                                                                         │
 * │  films-level media is copied to new diary entries at save time via      │
 * │  UserChangeMedia::propagateFilmsToContext() — later type=films changes  │
 * │  do NOT retroactively affect existing diary entries.                    │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
class PosterBackdropController extends Controller
{
    // -----------------------------------------------------------------------
    // POST /v1/users/{userId}/change-media
    // -----------------------------------------------------------------------

    /**
     * Save or update a user's poster/backdrop selection.
     *
     * Request body (JSON / form-data):
     *   film_id      int      required
     *   media_id     int      required  – id from movie_media table
     *   type         string   required  – films | reviews | logged | favorites
     *   diaries_id   int      nullable  – required when type = reviews | logged
     *   favorite_id  int      nullable  – required when type = favorites
     */
    public function setMedia(Request $request, int $userId)
    {
        $validated = $request->validate([
            'film_id'     => 'required|integer|exists:movies,id',
            'media_id'    => 'required|integer|exists:movie_media,id',
            'type'        => 'required|in:films,reviews,logged,favorites',
            'diaries_id'  => 'nullable|integer|exists:diaries,id',
            'favorite_id' => 'nullable|integer|exists:user_favorite_films,id',
        ]);

        $type       = $validated['type'];
        $diariesId  = $validated['diaries_id']  ?? null;
        $favoriteId = $validated['favorite_id'] ?? null;

        // Context-specific FK validation
        if (in_array($type, ['reviews', 'logged']) && !$diariesId) {
            return response()->json([
                'success' => false,
                'message' => 'diaries_id is required when type is reviews or logged.',
            ], 422);
        }
        if ($type === 'favorites' && !$favoriteId) {
            return response()->json([
                'success' => false,
                'message' => 'favorite_id is required when type is favorites.',
            ], 422);
        }

        // Confirm the media item belongs to the requested film
        $media = MovieMedia::where('id', $validated['media_id'])
            ->where('movie_id', $validated['film_id'])
            ->first();

        if (!$media) {
            return response()->json([
                'success' => false,
                'message' => 'The selected media does not belong to this film.',
            ], 422);
        }

        $mediaCategory = $media->media_type; // 'poster' | 'backdrop'

        $conditions = UserChangeMedia::upsertConditions(
            $userId,
            (int) $validated['film_id'],
            $mediaCategory,
            $type,
            $diariesId,
            $favoriteId
        );

        // Before the normal upsert, check whether a stale row exists for this
        // context that was saved without its FK (favorite_id or diaries_id = NULL).
        // If found, adopt it: stamp the correct FK onto it so it becomes valid.
        // This avoids creating a duplicate row and keeps the row count clean.
        $record = null;

        if ($type === 'favorites' && $favoriteId) {
            $stale = UserChangeMedia::where('user_id', $userId)
                ->where('film_id', (int) $validated['film_id'])
                ->where('media_category', $mediaCategory)
                ->where('type', 'favorites')
                ->whereNull('favorite_id')
                ->first();

            if ($stale) {
                $stale->update([
                    'favorite_id' => $favoriteId,
                    'media_id'    => $validated['media_id'],
                ]);
                $record = $stale->fresh();
            }
        } elseif (in_array($type, ['reviews', 'logged']) && $diariesId) {
            $stale = UserChangeMedia::where('user_id', $userId)
                ->where('film_id', (int) $validated['film_id'])
                ->where('media_category', $mediaCategory)
                ->where('type', $type)
                ->whereNull('diaries_id')
                ->first();

            if ($stale) {
                $stale->update([
                    'diaries_id' => $diariesId,
                    'media_id'   => $validated['media_id'],
                ]);
                $record = $stale->fresh();
            }
        }

        // Fall back to the normal updateOrCreate when no stale row was adopted.
        if (!$record) {
            $record = UserChangeMedia::updateOrCreate(
                $conditions,
                ['media_id' => $validated['media_id']]
            );
        }

        return response()->json([
            'success' => true,
            'data'    => $this->formatRecord($record->load('media')),
        ], $record->wasRecentlyCreated ? 201 : 200);
    }

    // -----------------------------------------------------------------------
    // GET /v1/users/{userId}/movies/{movieId}/custom-media
    // -----------------------------------------------------------------------

    /**
     * Get a user's custom poster + backdrop for a film in a specific context.
     *
     * Query params:
     *   type         string  default=films
     *   diaries_id   int     when type=reviews|logged
     *   favorite_id  int     when type=favorites
     *
     * Returns: { poster: record|null, backdrop: record|null }
     */
    public function getMedia(Request $request, int $userId, int $movieId)
    {
        $type       = $request->get('type', 'films');
        $diariesId  = $request->get('diaries_id')  ? (int) $request->get('diaries_id')  : null;
        $favoriteId = $request->get('favorite_id') ? (int) $request->get('favorite_id') : null;

        $resolved = UserChangeMedia::resolveForUser(
            $userId, $movieId, $type, $diariesId, $favoriteId
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'poster'   => $resolved['poster']   ? $this->formatRecord($resolved['poster'])   : null,
                'backdrop' => $resolved['backdrop'] ? $this->formatRecord($resolved['backdrop']) : null,
            ],
        ]);
    }

    // -----------------------------------------------------------------------
    // GET /v1/movies/{movieId}/display-media
    // -----------------------------------------------------------------------

    /**
     * Get the effective poster + backdrop to DISPLAY for a given film and viewer.
     *
     * Priority: context-specific → films → movie default (default_poster_path /
     * default_backdrop_path columns in movies table).
     *
     * Query params:
     *   viewer_user_id  int     optional – when absent, always returns defaults
     *   type            string  default=films
     *   diaries_id      int     when type=reviews|logged
     *   favorite_id     int     when type=favorites
     *
     * Response:
     *   {
     *     poster:   { id, path, is_default } | null,
     *     backdrop: { id, path, is_default } | null
     *   }
     */
    public function getDisplayMedia(Request $request, int $movieId)
    {
        $movie = Movie::find($movieId);
        if (!$movie) {
            return response()->json(['success' => false, 'message' => 'Movie not found.'], 404);
        }

        $defaults = [
            'poster'   => $movie->default_poster_path
                ? ['id' => null, 'path' => $movie->default_poster_path,   'is_default' => true]
                : null,
            'backdrop' => $movie->default_backdrop_path
                ? ['id' => null, 'path' => $movie->default_backdrop_path, 'is_default' => true]
                : null,
        ];

        $viewerUserId = $request->get('viewer_user_id') ? (int) $request->get('viewer_user_id') : null;

        if (!$viewerUserId) {
            return response()->json(['success' => true, 'data' => $defaults]);
        }

        $type       = $request->get('type', 'films');
        $diariesId  = $request->get('diaries_id')  ? (int) $request->get('diaries_id')  : null;
        $favoriteId = $request->get('favorite_id') ? (int) $request->get('favorite_id') : null;

        $resolved = UserChangeMedia::resolveForUser(
            $viewerUserId, $movieId, $type, $diariesId, $favoriteId
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'poster'   => $resolved['poster']
                    ? ['id' => $resolved['poster']->media_id, 'path' => $resolved['poster']->media->media_path, 'is_default' => false]
                    : $defaults['poster'],
                'backdrop' => $resolved['backdrop']
                    ? ['id' => $resolved['backdrop']->media_id, 'path' => $resolved['backdrop']->media->media_path, 'is_default' => false]
                    : $defaults['backdrop'],
            ],
        ]);
    }

    // -----------------------------------------------------------------------
    // GET /v1/users/{userId}/movies/{movieId}/display-media/batch
    // (convenience: resolve display media for multiple films at once)
    // -----------------------------------------------------------------------

    /**
     * Batch version of getDisplayMedia – resolve effective poster + backdrop for
     * multiple films in a single request (useful for list screens: films screen,
     * watchlist, diary, etc.).
     *
     * Request body:
     *   film_ids  int[]   required  – list of movie IDs
     *   type      string  default=films
     *
     * Response:
     *   {
     *     "data": {
     *       "17": { "poster": {...}, "backdrop": {...} },
     *       "42": { ... }
     *     }
     *   }
     */
    public function batchDisplayMedia(Request $request, int $userId)
    {
        $request->validate([
            'film_ids'   => 'required|array|max:100',
            'film_ids.*' => 'integer',
            'type'       => 'nullable|in:films,reviews,logged,favorites',
        ]);

        $filmIds = $request->input('film_ids');
        $type    = $request->input('type', 'films');

        // --- Custom selections (type = requested, then fall back to 'films') ---
        $typesToFetch = $type !== 'films' ? [$type, 'films'] : ['films'];

        $customRows = UserChangeMedia::where('user_id', $userId)
            ->whereIn('film_id', $filmIds)
            ->whereIn('type', $typesToFetch)
            ->when(in_array('favorites', $typesToFetch), function ($q) {
                // Exclude stale legacy rows that were saved without a favorite_id.
                // Valid favorites rows always have a non-null favorite_id pointing
                // to a current user_favorite_films row.
                $q->where(function ($inner) {
                    $inner->where('type', '!=', 'favorites')
                          ->orWhereNotNull('favorite_id');
                });
            })
            ->with('media')
            ->orderBy('updated_at', 'desc') // newest takes priority when duplicates exist
            ->get()
            ->groupBy('film_id');

        // --- Movie defaults ---
        $movies = Movie::whereIn('id', $filmIds)
            ->get(['id', 'default_poster_path', 'default_backdrop_path'])
            ->keyBy('id');

        $result = [];

        foreach ($filmIds as $filmId) {
            $rows   = $customRows->get($filmId, collect());
            $movie  = $movies->get($filmId);

            $defaults = [
                'poster'   => ($movie && $movie->default_poster_path)
                    ? ['id' => null, 'path' => $movie->default_poster_path,   'is_default' => true]
                    : null,
                'backdrop' => ($movie && $movie->default_backdrop_path)
                    ? ['id' => null, 'path' => $movie->default_backdrop_path, 'is_default' => true]
                    : null,
            ];

            // Priority: requested type > 'films' > default
            $poster   = null;
            $backdrop = null;

            foreach ($typesToFetch as $checkType) {
                $typeRows = $rows->where('type', $checkType);
                if (!$poster   && ($r = $typeRows->firstWhere('media_category', 'poster'))) {
                    $poster   = ['id' => $r->media_id, 'path' => $r->media->media_path, 'is_default' => false];
                }
                if (!$backdrop && ($r = $typeRows->firstWhere('media_category', 'backdrop'))) {
                    $backdrop = ['id' => $r->media_id, 'path' => $r->media->media_path, 'is_default' => false];
                }
                if ($poster && $backdrop) break;
            }

            $result[$filmId] = [
                'poster'   => $poster   ?? $defaults['poster'],
                'backdrop' => $backdrop ?? $defaults['backdrop'],
            ];
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    // -----------------------------------------------------------------------
    // DELETE /v1/users/{userId}/movies/{movieId}/change-media
    // -----------------------------------------------------------------------

    /**
     * Delete a user's custom media selection for a film/context.
     *
     * Query params:
     *   type            string  required
     *   media_category  string  optional  – 'poster' | 'backdrop' (both if omitted)
     *   diaries_id      int     when type=reviews|logged
     *   favorite_id     int     when type=favorites
     */
    public function deleteMedia(Request $request, int $userId, int $movieId)
    {
        $type          = $request->get('type', 'films');
        $mediaCategory = $request->get('media_category');
        $diariesId     = $request->get('diaries_id')  ? (int) $request->get('diaries_id')  : null;
        $favoriteId    = $request->get('favorite_id') ? (int) $request->get('favorite_id') : null;

        $query = UserChangeMedia::where('user_id', $userId)
            ->where('film_id', $movieId)
            ->where('type', $type);

        if ($mediaCategory) {
            $query->where('media_category', $mediaCategory);
        }
        if ($diariesId) {
            $query->where('diaries_id', $diariesId);
        }
        if ($favoriteId) {
            $query->where('favorite_id', $favoriteId);
        }

        $deleted = $query->delete();

        return response()->json([
            'success' => true,
            'deleted' => $deleted,
        ]);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private function formatRecord(UserChangeMedia $record): array
    {
        return [
            'id'             => $record->id,
            'user_id'        => $record->user_id,
            'film_id'        => $record->film_id,
            'media_id'       => $record->media_id,
            'media_category' => $record->media_category,
            'media_path'     => $record->relationLoaded('media') && $record->media
                ? $record->media->media_path
                : null,
            'type'           => $record->type,
            'diaries_id'     => $record->diaries_id,
            'favorite_id'    => $record->favorite_id,
            'updated_at'     => $record->updated_at?->toISOString(),
        ];
    }
}
