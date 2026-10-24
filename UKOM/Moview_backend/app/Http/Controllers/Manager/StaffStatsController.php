<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\StaffAttendance;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class StaffStatsController extends Controller
{
    public function index(Request $request)
    {
        $cinemaId = (int) session('admin_cinema_id');
        abort_if($cinemaId <= 0, 403, 'Akun Anda belum terhubung ke bioskop.');

        $period = $this->resolvePeriod($request);
        [$start, $end, $periodName, $periodLabel, $customDate] = $period;
        $endExclusive = $end->copy()->addDay();

        $staff = User::query()
            ->where('role', User::ROLE_STAFF)
            ->where('cinema_id', $cinemaId)
            ->where('status', 'active')
            ->orderBy('username')
            ->get();

        $today = now('Asia/Jakarta')->startOfDay();
        $todayAttendance = StaffAttendance::query()
            ->where('cinema_id', $cinemaId)
            ->whereDate('tanggal', $today->toDateString())
            ->get()
            ->keyBy('staff_id');

        $rows = $staff->map(function (User $member) use ($cinemaId, $start, $endExclusive, $todayAttendance) {
            $stats = $this->statsForStaff($member->id, $cinemaId, $start, $endExclusive);
            $attendance = $todayAttendance->get($member->id);
            $duration = $attendance?->durationMinutes();

            return array_merge($stats, [
                'staff_id' => $member->id,
                'name' => $member->username,
                'email' => $member->email,
                'today_status' => $this->attendanceStatus($attendance),
                'today_duration' => $duration,
            ]);
        });

        $sort = (string) $request->query('sort', 'name');
        $direction = $request->query('dir') === 'desc' ? 'desc' : 'asc';
        $sortable = ['name', 'tickets', 'orders', 'revenue', 'scanned', 'attendance_days', 'hours'];

        if (! in_array($sort, $sortable, true)) {
            $sort = 'name';
        }

        $rows = $rows->sortBy(function (array $row) use ($sort) {
            return $sort === 'name' ? mb_strtolower($row['name']) : $row[$sort];
        }, SORT_REGULAR, $direction === 'desc')->values();

        return view('manager.staff-stats.index', [
            'rows' => $rows,
            'period' => $periodName,
            'periodLabel' => $periodLabel,
            'start' => $start,
            'end' => $end,
            'customDate' => $customDate,
            'sort' => $sort,
            'direction' => $direction,
            'today' => $today,
        ]);
    }

    public function show(Request $request, User $staff)
    {
        $cinemaId = (int) session('admin_cinema_id');
        abort_if($cinemaId <= 0, 403, 'Akun Anda belum terhubung ke bioskop.');
        abort_unless(
            $staff->role === User::ROLE_STAFF && (int) $staff->cinema_id === $cinemaId,
            403,
            'Staff ini bukan bagian dari bioskop Anda.'
        );

        $period = $this->resolvePeriod($request);
        [$start, $end, $periodName, $periodLabel, $customDate] = $period;
        $endExclusive = $end->copy()->addDay();

        $stats = $this->statsForStaff($staff->id, $cinemaId, $start, $endExclusive);
        $dailyTickets = $this->dailyTickets($staff->id, $cinemaId, $start, $end);
        $attendanceHistory = StaffAttendance::query()
            ->where('staff_id', $staff->id)
            ->where('cinema_id', $cinemaId)
            ->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('tanggal')
            ->get();

        return view('manager.staff-stats.show', [
            'staff' => $staff,
            'stats' => $stats,
            'dailyTickets' => $dailyTickets,
            'attendanceHistory' => $attendanceHistory,
            'period' => $periodName,
            'periodLabel' => $periodLabel,
            'start' => $start,
            'end' => $end,
            'customDate' => $customDate,
        ]);
    }

    private function statsForStaff(int $staffId, int $cinemaId, Carbon $start, Carbon $endExclusive): array
    {
        $orders = Order::query()
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->where('orders.staff_id', $staffId)
            ->where('studios.cinema_id', $cinemaId)
            ->where('orders.status', 'paid')
            ->where('orders.created_at', '>=', $start)
            ->where('orders.created_at', '<', $endExclusive);

        $revenue = (int) (clone $orders)->sum('orders.total_price');

        $cashRevenue = (int) (clone $orders)
            ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
            ->where(function ($query) {
                $query->whereNull('payments.id')
                    ->orWhereRaw('LOWER(payments.payment_type) = ?', ['cash']);
            })
            ->sum('orders.total_price');

        $tickets = (int) (clone $orders)
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->count('tickets.id');

        $scanned = (int) Ticket::query()
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->where('orders.staff_id', $staffId)
            ->where('studios.cinema_id', $cinemaId)
            ->where('orders.status', 'paid')
            ->where('tickets.used_at', '>=', $start)
            ->where('tickets.used_at', '<', $endExclusive)
            ->count('tickets.id');

        $attendanceRows = StaffAttendance::query()
            ->where('staff_id', $staffId)
            ->where('cinema_id', $cinemaId)
            ->whereBetween('tanggal', [$start->toDateString(), $endExclusive->copy()->subDay()->toDateString()])
            ->get();

        $minutes = (int) $attendanceRows->sum(fn (StaffAttendance $row) => $row->durationMinutes() ?? 0);

        return [
            'tickets' => $tickets,
            'orders' => (int) (clone $orders)->count('orders.id'),
            'revenue' => $revenue,
            'cash_revenue' => $cashRevenue,
            'non_cash_revenue' => max(0, $revenue - $cashRevenue),
            'scanned' => $scanned,
            'attendance_days' => $attendanceRows->count(),
            'work_minutes' => $minutes,
            'hours' => round($minutes / 60, 1),
        ];
    }

    private function dailyTickets(int $staffId, int $cinemaId, Carbon $start, Carbon $end)
    {
        $rows = Order::query()
            ->join('schedules', 'schedules.id', '=', 'orders.schedule_id')
            ->join('studios', 'studios.id', '=', 'schedules.studio_id')
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->where('orders.staff_id', $staffId)
            ->where('studios.cinema_id', $cinemaId)
            ->where('orders.status', 'paid')
            ->where('orders.created_at', '>=', $start)
            ->where('orders.created_at', '<', $end->copy()->addDay())
            ->selectRaw('DATE(orders.created_at) AS report_date, COUNT(tickets.id) AS tickets')
            ->groupByRaw('DATE(orders.created_at)')
            ->pluck('tickets', 'report_date');

        $days = collect();
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $days->push([
                'date' => $cursor->copy(),
                'label' => $cursor->locale('id')->isoFormat('D MMM'),
                'full_label' => $cursor->locale('id')->isoFormat('dddd, D MMMM Y'),
                'tickets' => (int) ($rows[$cursor->toDateString()] ?? 0),
            ]);
            $cursor->addDay();
        }

        return [
            'days' => $days,
            'max' => max(1, (int) $days->max('tickets')),
        ];
    }

    private function attendanceStatus(?StaffAttendance $attendance): string
    {
        if (! $attendance) {
            return 'Belum absen';
        }

        $masuk = substr((string) $attendance->jam_masuk, 0, 5);

        if (! $attendance->jam_pulang) {
            return 'Bertugas sejak ' . $masuk;
        }

        return 'Selesai';
    }

    private function resolvePeriod(Request $request): array
    {
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
            $valid = is_string($customDate)
                && preg_match('/^\d{4}-\d{2}-\d{2}$/', $customDate)
                && Carbon::hasFormat($customDate, 'Y-m-d');

            if ($valid) {
                $start = Carbon::createFromFormat('Y-m-d', $customDate, 'Asia/Jakarta')->startOfDay();
                $end = $start->copy();
                $periodLabel = $start->locale('id')->isoFormat('D MMMM Y');
            } else {
                $period = 'today';
                $customDate = null;
            }
        }

        return [$start, $end, $period, $periodLabel, $customDate];
    }
}
