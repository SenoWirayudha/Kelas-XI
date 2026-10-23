<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The unique (schedule_id, seat_id) constraint must not keep seats blocked by
 * orders that no longer own them. Pending/paid orders keep their seats;
 * cancelled / expired / refunded orders release them.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "DELETE FROM order_seats
             WHERE order_id IN (
                 SELECT id FROM orders WHERE status NOT IN ('pending', 'paid')
             )"
        );
    }

    public function down(): void
    {
        // Seats of released orders cannot be reconstructed.
    }
};
