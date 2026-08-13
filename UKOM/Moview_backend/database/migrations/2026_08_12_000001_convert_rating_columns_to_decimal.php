<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Convert rating columns from unsignedTinyInteger to decimal(2,1)
     * to support half-star ratings (e.g. 3.5).
     */
    public function up(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->decimal('rating', 2, 1)->comment('Rating 0.5-5.0 stars')->change();
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->decimal('rating', 2, 1)->comment('Rating 0.5-5.0 stars')->change();
        });

        Schema::table('diaries', function (Blueprint $table) {
            $table->decimal('rating', 2, 1)->nullable()->after('watched_at')->comment('Rating snapshot at time of logging (0.5-5.0 stars)')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->unsignedTinyInteger('rating')->comment('Rating 1-5 stars')->change();
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->unsignedTinyInteger('rating')->comment('Rating 1-5 stars')->change();
        });

        Schema::table('diaries', function (Blueprint $table) {
            $table->unsignedTinyInteger('rating')->nullable()->after('watched_at')->comment('Rating snapshot at time of logging (1-5 stars)')->change();
        });
    }
};
