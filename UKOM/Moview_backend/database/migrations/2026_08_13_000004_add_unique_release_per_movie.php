<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Backfill the unique constraint on movie_releases for databases migrated before
     * 2026_08_13_000001 was updated. On fresh installs the index already exists
     * (created inside 000001), so this is a no-op thanks to IF NOT EXISTS.
     */
    public function up(): void
    {
        DB::statement(
            'CREATE UNIQUE INDEX IF NOT EXISTS movie_releases_movie_type_country_date_unique '
            . 'ON movie_releases (movie_id, type, country_code, release_date) '
            . 'NULLS NOT DISTINCT'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS movie_releases_movie_type_country_date_unique');
    }
};