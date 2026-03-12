<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seats', function (Blueprint $table) {
            $table->unsignedSmallInteger('position_x')->default(0)->after('seat_code');
            $table->unsignedSmallInteger('position_y')->default(0)->after('position_x');
            $table->boolean('is_active')->default(true)->after('position_y');
        });
    }

    public function down(): void
    {
        Schema::table('seats', function (Blueprint $table) {
            $table->dropColumn(['position_x', 'position_y', 'is_active']);
        });
    }
};
