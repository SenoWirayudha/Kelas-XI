<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seat extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'studio_id', 'seat_row', 'seat_number', 'seat_code',
        'seat_type', 'position_x', 'position_y', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function studio()
    {
        return $this->belongsTo(Studio::class);
    }

    public function orderSeats()
    {
        return $this->hasMany(OrderSeat::class);
    }
}
