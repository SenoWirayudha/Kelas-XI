<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
    }

    public function down(): void
    {
        Schema::dropIfExists('movie_releases');
    }
};