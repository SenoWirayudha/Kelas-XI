<?php

namespace App\Support;

use App\Models\Schedule;

/**
 * Single source of truth for "what title/poster does a ticket show?".
 *
 * Festival sessions group several films under one session title, so the first film alone is
 * misleading. Used by the ticket API, the staff scanner, printed tickets, cashier receipts
 * and the admin order list, so every surface shows the same thing.
 */
final class SessionDisplay
{
    /**
     * @return array{display_title: ?string, poster_path: ?string, age_rating: ?string, films: array<int, array{id:int,title:string}>}
     */
    public static function forSchedule(?Schedule $schedule): array
    {
        if (!$schedule) {
            return ['display_title' => null, 'poster_path' => null, 'age_rating' => null, 'films' => []];
        }

        $isSurprise = (bool) $schedule->is_surprise;

        // Surprise sessions must never expose the real film(s).
        $films = $isSurprise
            ? collect()
            : ($schedule->relationLoaded('festivalMovies')
                ? $schedule->festivalMovies->values()
                : $schedule->festivalMovies()->get()->values());

        $firstFilm = $films->first() ?: $schedule->movie;

        $title = $schedule->session_title
            ?: ($isSurprise ? 'Film Kejutan' : null)
            ?: $firstFilm?->title
            ?: $schedule->movie?->title;

        return [
            'display_title' => $title,
            // Session poster wins; surprise sessions never fall back to a film poster.
            'poster_path' => $isSurprise
                ? $schedule->poster_path
                : ($schedule->poster_path ?: $firstFilm?->default_poster_path),
            'age_rating' => $schedule->age_rating,
            // Only multi-film sessions expose the line-up.
            'films' => !$isSurprise && $films->count() > 1
                ? $films->map(fn ($film) => ['id' => $film->id, 'title' => $film->title])->values()->all()
                : [],
        ];
    }

    /** "Film A | Film B" (empty for single-film sessions). */
    public static function filmsLine(?Schedule $schedule): string
    {
        $films = self::forSchedule($schedule)['films'];

        return implode(' | ', array_column($films, 'title'));
    }

    /** True when the session needs an ID check at the door. */
    public static function requiresIdCheck(?Schedule $schedule): bool
    {
        return self::forSchedule($schedule)['age_rating'] === '21+';
    }
}
