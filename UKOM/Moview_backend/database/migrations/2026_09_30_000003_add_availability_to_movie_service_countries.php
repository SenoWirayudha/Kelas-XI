<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movie_service_countries', function (Blueprint $table) {
            $table->string('availability_type', 20)->default('stream')->after('service_id');
            $table->date('available_from')->nullable()->after('availability_type');
            $table->boolean('is_coming_soon')->default(false)->after('available_from');
            $table->dropUnique('uq_movie_service_countries');
        });

        // Backfill availability_type from the parent movie_services row.
        DB::statement(
            'UPDATE movie_service_countries msc
             SET availability_type = COALESCE(ms.availability_type, \'stream\')
             FROM movie_services ms
             WHERE ms.movie_id = msc.movie_id AND ms.service_id = msc.service_id'
        );

        Schema::table('movie_service_countries', function (Blueprint $table) {
            $table->unique(
                ['movie_id', 'service_id', 'country_id', 'availability_type'],
                'uq_msvc_availability'
            );
        });
    }

    public function down(): void
    {
        Schema::table('movie_service_countries', function (Blueprint $table) {
            $table->dropUnique('uq_msvc_availability');
            $table->dropColumn(['availability_type', 'available_from', 'is_coming_soon']);
            $table->unique(['movie_id', 'service_id', 'country_id'], 'uq_movie_service_countries');
        });
    }
};
