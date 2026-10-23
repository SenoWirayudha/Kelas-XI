<?php

namespace App\Http\Controllers\Staff;

use App\Exceptions\BookingException;
use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Services\TicketOrderService;
use Illuminate\Http\Request;

class CashierController extends Controller
{
    public function index()
    {
        $cinemaId = $this->cinemaId();

        $schedules = Schedule::with(['movie', 'studio'])
            ->whereHas('studio', fn ($q) => $q->where('cinema_id', $cinemaId))
            ->whereDate('show_date', now()->toDateString())
            ->where('status', 'active')
            ->orderBy('show_time')
            ->get();

        return view('staff.cashier.index', compact('schedules'));
    }

    /**
     * Seat map for the cashier. Reuses the same layout logic as the mobile
     * API, but only after checking the schedule belongs to the staff cinema.
     */
    public function seats(Request $request)
    {
        $validated = $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
        ]);

        $schedule = Schedule::with('studio')->findOrFail($validated['schedule_id']);
        $this->authorizeCinema($schedule->studio?->cinema_id);

        if ($schedule->show_date->toDateString() !== now()->toDateString()) {
            abort(422, 'Hanya jadwal hari ini yang dapat dijual di kasir.');
        }

        return app(\App\Http\Controllers\Api\SeatController::class)->layout($request);
    }

    public function store(Request $request, TicketOrderService $ticketOrderService)
    {
        $validated = $request->validate([
            'schedule_id'   => 'required|integer|exists:schedules,id',
            'seats'         => 'required|array|min:1',
            'seats.*'       => 'integer|exists:seats,id',
            'buyer_name'    => 'nullable|string|max:100',
            'cash_received' => 'required|integer|min:0',
        ]);

        $schedule = Schedule::with('studio')->findOrFail($validated['schedule_id']);
        $this->authorizeCinema($schedule->studio?->cinema_id);

        if ($schedule->show_date->toDateString() !== now()->toDateString()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya jadwal hari ini yang dapat dijual di kasir.',
            ], 422);
        }

        if ($schedule->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal ini tidak aktif.',
            ], 422);
        }

        try {
            $order = $ticketOrderService->create($schedule, $validated['seats'], [
                'status'        => 'paid',
                'channel'       => 'offline',
                'staff_id'      => (int) session('admin_user_id'),
                'buyer_name'    => trim((string) ($validated['buyer_name'] ?? '')) ?: null,
                'cash_received' => (int) $validated['cash_received'],
            ]);
        } catch (BookingException $e) {
            return response()->json([
                'success'    => false,
                'message'    => $e->getMessage(),
                'seat_codes' => $e->seatCodes,
                'total'      => $e->context['total'] ?? null,
            ], $e->status);
        }

        session()->flash('cash_received', (int) $validated['cash_received']);
        session()->flash('change', (int) $validated['cash_received'] - (int) $order->total_price);

        return response()->json([
            'success'  => true,
            'order_id' => $order->id,
            'redirect' => route('staff.tickets.print', $order),
        ]);
    }

    private function cinemaId(): int
    {
        $cinemaId = (int) $this->scopedCinemaId();

        abort_if($cinemaId <= 0, 403, 'Akun Anda belum terhubung ke bioskop.');

        return $cinemaId;
    }
}
