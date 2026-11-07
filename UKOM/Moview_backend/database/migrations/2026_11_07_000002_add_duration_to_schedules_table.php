<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Surprise sessions may be sold without exposing a film, so:
 *  - schedules.duration stores the session length (nullable; normal sessions keep
 *    deriving it from the film line-up), and
 *  - schedules.movie_id becomes nullable because a surprise session may have no film.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('schedules', 'duration')) {
                $table->unsignedInteger('duration')->nullable()->after('show_time');
            }
        });

        Schema::table('schedules', function (Blueprint $table) {
            $table->unsignedBigInteger('movie_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (Schema::hasColumn('schedules', 'duration')) {
                $table->dropColumn('duration');
            }
        });
    }
};
