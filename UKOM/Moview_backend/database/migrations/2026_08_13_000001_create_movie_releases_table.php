<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movie_releases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movie_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['premiere', 'theatrical', 'streaming']);
            $table->string('country_code', 2)->nullable()->comment('ISO 3166-1 alpha-2 for flag display');
            $table->string('name', 255)->nullable()->comment('Festival name (premiere) or platform name (streaming); null for theatrical');
            $table->date('release_date');
            $table->timestamps();

            $table->index(['movie_id', 'type']);
            $table->index('release_date');
        });

        // Unique per (movie, type, country, platform, date) so insertOrIgnore
        // dedupes correctly. `name` holds the platform (streaming) or festival
        // (premiere); theatrical rows keep name=NULL. NULLS NOT DISTINCT (PG 15+)
        // treats NULL country_code (e.g. theatrical, no country specified) as
        // equal, otherwise multiple NULLs would never conflict. Including `name`
        // lets two streaming platforms share the same release date independently.
        DB::statement(
            'CREATE UNIQUE INDEX movie_releases_movie_type_country_name_date_unique '
            . 'ON movie_releases (movie_id, type, country_code, name, release_date) '
            . 'NULLS NOT DISTINCT'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('movie_releases');
    }
};