<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Surprise sessions: the film is still scheduled (duration / end time), but every
 * customer-facing surface only shows the session title and age classification.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('schedules', 'is_surprise')) {
                $table->boolean('is_surprise')->default(false)->after('age_rating');
            }
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (Schema::hasColumn('schedules', 'is_surprise')) {
                $table->dropColumn('is_surprise');
            }
        });
    }
};
