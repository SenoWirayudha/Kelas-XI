<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * LSF age classification for a festival session (SU, 13+, 17+, 21+).
 * Nullable so existing sessions keep working until they are edited.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('schedules', 'age_rating')) {
                $table->string('age_rating', 8)->nullable()->after('session_title');
            }
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (Schema::hasColumn('schedules', 'age_rating')) {
                $table->dropColumn('age_rating');
            }
        });
    }
};
