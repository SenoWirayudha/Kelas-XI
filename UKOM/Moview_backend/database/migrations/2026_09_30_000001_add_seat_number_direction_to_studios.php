<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Seat numbering direction per studio:
     * - ltr: leftmost column gets seat_number 1 (existing behavior, default)
     * - rtl: rightmost sellable column gets seat_number 1
     *
     * Mirrors the row_direction enum pattern (PG varchar + CHECK constraint
     * studios_seat_number_direction_check).
     */
    public function up(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->enum('seat_number_direction', ['ltr', 'rtl'])
                ->default('ltr')
                ->after('row_direction');
        });
    }

    public function down(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->dropColumn('seat_number_direction');
        });
    }
};
