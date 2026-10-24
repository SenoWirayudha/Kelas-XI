<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ManagerStatsController extends Controller
{
    public function index(Request $request)
    {
        $cinemaId = (int) session('admin_cinema_id');

        abort_if($cinemaId <= 0, 403, 'Akun Anda belum terhubung ke bioskop.');

        $today = now('Asia/Jakarta')->startOfDay();
        $period = (string) $request->query('period', 'today');
        $customDate = $request->query('date');

        $start = $today->copy();
        $end = $today->copy();
        $periodLabel = 'Hari ini';

        if ($period === '7') {
            $start = $today->copy()->subDays(6);
            $periodLabel = '7 hari terakhir';
        } elseif ($period === '30') {
            $start = $today->copy()->subDays(29);
            $periodLabel = '30 hari terakhir';
        } elseif ($period === 'custom') {
            $validCustomDate = is_string($customDate)
                && preg_match('/^\d{4}-\d{2}-\d{2}$/', $customDate)
                && Carbon::hasFormat($customDate, 'Y-m-d');

            if ($validCustomDate) {
                $start = Carbon::createFromFormat('Y-m-d', $customDate, 'Asia/Jakarta')->startOfDay();
                $end = $start->copy();
                $periodLabel = $start->locale('id')->isoFormat('D MMMM Y');
            } else {
                $period = 'today';
                $customDate = null;
            }
        }

        $endExclusive = $end->copy()->addDay();

        $orders = Order::query()
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->where('studios.cinema_id', $cinemaId)
            ->where('orders.status', 'paid')
            ->where('orders.created_at', '>=', $start)
            ->where('orders.created_at', '<', $endExclusive);

        $totalRevenue = (int) (clone $orders)->sum('orders.total_price');
        $ordersCount = (int) (clone $orders)->count('orders.id');
        $ticketsSold = (int) (clone $orders)
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->count('tickets.id');

        $onlineOrders = (int) (clone $orders)->where('orders.channel', Order::CHANNEL_ONLINE)->count('orders.id');
        $offlineOrders = (int) (clone $orders)->where('orders.channel', Order::CHANNEL_OFFLINE)->count('orders.id');
        $onlineRevenue = (int) (clone $orders)->where('orders.channel', Order::CHANNEL_ONLINE)->sum('orders.total_price');
        $offlineRevenue = (int) (clone $orders)->where('orders.channel', Order::CHANNEL_OFFLINE)->sum('orders.total_price');

        $revenueTrend = $this->revenueTrend($orders, $start, $end);
        $peakHours = $this->peakHours($orders);
        $topFilms = $this->topFilms($orders);
        $paymentBreakdown = $this->paymentBreakdown($orders, $ordersCount);
        $occupancy = $this->occupancy($cinemaId, $start, $end);

        return view('manager.stats.index', [
            'period' => $period,
            'periodLabel' => $periodLabel,
            'start' => $start,
            'end' => $end,
            'customDate' => $customDate,
            'totalRevenue' => $totalRevenue,
            'ordersCount' => $ordersCount,
            'ticketsSold' => $ticketsSold,
            'onlineOrders' => $onlineOrders,
            'offlineOrders' => $offlineOrders,
            'onlineRevenue' => $onlineRevenue,
            'offlineRevenue' => $offlineRevenue,
            'revenueTrend' => $revenueTrend,
            'peakHours' => $peakHours,
            'topFilms' => $topFilms,
            'paymentBreakdown' => $paymentBreakdown,
            'occupancy' => $occupancy,
        ]);
    }

    private function revenueTrend($orders, Carbon $start, Carbon $end)
    {
        $rows = (clone $orders)
            ->selectRaw('DATE(orders.created_at) as report_date, orders.channel, SUM(orders.total_price) as revenue')
            ->groupByRaw('DATE(orders.created_at), orders.channel')
            ->get();

        $byDate = [];

        foreach ($rows as $row) {
            $date = (string) $row->report_date;
            $byDate[$date][$row->channel] = (int) $row->revenue;
        }

        $days = collect();
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $key = $cursor->toDateString();
            $online = $byDate[$key][Order::CHANNEL_ONLINE] ?? 0;
            $offline = $byDate[$key][Order::CHANNEL_OFFLINE] ?? 0;

            $days->push([
                'date' => $cursor->copy(),
                'label' => $cursor->locale('id')->isoFormat('D MMM'),
                'full_label' => $cursor->locale('id')->isoFormat('dddd, D MMMM Y'),
                'online' => $online,
                'offline' => $offline,
                'total' => $online + $offline,
            ]);

            $cursor->addDay();
        }

        return [
            'days' => $days,
            'max' => max(1, (int) $days->max('total')),
        ];
    }

    private function peakHours($orders)
    {
        $rows = (clone $orders)
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->selectRaw('EXTRACT(HOUR FROM orders.created_at) AS hour, COUNT(tickets.id) AS tickets')
            ->groupByRaw('EXTRACT(HOUR FROM orders.created_at)')
            ->get()
            ->keyBy(fn ($row) => (int) $row->hour);

        $hours = collect(range(0, 23))->map(function (int $hour) use ($rows) {
            $row = $rows->get($hour);

            return [
                'hour' => $hour,
                'label' => str_pad((string) $hour, 2, '0', STR_PAD_LEFT),
                'tickets' => (int) ($row?->tickets ?? 0),
            ];
        });

        return [
            'hours' => $hours,
            'max' => max(1, (int) $hours->max('tickets')),
        ];
    }

    private function topFilms($orders)
    {
        $films = (clone $orders)
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->join('movies', 'movies.id', '=', 'schedules.movie_id')
            ->selectRaw('movies.id, movies.title, COUNT(tickets.id) AS tickets_sold')
            ->groupBy('movies.id', 'movies.title')
            ->orderByDesc('tickets_sold')
            ->limit(5)
            ->get();

        $revenues = (clone $orders)
            ->whereIn('schedules.movie_id', $films->pluck('id'))
            ->selectRaw('schedules.movie_id, SUM(orders.total_price) AS revenue')
            ->groupBy('schedules.movie_id')
            ->pluck('revenue', 'movie_id');

        return $films->each(function ($film) use ($revenues) {
            $film->revenue = (int) ($revenues[$film->id] ?? 0);
        });
    }

    private function paymentBreakdown($orders, int $ordersCount)
    {
        $categorySql = "
            CASE
                WHEN payments.id IS NULL OR LOWER(payments.payment_type) = 'cash' THEN 'cash'
                WHEN LOWER(payments.payment_type) IN ('credit_card', 'card', 'debit_card') THEN 'card'
                WHEN LOWER(payments.payment_type) IN ('gopay', 'shopeepay', 'qris', 'e-wallet', 'ewallet', 'e_wallet', 'ovo', 'dana') THEN 'ewallet'
                ELSE 'other'
            END
        ";

        $rows = (clone $orders)
            ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
            ->selectRaw($categorySql . ' AS category, COUNT(*) AS orders_count, SUM(orders.total_price) AS revenue')
            ->groupByRaw($categorySql)
            ->get()
            ->keyBy('category');

        $definitions = [
            'cash' => 'Tunai',
            'card' => 'Kartu',
            'ewallet' => 'E-wallet / QRIS',
            'other' => 'Lainnya',
        ];

        return collect($definitions)->map(function (string $label, string $key) use ($rows, $ordersCount) {
            $row = $rows->get($key);
            $count = (int) ($row?->orders_count ?? 0);

            return [
                'key' => $key,
                'label' => $label,
                'orders' => $count,
                'revenue' => (int) ($row?->revenue ?? 0),
                'percentage' => $ordersCount > 0 ? round(($count / $ordersCount) * 100, 1) : 0,
            ];
        })->values();
    }

    private function occupancy(int $cinemaId, Carbon $start, Carbon $end): float
    {
        $schedules = Schedule::query()
            ->with('studio')
            ->whereHas('studio', fn ($query) => $query->where('cinema_id', $cinemaId))
            ->whereBetween('show_date', [$start->toDateString(), $end->toDateString()])
            ->withCount([
                'orderSeats as sold_seats' => fn ($query) => $query
                    ->whereHas('order', fn ($orderQuery) => $orderQuery->where('status', 'paid')),
            ])
            ->get();

        $totalSeats = (int) $schedules->sum(fn (Schedule $schedule) => (int) ($schedule->studio?->total_seats ?? 0));
        $soldSeats = (int) $schedules->sum('sold_seats');

        return $totalSeats > 0 ? round(($soldSeats / $totalSeats) * 100, 1) : 0.0;
    }
}
