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
            $table->boolean('is_liked')->default(false)->after('is_spoiler')->comment('Whether user liked this movie when writing review');
            $table->index('is_liked');
        });
        
        Schema::table('diaries', function (Blueprint $table) {
            $table->boolean('is_liked')->default(false)->after('rating')->comment('Whether user liked this movie when logging it');
            $table->index('is_liked');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['is_liked']);
            $table->dropColumn('is_liked');
        });
        
        Schema::table('diaries', function (Blueprint $table) {
            $table->dropIndex(['is_liked']);
            $table->dropColumn('is_liked');
        });
    }
};
