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
        // Drop existing status column and recreate with new enum values
        Schema::table('review_comments', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        
        Schema::table('review_comments', function (Blueprint $table) {
            $table->enum('status', ['published', 'flagged', 'deleted', 'hidden'])->default('published')->after('parent_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('review_comments', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        
        Schema::table('review_comments', function (Blueprint $table) {
            $table->enum('status', ['published', 'hidden'])->default('published')->after('parent_id');
        });
    }
};
