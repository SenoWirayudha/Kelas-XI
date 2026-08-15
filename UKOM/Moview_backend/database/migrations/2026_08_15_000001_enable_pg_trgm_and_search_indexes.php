<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Enable the pg_trgm extension and add trigram GIN indexes on the movie
     * search columns so fuzzy (similarity/word_similarity) lookups stay fast
     * on large tables. gin_trgm_ops is a PostgreSQL operator class and can only
     * be created through raw SQL.
     */
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        DB::statement(
            'CREATE INDEX IF NOT EXISTS movies_title_trgm_idx '
            . 'ON movies USING GIN (title gin_trgm_ops)'
        );
        DB::statement(
            'CREATE INDEX IF NOT EXISTS movies_original_title_trgm_idx '
            . 'ON movies USING GIN (original_title gin_trgm_ops)'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS movies_original_title_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS movies_title_trgm_idx');
    }
};
