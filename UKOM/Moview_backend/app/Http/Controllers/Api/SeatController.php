<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderSeat;
use App\Models\Schedule;
use App\Models\Seat;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    /**
     * GET /api/v1/seats?schedule_id=1
     * Returns all seats in the studio for the schedule,
     * each marked as 'available' or 'booked'.
     */
    public function index(Request $request)
    {
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
