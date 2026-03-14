<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class PendingOrderCleanupService
{
    public function cleanupExpiredPendingOrders(): int
    {
        $timeoutMinutes = (int) config('services.booking.pending_timeout_minutes', 7);
        $cutoff = now()->subMinutes($timeoutMinutes);

        return DB::transaction(function () use ($cutoff) {
            $staleOrderIds = Order::query()
                ->where('status', 'pending')
                ->where(function ($query) use ($cutoff) {
                    $query->where('created_at', '<=', $cutoff)
                        ->orWhere(function ($subQuery) {
                            $subQuery->whereNotNull('expired_at')
                                ->where('expired_at', '<=', now());
                        });
                })
                ->lockForUpdate()
                ->pluck('id')
                ->all();

            if (empty($staleOrderIds)) {
                return 0;
            }

            Order::whereIn('id', $staleOrderIds)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);

            Payment::whereIn('order_id', $staleOrderIds)
                ->where(function ($query) {
                    $query->whereNull('transaction_status')
                        ->orWhere('transaction_status', 'pending');
                })
                ->update([
                    'transaction_status' => 'expire',
                    'payment_time' => now(),
                ]);

            return count($staleOrderIds);
        });
    }
}
