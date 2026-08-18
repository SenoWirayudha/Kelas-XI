<?php

namespace App\Services;

use App\Models\Movie;
use App\Models\MovieRelease;
use App\Models\Service;

/**
 * Auto-syncs movie_services streaming rows (Indonesia only) from movie_releases.
 *
 * Each row of type=streaming with country_code=ID is handled independently per
 * platform (no "earliest wins"): multiple streaming platforms can be active at
 * the same time, each with its own release_date / coming-soon state.
 *
 *  - release_date <= today (past / live)  -> activate service without a date
 *      (release_date=NULL, is_coming_soon=0 -> "available now")
 *  - release_date > today (future)        -> activate service with the date
 *      (release_date=<date>, is_coming_soon=1 -> "coming soon on [platform]")
 *  - platform name in movie_releases.name that matches no known streaming
 *      service is reported as an unhandled case (never silently ignored)
 *
 * When a row is removed from movie_releases, the matching service is
 * deactivated (is_coming_soon=0, release_date=NULL, row kept) so manually
 * managed stream/rent/buy rows are left untouched.
 */
class StreamingSyncService
{
    private const TYPE_STREAMING = MovieRelease::TYPE_STREAMING;
    private const COUNTRY_ID = 'ID';

    /**
     * Normalized service name -> Service id, for streaming services only.
     */
    private array $streamingByName = [];

    public function __construct()
    {
        foreach (Service::where('type', 'streaming')->get() as $service) {
            $this->streamingByName[$this->normalize($service->name)] = $service->id;
        }
    }

    /**
     * Re-sync streaming movie_services for a single movie based on its current
     * Indonesian streaming movie_releases. Returns a list of unhandled platform
     * names found in movie_releases.name that matched no known streaming service.
     *
     * @return string[]
     */
    public function syncMovie(Movie $movie): array
    {
        $unhandled = [];

        $streamingReleases = $movie->movieReleases()
            ->where('type', self::TYPE_STREAMING)
            ->where('country_code', self::COUNTRY_ID)
            ->get();

        $today = now()->toDateString();

        $handledServiceIds = [];

        // Group by platform so multiple release rows for the same platform
        // (e.g. a past + a future date) resolve deterministically: any future
        // date -> earliest one wins (coming soon); otherwise -> available now.
        $platforms = [];
        foreach ($streamingReleases as $release) {
            $key = $this->normalize($release->name ?? '');
            if (!isset($platforms[$key])) {
                $platforms[$key] = [];
            }
            $platforms[$key][] = $release;
        }

        foreach ($platforms as $platformName => $releases) {
            $serviceId = $this->streamingByName[$platformName] ?? null;

            if ($serviceId === null) {
                $unhandled[] = $releases[0]->name ?: '(empty name)';
                continue;
            }

            $handledServiceIds[] = $serviceId;

            $futureDates = collect($releases)
                ->pluck('release_date')
                ->filter()
                ->filter(fn($date) => $date->format('Y-m-d') > $today)
                ->sort();

            $earliestFuture = $futureDates->first();

            $movie->movieServices()->updateOrCreate(
                ['service_id' => $serviceId],
                [
                    'availability_type' => 'stream',
                    'release_date' => $earliestFuture ? $earliestFuture->format('Y-m-d') : null,
                    'is_coming_soon' => $earliestFuture ? 1 : 0,
                ]
            );
        }

        // Deactivate streaming platforms that were auto-synced (had a date or
        // were marked coming soon) but no longer have a matching release row.
        $movie->movieServices()
            ->whereHas('service', fn($q) => $q->where('type', 'streaming'))
            ->where(function ($q) {
                $q->whereNotNull('release_date')
                    ->orWhere('is_coming_soon', 1);
            })
            ->whereNotIn('service_id', $handledServiceIds)
            ->update([
                'release_date' => null,
                'is_coming_soon' => 0,
            ]);

        return array_values(array_unique($unhandled));
    }

    /**
     * Cron entry point: for every movie whose Indonesian streaming release
     * dates have naturally passed (no admin re-save), clear the stale date so
     * the service reads as "available now". Returns the number of movies fixed.
     */
    public function syncAllPastDates(): int
    {
        $today = now()->toDateString();

        $movies = Movie::whereHas('movieReleases', function ($q) use ($today) {
            $q->where('type', self::TYPE_STREAMING)
                ->where('country_code', self::COUNTRY_ID)
                ->where('release_date', '<=', $today);
        })->with('movieReleases')->get();

        $fixed = 0;

        foreach ($movies as $movie) {
            $before = $movie->movieServices()
                ->whereHas('service', fn($q) => $q->where('type', 'streaming'))
                ->where(function ($q) {
                    $q->whereNotNull('release_date')->orWhere('is_coming_soon', 1);
                })
                ->count();

            $this->syncMovie($movie);

            $after = $movie->movieServices()
                ->whereHas('service', fn($q) => $q->where('type', 'streaming'))
                ->where(function ($q) {
                    $q->whereNotNull('release_date')->orWhere('is_coming_soon', 1);
                })
                ->count();

            if ($before !== $after) {
                $fixed++;
            }
        }

        return $fixed;
    }

    private function normalize(?string $name): string
    {
        return mb_strtolower(trim($name ?? ''));
    }
}
