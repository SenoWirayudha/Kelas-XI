<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Copy existing theatrical/streaming release dates from the legacy movie_services
     * pivot into movie_releases so the new source of truth is populated. movie_services
     * is intentionally left untouched — schedules & where-to-watch still read from it.
     * (Technical debt: once movie_releases is stable, migrate schedules/where-to-watch
     * to read from here, then deprecate movie_services date columns.)
     */
    public function up(): void
    {
        $inserted = 0;

        $rows = DB::table('movie_services')
            ->join('services', 'movie_services.service_id', '=', 'services.id')
            ->whereNotNull('movie_services.release_date')
            ->select(
                'movie_services.movie_id',
                'services.type',
                'services.name as service_name',
                'movie_services.release_date'
            )
            ->get();

        foreach ($rows as $row) {
            $type = $row->type === 'theatrical' ? 'theatrical' : 'streaming';
            DB::table('movie_releases')->insertOrIgnore([
                'movie_id' => $row->movie_id,
                'type' => $type,
                'country_code' => null,
                'name' => $type === 'streaming' ? $row->service_name : null,
                'release_date' => $row->release_date,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $inserted++;
        }
    }

    public function down(): void
    {
        DB::table('movie_releases')->truncate();
    }
};