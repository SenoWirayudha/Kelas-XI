<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Studio extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'cinema_id', 'studio_name', 'studio_type', 'total_seats',
        'seat_prices', 'row_direction',
    ];

    protected $casts = [
        'seat_prices'   => 'array',
        'row_direction' => 'string',
    ];

    /**
     * Sellable seat types (excludes aisle/entrance/unavailable placeholders).
     */
    public const SELLABLE_SEAT_TYPES = ['seat', 'couple', 'premium', 'wheelchair'];

    /**
     * Default price multiplier per seat type (relative to schedule ticket_price).
     */
    public const DEFAULT_SEAT_PRICE_MULTIPLIERS = [
        'seat'      => 1.0,
        'couple'    => 1.5,
        'premium'   => 2.0,
        'wheelchair'=> 1.0,
    ];

    public function priceMultiplierFor(string $seatType): float
    {
        $prices = $this->seat_prices ?? [];
        $mult = $prices[$seatType] ?? null;
        if ($mult === null) {
            $mult = self::DEFAULT_SEAT_PRICE_MULTIPLIERS[$seatType] ?? 1.0;
        }
        return (float) $mult;
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
