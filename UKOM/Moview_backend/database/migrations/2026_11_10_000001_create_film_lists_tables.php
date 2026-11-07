<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Curated film lists (Letterboxd-style).
 *
 * visibility: public | private. A private list is only returned to its owner.
 * type:       ranked (order matters, 1..n) | plain (no numbers).
 * use_backdrop: mirror the list's back cover from film #1 (movie_media only).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('film_lists', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('title', 120);
            $table->text('description')->nullable();
            $table->string('type', 16)->default('plain'); // ranked | plain
            $table->string('visibility', 16)->default('public'); // public | private
            $table->boolean('use_backdrop')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'updated_at']);
        });

        Schema::create('film_list_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('film_list_id');
            $table->unsignedBigInteger('movie_id');
            $table->unsignedInteger('position')->default(0);
            // List-scoped custom artwork (movie_media ids), independent of the
            // user's global 'films' preference.
            $table->unsignedBigInteger('poster_media_id')->nullable();
            $table->unsignedBigInteger('backdrop_media_id')->nullable();
            $table->timestamps();

            // One film may only appear once per list.
            $table->unique(['film_list_id', 'movie_id']);
            $table->index(['film_list_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('film_list_items');
        Schema::dropIfExists('film_lists');
    }
};
