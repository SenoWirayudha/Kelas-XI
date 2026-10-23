<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Scanning records the exact entry time; the old column was a DATE, which
 * truncated every scan to midnight.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE orders
             ALTER COLUMN scanned_at TYPE timestamp(0) WITHOUT TIME ZONE
             USING scanned_at::timestamp'
        );
    }

    public function down(): void
    {
        DB::statement(
            'ALTER TABLE orders
             ALTER COLUMN scanned_at TYPE date
             USING scanned_at::date'
        );
    }
};
