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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // who RECEIVES the notification
            $table->foreignId('actor_id')->constrained('users')->cascadeOnDelete(); // who PERFORMED the action
            $table->string('type')->comment('follow, like_review, comment_review, reply_comment');
            $table->foreignId('film_id')->nullable()->constrained('movies')->cascadeOnDelete();
            $table->unsignedBigInteger('related_id')->nullable()->comment('review_id or comment_id');
            $table->text('message'); // Pre-formatted notification message
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            
            // Indexes
            $table->index('user_id');
            $table->index('actor_id');
            $table->index('type');
            $table->index('is_read');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
