<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Studio extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'cinema_id', 'studio_name', 'studio_type', 'total_seats',
        'seat_type_definitions', 'row_direction',
    ];

    protected $casts = [
        'seat_type_definitions' => 'array',
        'row_direction'         => 'string',
    ];

    /**
     * Reserved keys that are NOT sellable seats (layout placeholders).
     */
    public const PLACEHOLDER_TYPE_KEYS = ['aisle', 'entrance', 'unavailable'];

    /**
     * Default custom entries auto-generated for new studios.
     */
    public const DEFAULT_CUSTOM_TYPE_KEYS = [
        'couple'     => ['label' => 'Couple',     'color' => '#F472B6', 'multiplier' => 1.5, 'mode' => 'paired'],
        'premium'    => ['label' => 'Premium',    'color' => '#C4B5FD', 'multiplier' => 2.0, 'mode' => 'individual'],
        'wheelchair' => ['label' => 'Wheelchair', 'color' => '#86EFAC', 'multiplier' => 1.0, 'mode' => 'individual'],
    ];

    protected static function booted(): void
    {
        static::creating(function (Studio $studio) {
            if (empty($studio->seat_type_definitions)) {
                $studio->seat_type_definitions = self::defaultDefinitions();
            }
        });
    }

    /**
     * Default definitions (4 builtins + default customs) for a fresh studio.
     */
    public static function defaultDefinitions(): array
    {
        $defs = [
            ['key' => 'seat', 'label' => 'Regular', 'color' => '#64748B', 'price_multiplier' => 1.0, 'purchase_mode' => 'individual', 'is_builtin' => true],
            ['key' => 'aisle', 'label' => 'Aisle', 'color' => '#CBD5E1', 'price_multiplier' => null, 'purchase_mode' => null, 'is_builtin' => true],
            ['key' => 'entrance', 'label' => 'Entrance', 'color' => '#94A3B8', 'price_multiplier' => null, 'purchase_mode' => null, 'is_builtin' => true],
            ['key' => 'unavailable', 'label' => 'Unavailable', 'color' => '#1E293B', 'price_multiplier' => null, 'purchase_mode' => null, 'is_builtin' => true],
        ];

        foreach (self::DEFAULT_CUSTOM_TYPE_KEYS as $key => $custom) {
            $defs[] = [
                'key'             => $key,
                'label'           => $custom['label'],
                'color'           => $custom['color'],
                'price_multiplier'=> $custom['multiplier'],
                'purchase_mode'   => $custom['mode'],
                'is_builtin'      => false,
            ];
        }

        return $defs;
    }

    /**
     * All seat type definitions for this studio (keyed by key).
     */
    public function definitionsByKey(): array
    {
        $defs = $this->seat_type_definitions ?? [];
        $out  = [];
        foreach ($defs as $def) {
            $out[$def['key']] = $def;
        }
        return $out;
    }

    public function seatTypeKeys(): array
    {
        return array_keys($this->definitionsByKey());
    }

    /**
     * Sellable definition keys (excludes aisle/entrance/unavailable placeholders).
     */
    public function sellableTypeKeys(): array
    {
        return array_values(array_filter(
            $this->seatTypeKeys(),
            fn(string $key) => $this->isSellableKey($key)
        ));
    }

    public function isSellableKey(?string $seatType): bool
    {
        if (!$seatType) {
            return false;
        }
        return !in_array($seatType, self::PLACEHOLDER_TYPE_KEYS, true);
    }

    /**
     * Price multiplier for a seat type key (relative to schedule ticket_price).
     */
    public function priceMultiplierFor(string $seatType): float
    {
        $def = $this->definitionsByKey()[$seatType] ?? null;
        $mult = $def['price_multiplier'] ?? null;
        return $mult === null ? 1.0 : (float) $mult;
    }

    /**
     * Purchase mode for a seat type key: 'individual' | 'paired' | null.
     */
    public function purchaseModeFor(?string $seatType): ?string
    {
        if (!$seatType) {
            return null;
        }
        $def = $this->definitionsByKey()[$seatType] ?? null;
        return $def['purchase_mode'] ?? null;
    }

    public function cinema()
    {
        return $this->belongsTo(Cinema::class);
    }

    public function seats()
    {
        return $this->hasMany(Seat::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}