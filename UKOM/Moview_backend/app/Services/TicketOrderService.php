<?php

namespace App\Services;

use App\Exceptions\BookingException;
use App\Models\Order;
use App\Models\OrderSeat;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\Ticket;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * One booking path for online checkout and offline cashier sales.
 *
 * The caller only supplies the schedule, seats and the commercial options
 * (pending vs paid, channel, staff, buyer). Seat locking, price calculation,
 * paired-seat rules and ticket creation live here so both entry points behave
 * identically.
 */
class TicketOrderService
{
    public function create(Schedule $schedule, array $seatIds, array $options = []): Order
    {
        $seatIds = array_values(array_unique(array_map('intval', $seatIds)));

        if (empty($seatIds)) {
            throw new BookingException('Pilih minimal satu kursi.', 422);
        }

        $schedule->loadMissing('studio');

        $status = $options['status'] ?? 'pending';
        $channel = $options['channel'] ?? Order::CHANNEL_ONLINE;
        $cashReceived = $options['cash_received'] ?? null;

        if (! $schedule->isOpenForChannel($channel)) {
            throw new BookingException(
                $channel === Order::CHANNEL_OFFLINE
                    ? 'Jadwal sudah ditutup untuk penjualan kasir.'
                    : 'Jadwal sudah ditutup untuk pembelian online.',
                422
            );
        }

        try {
            return DB::transaction(function () use ($schedule, $seatIds, $options, $status, $channel, $cashReceived) {
                $studio = $schedule->studio;

                if (!$studio) {
                    throw new BookingException('Jadwal tidak valid.', 422);
                }

                $preSeats = Seat::whereIn('id', $seatIds)->get();
                if ($preSeats->count() !== count($seatIds)) {
                    throw new BookingException('Ada kursi yang tidak valid.', 422);
                }

                // Couple/sweetbox atomicity: lock every cell of the group.
                $groups = $preSeats->pluck('seat_group')->filter()->unique()->all();
                $groupSeatIds = [];
                if (!empty($groups)) {
                    $groupSeatIds = Seat::where('studio_id', $schedule->studio_id)
                        ->whereIn('seat_group', $groups)
                        ->pluck('id')
                        ->all();
                }

                // Lock every involved seat in id order to avoid deadlocks.
                $allLockedIds = array_values(array_unique(array_merge($seatIds, $groupSeatIds)));
                $lockedSeats = Seat::whereIn('id', $allLockedIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();
                $lockedById = $lockedSeats->keyBy('id');

                $invalid = collect($seatIds)->map(fn ($id) => $lockedById->get($id))->filter()
                    ->filter(
                        fn ($seat) => $seat->studio_id !== $schedule->studio_id
                            || !$studio->isSellableKey($seat->seat_type)
                            || !$seat->is_active
                    );

                if ($invalid->isNotEmpty()) {
                    throw new BookingException(
                        'Kursi tidak dapat dijual: ' . $invalid->pluck('seat_code')->implode(', '),
                        422,
                        $invalid->pluck('seat_code')->all()
                    );
                }

                // Paired seats must be purchased together.
                $pairedGroups = collect($seatIds)->map(fn ($id) => $lockedById->get($id))->filter()
                    ->filter(fn ($seat) => $studio->purchaseModeFor($seat->seat_type) === 'paired')
                    ->pluck('seat_group')
                    ->filter()
                    ->unique();

                foreach ($pairedGroups as $group) {
                    $memberIds = Seat::where('studio_id', $schedule->studio_id)
                        ->where('seat_group', $group)
                        ->pluck('id')
                        ->all();

                    if (count(array_intersect($memberIds, $seatIds)) !== count($memberIds)) {
                        throw new BookingException(
                            "Kursi berpasangan '{$group}' harus dibeli sekaligus (semua sel dalam grup).",
                            422
                        );
                    }
                }

                // Authoritative availability check inside the transaction.
                $occupied = OrderSeat::occupiedSeatIds($schedule->id, $allLockedIds);
                if (!empty($occupied)) {
                    $codes = Seat::whereIn('id', $occupied)->pluck('seat_code')->all();
                    throw new BookingException('Kursi sudah terjual.', 409, $codes);
                }

                $totalPrice = 0;
                foreach ($seatIds as $seatId) {
                    $totalPrice += (int) round(
                        $schedule->ticket_price * $studio->priceMultiplierFor($lockedById->get($seatId)->seat_type)
                    );
                }

                if ($cashReceived !== null && (int) $cashReceived < $totalPrice) {
                    throw new BookingException(
                        'Uang tunai kurang.',
                        422,
                        [],
                        ['total' => $totalPrice, 'cash_received' => (int) $cashReceived]
                    );
                }

                $order = Order::create([
                    'schedule_id' => $schedule->id,
                    'user_id'     => $options['user_id'] ?? null,
                    'staff_id'    => $options['staff_id'] ?? null,
                    'buyer_name'  => $options['buyer_name'] ?? null,
                    'order_code'  => 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                    'ticket_code' => Order::generateUniqueTicketCode(),
                    'total_price' => $totalPrice,
                    'status'      => $status,
                    'channel'     => $channel,
                    'is_scanned'  => false,
                    'scanned_at'  => null,
                    'expired_at'  => $status === 'paid'
                        ? now()
                        : now()->addMinutes((int) config('services.booking.pending_timeout_minutes', 7)),
                ]);

                foreach ($seatIds as $seatId) {
                    $seat = $lockedById->get($seatId);
                    $price = (int) round(
                        $schedule->ticket_price * $studio->priceMultiplierFor($seat->seat_type)
                    );

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
        } catch (QueryException $e) {
            // Unique (schedule_id, seat_id): another transaction won the race.
            if ((string) $e->getCode() === '23505') {
                throw new BookingException('Kursi sudah terjual.', 409);
            }

            throw $e;
        }
    }
}
