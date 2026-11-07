<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FilmList;
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

    /** GET /users/{userId}/lists?viewer_id= */
    public function index(Request $request, $userId)
    {
        $viewerId = (int) $request->get('viewer_id', 0);

        $lists = FilmList::withCount('items')
            ->where('user_id', (int) $userId)
            ->when((int) $userId !== $viewerId, fn ($query) => $query
                ->where('visibility', FilmList::VISIBILITY_PUBLIC))
            ->orderByDesc('updated_at')
            ->get();

        $covers = $this->coverLookup($lists->pluck('id')->all(), $viewerId);

        return response()->json([
            'success' => true,
            'data' => $lists->map(fn (FilmList $list) => $this->formatList($list, $covers)),
        ]);
    }

    /** POST /users/{userId}/lists */
    public function store(Request $request, $userId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:120',
            'description' => 'nullable|string|max:2000',
            'type' => 'nullable|in:ranked,plain',
            'visibility' => 'nullable|in:public,private',
        ]);

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
            'use_backdrop' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatList($list->loadCount('items'), []),
        ]);
    }

    /** GET /lists/{listId}?viewer_id= */
    public function show(Request $request, $listId)
    {
        $viewerId = (int) $request->get('viewer_id', 0);
        $list = FilmList::with('items.movie')->find($listId);

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
        ]);

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
        if ($request->has('use_backdrop')) {
            $payload['use_backdrop'] = $request->boolean('use_backdrop');
        }

        $list->update($payload);

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
            'movie_ids' => 'required|array|min:1',
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

        // Media must belong to this film and match the requested category.
        foreach ([
            'poster' => ['poster_media_id', 'poster'],
            'backdrop' => ['backdrop_media_id', 'backdrop'],
        ] as [$field, $type]) {
            if (empty($validated[$field])) {
                continue;
            }

            $media = MovieMedia::find($validated[$field]);
            if (!$media
                || (int) $media->movie_id !== (int) $movieId
                || $media->media_type !== $type) {
                throw ValidationException::withMessages([
                    $field => 'Media tidak cocok dengan film ini.',
                ]);
            }
        }

        $item->update([
            'poster_media_id' => $validated['poster_media_id'] ?? null,
            'backdrop_media_id' => $validated['backdrop_media_id'] ?? null,
        ]);

        $fresh = FilmList::with('items.movie')->find($list->id);

        return response()->json([
            'success' => true,
            'data' => $this->formatList($fresh, $this->coverLookup([$list->id], (int) $userId), true, (int) $userId),
        ]);
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

        $viewerMedia = $this->viewerMedia($movieIds, $viewerId);
        $mediaPaths = $this->mediaPaths($items->pluck('poster_media_id')->merge($items->pluck('backdrop_media_id'))->filter()->all());

        $covers = [];
        foreach ($firstByList as $listId => $item) {
            $movie = $movies->get((int) $item->movie_id);
            $movieId = (int) $item->movie_id;

            $covers[$listId] = [
                'poster_url' => $this->mediaUrl($mediaPaths[$item->poster_media_id] ?? null)
                    ?? ($viewerMedia[$movieId]['poster'] ?? null)
                    ?? $this->movieDefault($movie?->default_poster_path),
                'backdrop_url' => $this->mediaUrl($mediaPaths[$item->backdrop_media_id] ?? null)
                    ?? ($viewerMedia[$movieId]['backdrop'] ?? null)
                    ?? $this->movieDefault($movie?->default_backdrop_path),
                'movie_id' => $movieId,
            ];
        }

        return $covers;
    }

    /** viewer's global 'films' poster/backdrop preference. */
    private function viewerMedia(array $movieIds, int $viewerId): array
    {
        if ($viewerId <= 0 || empty($movieIds)) {
            return [];
        }

        $rows = DB::table('user_change_medias as ucm')
            ->join('movie_media as mm', 'ucm.media_id', '=', 'mm.id')
            ->where('ucm.user_id', $viewerId)
            ->where('ucm.type', 'films')
            ->whereIn('ucm.film_id', $movieIds)
            ->whereIn('ucm.media_category', ['poster', 'backdrop'])
            ->select('ucm.film_id', 'ucm.media_category', 'mm.media_path')
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $result[(int) $row->film_id][$row->media_category] = $this->movieDefault($row->media_path);
        }

        return $result;
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
        $payload = [
            'id' => $list->id,
            'user_id' => $list->user_id,
            'title' => $list->title,
            'description' => $list->description,
            'type' => $list->type,
            'visibility' => $list->visibility,
            'use_backdrop' => (bool) $list->use_backdrop,
            'items_count' => $list->items_count ?? ($list->relationLoaded('items') ? $list->items->count() : 0),
            'poster_url' => $covers[$list->id]['poster_url'] ?? null,
            'backdrop_url' => $covers[$list->id]['backdrop_url'] ?? null,
            'updated_at' => optional($list->updated_at)->format('Y-m-d H:i:s'),
        ];

        if ($withItems) {
            $items = $list->items->sortBy('position')->values();
            $mediaPaths = $this->mediaPaths(
                $items->pluck('poster_media_id')->merge($items->pluck('backdrop_media_id'))->filter()->all()
            );
            $movieIds = $items->pluck('movie_id')->map(fn ($id) => (int) $id)->all();
            $viewerMedia = $this->viewerMedia($movieIds, $viewerId);

            $payload['items'] = $items->map(function (FilmListItem $item, $index) use ($mediaPaths, $viewerMedia) {
                $movie = $item->movie;
                $movieId = (int) $item->movie_id;

                return [
                    'movie_id' => $movieId,
                    'position' => $index + 1,
                    'title' => $movie?->title,
                    'release_year' => $movie?->release_year,
                    'age_rating' => $movie?->age_rating,
                    'poster_url' => $this->mediaUrl($mediaPaths[$item->poster_media_id] ?? null)
                        ?? ($viewerMedia[$movieId]['poster'] ?? null)
                        ?? $this->movieDefault($movie?->default_poster_path),
                    'backdrop_url' => $this->mediaUrl($mediaPaths[$item->backdrop_media_id] ?? null)
                        ?? ($viewerMedia[$movieId]['backdrop'] ?? null)
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
