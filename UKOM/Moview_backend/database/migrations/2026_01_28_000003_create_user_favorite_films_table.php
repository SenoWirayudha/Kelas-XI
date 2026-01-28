<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_favorite_films', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('film_id')->constrained('movies')->cascadeOnDelete();
            $table->unsignedTinyInteger('position')->comment('Position 1-4 for favorite films');
            $table->timestamps();
            
            // Constraints
            $table->unique(['user_id', 'film_id'], 'unique_user_film');
            $table->unique(['user_id', 'position'], 'unique_user_position');
            
            // Indexes
            $table->index('user_id');
            $table->index('film_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_favorite_films');
    }
};
