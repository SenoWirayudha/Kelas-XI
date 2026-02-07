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
            $table->foreignId('review_id')->nullable()->after('film_id')->constrained()->nullOnDelete();
            $table->index('review_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diaries', function (Blueprint $table) {
            $table->dropForeign(['review_id']);
            $table->dropIndex(['review_id']);
            $table->dropColumn('review_id');
        });
    }
};
