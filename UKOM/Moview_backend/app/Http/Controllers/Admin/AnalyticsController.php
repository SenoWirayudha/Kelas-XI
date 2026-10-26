<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ActivityFeedService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function __construct(private readonly ActivityFeedService $activityFeed)
    {
    }

    public function index(Request $request)
    {
        return view('admin.analytics.index', $this->reportData($request));
    }

    /**
     * Sales report for the selected period (CSV, UTF-8 with BOM so Excel reads it correctly).
     */
    public function export(Request $request)
    {
        $period = $this->resolvePeriod($request);
        $rows = $this->salesRows($period['start'], $period['end']);

        $filename = 'penjualan_' . $period['start']->format('Ymd') . '_' . $period['end']->format('Ymd') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // BOM
            $eol = "\r\n";
            $write = function (array $fields) use ($out, $eol) {
                fputcsv($out, $fields, ',', '"', '\\', $eol);
            };

            // CSV-injection guard for user-generated text cells only.
            $guard = function (?string $v): string {
                $v = (string) $v;
                return ($v !== '' && in_array($v[0], ['=', '+', '-', '@'], true)) ? "'" . $v : $v;
            };

            $write([
                'Tanggal', 'Order ID', 'Bioskop', 'Film', 'Jam Tayang', 'Kursi',
                'Jumlah Tiket', 'Total', 'Kanal', 'Metode Bayar', 'Status',
            ]);

            foreach ($rows as $row) {
                $write([
                    $row->show_date,
                    $guard($row->order_code),
                    $guard($row->cinema_name),
                    $guard($row->movie_title),
                    substr((string) $row->show_time, 0, 5),
                    $row->seats,
                    (int) $row->ticket_count,
                    (float) $row->total_price,
                    $row->channel === 'offline' ? 'offline' : 'online',
                    $guard($this->paymentLabel($row->payment_type)),
                    $row->status,
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    // ---------------------------------------------------------------------
    // Period handling
    // ---------------------------------------------------------------------

    /**
     * Resolves the selected period plus the immediately preceding period of the same length.
     */
    private function resolvePeriod(Request $request): array
    {
        $period = (string) $request->get('period', '7d');
        $now = Carbon::now();

        switch ($period) {
            case 'today':
                $start = $now->copy()->startOfDay();
                $end = $now->copy()->endOfDay();
                break;

            case '30d':
                $start = $now->copy()->subDays(29)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;

            case 'custom':
                $start = $this->parseDate($request->get('start'), $now)->startOfDay();
                $end = $this->parseDate($request->get('end'), $now)->endOfDay();
                if ($end->lt($start)) {
                    [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
                }
                break;

            case '7d':
            default:
                $period = '7d';
                $start = $now->copy()->subDays(6)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
        }

        $days = (int) $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1;
        $days = max(1, $days);

        $prevEnd = $start->copy()->subSecond();
        $prevStart = $prevEnd->copy()->subDays($days - 1)->startOfDay();

        return [
            'period' => $period,
            'start' => $start,
            'end' => $end,
            'prevStart' => $prevStart,
            'prevEnd' => $prevEnd,
            'days' => $days,
        ];
    }

    private function parseDate(?string $value, Carbon $fallback): Carbon
    {
        try {
            return $value ? Carbon::parse($value) : $fallback->copy();
        } catch (\Throwable $e) {
            return $fallback->copy();
        }
    }

    // ---------------------------------------------------------------------
    // Report data
    // ---------------------------------------------------------------------

    private function reportData(Request $request): array
    {
        $p = $this->resolvePeriod($request);
        $start = $p['start'];
        $end = $p['end'];

        // ---- Existing metrics (kept as-is) ----
        $totalViews = DB::table('ratings')->count();

        $lastMonthViews = DB::table('ratings')
            ->whereBetween('created_at', [
                Carbon::now()->subMonth()->startOfMonth(),
                Carbon::now()->subMonth()->endOfMonth(),
            ])
            ->count();

        $currentMonthViews = DB::table('ratings')
            ->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()])
            ->count();

        $viewsChange = $lastMonthViews > 0
            ? (($currentMonthViews - $lastMonthViews) / $lastMonthViews) * 100
            : 0;

        $activeUsers = DB::table('users')->where('role', '!=', 'admin')->count();

        $reviewsPosted = DB::table('reviews')->where('status', 'published')->count();

        $lastMonthReviews = DB::table('reviews')
            ->where('status', 'published')
            ->whereBetween('created_at', [
                Carbon::now()->subMonth()->startOfMonth(),
                Carbon::now()->subMonth()->endOfMonth(),
            ])
            ->count();

        $currentMonthReviews = DB::table('reviews')
            ->where('status', 'published')
            ->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()])
            ->count();

        $reviewsChange = $lastMonthReviews > 0
            ? (($currentMonthReviews - $lastMonthReviews) / $lastMonthReviews) * 100
            : 0;

        // Top Films This Week (unchanged: most viewed via ratings)
        $topFilms = DB::table('ratings')
            ->join('movies', 'ratings.film_id', '=', 'movies.id')
            ->select('movies.id', 'movies.title', DB::raw('COUNT(*) as view_count'))
            ->whereBetween('ratings.created_at', [Carbon::now()->subWeek(), Carbon::now()])
            ->groupBy('movies.id', 'movies.title')
            ->orderByDesc('view_count')
            ->limit(5)
            ->get();

        $topFilmsWithChange = $topFilms->map(function ($film) {
            $previousWeekViews = DB::table('ratings')
                ->where('film_id', $film->id)
                ->whereBetween('created_at', [
                    Carbon::now()->subWeeks(2),
                    Carbon::now()->subWeek(),
                ])
                ->count();

            $change = 0;
            if ($previousWeekViews > 0) {
                $change = (($film->view_count - $previousWeekViews) / $previousWeekViews) * 100;
            } elseif ($film->view_count > 0) {
                $change = 100;
            }

            $film->change = $change;
            return $film;
        });

        // Views over time (last 7 days, unchanged)
        $viewsOverTime = [];
        for ($i = 6; $i >= 0; $i--) {
            $targetDate = Carbon::now()->subDays($i);
            $viewsOverTime[] = [
                'date' => $targetDate->format('M d'),
                'iso' => $targetDate->format('Y-m-d'),
                'count' => DB::table('ratings')->whereDate('created_at', $targetDate->format('Y-m-d'))->count(),
            ];
        }

        $recentActivities = $this->activityFeed->recent(10);

        // ---- New: ticket sales for the selected period ----
        $current = $this->salesTotals($start, $end);
        $previous = $this->salesTotals($p['prevStart'], $p['prevEnd']);

        $ticketStats = [
            'revenue' => $current['revenue'],
            'tickets' => $current['tickets'],
            'orders' => $current['orders'],
            'revenue_change' => $this->percentChange($previous['revenue'], $current['revenue']),
            'tickets_change' => $this->percentChange($previous['tickets'], $current['tickets']),
            'orders_change' => $this->percentChange($previous['orders'], $current['orders']),
        ];

        return [
            // existing
            'totalViews' => $totalViews,
            'viewsChange' => $viewsChange,
            'activeUsers' => $activeUsers,
            'reviewsPosted' => $reviewsPosted,
            'reviewsChange' => $reviewsChange,
            'topFilms' => $topFilmsWithChange,
            'viewsOverTime' => $viewsOverTime,
            'recentActivities' => $recentActivities,

            // period + new sections
            'period' => $p['period'],
            'periodStart' => $start,
            'periodEnd' => $end,
            'periodDays' => $p['days'],
            'ticketStats' => $ticketStats,
            'revenueOverTime' => $this->revenueOverTime($start, $end),
            'cinemaRanking' => $this->cinemaRanking($start, $end),
            'topFilmsByTickets' => $this->topFilmsByTickets($start, $end, 5),
            'topFilmsLastWeek' => $this->topFilmsByTickets(
                Carbon::now()->subDays(6)->startOfDay(),
                Carbon::now()->endOfDay(),
                5
            ),
            'socialTrend' => $this->socialTrend($start, $end),
        ];
    }

    private function percentChange(float $previous, float $current): ?float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : null;
        }

        return (($current - $previous) / $previous) * 100;
    }

    /** Revenue / tickets / orders for paid orders created inside the window. */
    private function salesTotals(Carbon $start, Carbon $end): array
    {
        $base = DB::table('orders')
            ->where('status', 'paid')
            ->whereBetween('created_at', [$start, $end]);

        return [
            'revenue' => (float) (clone $base)->sum('total_price'),
            'orders' => (int) (clone $base)->count(),
            'tickets' => (int) DB::table('tickets')
                ->join('orders', 'orders.id', '=', 'tickets.order_id')
                ->where('orders.status', 'paid')
                ->whereBetween('orders.created_at', [$start, $end])
                ->count(),
        ];
    }

    /** Per-day revenue split by channel, with a zero-filled day list. */
    private function revenueOverTime(Carbon $start, Carbon $end): array
    {
        $rows = DB::table('orders')
            ->selectRaw('DATE(created_at) as day, channel, SUM(total_price) as revenue')
            ->where('status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('day', 'channel')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $key = (string) $row->day;
            $channel = $row->channel === 'offline' ? 'offline' : 'online';
            $map[$key][$channel] = (float) $row->revenue;
        }

        $days = [];
        $cursor = $start->copy()->startOfDay();
        $last = $end->copy()->startOfDay();
        while ($cursor->lte($last)) {
            $key = $cursor->format('Y-m-d');
            $days[] = [
                'iso' => $key,
                'label' => $cursor->format('d M'),
                'online' => $map[$key]['online'] ?? 0.0,
                'offline' => $map[$key]['offline'] ?? 0.0,
            ];
            $cursor->addDay();
        }

        return $days;
    }

    /** Cinema ranking: revenue, tickets sold and average seat occupancy for the period. */
    private function cinemaRanking(Carbon $start, Carbon $end): array
    {
        $revenue = DB::table('orders')
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->join('cinemas', 'cinemas.id', '=', 'studios.cinema_id')
            ->selectRaw('cinemas.id as cinema_id, cinemas.cinema_name, SUM(orders.total_price) as revenue')
            ->where('orders.status', 'paid')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('cinemas.id', 'cinemas.cinema_name')
            ->get()
            ->keyBy('cinema_id');

        $tickets = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->selectRaw('studios.cinema_id, COUNT(*) as tickets')
            ->where('orders.status', 'paid')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('studios.cinema_id')
            ->pluck('tickets', 'cinema_id');

        // Capacity of every show that actually played in the window.
        $capacity = DB::table('schedules')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->selectRaw('studios.cinema_id, SUM(studios.total_seats) as capacity')
            ->whereBetween('schedules.show_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('studios.cinema_id')
            ->pluck('capacity', 'cinema_id');

        return $revenue->map(function ($row) use ($tickets, $capacity) {
            $sold = (int) ($tickets[$row->cinema_id] ?? 0);
            $seats = (int) ($capacity[$row->cinema_id] ?? 0);

            return [
                'cinema_id' => (int) $row->cinema_id,
                'cinema_name' => $row->cinema_name,
                'revenue' => (float) $row->revenue,
                'tickets' => $sold,
                'occupancy' => $seats > 0 ? min(100, ($sold / $seats) * 100) : 0.0,
            ];
        })->sortByDesc('revenue')->values()->all();
    }

    /** Top films by tickets sold inside the window. */
    private function topFilmsByTickets(Carbon $start, Carbon $end, int $limit): array
    {
        return DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('movies', 'movies.id', '=', 'schedules.movie_id')
            ->selectRaw('movies.id, movies.title, COUNT(*) as tickets')
            ->where('orders.status', 'paid')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('movies.id', 'movies.title')
            ->orderByDesc('tickets')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'title' => $row->title,
                'tickets' => (int) $row->tickets,
            ])
            ->all();
    }

    /** Daily review/like counts plus the period's average rating. */
    private function socialTrend(Carbon $start, Carbon $end): array
    {
        $reviews = DB::table('reviews')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('status', 'published')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('day')
            ->pluck('total', 'day');

        $likes = DB::table('review_likes')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('day')
            ->pluck('total', 'day');

        $days = [];
        $cursor = $start->copy()->startOfDay();
        $last = $end->copy()->startOfDay();
        while ($cursor->lte($last)) {
            $key = $cursor->format('Y-m-d');
            $days[] = [
                'iso' => $key,
                'label' => $cursor->format('d M'),
                'reviews' => (int) ($reviews[$key] ?? 0),
                'likes' => (int) ($likes[$key] ?? 0),
            ];
            $cursor->addDay();
        }

        $averageRating = DB::table('reviews')
            ->where('status', 'published')
            ->whereBetween('created_at', [$start, $end])
            ->avg('rating');

        return [
            'days' => $days,
            'total_reviews' => array_sum(array_column($days, 'reviews')),
            'total_likes' => array_sum(array_column($days, 'likes')),
            'average_rating' => $averageRating !== null ? (float) $averageRating : null,
        ];
    }

    /** One row per paid order, used by the CSV export. */
    private function salesRows(Carbon $start, Carbon $end)
    {
        $orders = DB::table('orders')
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('movies', 'movies.id', '=', 'schedules.movie_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->join('cinemas', 'cinemas.id', '=', 'studios.cinema_id')
            ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
            ->select([
                'orders.id',
                'orders.order_code',
                'orders.total_price',
                'orders.channel',
                'orders.status',
                'cinemas.cinema_name',
                'movies.title as movie_title',
                'schedules.show_date',
                'schedules.show_time',
                'payments.payment_type',
            ])
            ->where('orders.status', 'paid')
            ->whereBetween('orders.created_at', [$start, $end])
            ->orderBy('orders.created_at')
            ->get();

        if ($orders->isEmpty()) {
            return $orders;
        }

        $ids = $orders->pluck('id')->all();

        $seats = DB::table('order_seats')
            ->join('seats', 'seats.id', '=', 'order_seats.seat_id')
            ->whereIn('order_seats.order_id', $ids)
            ->select('order_seats.order_id', 'seats.seat_code')
            ->get()
            ->groupBy('order_id')
            ->map(fn ($rows) => $rows->pluck('seat_code')->filter()->implode(', '));

        $ticketCounts = DB::table('tickets')
            ->whereIn('order_id', $ids)
            ->selectRaw('order_id, COUNT(*) as total')
            ->groupBy('order_id')
            ->pluck('total', 'order_id');

        return $orders->map(function ($row) use ($seats, $ticketCounts) {
            $row->show_date = $row->show_date ? Carbon::parse($row->show_date)->format('Y-m-d') : '';
            $row->seats = $seats[$row->id] ?? '';
            $row->ticket_count = (int) ($ticketCounts[$row->id] ?? 0);
            return $row;
        });
    }

    private function paymentLabel(?string $type): string
    {
        $type = strtolower((string) $type);

        return match ($type) {
            '' => '-',
            'bank_transfer' => 'Bank Transfer',
            'gopay' => 'GoPay',
            'shopeepay' => 'ShopeePay',
            'qris' => 'QRIS',
            'credit_card' => 'Credit Card',
            'cash' => 'Tunai',
            default => ucwords(str_replace('_', ' ', $type)),
        };
    }
}
