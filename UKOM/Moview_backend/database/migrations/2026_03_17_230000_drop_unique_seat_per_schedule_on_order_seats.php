<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('order_seats')) {
            Schema::table('order_seats', function (Blueprint $table) {
                try {
                    $table->dropUnique('uq_seat_per_schedule');
                } catch (\Throwable $e) {
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('order_seats')) {
            Schema::table('order_seats', function (Blueprint $table) {
                try {
                    $table->unique(['schedule_id', 'seat_id'], 'uq_seat_per_schedule');
                } catch (\Throwable $e) {
                }
            });
        }
    }
};
