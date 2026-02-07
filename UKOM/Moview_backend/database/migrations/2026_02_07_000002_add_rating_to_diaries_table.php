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
            $table->unsignedTinyInteger('rating')->nullable()->after('watched_at')->comment('Rating snapshot at time of logging (1-5 stars)');
            $table->index('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diaries', function (Blueprint $table) {
            $table->dropIndex(['rating']);
            $table->dropColumn('rating');
        });
    }
};
