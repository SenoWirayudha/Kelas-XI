<?php

namespace App\Services;

use App\Models\Movie;
use App\Models\MovieRelease;
use App\Models\MovieService;
use App\Models\Service;

/**
 * Derives the movie_services rows that follow from a movie's release track
 * (theatrical in Indonesia + streaming per platform).
 *
 * Two modes:
 *  - suggestions(): read-only. Returns the services the release track points to
 *    that the movie does not have yet. Used on EDIT so nothing changes without
 *    the admin clicking "Terapkan".
 *  - syncMovie(): applies those suggestions. Used on CREATE only. It never
 *    overwrites a row created/edited manually (source = manual); it only creates
 *    missing rows or refreshes rows it created itself (source = auto).
 *
 * Streaming rows (country_code=ID):
 *  - release_date <= today -> available now (release_date NULL, not coming soon)
 *  - release_date > today  -> coming soon on that date
 *
 * Theatrical rows (country_code=ID, future date) -> all cinema services with the
 * earliest future date; without a future date they are just deactivated.
 */
class StreamingSyncService
{
    private const TYPE_STREAMING = MovieRelease::TYPE_STREAMING;
    private const COUNTRY_ID = 'ID';

    /** Normalized service name -> Service model, streaming only. */
    private array $streamingByName = [];

    /** Theatrical service ids (cinemas). */
    private array $theatricalServiceIds = [];

    public function __construct()
    {
        foreach (Service::where('type', 'streaming')->get() as $service) {
            $this->streamingByName[$this->normalize($service->name)] = $service;
        }
        $this->theatricalServiceIds = Service::where('type', 'theatrical')->pluck('id')->all();
    }

    /**
     * Services detected from the release track that the movie does not have yet.
     *
     * @return array<int, array{service_id:int, name:string, type:string, availability_type:string, release_date:?string, is_coming_soon:bool}>
     */
    public function suggestions(Movie $movie): array
    {
        $existing = $movie->movieServices()->pluck('service_id')->map(fn ($id) => (int) $id)->all();
        $existing = array_flip($existing);

        $suggestions = [];
        $today = now()->toDateString();

        // --- Theatrical: one suggestion per cinema service, earliest future date ---
        $earliestFuture = $movie->movieReleases()
            ->where('type', MovieRelease::TYPE_THEATRICAL)
            ->where('country_code', self::COUNTRY_ID)
            ->where('release_date', '>', $today)
            ->min('release_date');

        if ($earliestFuture) {
            foreach ($this->theatricalServiceIds as $serviceId) {
                if (isset($existing[(int) $serviceId])) {
                    continue;
                }
                $service = Service::find($serviceId);
                if (!$service) {
                    continue;
                }
                $suggestions[] = [
                    'service_id' => (int) $serviceId,
                    'name' => $service->name,
                    'type' => 'theatrical',
                    'availability_type' => 'theatrical',
                    'release_date' => $earliestFuture,
                    'is_coming_soon' => true,
                ];
            }
        }

        // --- Streaming: one suggestion per platform, per platform resolution ---
        $streamingReleases = $movie->movieReleases()
            ->where('type', self::TYPE_STREAMING)
            ->where('country_code', self::COUNTRY_ID)
            ->get();

        $platforms = [];
        foreach ($streamingReleases as $release) {
            $platforms[$this->normalize($release->name ?? '')][] = $release;
        }

        foreach ($platforms as $platformName => $releases) {
            $service = $this->streamingByName[$platformName] ?? null;
            if ($service === null || isset($existing[(int) $service->id])) {
                continue;
            }

            $earliestFuture = collect($releases)
                ->pluck('release_date')
                ->filter()
                ->filter(fn ($date) => $date->format('Y-m-d') > $today)
                ->sort()
                ->first();

            $suggestions[] = [
                'service_id' => (int) $service->id,
                'name' => $service->name,
                'type' => 'streaming',
                'availability_type' => 'stream',
                'release_date' => $earliestFuture ? $earliestFuture->format('Y-m-d') : null,
                'is_coming_soon' => (bool) $earliestFuture,
            ];
        }

        return $suggestions;
    }

    /**
     * Applies the release-track state to movie_services.
     *
     * Only missing rows and rows with source=auto are written; a manual row is
     * never overwritten. Returns the streaming platform names found in the
     * release track that match no known service (never silently ignored).
     *
     * @param  array|null  $suggestions  Pre-computed suggestions (optional).
     * @return string[]
     */
    public function syncMovie(Movie $movie, ?array $suggestions = null): array
    {
        $suggestions ??= $this->suggestions($movie);

        $appliedServiceIds = [];

        foreach ($suggestions as $suggestion) {
            $serviceId = (int) $suggestion['service_id'];
            $appliedServiceIds[] = $serviceId;

            $existing = $movie->movieServices()->where('service_id', $serviceId)->first();
            if ($existing && $existing->source === MovieService::SOURCE_MANUAL) {
                continue;
            }

            $movie->movieServices()->updateOrCreate(
                ['service_id' => $serviceId],
                [
                    'availability_type' => $suggestion['availability_type'],
                    'release_date' => $suggestion['release_date'],
                    'is_coming_soon' => $suggestion['is_coming_soon'] ? 1 : 0,
                    'source' => MovieService::SOURCE_AUTO,
                ]
            );
        }

        // Deactivate auto rows whose release row disappeared. Manual rows are
        // left exactly as the admin saved them.
        $movie->movieServices()
            ->where('source', MovieService::SOURCE_AUTO)
            ->where(function ($q) {
                $q->whereNotNull('release_date')->orWhere('is_coming_soon', 1);
            })
            ->whereNotIn('service_id', $appliedServiceIds)
            ->update([
                'release_date' => null,
                'is_coming_soon' => 0,
            ]);

        // Streaming platforms in the release track that match no known service.
        $unhandled = [];
        foreach ($movie->movieReleases()
                     ->where('type', self::TYPE_STREAMING)
                     ->where('country_code', self::COUNTRY_ID)
                     ->get() as $release) {
            $name = trim((string) $release->name);
            if ($name === '') {
                continue;
            }
            if (!isset($this->streamingByName[$this->normalize($name)])) {
                $unhandled[$name] = $name;
            }
        }

        return array_values($unhandled);
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
                ->where('source', MovieService::SOURCE_AUTO)
                ->where(function ($q) {
                    $q->whereNotNull('release_date')->orWhere('is_coming_soon', 1);
                })
                ->count();

            $this->syncMovie($movie);

            $after = $movie->movieServices()
                ->where('source', MovieService::SOURCE_AUTO)
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
