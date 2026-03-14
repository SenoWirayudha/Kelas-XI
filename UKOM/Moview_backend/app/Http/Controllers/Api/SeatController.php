<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderSeat;
use App\Models\Schedule;
use App\Models\Seat;
use App\Services\PendingOrderCleanupService;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    public function __construct(private readonly PendingOrderCleanupService $pendingOrderCleanupService)
    {
    }

    /**
     * GET /api/v1/seats/layout?schedule_id=1
     * Returns seat layout matrix metadata + seat entries for the schedule's studio.
     */
    public function layout(Request $request)
    {
        $this->pendingOrderCleanupService->cleanupExpiredPendingOrders();

        $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
        ]);

        $schedule = Schedule::findOrFail($request->schedule_id);

        $bookedSeatIds = OrderSeat::where('schedule_id', $schedule->id)
            ->whereHas('order', fn($q) => $q->whereIn('status', ['pending', 'paid']))
            ->pluck('seat_id')
            ->all();

        $rawSeats = Seat::where('studio_id', $schedule->studio_id)
            ->orderBy('position_y')
            ->orderBy('position_x')
            ->get();

        $rows = (int) ($rawSeats->max('position_y') ?? 0);
        $columns = (int) ($rawSeats->max('position_x') ?? 0);

        $seats = $rawSeats->map(function ($seat) use ($bookedSeatIds) {
            $seatType = $seat->seat_type ?? 'seat';
            $status = null;

            if ($seatType === 'seat') {
                $status = in_array($seat->id, $bookedSeatIds) ? 'booked' : 'available';
            }

            return [
                'seat_id'   => $seat->id,
                'seat_code' => $seat->seat_code,
                'row'       => $seat->seat_row,
                'row_index' => (int) $seat->position_y,
                'column'    => (int) $seat->position_x,
                'seat_type' => $seatType,
                'status'    => $status,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'studio_id' => $schedule->studio_id,
                'rows'      => $rows,
                'columns'   => $columns,
                'seats'     => $seats,
            ],
        ]);
    }

    /**
     * GET /api/v1/seats?schedule_id=1
     * Returns all seats in the studio for the schedule,
     * each marked as 'available' or 'booked'.
     */
    public function index(Request $request)
    {
        $this->pendingOrderCleanupService->cleanupExpiredPendingOrders();

        $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
        ]);

        $schedule = Schedule::findOrFail($request->schedule_id);

        // Seat IDs already taken by active (pending or paid) orders
        $bookedSeatIds = OrderSeat::where('schedule_id', $schedule->id)
            ->whereHas('order', fn($q) => $q->whereIn('status', ['pending', 'paid']))
            ->pluck('seat_id')
            ->all();

        $seats = Seat::where('studio_id', $schedule->studio_id)
            ->orderBy('position_y')
            ->orderBy('position_x')
            ->get()
            ->map(fn($seat) => [
                'seat_id'     => $seat->id,
                'seat_code'   => $seat->seat_code,
                'seat_row'    => $seat->seat_row,
                'seat_number' => $seat->seat_number,
                'seat_type'   => $seat->seat_type ?? 'seat',
                'position_x'  => $seat->position_x,
                'position_y'  => $seat->position_y,
                // status only meaningful for selectable seats
                'status'      => ($seat->seat_type === 'seat')
                    ? (in_array($seat->id, $bookedSeatIds) ? 'booked' : 'available')
                    : null,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $seats,
        ]);
    }
}
