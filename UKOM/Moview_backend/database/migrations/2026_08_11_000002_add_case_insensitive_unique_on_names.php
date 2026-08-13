<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE UNIQUE INDEX uq_themes_lower_name ON themes (LOWER(name))');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS uq_themes_lower_name');
    }
};
