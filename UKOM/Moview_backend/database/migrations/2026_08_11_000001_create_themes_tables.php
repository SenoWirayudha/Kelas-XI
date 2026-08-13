<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('themes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150)->unique();
            $table->timestamps();
        });

        Schema::create('movie_themes', function (Blueprint $table) {
            $table->unsignedBigInteger('movie_id');
            $table->unsignedBigInteger('theme_id');

            $table->primary(['movie_id', 'theme_id']);
            $table->foreign('movie_id')->references('id')->on('movies')->onDelete('cascade');
            $table->foreign('theme_id')->references('id')->on('themes')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movie_themes');
        Schema::dropIfExists('themes');
    }
};