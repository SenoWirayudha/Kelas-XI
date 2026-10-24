<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\StaffAttendance;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DailyStatsController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $staffId = (int) session('admin_user_id');
        $cinemaId = (int) session('admin_cinema_id');
        $today = now('Asia/Jakarta')->startOfDay();

        $date = isset($validated['date'])
            ? Carbon::createFromFormat('Y-m-d', $validated['date'], 'Asia/Jakarta')->startOfDay()
            : $today->copy();

        $stats = $this->statsForDate($staffId, $cinemaId, $date);

        $lastSevenDays = collect(range(6, 0))
            ->map(function (int $offset) use ($staffId, $cinemaId, $today) {
                $day = $today->copy()->subDays($offset);

                return array_merge(
                    ['date' => $day],
                    $this->statsForDate($staffId, $cinemaId, $day)
                );
            })
            ->values();

        return view('staff.stats.index', [
            'date' => $date,
            'today' => $today,
            'stats' => $stats,
            'lastSevenDays' => $lastSevenDays,
        ]);
    }

    private function statsForDate(int $staffId, int $cinemaId, Carbon $date): array
    {
        $orders = $this->ordersQuery($staffId, $cinemaId, $date);

        $totalRevenue = (int) (clone $orders)->sum('orders.total_price');

        $cashRevenue = (int) (clone $orders)
            ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
            ->where(function ($query) {
                $query->whereNull('payments.id')
                    ->orWhereRaw('LOWER(payments.payment_type) = ?', ['cash']);
            })
            ->sum('orders.total_price');

        $ticketsSold = (int) (clone $orders)
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->count('tickets.id');

        // The schema does not store which staff performed the scan, so this
        // counts scanned tickets on paid orders owned by the logged-in staff.
        $scannedTickets = (int) Ticket::query()
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->where('orders.staff_id', $staffId)
            ->where('studios.cinema_id', $cinemaId)
            ->where('orders.status', 'paid')
            ->whereDate('tickets.used_at', $date->toDateString())
            ->count('tickets.id');

        $attendance = StaffAttendance::query()
            ->where('staff_id', $staffId)
            ->where('cinema_id', $cinemaId)
            ->whereDate('tanggal', $date->toDateString())
            ->first();

        return [
            'orders' => (int) (clone $orders)->count('orders.id'),
            'tickets_sold' => $ticketsSold,
            'revenue' => $totalRevenue,
            'cash_revenue' => $cashRevenue,
            'non_cash_revenue' => max(0, $totalRevenue - $cashRevenue),
            'scanned_tickets' => $scannedTickets,
            'attendance' => $attendance,
            'duration_minutes' => $attendance?->durationMinutes(),
        ];
    }

    private function ordersQuery(int $staffId, int $cinemaId, Carbon $date)
    {
        return Order::query()
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->where('orders.staff_id', $staffId)
            ->where('studios.cinema_id', $cinemaId)
            ->where('orders.status', 'paid')
            ->whereDate('orders.created_at', $date->toDateString());
    }
}
