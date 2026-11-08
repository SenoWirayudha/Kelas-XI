<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Backdrop chosen for the list hero (movie_media id of film #1). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('film_lists', function (Blueprint $table) {
            $table->unsignedBigInteger('backdrop_media_id')->nullable()->after('use_backdrop');
        });
    }

    public function down(): void
    {
        Schema::table('film_lists', function (Blueprint $table) {
            $table->dropColumn('backdrop_media_id');
        });
    }
};
