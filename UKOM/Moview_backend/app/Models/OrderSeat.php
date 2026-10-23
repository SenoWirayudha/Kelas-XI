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

    /**
     * Seat ids already occupied for a show by a pending or paid order.
     * Cancelled / expired / refunded orders release their seats.
     */
    public static function occupiedSeatIds(int $scheduleId, array $seatIds = []): array
    {
        return static::query()
            ->where('schedule_id', $scheduleId)
            ->when(!empty($seatIds), fn ($q) => $q->whereIn('seat_id', $seatIds))
            ->whereHas('order', fn ($q) => $q->whereIn('status', Order::OCCUPYING_STATUSES))
            ->pluck('seat_id')
            ->all();
    }

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
