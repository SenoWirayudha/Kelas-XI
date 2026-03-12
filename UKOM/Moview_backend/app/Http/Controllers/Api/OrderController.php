<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderSeat;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * POST /api/v1/orders
     * Body: { schedule_id, seats: [1,2,3], user_id? }
     *
     * Creates an order, locks the requested seats (inside a DB transaction
     * to guard against race conditions), and generates QR tickets.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
            'seats'       => 'required|array|min:1',
            'seats.*'     => 'integer|exists:seats,id',
            'user_id'     => 'nullable|integer|exists:users,id',
        ]);

        $schedule = Schedule::findOrFail($validated['schedule_id']);
        $seatIds  = $validated['seats'];

        try {
            $order = DB::transaction(function () use ($schedule, $seatIds, $validated) {

                // Re-check availability inside the transaction (race-condition guard)
                $alreadyBooked = OrderSeat::where('schedule_id', $schedule->id)
                    ->whereIn('seat_id', $seatIds)
                    ->whereHas('order', fn($q) => $q->whereIn('status', ['pending', 'paid']))
                    ->lockForUpdate()
                    ->pluck('seat_id')
                    ->all();

                if (!empty($alreadyBooked)) {
                    // Resolve seat codes for a helpful error message
                    $codes = Seat::whereIn('id', $alreadyBooked)->pluck('seat_code')->implode(', ');
                    abort(409, "Seat(s) no longer available: {$codes}");
                }

                $totalPrice = $schedule->ticket_price * count($seatIds);
                $orderCode  = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));

                $order = Order::create([
                    'schedule_id' => $schedule->id,
                    'user_id'     => $validated['user_id'] ?? null,
                    'order_code'  => $orderCode,
                    'total_price' => $totalPrice,
                    'status'      => 'pending',
                    'expired_at'  => now()->addMinutes(15),
                ]);

                // Create per-seat records and QR tickets
                foreach ($seatIds as $seatId) {
                    OrderSeat::create([
                        'order_id'    => $order->id,
                        'seat_id'     => $seatId,
                        'schedule_id' => $schedule->id,
                        'price'       => $schedule->ticket_price,
                    ]);

                    Ticket::create([
                        'order_id' => $order->id,
                        'seat_id'  => $seatId,
                        'qr_code'  => strtoupper(Str::random(12)) . '-' . $order->id . '-' . $seatId,
                        'is_used'  => false,
                    ]);
                }

                return $order;
            });

            $order->load(['orderSeats.seat', 'tickets']);

            return response()->json([
                'success' => true,
                'data'    => [
                    'order_id'    => $order->id,
                    'order_code'  => $order->order_code,
                    'total_price' => (float) $order->total_price,
                    'status'      => $order->status,
                    'expired_at'  => $order->expired_at->toIso8601String(),
                    'seats'       => $order->orderSeats->map(fn($os) => [
                        'seat_id'   => $os->seat_id,
                        'seat_code' => $os->seat->seat_code,
                        'price'     => (float) $os->price,
                    ]),
                    'tickets'     => $order->tickets->map(fn($t) => [
                        'ticket_id' => $t->id,
                        'qr_code'   => $t->qr_code,
                        'seat_id'   => $t->seat_id,
                    ]),
                ],
            ], 201);

        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order creation failed. Please try again.',
            ], 500);
        }
    }
}
