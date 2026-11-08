<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FilmList;
use App\Models\FilmListComment;
use App\Models\FilmListItem;
use App\Models\Movie;
use App\Models\MovieMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Film lists (Letterboxd-style).
 *
 * Ownership is enforced on writes, visibility on reads.
 * Artwork resolution per film: list-item custom media (movie_media id) →
 * the viewer's own 'films' preference → the film's default artwork.
 */
class FilmListApiController extends Controller
{
    private const MAX_BACKDROP_MOVIES = 8;

    // ------------------------------------------------------------------
    // Collections
    // ------------------------------------------------------------------

    /** GET /users/{userId}/lists?viewer_id=&movie_id= */
    public function index(Request $request, $userId)
    {
        $viewerId = (int) $request->get('viewer_id', 0);
        $movieId = (int) $request->get('movie_id', 0);

        $lists = FilmList::withCount('items')
            ->with('user.userProfile')
            ->where('user_id', (int) $userId)
            ->when((int) $userId !== $viewerId, fn ($query) => $query
                ->where('visibility', FilmList::VISIBILITY_PUBLIC))
            ->orderByDesc('updated_at')
            ->get();

        $covers = $this->coverLookup($lists->pluck('id')->all(), $viewerId);

        // Optional "Add to List" scope: which lists already hold this film.
        $listIdsWithMovie = $movieId > 0
            ? FilmListItem::whereIn('film_list_id', $lists->pluck('id')->all())
                ->where('movie_id', $movieId)
                ->pluck('film_list_id')
                ->map(fn ($id) => (int) $id)
                ->all()
            : [];

        return response()->json([
            'success' => true,
            'data' => $lists->map(function (FilmList $list) use ($covers, $listIdsWithMovie) {
                $payload = $this->formatList($list, $covers);
                $payload['contains_movie'] = in_array((int) $list->id, $listIdsWithMovie, true);

                return $payload;
            }),
        ]);
    }

    /**
     * GET /movies/{movieId}/lists?viewer_id=&scope=all|friends
     *
     * Public lists that contain the film, newest first. Private lists only show
     * up for their owner on the "all" scope. "friends" narrows to lists from
     * users the viewer follows.
     */
    public function listsForMovie(Request $request, $movieId)
    {
        $viewerId = (int) $request->get('viewer_id', 0);
        $scope = $request->get('scope', 'all') === 'friends' ? 'friends' : 'all';

        $query = FilmList::withCount('items')
            ->with('user.userProfile')
            ->whereIn('id', FilmListItem::where('movie_id', (int) $movieId)->select('film_list_id'))
            // Public for everyone; private only for its owner.
            ->where(function ($q) use ($viewerId) {
                $q->where('visibility', FilmList::VISIBILITY_PUBLIC)
                    ->orWhere('user_id', $viewerId);
            })
            ->orderByDesc('updated_at');

        if ($scope === 'friends') {
            $followedIds = DB::table('followers')
                ->where('follower_id', $viewerId)
                ->pluck('user_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            $query->whereIn('user_id', $followedIds)
                ->where('visibility', FilmList::VISIBILITY_PUBLIC);
        }

        $lists = $query->get();
        $covers = $this->coverLookup($lists->pluck('id')->all(), $viewerId);

        return response()->json([
            'success' => true,
            'data' => $lists->map(fn (FilmList $list) => $this->formatList($list, $covers)),
        ]);
    }

    /** POST /users/{userId}/lists */
    public function store(Request $request, $userId)    {
        $validated = $request->validate([
            'title' => 'required|string|max:120',
            'description' => 'nullable|string|max:2000',
            'type' => 'nullable|in:ranked,plain',
            'visibility' => 'nullable|in:public,private',
            'movie_ids' => 'nullable|array',
            'movie_ids.*' => 'integer|exists:movies,id',
            'backdrop_media_id' => 'nullable|integer|exists:movie_media,id',
            'use_backdrop' => 'nullable|boolean',
        ]);

        // Films are accepted inline so create + first line-up is one atomic call.
        $movieIds = array_values(array_unique(array_map('intval', $validated['movie_ids'] ?? [])));
        $backdropMediaId = $this->validatedBackdropId(
            $validated['backdrop_media_id'] ?? null,
            $movieIds[0] ?? null
        );

        $list = DB::transaction(function () use ($validated, $userId, $movieIds, $backdropMediaId) {
            $list = FilmList::create([
                'user_id' => (int) $userId,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'type' => ($validated['type'] ?? FilmList::TYPE_PLAIN) === FilmList::TYPE_RANKED
                    ? FilmList::TYPE_RANKED
                    : FilmList::TYPE_PLAIN,
                'visibility' => ($validated['visibility'] ?? FilmList::VISIBILITY_PUBLIC) === FilmList::VISIBILITY_PRIVATE
                    ? FilmList::VISIBILITY_PRIVATE
                    : FilmList::VISIBILITY_PUBLIC,
                'use_backdrop' => ($validated['use_backdrop'] ?? false) || $backdropMediaId !== null,
                'backdrop_media_id' => $backdropMediaId,
            ]);

            foreach ($movieIds as $index => $movieId) {
                FilmListItem::create([
                    'film_list_id' => $list->id,
                    'movie_id' => $movieId,
                    'position' => $index + 1,
                ]);
            }

            return $list;
        });

        $fresh = FilmList::with('items.movie')->find($list->id);

        return response()->json([
            'success' => true,
            'data' => $this->formatList($fresh, [], true, (int) $userId),
        ]);
    }

    /** GET /lists/{listId}?viewer_id= */
    public function show(Request $request, $listId)
    {
        $viewerId = (int) $request->get('viewer_id', 0);
        $list = FilmList::with(['items.movie', 'user.userProfile'])->find($listId);

        if (!$list) {
            return $this->notFound();
        }
        if (!$list->isVisibleTo($viewerId)) {
            return response()->json(['success' => false, 'message' => 'List ini privat.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatList($list, $this->coverLookup([$list->id], $viewerId), true, $viewerId),
        ]);
    }

    /** PUT /users/{userId}/lists/{listId} */
    public function update(Request $request, $userId, $listId)
    {
        $list = $this->ownedList($userId, $listId);
        if ($list instanceof \Illuminate\Http\JsonResponse) {
            return $list;
        }

        $validated = $request->validate([
            'title' => 'required|string|max:120',
            'description' => 'nullable|string|max:2000',
            'type' => 'nullable|in:ranked,plain',
            'visibility' => 'nullable|in:public,private',
            'use_backdrop' => 'nullable|boolean',
            'movie_ids' => 'nullable|array',
            'movie_ids.*' => 'integer|exists:movies,id',
            'backdrop_media_id' => 'nullable|integer|exists:movie_media,id',
        ]);

        $movieIds = $request->has('movie_ids')
            ? array_values(array_unique(array_map('intval', $validated['movie_ids'] ?? [])))
            : null;

        // Backdrop belongs to film #1; when the first film changes the choice is
        // dropped so the new film's default backdrop is used.
        $firstMovieChanged = false;
        if ($movieIds !== null) {
            $oldFirst = FilmListItem::where('film_list_id', $list->id)
                ->orderBy('position')
                ->value('movie_id');
            $firstMovieChanged = (int) $oldFirst !== (int) ($movieIds[0] ?? 0);
        }

        $payload = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
        ];
        if (array_key_exists('type', $validated) && $validated['type'] !== null) {
            $payload['type'] = $validated['type'] === FilmList::TYPE_RANKED
                ? FilmList::TYPE_RANKED
                : FilmList::TYPE_PLAIN;
        }
        if (array_key_exists('visibility', $validated) && $validated['visibility'] !== null) {
            $payload['visibility'] = $validated['visibility'] === FilmList::VISIBILITY_PRIVATE
                ? FilmList::VISIBILITY_PRIVATE
                : FilmList::VISIBILITY_PUBLIC;
        }

        if ($firstMovieChanged) {
            // Keep the toggle on: the hero falls back to the new film #1's default.
            $payload['backdrop_media_id'] = null;
        } elseif ($request->has('backdrop_media_id')) {
            $backdropMediaId = $this->validatedBackdropId(
                $validated['backdrop_media_id'] ?? null,
                $movieIds[0] ?? FilmListItem::where('film_list_id', $list->id)->orderBy('position')->value('movie_id')
            );
            $payload['backdrop_media_id'] = $backdropMediaId;
            $payload['use_backdrop'] = $backdropMediaId !== null;
        } elseif ($request->has('use_backdrop')) {
            $payload['use_backdrop'] = $request->boolean('use_backdrop');
        }

        $list->update($payload);

        // When the editor sends the full line-up, it replaces the old one so
        // additions/removals/order from "Pilih Film" are all persisted.
        if ($movieIds !== null) {
            DB::transaction(function () use ($list, $movieIds) {
                // List-scoped custom artwork is keyed by (film_list_id, movie_id):
                // keep it for films that stay, drop it for films that leave, and
                // let brand-new films fall back to their default artwork.
                $keptMedia = FilmListItem::where('film_list_id', $list->id)
                    ->get(['movie_id', 'poster_media_id', 'backdrop_media_id'])
                    ->keyBy(fn (FilmListItem $item) => (int) $item->movie_id);

                FilmListItem::where('film_list_id', $list->id)->delete();

                foreach ($movieIds as $index => $movieId) {
                    $kept = $keptMedia->get((int) $movieId);

                    FilmListItem::create([
                        'film_list_id' => $list->id,
                        'movie_id' => $movieId,
                        'position' => $index + 1,
                        'poster_media_id' => $kept?->poster_media_id,
                        'backdrop_media_id' => $kept?->backdrop_media_id,
                    ]);
                }
            });
        }

        $fresh = FilmList::with('items.movie')->find($list->id);

        return response()->json([
            'success' => true,
            'data' => $this->formatList($fresh, $this->coverLookup([$list->id], (int) $userId), true, (int) $userId),
        ]);
    }

    /** DELETE /users/{userId}/lists/{listId} */
    public function destroy($userId, $listId)
    {
        $list = $this->ownedList($userId, $listId);
        if ($list instanceof \Illuminate\Http\JsonResponse) {
            return $list;
        }

        DB::transaction(function () use ($list) {
            FilmListItem::where('film_list_id', $list->id)->delete();
            $list->delete();
        });

        return response()->json(['success' => true, 'message' => 'List dihapus.']);
    }

    // ------------------------------------------------------------------
    // Items
    // ------------------------------------------------------------------

    /** POST /users/{userId}/lists/{listId}/items { movie_ids: [] } */
    public function addItems(Request $request, $userId, $listId)
    {
        $list = $this->ownedList($userId, $listId);
        if ($list instanceof \Illuminate\Http\JsonResponse) {
            return $list;
        }

        $validated = $request->validate([
            'movie_ids' => 'required|array|min:1',
            'movie_ids.*' => 'integer|exists:movies,id',
        ]);

        $existing = FilmListItem::where('film_list_id', $list->id)
            ->pluck('movie_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        // One film per list: duplicates are skipped, not treated as an error.
        $toAdd = array_values(array_diff(
            array_unique(array_map('intval', $validated['movie_ids'])),
            $existing
        ));

        $position = (int) FilmListItem::where('film_list_id', $list->id)->max('position');

        DB::transaction(function () use ($list, $toAdd, &$position) {
            foreach ($toAdd as $movieId) {
                FilmListItem::create([
                    'film_list_id' => $list->id,
                    'movie_id' => $movieId,
                    'position' => ++$position,
                ]);
            }
            $list->touch();
        });

        $fresh = FilmList::with('items.movie')->find($list->id);

        return response()->json([
            'success' => true,
            'data' => $this->formatList($fresh, $this->coverLookup([$list->id], (int) $userId), true, (int) $userId),
        ]);
    }

    /** DELETE /users/{userId}/lists/{listId}/items/{movieId} */
    public function removeItem($userId, $listId, $movieId)
    {
        $list = $this->ownedList($userId, $listId);
        if ($list instanceof \Illuminate\Http\JsonResponse) {
            return $list;
        }

        FilmListItem::where('film_list_id', $list->id)
            ->where('movie_id', (int) $movieId)
            ->delete();

        $this->resequence($list->id);
        $list->touch();

        $fresh = FilmList::with('items.movie')->find($list->id);

        return response()->json([
            'success' => true,
            'data' => $this->formatList($fresh, $this->coverLookup([$list->id], (int) $userId), true, (int) $userId),
        ]);
    }

    /** PUT /users/{userId}/lists/{listId}/order { movie_ids: [] } */
    public function reorder(Request $request, $userId, $listId)
    {
        $list = $this->ownedList($userId, $listId);
        if ($list instanceof \Illuminate\Http\JsonResponse) {
            return $list;
        }

        $validated = $request->validate([
            'movie_ids' => 'present|array',
            'movie_ids.*' => 'integer',
        ]);

        $current = FilmListItem::where('film_list_id', $list->id)
            ->pluck('movie_id')
            ->map(fn ($id) => (int) $id)
            ->all();
        $requested = array_map('intval', $validated['movie_ids']);

        // The payload must describe the same set, or a drag would silently
        // drop/duplicate films.
        $sortedCurrent = $current;
        $sortedRequested = $requested;
        sort($sortedCurrent);
        sort($sortedRequested);
        if ($sortedCurrent !== $sortedRequested) {
            throw ValidationException::withMessages([
                'movie_ids' => 'Urutan harus memuat semua film di list ini.',
            ]);
        }

        DB::transaction(function () use ($list, $requested) {
            foreach ($requested as $index => $movieId) {
                FilmListItem::where('film_list_id', $list->id)
                    ->where('movie_id', $movieId)
                    ->update(['position' => $index + 1]);
            }
            $list->touch();
        });

        return response()->json(['success' => true, 'message' => 'Urutan disimpan.']);
    }

    // ------------------------------------------------------------------
    // Artwork
    // ------------------------------------------------------------------

    /** GET /movies/{movieId}/list-artwork */
    public function movieArtwork($movieId)
    {
        $rows = MovieMedia::where('movie_id', (int) $movieId)
            ->whereIn('media_type', ['poster', 'backdrop'])
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get(['id', 'media_type', 'media_path', 'is_default']);

        $group = fn (string $type) => $rows
            ->where('media_type', $type)
            ->values()
            ->map(fn ($media) => [
                'id' => $media->id,
                'url' => url('storage/' . $media->media_path),
                'is_default' => (bool) $media->is_default,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'posters' => $group('poster'),
                'backdrops' => $group('backdrop'),
            ],
        ]);
    }

    /** GET /lists/{listId}/backdrop-movies?viewer_id= */
    public function backdropMovies(Request $request, $listId)
    {
        $viewerId = (int) $request->get('viewer_id', 0);
        $list = FilmList::with('items.movie')->find($listId);

        if (!$list) {
            return $this->notFound();
        }
        if (!$list->isVisibleTo($viewerId)) {
            return response()->json(['success' => false, 'message' => 'List ini privat.'], 403);
        }

        $movies = $list->items
            ->sortBy('position')
            ->take(self::MAX_BACKDROP_MOVIES)
            ->map(function (FilmListItem $item) {
                $movie = $item->movie;
                if (!$movie) {
                    return null;
                }

                return [
                    'movie_id' => $movie->id,
                    'title' => $movie->title,
                    'backdrops' => MovieMedia::where('movie_id', $movie->id)
                        ->where('media_type', 'backdrop')
                        ->orderByDesc('is_default')
                        ->orderByDesc('created_at')
                        ->get(['id', 'media_path'])
                        ->map(fn ($media) => [
                            'id' => $media->id,
                            'url' => url('storage/' . $media->media_path),
                        ])
                        ->values(),
                ];
            })
            ->filter()
            ->values();

        return response()->json(['success' => true, 'data' => $movies]);
    }

    /**
     * PUT /users/{userId}/lists/{listId}/items/{movieId}/media
     * { poster_media_id: int|null, backdrop_media_id: int|null }
     *
     * Null clears the choice so the film falls back to its default artwork.
     */
    public function setItemMedia(Request $request, $userId, $listId, $movieId)
    {
        $list = $this->ownedList($userId, $listId);
        if ($list instanceof \Illuminate\Http\JsonResponse) {
            return $list;
        }

        $validated = $request->validate([
            'poster_media_id' => 'nullable|integer|exists:movie_media,id',
            'backdrop_media_id' => 'nullable|integer|exists:movie_media,id',
        ]);

        $item = FilmListItem::where('film_list_id', $list->id)
            ->where('movie_id', (int) $movieId)
            ->first();

        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Film tidak ada di list ini.'], 404);
        }

        // Partial update: only fields present in the request are touched, so a
        // poster-only change never clears the item's backdrop (and vice versa).
        $update = [];
        foreach (['poster_media_id' => 'poster', 'backdrop_media_id' => 'backdrop'] as $field => $type) {
            if (!$request->has($field)) {
                continue;
            }

            $mediaId = $validated[$field] ?? null;
            if ($mediaId !== null) {
                $media = MovieMedia::find($mediaId);
                if (!$media
                    || (int) $media->movie_id !== (int) $movieId
                    || $media->media_type !== $type) {
                    throw ValidationException::withMessages([
                        $field => 'Media tidak cocok dengan film ini.',
                    ]);
                }
            }

            $update[$field] = $mediaId;
        }

        if (!empty($update)) {
            $item->update($update);
        }

        $fresh = FilmList::with('items.movie')->find($list->id);

        return response()->json([
            'success' => true,
            'data' => $this->formatList($fresh, $this->coverLookup([$list->id], (int) $userId), true, (int) $userId),
        ]);
    }

    // ------------------------------------------------------------------
    // Comments
    // ------------------------------------------------------------------

    /** GET /lists/{listId}/comments?viewer_id= */
    public function comments(Request $request, $listId)
    {
        $viewerId = (int) $request->get('viewer_id', 0);
        $list = FilmList::find($listId);

        if (!$list) {
            return $this->notFound();
        }
        if (!$list->isVisibleTo($viewerId)) {
            return response()->json(['success' => false, 'message' => 'List ini privat.'], 403);
        }

        $comments = FilmListComment::with('user')
            ->where('film_list_id', $list->id)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $comments->map(fn (FilmListComment $comment) => $this->formatComment($comment)),
        ]);
    }

    /** POST /users/{userId}/lists/{listId}/comments { content } */
    public function addComment(Request $request, $userId, $listId)
    {
        $list = FilmList::find($listId);

        if (!$list) {
            return $this->notFound();
        }
        if (!$list->isVisibleTo((int) $userId)) {
            return response()->json(['success' => false, 'message' => 'List ini privat.'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment = FilmListComment::create([
            'film_list_id' => $list->id,
            'user_id' => (int) $userId,
            'content' => trim($validated['content']),
        ]);

        $comment->load('user');

        return response()->json([
            'success' => true,
            'data' => $this->formatComment($comment),
        ], 201);
    }

    private function formatComment(FilmListComment $comment): array
    {
        return [
            'id' => $comment->id,
            'user' => [
                'id' => $comment->user?->id,
                'username' => $comment->user?->username,
                'profile_photo' => $comment->user?->userProfile?->profile_photo
                    ? url('storage/' . $comment->user->userProfile->profile_photo)
                    : null,
            ],
            'content' => $comment->content,
            'created_at' => optional($comment->created_at)->format('Y-m-d H:i:s'),
            'time_ago' => optional($comment->created_at)->diffForHumans(short: true),
        ];
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** @return FilmList|\Illuminate\Http\JsonResponse */
    private function ownedList($userId, $listId)
    {
        $list = FilmList::find($listId);

        if (!$list) {
            return $this->notFound();
        }
        if ((int) $list->user_id !== (int) $userId) {
            return response()->json(['success' => false, 'message' => 'List ini bukan milik Anda.'], 403);
        }

        return $list;
    }

    private function notFound()
    {
        return response()->json(['success' => false, 'message' => 'List tidak ditemukan.'], 404);
    }

    /** Keeps positions contiguous (1..n) after a removal. */
    private function resequence(int $listId): void
    {
        $items = FilmListItem::where('film_list_id', $listId)->orderBy('position')->pluck('movie_id');

        foreach ($items as $index => $movieId) {
            FilmListItem::where('film_list_id', $listId)
                ->where('movie_id', $movieId)
                ->update(['position' => $index + 1]);
        }
    }

    /**
     * Poster/backdrop for the list cards and the list hero, always from the
     * film at position 1.
     */
    private function coverLookup(array $listIds, int $viewerId): array
    {
        if (empty($listIds)) {
            return [];
        }

        $items = FilmListItem::whereIn('film_list_id', $listIds)
            ->orderBy('position')
            ->get(['film_list_id', 'movie_id', 'poster_media_id', 'backdrop_media_id']);

        $firstByList = [];
        foreach ($items as $item) {
            if (!isset($firstByList[$item->film_list_id])) {
                $firstByList[$item->film_list_id] = $item;
            }
        }

        $movieIds = array_values(array_unique(array_map('intval', $items->pluck('movie_id')->all())));
        $movies = Movie::whereIn('id', $movieIds)
            ->get(['id', 'default_poster_path', 'default_backdrop_path'])
            ->keyBy('id');

        // List artwork only: item poster → film default. Never the user's
        // film/review custom artwork.
        $mediaPaths = $this->mediaPaths($items->pluck('poster_media_id')->filter()->all());
        $listBackdrops = FilmList::whereIn('id', $listIds)
            ->pluck('backdrop_media_id', 'id')
            ->all();
        $backdropPaths = $this->mediaPaths(array_values(array_filter($listBackdrops)));

        $covers = [];
        foreach ($firstByList as $listId => $item) {
            $movie = $movies->get((int) $item->movie_id);
            $movieId = (int) $item->movie_id;

            // Poster strip for the "My List" row (max 7, in order).
            $posterUrls = [];
            foreach ($items->where('film_list_id', $listId)->sortBy('position')->take(7) as $stripItem) {
                $stripMovie = $movies->get((int) $stripItem->movie_id);
                $url = $this->mediaUrl($mediaPaths[$stripItem->poster_media_id] ?? null)
                    ?? $this->movieDefault($stripMovie?->default_poster_path);

                if ($url) {
                    $posterUrls[] = $url;
                }
            }

            $covers[$listId] = [
                'poster_url' => $this->mediaUrl($mediaPaths[$item->poster_media_id] ?? null)
                    ?? $this->movieDefault($movie?->default_poster_path),
                'backdrop_url' => $this->mediaUrl($backdropPaths[$listBackdrops[$listId] ?? null] ?? null)
                    ?? $this->movieDefault($movie?->default_backdrop_path),
                'poster_urls' => $posterUrls,
                'movie_id' => $movieId,
            ];
        }

        return $covers;
    }

    /**
     * PUT /users/{userId}/lists/{listId}/backdrop
     * { backdrop_media_id: int|null } — null restores film #1's default backdrop.
     */
    public function setListBackdrop(Request $request, $userId, $listId)
    {
        $list = $this->ownedList($userId, $listId);
        if ($list instanceof \Illuminate\Http\JsonResponse) {
            return $list;
        }

        $validated = $request->validate([
            'backdrop_media_id' => 'nullable|integer|exists:movie_media,id',
        ]);

        $firstMovieId = FilmListItem::where('film_list_id', $list->id)
            ->orderBy('position')
            ->value('movie_id');

        $backdropMediaId = $this->validatedBackdropId(
            $validated['backdrop_media_id'] ?? null,
            $firstMovieId
        );

        $list->update([
            'backdrop_media_id' => $backdropMediaId,
            'use_backdrop' => $backdropMediaId !== null,
        ]);

        $fresh = FilmList::with('items.movie')->find($list->id);

        return response()->json([
            'success' => true,
            'data' => $this->formatList($fresh, $this->coverLookup([$list->id], (int) $userId), true, (int) $userId),
        ]);
    }

    /**
     * Backdrops must belong to film #1 (the hero source) and be a backdrop.
     * Returns null when no backdrop was chosen.
     */
    private function validatedBackdropId(?int $mediaId, $firstMovieId): ?int
    {
        if ($mediaId === null || (int) $mediaId <= 0) {
            return null;
        }

        $media = MovieMedia::find($mediaId);
        if (!$media || $media->media_type !== 'backdrop') {
            throw ValidationException::withMessages([
                'backdrop_media_id' => 'Backdrop tidak valid.',
            ]);
        }

        if ($firstMovieId !== null && (int) $media->movie_id !== (int) $firstMovieId) {
            throw ValidationException::withMessages([
                'backdrop_media_id' => 'Backdrop harus milik film nomor 1.',
            ]);
        }

        return (int) $media->id;
    }

    /** movie_media.id => media_path for a set of ids. */
    private function mediaPaths(array $mediaIds): array
    {
        if (empty($mediaIds)) {
            return [];
        }

        return MovieMedia::whereIn('id', $mediaIds)
            ->pluck('media_path', 'id')
            ->all();
    }

    private function mediaUrl(?string $path): ?string
    {
        return $path ? url('storage/' . $path) : null;
    }

    private function movieDefault(?string $path): ?string
    {
        return $this->mediaUrl($path);
    }

    private function formatList(FilmList $list, array $covers, bool $withItems = false, int $viewerId = 0): array
    {
        $owner = $list->user;
        $ownerPhoto = $owner?->userProfile?->profile_photo;

        $payload = [
            'id' => $list->id,
            'user_id' => $list->user_id,
            'user' => [
                'id' => $owner?->id,
                'username' => $owner?->username,
                'profile_photo' => $ownerPhoto ? url('storage/' . $ownerPhoto) : null,
            ],
            'title' => $list->title,
            'description' => $list->description,
            'type' => $list->type,
            'visibility' => $list->visibility,
            'use_backdrop' => (bool) $list->use_backdrop,
            'backdrop_media_id' => $list->backdrop_media_id,
            'items_count' => $list->items_count ?? ($list->relationLoaded('items') ? $list->items->count() : 0),
            'poster_url' => $covers[$list->id]['poster_url'] ?? null,
            'backdrop_url' => $covers[$list->id]['backdrop_url'] ?? null,
            'poster_urls' => $covers[$list->id]['poster_urls'] ?? [],
            'updated_at' => optional($list->updated_at)->format('Y-m-d H:i:s'),
        ];

        if ($withItems) {
            $items = $list->items->sortBy('position')->values();
            $mediaPaths = $this->mediaPaths(
                $items->pluck('poster_media_id')->merge($items->pluck('backdrop_media_id'))->filter()->all()
            );

            $payload['items'] = $items->map(function (FilmListItem $item, $index) use ($mediaPaths) {
                $movie = $item->movie;

                return [
                    'movie_id' => (int) $item->movie_id,
                    'position' => $index + 1,
                    'title' => $movie?->title,
                    'release_year' => $movie?->release_year,
                    'age_rating' => $movie?->age_rating,
                    // List poster only → film default. Film/review custom artwork is ignored.
                    'poster_url' => $this->mediaUrl($mediaPaths[$item->poster_media_id] ?? null)
                        ?? $this->movieDefault($movie?->default_poster_path),
                    'backdrop_url' => $this->mediaUrl($mediaPaths[$item->backdrop_media_id] ?? null)
                        ?? $this->movieDefault($movie?->default_backdrop_path),
                    'custom_poster' => $item->poster_media_id !== null,
                    'custom_backdrop' => $item->backdrop_media_id !== null,
                    'poster_media_id' => $item->poster_media_id,
                    'backdrop_media_id' => $item->backdrop_media_id,
                ];
            })->all();
        }

        return $payload;
    }
}
