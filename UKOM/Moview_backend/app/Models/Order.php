<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'schedule_id', 'user_id', 'order_code',
        'total_price', 'status', 'expired_at',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'expired_at'  => 'datetime',
    ];

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function orderSeats()
    {
        return $this->hasMany(OrderSeat::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}
