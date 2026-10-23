<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BookingException;
use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Services\PendingOrderCleanupService;
use App\Services\TicketOrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private readonly PendingOrderCleanupService $pendingOrderCleanupService,
        private readonly TicketOrderService $ticketOrderService
    ) {
    }

    /**
     * POST /api/v1/orders
     * Body: { schedule_id, seats: [1,2,3], user_id? }
     *
     * Creates a pending order, locks the requested seats inside a DB
     * transaction (guarded by the unique schedule+seat constraint) and
     * generates QR tickets. The heavy lifting lives in TicketOrderService so
     * the staff cashier shares exactly the same rules.
     */
    public function store(Request $request)
    {
        $this->pendingOrderCleanupService->cleanupExpiredPendingOrders();

        $validated = $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
            'seats'       => 'required|array|min:1',
            'seats.*'     => 'integer|exists:seats,id',
            'user_id'     => 'nullable|integer|exists:users,id',
        ]);

        $schedule = Schedule::findOrFail($validated['schedule_id']);

        try {
            $order = $this->ticketOrderService->create($schedule, $validated['seats'], [
                'user_id' => $validated['user_id'] ?? null,
                'status'  => 'pending',
                'channel' => 'online',
            ]);
        } catch (BookingException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => ['seat_codes' => $e->seatCodes],
            ], $e->status);
        }

        $order->load(['orderSeats.seat', 'tickets']);

        return response()->json([
            'success' => true,
            'data'    => [
                'order_id'    => $order->id,
                'order_code'  => $order->order_code,
                'ticket_code' => $order->ticket_code,
                'total_price' => (float) $order->total_price,
                'status'      => $order->status,
                'expired_at'  => $order->expired_at->toIso8601String(),
                'seats'       => $order->orderSeats->map(fn ($os) => [
                    'seat_id'   => $os->seat_id,
                    'seat_code' => $os->seat->seat_code,
                    'price'     => (float) $os->price,
                ]),
                'tickets'     => $order->tickets->map(fn ($t) => [
                    'ticket_id' => $t->id,
                    'qr_code'   => $t->qr_code,
                    'seat_id'   => $t->seat_id,
                ]),
            ],
        ], 201);
    }
}
