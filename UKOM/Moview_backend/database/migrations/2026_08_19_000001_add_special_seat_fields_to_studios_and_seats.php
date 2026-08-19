<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add special-seat support:
     * - studios: seat_prices (JSON multiplier per seat type), row_direction (A front/back)
     * - seats: seat_type enum extended, seat_group (couple/sweetbox pairing)
     */
    public function up(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->json('seat_prices')->nullable()->after('total_seats');
            $table->enum('row_direction', ['front_to_back', 'back_to_front'])
                  ->default('front_to_back')
                  ->after('seat_prices');
        });

        Schema::table('seats', function (Blueprint $table) {
            $table->string('seat_group', 20)->nullable()->after('seat_type');
        });
    }

    public function down(): void
    {
        Schema::table('seats', function (Blueprint $table) {
            $table->dropColumn('seat_group');
        });

        Schema::table('studios', function (Blueprint $table) {
            $table->dropColumn(['seat_prices', 'row_direction']);
        });
    }
};
