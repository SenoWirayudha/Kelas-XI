<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Offline (kasir) sales + double-seat protection.
 *
 * - orders.channel      online | offline
 * - orders.staff_id     staff account that sold an offline order
 * - orders.buyer_name   optional walk-in buyer name
 * - tickets.used_at     when the ticket was claimed at the gate
 * - unique (schedule_id, seat_id) on order_seats so one seat can never be
 *   sold twice for the same show, even under concurrent requests.
 *
 * Duplicate order_seats that already exist in the database are collapsed
 * first: the earliest order keeps the seat, any later *paid* duplicate is
 * marked as a refund (status -> refunded) instead of silently deleted, and
 * later unpaid/cancelled duplicates are removed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'channel')) {
                $table->string('channel', 20)->default('online')->after('status');
            }

            if (!Schema::hasColumn('orders', 'staff_id')) {
                $table->foreignId('staff_id')
                    ->nullable()
                    ->after('user_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('orders', 'buyer_name')) {
                $table->string('buyer_name', 100)->nullable()->after('staff_id');
            }
        });

        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'used_at')) {
                $table->dateTime('used_at')->nullable()->after('is_used');
            }
        });

        $this->collapseDuplicateSeats();

        Schema::table('order_seats', function (Blueprint $table) {
            // Re-create the constraint that 2026_03_17_230000 dropped.
            try {
                $table->unique(['schedule_id', 'seat_id'], 'uq_seat_per_schedule');
            } catch (\Throwable $e) {
                // Already present.
            }
        });
    }

    public function down(): void
    {
        Schema::table('order_seats', function (Blueprint $table) {
            try {
                $table->dropUnique('uq_seat_per_schedule');
            } catch (\Throwable $e) {
            }
        });

        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'used_at')) {
                $table->dropColumn('used_at');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'buyer_name')) {
                $table->dropColumn('buyer_name');
            }

            if (Schema::hasColumn('orders', 'staff_id')) {
                $table->dropConstrainedForeignId('staff_id');
            }

            if (Schema::hasColumn('orders', 'channel')) {
                $table->dropColumn('channel');
            }
        });
    }

    /**
     * Keep only the earliest order_seat for each (schedule_id, seat_id).
     */
    private function collapseDuplicateSeats(): void
    {
        $duplicates = DB::table('order_seats')
            ->select('schedule_id', 'seat_id')
            ->groupBy('schedule_id', 'seat_id')
            ->havingRaw('count(*) > 1')
            ->get();

        foreach ($duplicates as $duplicate) {
            $rows = DB::table('order_seats')
                ->join('orders', 'orders.id', '=', 'order_seats.order_id')
                ->where('order_seats.schedule_id', $duplicate->schedule_id)
                ->where('order_seats.seat_id', $duplicate->seat_id)
                ->orderBy('orders.created_at')
                ->orderBy('orders.id')
                ->get([
                    'order_seats.id',
                    'order_seats.order_id',
                    'orders.status',
                    'orders.channel',
                ]);

            // The winner is the first paid order, otherwise the first row.
            $winner = $rows->first(fn ($row) => $row->status === 'paid') ?? $rows->first();

            foreach ($rows as $row) {
                if ($row->id === $winner->id) {
                    continue;
                }

                if ($row->status === 'paid' && $row->id !== $winner->id) {
                    // A second paid sale for the same seat: refund it rather
                    // than dropping the money trail. Its tickets become used.
                    DB::table('orders')->where('id', $row->order_id)->update([
                        'status' => 'refunded',
                    ]);

                    DB::table('tickets')->where('order_id', $row->order_id)->update([
                        'is_used' => true,
                    ]);
                }

                DB::table('order_seats')->where('id', $row->id)->delete();
            }
        }
    }
};
