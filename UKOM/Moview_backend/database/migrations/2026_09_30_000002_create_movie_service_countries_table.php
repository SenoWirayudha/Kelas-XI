<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movie_service_countries', function (Blueprint $table) {
            $table->unsignedBigInteger('movie_id');
            $table->unsignedBigInteger('service_id');
            $table->unsignedBigInteger('country_id');

            $table->foreign('movie_id')->references('id')->on('movies')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
            $table->foreign('country_id')->references('id')->on('countries')->onDelete('cascade');

            $table->unique(['movie_id', 'service_id', 'country_id'], 'uq_movie_service_countries');
            $table->index('service_id');
            $table->index(['movie_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movie_service_countries');
    }
};
