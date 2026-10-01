<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tri-state: NULL = inherit type default (movie_services), 0/1 = per-country override.
        DB::statement('ALTER TABLE movie_service_countries ALTER COLUMN is_coming_soon DROP DEFAULT');
        Schema::table('movie_service_countries', function (Blueprint $table) {
            $table->boolean('is_coming_soon')->nullable()->default(null)->change();
        });

        // All existing values are copies of the type default (or cron divergence where the
        // old API fell back via `?:`), so NULL (inherit) preserves current effective output.
        DB::statement('UPDATE movie_service_countries SET is_coming_soon = NULL');
    }

    public function down(): void
    {
        // Restore NOT NULL with default false: materialize the effective value first.
        // (movie_services.is_coming_soon is smallint 0/1 -> cast to boolean.)
        DB::statement(
            'UPDATE movie_service_countries msc
             SET is_coming_soon = COALESCE(msc.is_coming_soon, ms.is_coming_soon <> 0, false)
             FROM movie_services ms
             WHERE ms.movie_id = msc.movie_id AND ms.service_id = msc.service_id
               AND ms.availability_type = msc.availability_type'
        );
        DB::statement('UPDATE movie_service_countries SET is_coming_soon = false WHERE is_coming_soon IS NULL');

        Schema::table('movie_service_countries', function (Blueprint $table) {
            $table->boolean('is_coming_soon')->default(false)->change();
        });
        DB::statement('ALTER TABLE movie_service_countries ALTER COLUMN is_coming_soon SET DEFAULT false');
    }
};
