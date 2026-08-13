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
        // Deduplicate by (movie_id, type, release_date) at the SQL level so the copy is
        // self-contained and does not depend on the unique index existing yet (rollback
        // re-runs 000003 before 000004 recreates it). 14 source rows (3 theatrical
        // services per movie) collapse to 6 release rows.
        $rows = DB::table('movie_services')
            ->join('services', 'movie_services.service_id', '=', 'services.id')
            ->whereNotNull('movie_services.release_date')
            ->select(
                'movie_services.movie_id',
                'services.type',
                'movie_services.release_date',
                DB::raw('MIN(services.name) as service_name')
            )
            ->groupBy('movie_services.movie_id', 'services.type', 'movie_services.release_date')
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
        }
    }

    public function down(): void
    {
        // Remove only the rows this copy inserted (deduplicated by the unique index
        // on movie_id/type/country_code/release_date). Never truncate — premiere rows
        // added by admins must survive a rollback.
        DB::table('movie_releases')
            ->whereIn('type', [App\Models\MovieRelease::TYPE_THEATRICAL, App\Models\MovieRelease::TYPE_STREAMING])
            ->whereExists(function ($sub) {
                $sub->selectRaw('1')
                    ->from('movie_services')
                    ->whereColumn('movie_services.movie_id', 'movie_releases.movie_id')
                    ->whereColumn('movie_services.release_date', 'movie_releases.release_date');
            })
            ->delete();
    }
};