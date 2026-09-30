<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Studio extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'cinema_id', 'studio_name', 'studio_type', 'total_seats',
        'seat_type_definitions', 'row_direction', 'seat_number_direction',
    ];

    protected $casts = [
        'seat_type_definitions' => 'array',
        'row_direction'         => 'string',
        'seat_number_direction' => 'string',
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

                // Inherit shared seat types from studios of the same cinema
                // (first studio by id wins on divergent keys; no duplicates).
                if ($studio->cinema_id) {
                    $map = [];
                    foreach ($studio->seat_type_definitions as $d) {
                        $map[$d['key']] = $d;
                    }
                    $taken = [];
                    foreach (self::where('cinema_id', $studio->cinema_id)->orderBy('id')->get() as $peer) {
                        foreach (($peer->seat_type_definitions ?? []) as $d) {
                            $k = $d['key'] ?? null;
                            if ($k === null || isset($taken[$k])) {
                                continue;
                            }
                            $taken[$k] = true;
                            $map[$k] = $d;
                        }
                    }
                    $studio->seat_type_definitions = array_values($map);
                }
            }
        });
    }

    /**
     * Other studios inside the same cinema (ordered by id), excluding self.
     */
    public function cinemaPeers()
    {
        if (!$this->cinema_id) {
            return collect();
        }
        return static::where('cinema_id', $this->cinema_id)
            ->where('id', '!=', $this->id)
            ->orderBy('id')
            ->get();
    }

    /**
     * All studios inside the same cinema (including self), ordered by id.
     */
    public function cinemaStudioIds(): array
    {
        if (!$this->cinema_id) {
            return [$this->id];
        }
        return static::where('cinema_id', $this->cinema_id)
            ->orderBy('id')
            ->pluck('id')
            ->all();
    }

    /**
     * Upsert a seat type definition (matched by key, case-insensitive) into
     * every other studio of the same cinema. Never appends a second entry
     * with the same key. Other cinemas are never touched.
     */
    public function syncDefinitionToPeers(array $definition): void
    {
        foreach ($this->cinemaPeers() as $peer) {
            $defs = $peer->seat_type_definitions ?? [];
            $replaced = false;
            foreach ($defs as $i => $d) {
                if (strcasecmp((string) $d['key'], (string) $definition['key']) === 0) {
                    $defs[$i] = $definition;
                    $replaced = true;
                    break;
                }
            }
            if (!$replaced) {
                $defs[] = $definition;
            }
            $peer->update(['seat_type_definitions' => array_values($defs)]);
        }
    }

    /**
     * Rename propagation: drop the old key entry from every peer (when
     * present) and upsert the new definition. Peers without either key are
     * left untouched.
     */
    public function syncRenamedDefinitionToPeers(array $definition, string $oldKey): void
    {
        foreach ($this->cinemaPeers() as $peer) {
            $defs = $peer->seat_type_definitions ?? [];
            $hadOld = false;
            $out = [];
            $newPlaced = false;
            foreach ($defs as $d) {
                if (($d['key'] ?? null) === $oldKey) {
                    $hadOld = true;
                    continue;
                }
                if (strcasecmp((string) $d['key'], (string) $definition['key']) === 0) {
                    $out[] = $definition;
                    $newPlaced = true;
                    continue;
                }
                $out[] = $d;
            }
            if ($hadOld && !$newPlaced) {
                $out[] = $definition;
            }
            if ($hadOld || $newPlaced) {
                $peer->update(['seat_type_definitions' => array_values($out)]);
            }
        }
    }

    /**
     * Remove a definition from every studio of the same cinema (including
     * self). Callers must have verified the key is unused cinema-wide.
     */
    public function removeDefinitionAcrossCinema(string $key): void
    {
        $ids = $this->cinema_id ? $this->cinemaStudioIds() : [$this->id];
        foreach (static::whereIn('id', $ids)->orderBy('id')->get() as $studio) {
            $defs = $studio->seat_type_definitions ?? [];
            $out = array_values(array_filter(
                $defs,
                fn($d) => ($d['key'] ?? null) !== $key
            ));
            if (count($out) !== count($defs)) {
                $studio->update(['seat_type_definitions' => $out]);
            }
        }
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
     * Cell types that consume a display seat number during layout numbering
     * (sellable seats + unavailable; aisle/entrance/empty are skipped).
     * Shared by saveLayout rtl numbering; mirrored by the builder preview.
     */
    public function isNumberedKey(?string $seatType): bool
    {
        if ($seatType === null || $seatType === 'empty') {
            return false;
        }
        return $this->isSellableKey($seatType) || $seatType === 'unavailable';
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