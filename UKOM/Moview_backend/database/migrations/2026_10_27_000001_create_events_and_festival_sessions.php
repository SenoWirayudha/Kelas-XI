<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Film festival events.
 *
 * A festival event belongs to one cinema and owns "sessions". A session is a normal
 * schedule row (so selling/ticketing keeps working unchanged) tagged with event_id; the
 * films in a session live in schedule_movies (ordered), while schedules.movie_id keeps the
 * first film so every existing query/relation still works.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('cinema_id')->constrained('cinemas')->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('banner')->nullable();
                $table->date('start_date');
                $table->date('end_date');
                $table->dateTime('sale_starts_at')->nullable();
                $table->boolean('is_published')->default(false);
                $table->timestamps();
            });
        }

        Schema::table('schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('schedules', 'event_id')) {
                $table->foreignId('event_id')
                    ->nullable()
                    ->after('movie_id')
                    ->constrained('events')
                    ->nullOnDelete();
            }
            if (!Schema::hasColumn('schedules', 'session_title')) {
                $table->string('session_title')->nullable()->after('event_id');
            }
            if (!Schema::hasColumn('schedules', 'quota')) {
                $table->unsignedInteger('quota')->nullable()->after('ticket_price');
            }
        });

        if (!Schema::hasTable('schedule_movies')) {
            Schema::create('schedule_movies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('schedule_id')->constrained('schedules')->cascadeOnDelete();
                $table->foreignId('movie_id')->constrained('movies')->cascadeOnDelete();
                $table->unsignedInteger('sort_order')->default(0);
                $table->unique(['schedule_id', 'movie_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_movies');

        Schema::table('schedules', function (Blueprint $table) {
            foreach (['quota', 'session_title', 'event_id'] as $column) {
                if (Schema::hasColumn('schedules', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('events');
    }
};