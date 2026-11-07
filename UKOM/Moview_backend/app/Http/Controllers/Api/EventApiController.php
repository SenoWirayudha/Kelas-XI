<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use App\Models\Schedule;
use App\Models\Studio;
use App\Support\FestivalSchedule;
use Illuminate\Support\Facades\DB;

/**
 * Festival events for the mobile app.
 *
 * A session is a schedule row tagged with event_id; its films live in schedule_movies.
 * Only published events that have not ended yet are exposed.
 */
class EventApiController extends Controller
{
    /** GET /api/v1/events — published, not finished yet. */
    public function index()
    {
        $events = Event::with('cinema')
            ->where('is_published', true)
            ->where('end_date', '>=', FestivalSchedule::today())
            // Ongoing first, then upcoming by the nearest start date.
            ->orderByRaw('CASE WHEN start_date <= ? THEN 0 ELSE 1 END', [FestivalSchedule::today()])
            ->orderBy('start_date')
            ->get()
            ->map(function (Event $event) {
                $sessions = Schedule::with('studio')
                    ->where('event_id', $event->id)
                    ->where('status', 'active')
                    ->get();

                $prices = [];
                foreach ($sessions as $session) {
                    $range = $this->sessionPriceRange($session);
                    if ($range !== null) {
                        $prices[] = $range['min'];
                    }
                }

                return [
                    'id' => $event->id,
                    'judul' => $event->title,
                    'deskripsi' => $event->description,
                    'banner_url' => $this->mediaUrl($event->banner),
                    'tanggal_mulai' => $event->start_date->format('Y-m-d'),
                    'tanggal_selesai' => $event->end_date->format('Y-m-d'),
                    'nama_bioskop' => $event->cinema?->cinema_name,
                    'harga_mulai' => $prices ? (float) min($prices) : null,
                    // Server clock (WIB): coming_soon before the start date, berlangsung otherwise.
                    'status_event' => $this->eventStatus($event),
                    'sale_starts_at' => $event->sale_starts_at?->format('Y-m-d H:i:s'),
                    'penjualan_dibuka' => $this->salesOpen($event),
                ];
            });

        return response()->json(['success' => true, 'data' => $events]);
    }

    /** coming_soon | berlangsung, evaluated on the server clock (WIB). */
    private function eventStatus(Event $event): string
    {
        return $event->start_date->format('Y-m-d') > FestivalSchedule::today()
            ? 'coming_soon'
            : 'berlangsung';
    }

    /** True when ticket sales have started (or no sale window is configured). */
    private function salesOpen(Event $event): bool
    {
        if (!$event->sale_starts_at) {
            return true;
        }

        return FestivalSchedule::now()->greaterThanOrEqualTo(
            FestivalSchedule::parse($event->sale_starts_at->format('Y-m-d H:i:s'))
        );
    }

    /** GET /api/v1/events/{id} — event + sessions with their films. */
    public function show($id)
    {
        $event = Event::with('cinema')->find($id);

        if (!$event || !$event->is_published) {
            return response()->json(['success' => false, 'message' => 'Event tidak ditemukan.'], 404);
        }

        $sessions = Schedule::with(['studio', 'festivalMovies', 'movie'])
            ->where('event_id', $event->id)
            ->orderBy('show_date')
            ->orderBy('show_time')
            ->get()
            // $event must be captured: the session status depends on its sale_starts_at.
            ->map(function (Schedule $session) use ($event) {
                $isSurprise = (bool) $session->is_surprise;
                $films = $isSurprise ? collect() : $session->festivalMovies;
                $range = $this->sessionPriceRange($session);

                // Surprise: own duration column wins; legacy rows fall back to the line-up.
                $duration = $isSurprise
                    ? $session->sessionDuration()
                    : (int) $films->sum(fn ($film) => (int) $film->duration);
                if (!$isSurprise && $duration <= 0 && $session->movie) {
                    $duration = (int) $session->movie->duration;
                }

                // LSF classification comes from the session itself (not the film rating).
                $age = $session->age_rating ?: null;

                $firstFilm = $isSurprise ? null : ($films->first() ?: $session->movie);

                return [
                    'id' => $session->id,
                    'starts_at' => $session->startsAt()->format('Y-m-d H:i:s'),
                    'judul_sesi' => $isSurprise
                        ? ($session->session_title ?: 'Film Kejutan')
                        : $session->session_title,
                    'poster_url' => $this->mediaUrl(
                        $isSurprise
                            ? $session->poster_path
                            : ($session->poster_path ?: $firstFilm?->default_poster_path)
                    ),
                    'durasi_total_menit' => $duration,
                    'usia' => $age,
                    'is_surprise' => $isSurprise,
                    'films' => $films->map(fn ($film) => [
                        'judul' => $film->title,
                        'sinopsis' => $film->synopsis,
                        'poster_url' => $this->mediaUrl($film->default_poster_path),
                    ])->values(),
                    'harga_min' => $range['min'] ?? null,
                    'harga_maks' => $range['max'] ?? null,
                    'sold_out' => $this->isSoldOut($session),
                    // Server-computed (WIB clock), so a device with a wrong clock cannot buy.
                    'status' => $this->sessionStatus($session, $event),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $event->id,
                'judul' => $event->title,
                'deskripsi' => $event->description,
                'banner_url' => $this->mediaUrl($event->banner),
                'tanggal_mulai' => $event->start_date->format('Y-m-d'),
                'tanggal_selesai' => $event->end_date->format('Y-m-d'),
                'nama_bioskop' => $event->cinema?->cinema_name,
                'sale_starts_at' => $event->sale_starts_at?->format('Y-m-d H:i:s'),
                'penjualan_dibuka' => $this->salesOpen($event),
                'status_event' => $this->eventStatus($event),
                'sessions' => $sessions,
            ],
        ]);
    }

    /**
     * GET /api/v1/events/sessions/{sessionId}/status
     * Lightweight re-check before opening the seat picker.
     */
    public function sessionStatusCheck($sessionId)
    {
        $session = Schedule::with('studio')->find($sessionId);

        if (!$session || !$session->event_id) {
            return response()->json(['success' => false, 'message' => 'Sesi tidak ditemukan.'], 404);
        }

        $event = $session->event;
        $status = $this->sessionStatus($session, $event);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $session->id,
                'status' => $status,
                'tersedia' => $status === self::STATUS_AVAILABLE,
            ],
        ]);
    }

    public const STATUS_AVAILABLE = 'tersedia';
    public const STATUS_SOLD_OUT = 'sold_out';
    public const STATUS_NOT_OPEN = 'belum_dibuka';
    public const STATUS_FINISHED = 'selesai';

    /**
     * Availability of a session, evaluated on the server clock (WIB):
     *  - selesai      : schedule inactive, or the films (+gap) already ended
     *  - belum_dibuka : sales have not opened yet
     *  - sold_out     : every seat in the quota is already taken
     *  - tersedia     : buyable
     */
    private function sessionStatus(Schedule $session, ?Event $event): string
    {
        if ($session->status !== 'active') {
            return self::STATUS_FINISHED;
        }

        $now = FestivalSchedule::now();

        if ($now->greaterThanOrEqualTo($session->endsAt())) {
            return self::STATUS_FINISHED;
        }

        if ($event?->sale_starts_at && $now->lessThan($event->sale_starts_at)) {
            return self::STATUS_NOT_OPEN;
        }

        if ($this->isSoldOut($session)) {
            return self::STATUS_SOLD_OUT;
        }

        return self::STATUS_AVAILABLE;
    }

    /** Price range for a session: base price + surcharges of the seat types in use. */
    private function sessionPriceRange(Schedule $session): ?array
    {
        $studio = $session->studio;
        $base = (int) round((float) $session->ticket_price);

        if (!$studio) {
            return ['min' => $base, 'max' => $base];
        }

        $usedTypes = $studio->seats()
            ->whereNotNull('seat_type')
            ->select('seat_type')
            ->distinct()
            ->pluck('seat_type')
            ->all();

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

    /** Sold out when the paid/occupied seats reach the session quota. */
    private function isSoldOut(Schedule $session): bool
    {
        $quota = (int) ($session->quota ?? $session->studio?->total_seats ?? 0);
        if ($quota <= 0) {
            return false;
        }

        $taken = DB::table('order_seats')
            ->join('orders', 'orders.id', '=', 'order_seats.order_id')
            ->where('order_seats.schedule_id', $session->id)
            ->whereIn('orders.status', Order::OCCUPYING_STATUSES)
            ->count();

        return $taken >= $quota;
    }

    private function mediaUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : url('storage/' . $path);
    }
}
