<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Comments on a film list (mirrors review comments, without replies). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('film_list_comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('film_list_id');
            $table->unsignedBigInteger('user_id');
            $table->text('content');
            $table->timestamps();

            $table->index(['film_list_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('film_list_comments');
    }
};
