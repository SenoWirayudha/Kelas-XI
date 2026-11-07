<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Poster for a festival session (used for multi-film sessions, where schedules.movie_id
 * only points at the first film). Nullable: normal schedules keep using the film poster.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('schedules', 'poster_path')) {
                $table->string('poster_path')->nullable()->after('session_title');
            }
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (Schema::hasColumn('schedules', 'poster_path')) {
                $table->dropColumn('poster_path');
            }
        });
    }
};
