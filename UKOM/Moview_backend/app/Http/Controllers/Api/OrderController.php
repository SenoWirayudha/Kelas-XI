<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderSeat;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\Studio;
use App\Models\Ticket;
use App\Services\PendingOrderCleanupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function __construct(private readonly PendingOrderCleanupService $pendingOrderCleanupService)
    {
    }

    /**
     * POST /api/v1/orders
     * Body: { schedule_id, seats: [1,2,3], user_id? }
     *
     * Creates an order, locks the requested seats (inside a DB transaction
     * to guard against race conditions), and generates QR tickets.
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
        $seatIds  = $validated['seats'];

        try {
            $order = DB::transaction(function () use ($schedule, $seatIds, $validated) {
                $studio = $schedule->studio;

                // ── Row-level lock on seats table (consistent order → no deadlock) ──
                // Couple/sweetbox atomicity: every cell in a requested seat_group is
                // locked together so no race can ever leave a couple half-sold.
                // 1) Pre-read requested seats (no lock) to discover their groups.
                $preSeats = Seat::whereIn('id', $seatIds)->get();
                if ($preSeats->count() !== count(array_unique($seatIds))) {
                    abort(422, 'Ada kursi yang tidak valid.');
                }

                $groups = $preSeats->pluck('seat_group')->filter()->unique()->all();
                $groupSeatIds = [];
                if (!empty($groups)) {
                    $groupSeatIds = Seat::where('studio_id', $schedule->studio_id)
                        ->whereIn('seat_group', $groups)
                        ->pluck('id')
                        ->all();
                }

                // 2) Lock every involved seat in a single sorted query (no deadlock,
                //    since all transactions acquire the same locks in the same order).
                $allLockedIds = array_values(array_unique(array_merge($seatIds, $groupSeatIds)));
                $lockedSeats = Seat::whereIn('id', $allLockedIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();
                $lockedById = $lockedSeats->keyBy('id');

                // Validate: every requested seat sellable, active, and belongs to this studio
                $invalid = collect($seatIds)->map(fn($id) => $lockedById->get($id))->filter()
                    ->filter(
                        fn($s) => $s->studio_id !== $schedule->studio_id
                            || !$studio->isSellableKey($s->seat_type)
                            || !$s->is_active
                    );
                if ($invalid->isNotEmpty()) {
                    $codes = $invalid->pluck('seat_code')->implode(', ');
                    abort(422, "Seat tidak dapat dijual: {$codes}");
                }

                // Paired atomicity: any paired seat group must be fully included in the request
                $pairedGroups = collect($seatIds)->map(fn($id) => $lockedById->get($id))->filter()
                    ->filter(fn($s) => $studio->purchaseModeFor($s->seat_type) === 'paired')
                    ->pluck('seat_group')
                    ->filter()
                    ->unique();
                foreach ($pairedGroups as $group) {
                    $memberIds = Seat::where('studio_id', $schedule->studio_id)
                        ->where('seat_group', $group)
                        ->pluck('id')
                        ->all();
                    if (count(array_intersect($memberIds, $seatIds)) !== count($memberIds)) {
                        abort(422, "Kursi berpasangan '{$group}' harus dibeli sekaligus (semua sel dalam grup).");
                    }
                }

                // Re-check availability inside the transaction (race-condition guard)
                $alreadyBooked = OrderSeat::where('schedule_id', $schedule->id)
                    ->whereIn('seat_id', $allLockedIds)
                    ->whereHas('order', fn($q) => $q->whereIn('status', ['pending', 'paid']))
                    ->lockForUpdate()
                    ->pluck('seat_id')
                    ->all();

                if (!empty($alreadyBooked)) {
                    // Resolve seat codes for a helpful error message
                    $codes = Seat::whereIn('id', $alreadyBooked)->pluck('seat_code')->implode(', ');
                    abort(409, "Seat(s) no longer available: {$codes}");
                }

                $totalPrice = 0;
                foreach ($seatIds as $seatId) {
                    $totalPrice += (int) round($schedule->ticket_price * $studio->priceMultiplierFor(
                        $lockedById->get($seatId)->seat_type
                    ));
                }

                $orderCode  = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));

                $orderPayload = [
                    'schedule_id' => $schedule->id,
                    'user_id'     => $validated['user_id'] ?? null,
                    'order_code'  => $orderCode,
                    'total_price' => $totalPrice,
                    'status'      => 'pending',
                    'expired_at'  => now()->addMinutes((int) config('services.booking.pending_timeout_minutes', 7)),
                ];

                if (Schema::hasColumn('orders', 'ticket_code')) {
                    $orderPayload['ticket_code'] = Order::generateUniqueTicketCode();
                }

                if (Schema::hasColumn('orders', 'is_scanned')) {
                    $orderPayload['is_scanned'] = false;
                }

                if (Schema::hasColumn('orders', 'scanned_at')) {
                    $orderPayload['scanned_at'] = null;
                }

                $order = Order::create($orderPayload);

                // Create per-seat records and QR tickets
                foreach ($seatIds as $seatId) {
                    $seatModel = $lockedById->get($seatId);
                    $price = (int) round($schedule->ticket_price * $studio->priceMultiplierFor($seatModel->seat_type));

                    OrderSeat::create([
                        'order_id'    => $order->id,
                        'seat_id'     => $seatId,
                        'schedule_id' => $schedule->id,
                        'price'       => $price,
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
