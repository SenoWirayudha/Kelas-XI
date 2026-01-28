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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('film_id')->constrained('movies')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating')->comment('Rating 1-5 stars');
            $table->string('title')->nullable();
            $table->text('content');
            $table->string('backdrop_path')->nullable()->comment('Hero image for review detail page');
            $table->boolean('is_spoiler')->default(false);
            $table->enum('status', ['published', 'hidden', 'deleted'])->default('published');
            $table->timestamps();
            
            // Indexes
            $table->index('user_id');
            $table->index('film_id');
            $table->index('rating');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
