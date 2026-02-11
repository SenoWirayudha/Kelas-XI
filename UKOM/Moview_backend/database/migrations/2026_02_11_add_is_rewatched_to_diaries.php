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
        Schema::table('diaries', function (Blueprint $table) {
            $table->boolean('is_rewatched')->default(false)->after('note')
                ->comment('Whether this diary entry is a rewatch (not first watch)');
            $table->index('is_rewatched', 'diaries_is_rewatched_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diaries', function (Blueprint $table) {
            $table->dropIndex('diaries_is_rewatched_index');
            $table->dropColumn('is_rewatched');
        });
    }
};
