<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderSeat extends Model
{
    public $timestamps = false;

    protected $fillable = ['order_id', 'seat_id', 'schedule_id', 'price'];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function seat()
    {
        return $this->belongsTo(Seat::class);
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }
}
