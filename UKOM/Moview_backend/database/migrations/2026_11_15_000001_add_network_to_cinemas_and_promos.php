<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cinema network (XXI / CGV / CINEPOLIS) + per-promo network restriction.
 *
 * promos.networks is null/empty for "all networks", so every existing promo
 * keeps working everywhere after this migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('cinemas', 'network')) {
            Schema::table('cinemas', function (Blueprint $table) {
                $table->string('network', 16)->nullable()->after('cinema_name');
            });
        }

        if (!Schema::hasColumn('promos', 'networks')) {
            Schema::table('promos', function (Blueprint $table) {
                $table->json('networks')->nullable()->after('cinema_id');
            });
        }

        // Backfill from the cinema name first, then fall back to its service
        // (some names such as "Pakuwon Mall IMAX" carry no brand).
        $cinemas = DB::table('cinemas')
            ->whereNull('network')
            ->select('id', 'cinema_name', 'service_id')
            ->get();

        foreach ($cinemas as $cinema) {
            $network = self::networkFromName($cinema->cinema_name);

            if ($network === null && $cinema->service_id !== null) {
                $serviceName = DB::table('services')
                    ->where('id', $cinema->service_id)
                    ->value('name');
                $network = self::networkFromName($serviceName);
            }

            if ($network !== null) {
                DB::table('cinemas')->where('id', $cinema->id)->update(['network' => $network]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('promos', 'networks')) {
            Schema::table('promos', function (Blueprint $table) {
                $table->dropColumn('networks');
            });
        }

        if (Schema::hasColumn('cinemas', 'network')) {
            Schema::table('cinemas', function (Blueprint $table) {
                $table->dropColumn('network');
            });
        }
    }

    private static function networkFromName(?string $name): ?string
    {
        $name = strtoupper((string) $name);

        return match (true) {
            str_contains($name, 'CINEPOLIS') => 'CINEPOLIS',
            str_contains($name, 'CGV') => 'CGV',
            str_contains($name, 'XXI') => 'XXI',
            default => null,
        };
    }
};
