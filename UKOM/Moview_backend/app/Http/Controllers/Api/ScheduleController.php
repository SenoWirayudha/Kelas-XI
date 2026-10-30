<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Support\ScheduleRules;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    /**
     * GET /api/v1/schedules?movie_id=1
     * Returns all upcoming schedules for the given movie.
     */
    /**
     * Seat price range for a schedule: base price + the surcharge of every seat type that is
     * actually used in the studio (identical rule to the admin price preview).
     */
    private function seatPriceRange(Schedule $schedule): array
    {
        $base = (int) round((float) $schedule->ticket_price);
        $studio = $schedule->studio;

        if (!$studio) {
            return ['min' => $base, 'max' => $base];
        }

        $usedTypes = $studio->getAttribute('used_seat_types');
        if ($usedTypes === null) {
            $usedTypes = $studio->seats()
                ->whereNotNull('seat_type')
                ->select('seat_type')
                ->distinct()
                ->pluck('seat_type')
                ->all();
        }

        $prices = [];
        foreach ($studio->sellableTypeKeys() as $key) {
            if (!in_array($key, $usedTypes, true)) {
                continue;
            }
            $prices[] = $base + $studio->priceSurchargeFor($key);
        }

        if (!$prices) {
            return ['min' => $base, 'max' => $base];
        }

        return ['min' => min($prices), 'max' => max($prices)];
    }

    public function index(Request $request)
    {
        $request->validate([
            'movie_id' => 'required|integer|exists:movies,id',
        ]);

        $schedules = Schedule::with(['studio.cinema.service'])
            ->where('movie_id', $request->movie_id)
            ->where('show_date', '>=', now()->toDateString())
            ->orderBy('show_date')
            ->orderBy('show_time')
            ->get()
            // Seat types actually painted in each studio (same rule as the web price preview).
            ->each(function (Schedule $s) {
                if ($s->studio) {
                    $s->studio->setAttribute('used_seat_types', $s->studio->seats()
                        ->whereNotNull('seat_type')
                        ->select('seat_type')
                        ->distinct()
                        ->pluck('seat_type')
                        ->all());
                }
            })
            ->map(function (Schedule $s) {
                $priceRange = $this->seatPriceRange($s);

                return [
                'schedule_id'     => $s->id,
                'cinema_name'     => $s->studio->cinema->cinema_name,
                'cinema_location' => trim($s->studio->cinema->city . ', ' . $s->studio->cinema->address, ', '),
            'service_name'    => $s->studio->cinema->service->name ?? null,
                'studio_name'     => $s->studio->studio_name,
                'studio_type'     => $s->studio->studio_type,
                'status'          => ScheduleRules::effectiveStatus($s, 'online'),
                'is_open'         => ScheduleRules::isOnlineOpen($s),
                'show_date'       => $s->show_date->format('Y-m-d'),
                'show_time'       => $s->show_time,
                // "Mulai dari": base price + the cheapest surcharge in that studio.
                'ticket_price'    => (float) $priceRange['min'],
                'base_price'      => (float) $s->ticket_price,
                // Full range for studios whose seat types cost different amounts.
                'price_min'       => (float) $priceRange['min'],
                'price_max'       => (float) $priceRange['max'],
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $schedules,
        ]);
    }
}
