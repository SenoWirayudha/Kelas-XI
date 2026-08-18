<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Include `name` (platform) in the unique index so multiple streaming
     * platforms can share the same release date independently, e.g. Netflix
     * AND Disney+ both dropping on the same day. Previously the key was
     * (movie_id, type, country_code, release_date) which silently dropped the
     * second platform via insertOrIgnore.
     *
     * Theatrical rows keep name=NULL (NULLS NOT DISTINCT) so the single-slot
     * dedupe for theatrical is preserved.
     */
    public function up(): void
    {
        DB::statement('DROP INDEX IF EXISTS movie_releases_movie_type_country_date_unique');

        DB::statement(
            'CREATE UNIQUE INDEX movie_releases_movie_type_country_name_date_unique '
            . 'ON movie_releases (movie_id, type, country_code, name, release_date) '
            . 'NULLS NOT DISTINCT'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS movie_releases_movie_type_country_name_date_unique');

        DB::statement(
            'CREATE UNIQUE INDEX movie_releases_movie_type_country_date_unique '
            . 'ON movie_releases (movie_id, type, country_code, release_date) '
            . 'NULLS NOT DISTINCT'
        );
    }
};