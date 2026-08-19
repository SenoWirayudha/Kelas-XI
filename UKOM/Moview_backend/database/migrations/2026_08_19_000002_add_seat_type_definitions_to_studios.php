<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Custom seat type system:
     * - studios.seat_type_definitions (JSON) replaces the fixed ENUM approach.
     * - seats.seat_type becomes a plain varchar(50) referencing definition keys
     *   (validated at the application level, not by a DB constraint).
     * - Existing studios get default definitions backfilled (builtin + custom).
     */
    public function up(): void
    {
        // 1) seats.seat_type: varchar(50), drop the legacy enum check constraint
        DB::statement('ALTER TABLE seats DROP CONSTRAINT IF EXISTS seats_seat_type_check');
        DB::statement('ALTER TABLE seats ALTER COLUMN seat_type TYPE varchar(50) USING seat_type::varchar(50)');
        DB::statement("ALTER TABLE seats ALTER COLUMN seat_type SET DEFAULT 'seat'");

        // 2) studios: add seat_type_definitions
        Schema::table('studios', function (Blueprint $table) {
            $table->json('seat_type_definitions')->nullable()->after('total_seats');
        });

        // 3) backfill definitions for every existing studio
        $studios = DB::table('studios')->get(['id', 'seat_prices']);
        foreach ($studios as $studio) {
            $prices = json_decode((string) ($studio->seat_prices ?? ''), true) ?: [];
            DB::table('studios')
                ->where('id', $studio->id)
                ->update(['seat_type_definitions' => json_encode($this->defaultDefinitions($prices))]);
        }

        // 4) drop the superseded seat_prices column
        Schema::table('studios', function (Blueprint $table) {
            $table->dropColumn('seat_prices');
        });
    }

    public function down(): void
    {
        // Restore seat_prices from definitions
        Schema::table('studios', function (Blueprint $table) {
            $table->json('seat_prices')->nullable()->after('total_seats');
        });

        $studios = DB::table('studios')->get(['id', 'seat_type_definitions']);
        foreach ($studios as $studio) {
            $defs  = json_decode((string) ($studio->seat_type_definitions ?? '[]'), true) ?: [];
            $prices = [];
            foreach ($defs as $d) {
                if (!empty($d['purchase_mode']) && $d['price_multiplier'] !== null) {
                    $prices[$d['key']] = (float) $d['price_multiplier'];
                }
            }
            if ($prices === []) {
                $prices = ['couple' => 1.5, 'premium' => 2.0, 'wheelchair' => 1.0];
            }
            DB::table('studios')->where('id', $studio->id)->update(['seat_prices' => json_encode($prices)]);
        }

        Schema::table('studios', function (Blueprint $table) {
            $table->dropColumn('seat_type_definitions');
        });

        // Restore the legacy enum check constraint
        DB::statement('ALTER TABLE seats ALTER COLUMN seat_type DROP DEFAULT');
        DB::statement('ALTER TABLE seats DROP CONSTRAINT IF EXISTS seats_seat_type_check');
        DB::statement(
            "ALTER TABLE seats ADD CONSTRAINT seats_seat_type_check CHECK (seat_type::text = ANY "
            . "(ARRAY['seat','aisle','entrance','couple','premium','wheelchair','unavailable']::text[]))"
        );
    }

    /**
     * Default definitions for a studio: 4 builtins + default customs.
     */
    private function defaultDefinitions(array $prices): array
    {
        return [
            ['key' => 'seat',           'label' => 'Regular',    'color' => '#64748B', 'price_multiplier' => 1.0,  'purchase_mode' => 'individual', 'is_builtin' => true],
            ['key' => 'couple',         'label' => 'Couple',     'color' => '#F472B6', 'price_multiplier' => (float) ($prices['couple'] ?? 1.5),    'purchase_mode' => 'paired',     'is_builtin' => false],
            ['key' => 'premium',        'label' => 'Premium',    'color' => '#C4B5FD', 'price_multiplier' => (float) ($prices['premium'] ?? 2.0),   'purchase_mode' => 'individual', 'is_builtin' => false],
            ['key' => 'wheelchair',     'label' => 'Wheelchair', 'color' => '#86EFAC', 'price_multiplier' => (float) ($prices['wheelchair'] ?? 1.0), 'purchase_mode' => 'individual', 'is_builtin' => false],
            ['key' => 'aisle',          'label' => 'Aisle',      'color' => '#CBD5E1', 'price_multiplier' => null,    'purchase_mode' => null,         'is_builtin' => true],
            ['key' => 'entrance',       'label' => 'Entrance',   'color' => '#94A3B8', 'price_multiplier' => null,    'purchase_mode' => null,         'is_builtin' => true],
            ['key' => 'unavailable',    'label' => 'Unavailable','color' => '#1E293B', 'price_multiplier' => null,    'purchase_mode' => null,         'is_builtin' => true],
        ];
    }
};