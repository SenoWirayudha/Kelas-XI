<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a `source` marker to movie_services (auto = created by the release-track
 * sync, manual = created/edited by an admin) and normalizes legacy
 * availability_type values that were stored with the wrong casing / wording /
 * quoting (e.g. "'stream'", which the admin page showed as 'stream' and the
 * Android app uppercased to 'STREAM'). The bad value made the Stream toggle in
 * the service modal read as inactive.
 *
 * Existing rows are marked `manual` so the automatic sync can never overwrite
 * data that was there before this fix; only rows the sync creates from now on
 * are `auto`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('movie_services', 'source')) {
            Schema::table('movie_services', function (Blueprint $table) {
                $table->string('source', 10)->default('manual');
                $table->index('source');
            });
        }

        $this->normalizeAvailabilityTypes('movie_services');
        $this->normalizeAvailabilityTypes('movie_service_countries');
    }

    public function down(): void
    {
        if (Schema::hasColumn('movie_services', 'source')) {
            Schema::table('movie_services', function (Blueprint $table) {
                $table->dropIndex(['source']);
                $table->dropColumn('source');
            });
        }
    }

    /**
     * stream/rent/buy/theatrical are the only valid values; anything that still
     * maps to one of them (different case, "streaming") is rewritten. Duplicate
     * country rows produced by the rewrite (the table has no id and a unique
     * index on the type) are dropped instead of updated.
     */
    private function normalizeAvailabilityTypes(string $table): void
    {
        if (!Schema::hasColumn($table, 'availability_type')) {
            return;
        }

        $rows = DB::table($table)->whereNotNull('availability_type')->get();

        foreach ($rows as $row) {
            $current = (string) $row->availability_type;
            $normalized = strtolower(trim($current));
            // Legacy rows were stored with the SQL quoting included ("'stream'").
            $normalized = trim($normalized, "'\"`");
            $normalized = trim($normalized);
            if ($normalized === 'streaming') {
                $normalized = 'stream';
            }
            if ($normalized === $current) {
                continue;
            }

            if ($table === 'movie_service_countries') {
                $duplicate = DB::table($table)
                    ->where('movie_id', $row->movie_id)
                    ->where('service_id', $row->service_id)
                    ->where('country_id', $row->country_id)
                    ->where('availability_type', $normalized)
                    ->exists();

                if ($duplicate) {
                    DB::table($table)
                        ->where('movie_id', $row->movie_id)
                        ->where('service_id', $row->service_id)
                        ->where('country_id', $row->country_id)
                        ->where('availability_type', $current)
                        ->delete();
                    continue;
                }

                DB::table($table)
                    ->where('movie_id', $row->movie_id)
                    ->where('service_id', $row->service_id)
                    ->where('country_id', $row->country_id)
                    ->where('availability_type', $current)
                    ->update(['availability_type' => $normalized]);
                continue;
            }

            DB::table($table)->where('id', $row->id)->update(['availability_type' => $normalized]);
        }
    }
};
