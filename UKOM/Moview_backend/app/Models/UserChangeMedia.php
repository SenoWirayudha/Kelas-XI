<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * UserChangeMedia – stores which movie_media (poster or backdrop) a user has
 * chosen to display for a film in a specific context (films / reviews / logged /
 * favorites).
 *
 * Display priority (highest → lowest):
 *   1. Context-specific record  (type = reviews | logged | favorites)
 *   2. General films record     (type = films)
 *   3. Movie default            (movies.default_poster_path / default_backdrop_path)
 */
class UserChangeMedia extends Model
{
    protected $table = 'user_change_medias';

    protected $fillable = [
        'user_id',
        'film_id',
        'media_id',
        'media_category',   // 'poster' | 'backdrop'
        'type',             // 'films' | 'reviews' | 'logged' | 'favorites'
        'diaries_id',       // set when type = 'reviews' or 'logged'
        'favorite_id',      // set when type = 'favorites'
    ];

    // -----------------------------------------------------------------------
    // Relationships
    // -----------------------------------------------------------------------

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class, 'film_id');
    }

    public function media()
    {
        return $this->belongsTo(MovieMedia::class, 'media_id');
    }

    public function diary()
    {
        return $this->belongsTo(Diary::class, 'diaries_id');
    }

    public function favoriteFilm()
    {
        return $this->belongsTo(UserFavoriteFilm::class, 'favorite_id');
    }

    // -----------------------------------------------------------------------
    // Static helpers
    // -----------------------------------------------------------------------

    /**
     * Build the where conditions used for an upsert, ensuring NULL FK fields
     * are always explicitly included so Laravel generates "IS NULL" clauses.
     */
    public static function upsertConditions(
        int     $userId,
        int     $filmId,
        string  $mediaCategory,
        string  $type,
        ?int    $diariesId,
        ?int    $favoriteId
    ): array {
        return [
            'user_id'        => $userId,
            'film_id'        => $filmId,
            'media_category' => $mediaCategory,
            'type'           => $type,
            'diaries_id'     => ($type === 'reviews' || $type === 'logged') ? $diariesId : null,
            'favorite_id'    => $type === 'favorites' ? $favoriteId : null,
        ];
    }

    /**
     * When a user saves a review or log entry, copy their existing type='films'
     * media selections to the new context (type='reviews' or type='logged'),
     * linked to the freshly-inserted diary row.
     *
     * Called from UserActivityController::saveReview() after diary insert.
     */
    public static function propagateFilmsToContext(
        int    $userId,
        int    $filmId,
        int    $diariesId,
        string $contextType   // 'reviews' | 'logged'
    ): void {
        $filmsMedia = static::where('user_id', $userId)
            ->where('film_id', $filmId)
            ->where('type', 'films')
            ->get();

        foreach ($filmsMedia as $record) {
            static::updateOrCreate(
                static::upsertConditions(
                    $userId, $filmId, $record->media_category,
                    $contextType, $diariesId, null
                ),
                ['media_id' => $record->media_id]
            );
        }
    }

    /**
     * Get the effective display media (poster + backdrop) for a user/film/context.
     * Falls through:  context-specific → films → [null if nothing set]
     *
     * Returns ['poster' => MediaRow|null, 'backdrop' => MediaRow|null]
     */
    public static function resolveForUser(
        int    $userId,
        int    $filmId,
        string $type       = 'films',
        ?int   $diariesId  = null,
        ?int   $favoriteId = null
    ): array {
        // Collect records from the most-specific type, then fall back to 'films'
        $typesToCheck = $type !== 'films' ? [$type, 'films'] : ['films'];

        $resolved = ['poster' => null, 'backdrop' => null];

        foreach ($typesToCheck as $checkType) {
            $query = static::where('user_id', $userId)
                ->where('film_id', $filmId)
                ->where('type', $checkType)
                ->with('media');

            if (in_array($checkType, ['reviews', 'logged']) && $diariesId) {
                $query->where('diaries_id', $diariesId);
            } elseif ($checkType === 'favorites' && $favoriteId) {
                $query->where('favorite_id', $favoriteId);
            } elseif (in_array($checkType, ['reviews', 'logged', 'favorites'])) {
                // Skip if required context ID is missing
                continue;
            }

            $records = $query->get();

            if (!$resolved['poster']) {
                $resolved['poster'] = $records->firstWhere('media_category', 'poster');
            }
            if (!$resolved['backdrop']) {
                $resolved['backdrop'] = $records->firstWhere('media_category', 'backdrop');
            }

            if ($resolved['poster'] && $resolved['backdrop']) {
                break;
            }
        }

        return $resolved;
    }
}
