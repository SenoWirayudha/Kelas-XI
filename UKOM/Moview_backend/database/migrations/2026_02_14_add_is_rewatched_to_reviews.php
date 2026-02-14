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
        Schema::table('reviews', function (Blueprint $table) {
            $table->boolean('is_rewatched')->default(false)->after('is_liked')
                ->comment('Whether this review was written during a rewatch (not first watch)');
            $table->index('is_rewatched', 'reviews_is_rewatched_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_is_rewatched_index');
            $table->dropColumn('is_rewatched');
        });
    }
};
