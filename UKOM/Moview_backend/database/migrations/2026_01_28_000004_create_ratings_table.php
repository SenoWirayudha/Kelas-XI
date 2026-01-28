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
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('film_id')->constrained('movies')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating')->comment('Rating 1-5 stars');
            $table->timestamps();
            
            // Constraints
            $table->unique(['user_id', 'film_id'], 'unique_user_film_rating');
            
            // Indexes
            $table->index('user_id');
            $table->index('film_id');
            $table->index('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
