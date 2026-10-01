<?php

namespace App\Services;

use Carbon\CarbonImmutable;

/**
 * Single source of truth for streaming availability resolution + status.
 *
 * Tri-state semantics on movie_service_countries.is_coming_soon:
 *   - NULL  => inherit BOTH is_coming_soon and available_from from the type
 *              default (movie_services row); available_from on the pivot row
 *              is ignored.
 *   - 0 / 1 => per-country override active; available_from comes from the
 *              pivot row itself (NULL = no date).
 *
 * Status rule (effective values, application timezone for "today"):
 *   - effective date filled  => date > today ? coming_soon : available
 *                               (the coming_soon flag is ignored)
 *   - effective date empty   => effective flag decides (true => coming_soon)
 *
 * Returned is_coming_soon is always (status === 'coming_soon'), never the raw
 * effective flag, so legacy API consumers stay consistent with status.
 */
class AvailabilityResolver
{
    /**
     * @param  bool|null      $rowComingSoon     pivot.is_coming_soon (NULL = inherit)
     * @param  string|null    $rowAvailableFrom  pivot.available_from
     * @param  bool           $globalComingSoon  type default (movie_services.is_coming_soon)
     * @param  string|null    $globalAvailableFrom type default (movie_services.release_date)
     * @return array{available_from: ?string, is_coming_soon: bool, status: string}
     */
    public static function resolve(
        ?bool $rowComingSoon,
        ?string $rowAvailableFrom,
        bool $globalComingSoon,
        ?string $globalAvailableFrom
    ): array {
        if ($rowComingSoon === null) {
            $comingSoon = $globalComingSoon;
            $availableFrom = $globalAvailableFrom;
        } else {
            $comingSoon = $rowComingSoon;
            $availableFrom = $rowAvailableFrom;
        }

        $status = self::status($availableFrom, $comingSoon);

        return [
            'available_from' => $availableFrom,
            // Legacy field: MUST equal (status === 'coming_soon') so consumers
            // reading only is_coming_soon never contradict the status rule
            // (e.g. flag=1 + past effective date => status=available).
            'is_coming_soon' => $status === 'coming_soon',
            'status' => $status,
        ];
    }

    /**
     * Status for a pair of effective values.
     * Date filled => future date wins over the flag; empty date => flag decides.
     */
    public static function status(?string $availableFrom, bool $comingSoon): string
    {
        if ($availableFrom !== null && $availableFrom !== '') {
            $today = CarbonImmutable::today()->toDateString(); // app timezone (Asia/Jakarta)
            return $availableFrom > $today ? 'coming_soon' : 'available';
        }

        return $comingSoon ? 'coming_soon' : 'available';
    }
}
