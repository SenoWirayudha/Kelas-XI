<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'schedule_id', 'user_id', 'order_code',
        'ticket_code', 'total_price', 'status', 'is_scanned', 'scanned_at', 'expired_at',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'is_scanned'  => 'boolean',
        'scanned_at'  => 'datetime',
        'expired_at'  => 'datetime',
    ];

    public static function generateUniqueTicketCode(): string
    {
        do {
            $ticketCode = 'MOV-' . strtoupper(Str::random(6));
        } while (self::where('ticket_code', $ticketCode)->exists());

        return $ticketCode;
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
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
