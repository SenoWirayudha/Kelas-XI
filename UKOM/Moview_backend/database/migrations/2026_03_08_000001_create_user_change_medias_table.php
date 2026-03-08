<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_change_medias', function (Blueprint $table) {
            $table->id();

            // Core FK columns
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('film_id');
            $table->foreign('film_id')
                ->references('id')->on('movies')
                ->cascadeOnDelete();

            // The selected movie_media row (movie_media has no Laravel migration – use raw FK)
            $table->unsignedBigInteger('media_id');
            $table->foreign('media_id')
                ->references('id')->on('movie_media')
                ->cascadeOnDelete();

            // Redundantly store media category for efficient querying without joining movie_media
            $table->enum('media_category', ['poster', 'backdrop']);

            // Context type:
            //   films     – general preference for a movie (used on most screens & for other-user views)
            //   reviews   – tied to a review diary entry  (diaries.review_id IS NOT NULL)
            //   logged    – tied to a log-only diary entry (diaries.review_id IS NULL)
            //   favorites – tied to a favorite-film slot   (user_favorite_films row)
            $table->enum('type', ['films', 'reviews', 'logged', 'favorites']);

            // Nullable FKs – only set when type = reviews/logged or favorites respectively
            $table->unsignedBigInteger('diaries_id')->nullable();
            $table->foreign('diaries_id')
                ->references('id')->on('diaries')
                ->nullOnDelete();

            $table->unsignedBigInteger('favorite_id')->nullable();
            $table->foreign('favorite_id')
                ->references('id')->on('user_favorite_films')
                ->nullOnDelete();

            $table->timestamps();

            // ---------------------------------------------------------------
            // Indexes for the most common lookups
            // ---------------------------------------------------------------

            // "What poster/backdrop should I show for film X in context C to user U?"
            $table->index(['user_id', 'film_id', 'media_category', 'type'], 'ucm_user_film_cat_type');

            // Lookup by diary entry (for review/log detail screens)
            $table->index(['user_id', 'diaries_id', 'media_category'], 'ucm_user_diary_cat');

            // Lookup by favorite slot (for profile / edit-profile screens)
            $table->index(['user_id', 'favorite_id', 'media_category'], 'ucm_user_fav_cat');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_change_medias');
    }
};
