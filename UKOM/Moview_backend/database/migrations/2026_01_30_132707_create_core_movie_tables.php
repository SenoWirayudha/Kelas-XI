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
        // Genres table
        Schema::create('genres', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->timestamps();
        });

        // Movies table
        Schema::create('movies', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->year('release_year');
            $table->integer('duration')->comment('Duration in minutes');
            $table->string('age_rating', 10)->nullable();
            $table->text('synopsis');
            $table->string('default_poster_path', 500)->nullable();
            $table->string('default_backdrop_path', 500)->nullable();
            $table->string('trailer_url', 500)->nullable();
            $table->string('original_language', 10)->nullable();
            $table->json('spoken_languages')->nullable();
            $table->json('production_countries')->nullable();
            $table->json('production_companies')->nullable();
            $table->timestamps();
            
            $table->index('title');
            $table->index('release_year');
        });

        // Movie-Genre pivot table
        Schema::create('genre_movie', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('genre_id');
            $table->unsignedBigInteger('movie_id');
            $table->timestamps();
            
            $table->foreign('genre_id')->references('id')->on('genres')->onDelete('cascade');
            $table->foreign('movie_id')->references('id')->on('movies')->onDelete('cascade');
            
            $table->unique(['genre_id', 'movie_id']);
        });

        // Persons table
        Schema::create('persons', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->enum('primary_role', ['Actor', 'Director', 'Writer', 'Producer', 'Cinematographer', 'Composer']);
            $table->string('photo_path', 500)->nullable();
            $table->text('bio')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('nationality', 100)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->index('full_name');
            $table->index('primary_role');
        });

        // Movie-Person pivot table
        Schema::create('movie_persons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('movie_id');
            $table->unsignedBigInteger('person_id');
            $table->enum('role_type', ['cast', 'crew']);
            $table->string('character_name')->nullable();
            $table->string('job')->nullable()->comment('For crew: Director, Writer, etc.');
            $table->integer('order_index')->default(0);
            
            $table->foreign('movie_id')->references('id')->on('movies')->onDelete('cascade');
            $table->foreign('person_id')->references('id')->on('persons')->onDelete('cascade');
            
            $table->index(['movie_id', 'role_type']);
            $table->index('person_id');
        });

        // Services table (streaming and theatrical)
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->enum('type', ['streaming', 'theatrical']);
            $table->string('logo_path', 500)->nullable();
            $table->timestamps();
            
            $table->index('type');
        });

        // Movie-Service pivot table
        Schema::create('movie_services', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('movie_id');
            $table->unsignedBigInteger('service_id');
            $table->string('availability_type')->nullable()->comment('For streaming: stream, rent, buy');
            $table->date('release_date')->nullable();
            $table->timestamps();
            
            $table->foreign('movie_id')->references('id')->on('movies')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_services');
        Schema::dropIfExists('services');
        Schema::dropIfExists('movie_persons');
        Schema::dropIfExists('persons');
        Schema::dropIfExists('genre_movie');
        Schema::dropIfExists('movies');
        Schema::dropIfExists('genres');
    }
};
