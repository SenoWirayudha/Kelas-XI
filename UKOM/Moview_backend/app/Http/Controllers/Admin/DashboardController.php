<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Schedule;
use App\Models\StaffAttendance;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class DashboardController extends Controller
{
    public function manager()
    {
        $cinemaId = (int) $this->scopedCinemaId();
        $today = Carbon::today();
        $tomorrow = $today->copy()->addDay();
        $trendStart = $today->copy()->subDays(6);

        $paidToday = $this->paidOrdersInCinema($cinemaId)
            ->whereBetween('orders.created_at', [$today, $tomorrow]);

        $onlineRevenue = (int) (clone $paidToday)
            ->where('orders.channel', Order::CHANNEL_ONLINE)
            ->sum('orders.total_price');

        $offlineRevenue = (int) (clone $paidToday)
            ->where('orders.channel', Order::CHANNEL_OFFLINE)
            ->sum('orders.total_price');

        $revenueTrend = $this->revenueTrend($cinemaId, $trendStart, $tomorrow);

        $topFilms = $this->paidTicketsInCinema($cinemaId)
            ->whereBetween('orders.created_at', [$today, $tomorrow])
            ->join('movies', 'movies.id', '=', 'schedules.movie_id')
            ->selectRaw('movies.id, movies.title, COUNT(tickets.id) AS tickets_sold')
            ->groupBy('movies.id', 'movies.title')
            ->orderByDesc('tickets_sold')
            ->limit(5)
            ->get();

        $schedules = $this->todaySchedules($cinemaId, $today);

        $latestOrders = $this->ordersInCinema($cinemaId)
            ->select('orders.*')
            ->with(['schedule.movie', 'schedule.studio', 'staff'])
            ->latest('orders.created_at')
            ->latest('orders.id')
            ->limit(5)
            ->get();

        return view('manager.dashboard', [
            'cinemaName' => session('admin_cinema_name'),
            'greeting' => $this->greeting(),
            'today' => $today,
            'revenueToday' => $onlineRevenue + $offlineRevenue,
            'onlineRevenue' => $onlineRevenue,
            'offlineRevenue' => $offlineRevenue,
            'ticketsToday' => (int) $this->paidTicketsInCinema($cinemaId)
                ->whereBetween('orders.created_at', [$today, $tomorrow])
                ->count('tickets.id'),
            'ordersToday' => (int) (clone $paidToday)->count('orders.id'),
            'onlineOrdersToday' => (int) (clone $paidToday)
                ->where('orders.channel', Order::CHANNEL_ONLINE)
                ->count('orders.id'),
            'offlineOrdersToday' => (int) (clone $paidToday)
                ->where('orders.channel', Order::CHANNEL_OFFLINE)
                ->count('orders.id'),
            'revenueTrend' => $revenueTrend,
            'revenueTrendMax' => max(1, (int) $revenueTrend->max('total')),
            'topFilms' => $topFilms,
            'topFilmMax' => max(1, (int) optional($topFilms->first())->tickets_sold),
            'schedules' => $schedules,
            'latestOrders' => $latestOrders,
        ]);
    }

    public function staff()
    {
        $cinemaId = (int) $this->scopedCinemaId();
        $staffId = (int) session('admin_user_id');
        $today = Carbon::today();
        $tomorrow = $today->copy()->addDay();

        $staffOrdersToday = $this->paidOrdersInCinema($cinemaId)
            ->where('orders.staff_id', $staffId)
            ->where('orders.channel', Order::CHANNEL_OFFLINE)
            ->whereBetween('orders.created_at', [$today, $tomorrow]);

        $attendanceToday = StaffAttendance::query()
            ->where('staff_id', $staffId)
            ->where('cinema_id', $cinemaId)
            ->whereDate('tanggal', $today->toDateString())
            ->first();

        return view('staff.dashboard', [
            'cinemaName' => session('admin_cinema_name'),
            'attendanceToday' => $attendanceToday,
            'greeting' => $this->greeting(),
            'today' => $today,
            'ticketsSoldToday' => (int) $this->paidTicketsInCinema($cinemaId)
                ->where('orders.staff_id', $staffId)
                ->whereBetween('orders.created_at', [$today, $tomorrow])
                ->count('tickets.id'),
            'cashToday' => (int) (clone $staffOrdersToday)->sum('orders.total_price'),
            'scannedToday' => (int) $this->paidTicketsInCinema($cinemaId)
                ->whereBetween('tickets.used_at', [$today, $tomorrow])
                ->count('tickets.id'),
            'schedules' => $this->todaySchedules($cinemaId, $today),
        ]);
    }

    private function ordersInCinema(int $cinemaId): Builder
    {
        return Order::query()
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->where('studios.cinema_id', $cinemaId);
    }

    private function paidOrdersInCinema(int $cinemaId): Builder
    {
        return $this->ordersInCinema($cinemaId)
            ->where('orders.status', 'paid');
    }

    private function paidTicketsInCinema(int $cinemaId): Builder
    {
        return Ticket::query()
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->where('studios.cinema_id', $cinemaId)
            ->where('orders.status', 'paid');
    }

    private function revenueTrend(int $cinemaId, Carbon $start, Carbon $end): \Illuminate\Support\Collection
    {
        $rows = $this->paidOrdersInCinema($cinemaId)
            ->where('orders.created_at', '>=', $start)
            ->where('orders.created_at', '<', $end)
            ->selectRaw('DATE(orders.created_at) AS report_date, orders.channel, SUM(orders.total_price) AS revenue')
            ->groupByRaw('DATE(orders.created_at), orders.channel')
            ->get();

        $byDate = [];
        foreach ($rows as $row) {
            $date = Carbon::parse($row->report_date)->toDateString();
            $byDate[$date][$row->channel] = (int) $row->revenue;
        }

        $days = collect();
        for ($offset = 6; $offset >= 0; $offset--) {
            $day = $start->copy()->addDays(6 - $offset);
            $key = $day->toDateString();
            $online = $byDate[$key][Order::CHANNEL_ONLINE] ?? 0;
            $offline = $byDate[$key][Order::CHANNEL_OFFLINE] ?? 0;

            $days->push([
                'date' => $day,
                'label' => $day->isoFormat('ddd'),
                'full_label' => $day->isoFormat('D MMM'),
                'online' => $online,
                'offline' => $offline,
                'total' => $online + $offline,
            ]);
        }

        return $days;
    }

    private function todaySchedules(int $cinemaId, Carbon $today): \Illuminate\Support\Collection
    {
        return Schedule::query()
            ->with(['movie', 'studio'])
            ->whereHas('studio', fn (Builder $query) => $query->where('cinema_id', $cinemaId))
            ->whereDate('show_date', $today->toDateString())
            ->where('status', '!=', 'cancelled')
            ->withCount([
                'orderSeats as sold_seats' => fn (Builder $query) => $query
                    ->whereHas('order', fn (Builder $orderQuery) => $orderQuery->where('status', 'paid')),
            ])
            ->orderBy('show_time')
            ->get()
            ->map(function (Schedule $schedule) {
                $totalSeats = max(0, (int) ($schedule->studio?->total_seats ?? 0));
                $soldSeats = (int) $schedule->sold_seats;

                $schedule->setAttribute('sold_seats', $soldSeats);
                $schedule->setAttribute('total_seats', $totalSeats);
                $schedule->setAttribute(
                    'occupancy',
                    $totalSeats > 0 ? min(100, (int) round(($soldSeats / $totalSeats) * 100)) : 0
                );

                return $schedule;
            });
    }

    private function greeting(): string
    {
        $hour = (int) now()->format('H');

        return match (true) {
            $hour < 11 => 'Selamat pagi',
            $hour < 15 => 'Selamat siang',
            $hour < 19 => 'Selamat sore',
            default => 'Selamat malam',
        };
    }
}
